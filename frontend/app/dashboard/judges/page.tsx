"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase-client"
import type { Judge } from "@/lib/judges-data"
import { JudgesDataTable } from "@/components/judges-data-table"
import type { DashboardEntry } from "@/lib/dashboard-entries-data"
import { NumberTicker } from "@/components/ui/number-ticker"
import { IconNotes } from "@tabler/icons-react"
import { getUserRole, type AppRole } from "@/lib/rbac"


type JudgeSubmission = {
  id: string
  project_name: string
  tracks: string[]
  investment: number
  team_name?: string
  devpost_link?: string
}

type ScheduleSlotInfo = {
  submission_id: string
  date: string
  start_time: string
  end_time: string
  room_id: number
}

const POINTS_PER_JUDGE = 20

export default function JudgesPage() {
  const [currentRole, setCurrentRole] = React.useState<AppRole | null>(null)
  const [judgeName, setJudgeName] = React.useState<string>("")
  const [selectedJudgeId, setSelectedJudgeId] = React.useState<string | null>(null)
  const [judgesDirectory, setJudgesDirectory] = React.useState<
    { id: string; name: string; email: string; assignedProjects: number }[]
  >([])
  const [judgeAssignmentFilter, setJudgeAssignmentFilter] = React.useState<"all" | "assigned" | "unassigned">("all")
  const [judge, setJudge] = React.useState<Judge | null>(null)
  const [submissions, setSubmissions] = React.useState<JudgeSubmission[]>([])
  const [loading, setLoading] = React.useState(true)
  const [investments, setInvestments] = React.useState<Record<string, number>>({})
  const [editingInvestment, setEditingInvestment] = React.useState<string | null>(null)
  const [investmentInput, setInvestmentInput] = React.useState("")
  const [loadingJudgeIdentity, setLoadingJudgeIdentity] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)
  
  // Load assigned submissions for this judge
  const [assignedSubmissionIds, setAssignedSubmissionIds] = React.useState<string[]>([])
  
  // Points allocation
  const [totalInvestmentFund, setTotalInvestmentFund] = React.useState(0)
  const [totalJudgesCount, setTotalJudgesCount] = React.useState(0)
  const [judgeAllocation, setJudgeAllocation] = React.useState(0)
  
  // Schedule slots mapping (submission_id -> schedule info)
  const [scheduleSlotsMap, setScheduleSlotsMap] = React.useState<Map<string, ScheduleSlotInfo[]>>(new Map())
  
  // Rooms data for display
  const [roomsMap, setRoomsMap] = React.useState<Map<number, string>>(new Map())
  
  // Dashboard entries for DataTable
  const [dashboardEntries, setDashboardEntries] = React.useState<DashboardEntry[]>([])

  // Judge notes: submissionId -> notes for the current page judge
  const [notesMap, setNotesMap] = React.useState<Record<string, string>>({})
  const [isNotesDialogOpen, setIsNotesDialogOpen] = React.useState(false)
  const [notesDialogSubmissionId, setNotesDialogSubmissionId] = React.useState<string>("")
  const [notesDialogText, setNotesDialogText] = React.useState("")
  const [notesDialogSaving, setNotesDialogSaving] = React.useState(false)
  const [notesDialogTab, setNotesDialogTab] = React.useState<"view" | "edit">("view")
  const [notesDialogProjectSearch, setNotesDialogProjectSearch] = React.useState("")
  const [projectAutocompleteOpen, setProjectAutocompleteOpen] = React.useState(false)
  const [projectAutocompleteHighlight, setProjectAutocompleteHighlight] = React.useState(0)
  const canBrowseAllJudges = currentRole === "superadmin"

  const filteredJudgesDirectory = React.useMemo(() => {
    if (judgeAssignmentFilter === "assigned") {
      return judgesDirectory.filter((judgeRow) => judgeRow.assignedProjects > 0)
    }
    if (judgeAssignmentFilter === "unassigned") {
      return judgesDirectory.filter((judgeRow) => judgeRow.assignedProjects <= 0)
    }
    return judgesDirectory
  }, [judgeAssignmentFilter, judgesDirectory])

  // Resolve current judge strictly by authenticated email.
  React.useEffect(() => {
    const loadCurrentJudge = async () => {
      try {
        setLoadingJudgeIdentity(true)
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const role = session?.user ? getUserRole(session.user) : null
        setCurrentRole(role)

        if (role === "superadmin") {
          const { data: allJudges, error: allJudgesError } = await supabase
            .from("judges")
            .select("id, name, email, assigned_projects")
            .order("name", { ascending: true })
          if (allJudgesError) throw allJudgesError

          const mapped = ((allJudges as any[]) ?? []).map((row) => ({
            id: String(row.id),
            name: row.name ?? "Unnamed Judge",
            email: row.email ?? "",
            assignedProjects: Number(row.assigned_projects ?? 0),
          }))
          setJudgesDirectory(mapped)
          if (mapped.length === 0) {
            setSelectedJudgeId(null)
            setJudgeName("")
            return
          }
          setSelectedJudgeId((prev) => (prev && mapped.some((j) => j.id === prev) ? prev : mapped[0].id))
          setJudgeName(mapped[0].name)
          return
        }

        const userEmail = session?.user?.email?.trim()
        if (!userEmail) {
          setSelectedJudgeId(null)
          setJudgeName("")
          toast.error("Unable to resolve your account email.")
          return
        }

        const { data, error } = await supabase
          .from("judges")
          .select("id, name")
          .ilike("email", userEmail)
          .maybeSingle()
        if (error) throw error
        if (!data?.id) {
          setSelectedJudgeId(null)
          setJudgeName("")
          toast.error("No judge profile found for this account.", {
            description: `Signed in as ${userEmail}. Ask an admin to add this email to the judges table.`,
          })
          return
        }

        setSelectedJudgeId(data.id)
        setJudgeName(data.name ?? userEmail)
      } catch {
        toast.error("Failed to load judge profile")
      } finally {
        setLoadingJudgeIdentity(false)
      }
    }
    void loadCurrentJudge()
  }, [])

  React.useEffect(() => {
    if (!canBrowseAllJudges) return
    if (filteredJudgesDirectory.length === 0) {
      setSelectedJudgeId(null)
      return
    }
    if (!selectedJudgeId || !filteredJudgesDirectory.some((judgeRow) => judgeRow.id === selectedJudgeId)) {
      setSelectedJudgeId(filteredJudgesDirectory[0].id)
    }
  }, [canBrowseAllJudges, filteredJudgesDirectory, selectedJudgeId])

  React.useEffect(() => {
    if (!selectedJudgeId) {
      setJudge(null)
      setSubmissions([])
      setDashboardEntries([])
      return
    }

    const loadJudgeData = async () => {
      try {
        setLoading(true)

        const { data: judgesData, error: judgesError } = await supabase
          .from("judges")
          .select("id, name, email, assigned_projects, total_invested, tracks")
          .eq("id", selectedJudgeId)
          .single()

        if (judgesError || !judgesData) {
          setJudge(null)
          return
        }

        // Map database fields (snake_case) to TypeScript interface (camelCase)
        const rawData = judgesData as any
        const judgeData: Judge = {
          id: rawData.id,
          name: rawData.name,
          email: rawData.email || "",
          assignedProjects: rawData.assigned_projects ?? rawData.assignedProjects ?? 0,
          totalInvested: parseFloat(String(rawData.total_invested ?? rawData.totalInvested ?? 0)),
          tracks: rawData.tracks || [],
        }

        setJudge(judgeData)
        setJudgeName(judgeData.name || judgeData.email || "")

        setTotalInvestmentFund(POINTS_PER_JUDGE)

        // Load rooms data for room name mapping
        const { data: roomsSetting } = await supabase
          .from("admin_settings")
          .select("setting_value")
          .eq("setting_key", "rooms_data")
          .single()
        
        if (roomsSetting?.setting_value) {
          try {
            const rooms = JSON.parse(roomsSetting.setting_value)
            const roomsMapData = new Map<number, string>()
            rooms.forEach((room: any) => {
              roomsMapData.set(room.id, room.name)
            })
            setRoomsMap(roomsMapData)

          } catch (e) {

          }
        }

        // Count total number of judges
        const { count: judgesCount, error: countError } = await supabase
          .from("judges")
          .select("*", { count: "exact", head: true })

        if (countError) {

        } else {
          const count = judgesCount || 0
          setTotalJudgesCount(count)

          // Each judge gets a fixed point budget.
          setJudgeAllocation(POINTS_PER_JUDGE)

        }

        // Load assigned submissions from BOTH sources:
        // 1) calendar_schedule_slots (when a schedule has been built/saved)
        // 2) judge_project_assignments (Admin-assigned judge to project, even before schedule exists)
        const judgeIdStr = String(judgeData.id).toLowerCase()

        const [
          { data: calendarSlotsData, error: calendarSlotsError },
          { data: assignmentData, error: assignmentError },
        ] = await Promise.all([
          supabase
            .from("calendar_schedule_slots")
            .select("submission_id, judge_ids, date, start_time, end_time, room_id"),
          supabase
            .from("judge_project_assignments")
            .select("submission_id")
            .eq("judge_id", judgeData.id),
        ])

        if (calendarSlotsError) {
          console.warn("calendar_schedule_slots fetch error:", calendarSlotsError)
        }
        if (assignmentError) {
          console.warn("judge_project_assignments fetch error:", assignmentError)
        }

        // Filter calendar slots where judge_ids array contains this judge's ID (case-insensitive UUID)
        const assignedSlots = (calendarSlotsData || []).filter(slot => {
          const judgeIds = slot.judge_ids || []
          if (!Array.isArray(judgeIds)) return false
          for (let i = 0; i < judgeIds.length; i++) {
            const slotJudgeIdStr = String(judgeIds[i]).toLowerCase()
            if (slotJudgeIdStr === judgeIdStr) return true
          }
          return false
        })

        // Submission IDs from calendar schedule
        const idsFromCalendar = assignedSlots.map(slot => slot.submission_id)
        // Submission IDs from Admin assignments (fallback when no schedule yet)
        const idsFromAssignments = (assignmentData || []).map((row: any) => row.submission_id)
        const assignedSubmissionIds = Array.from(
          new Set([...idsFromCalendar, ...idsFromAssignments])
        )

        setAssignedSubmissionIds(assignedSubmissionIds)
        
        // Build schedule slots map (submission_id -> schedule info array)
        const slotsMap = new Map<string, ScheduleSlotInfo[]>()
        assignedSlots.forEach((slot: any) => {
          const submissionId = slot.submission_id
          if (!slotsMap.has(submissionId)) {
            slotsMap.set(submissionId, [])
          }
          slotsMap.get(submissionId)!.push({
            submission_id: submissionId,
            date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            room_id: slot.room_id,
          })
        })
        setScheduleSlotsMap(slotsMap)

        // Load submission details from Supabase (only assigned ones)
        let submissionsData: any[] | null = null
        if (assignedSubmissionIds.length > 0) {

          const { data, error: submissionsError } = await supabase
            .from("submissions")
            .select("id, project_name, tracks, team_name, devpost_link")
            .in("id", assignedSubmissionIds)
            .order("submitted_at", { ascending: false })

          if (submissionsError) {


          } else {
            submissionsData = data

          }
        } else {

        }

        // Load investments from Supabase (using submission_id)

        const { data: investmentsData, error: investmentsError } = await supabase
          .from("judge_investments")
          .select("submission_id, amount")
          .eq("judge_id", judgeData.id)

        if (investmentsError) {


        } else {

        }

        // Build investments map using submission IDs
        const investmentsMap: Record<string, number> = {}
        investmentsData?.forEach(inv => {
          investmentsMap[inv.submission_id] = parseFloat(String(inv.amount)) || 0
        })

        // Load judge notes for this judge
        const { data: notesData, error: notesError } = await supabase
          .from("judge_notes")
          .select("submission_id, notes")
          .eq("judge_id", judgeData.id)
        if (!notesError && notesData) {
          const nm: Record<string, string> = {}
          notesData.forEach((row: { submission_id: string; notes: string | null }) => {
            nm[row.submission_id] = row.notes ?? ""
          })
          setNotesMap(nm)
        } else {
          setNotesMap({})
        }

        if (submissionsData && submissionsData.length > 0) {
          const judgeSubmissions: JudgeSubmission[] = submissionsData.map((submission: any) => ({
            id: submission.id,
            project_name: submission.project_name,
            tracks: submission.tracks || [],
            investment: investmentsMap[submission.id] || 0,
            team_name: submission.team_name,
            devpost_link: submission.devpost_link,
          }))

          setSubmissions(judgeSubmissions)
          setInvestments(investmentsMap)
          
          // Build dashboard entries for DataTable
          const entries: DashboardEntry[] = judgeSubmissions.map((submission, index) => {
            const scheduleSlots = slotsMap.get(submission.id) || []
            // Sort schedule slots by start_time (early to late)
            // Convert times to seconds for accurate numeric comparison
            const sortedSlots = [...scheduleSlots].sort((a, b) => {
              // Helper function to convert time string to total seconds
              const timeToSeconds = (time: any): number => {
                if (!time) return 0
                const timeStr = typeof time === 'string' ? time.trim() : String(time).trim()
                
                // Handle empty or invalid strings
                if (!timeStr || timeStr === '') return 0
                
                // Split by colon to get hours, minutes, seconds
                const parts = timeStr.split(':').map(p => parseInt(p.trim() || '0', 10))
                
                if (parts.length === 0) return 0
                if (parts.length === 1) return parts[0] * 3600 // Just hours
                if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60 // Hours:Minutes
                // Hours:Minutes:Seconds
                return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0)
              }
              
              const timeA = timeToSeconds(a.start_time)
              const timeB = timeToSeconds(b.start_time)
              
              // Sort ascending (early to late)
              return timeA - timeB
            })
            
            
            // Get the first (earliest) schedule slot for sorting and display
            const firstSlot = sortedSlots.length > 0 ? sortedSlots[0] : null
            
            // Format time range from first slot
            let timeInfo = "Not scheduled"
            let startTimeForSort = 0
            if (firstSlot) {
              // Format time - handle both time type and text format
              let startTime = firstSlot.start_time
              if (typeof startTime === 'string') {
                // If it's a full time string like "13:00:00", extract just "13:00"
                if (startTime.includes(':') && startTime.split(':').length >= 2) {
                  startTime = startTime.substring(0, 5)
                }
              }
              
              // Format end time similarly
              let endTime = firstSlot.end_time
              if (typeof endTime === 'string') {
                if (endTime.includes(':') && endTime.split(':').length >= 2) {
                  endTime = endTime.substring(0, 5)
                }
              }
              
              timeInfo = `${startTime} - ${endTime}`
              
              // Calculate start time in seconds for sorting
              const timeToSeconds = (time: any): number => {
                if (!time) return 0
                const timeStr = typeof time === 'string' ? time.trim() : String(time).trim()
                if (!timeStr || timeStr === '') return 0
                const parts = timeStr.split(':').map(p => parseInt(p.trim() || '0', 10))
                if (parts.length === 0) return 0
                if (parts.length === 1) return parts[0] * 3600
                if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60
                return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0)
              }
              startTimeForSort = timeToSeconds(firstSlot.start_time)
            }
            
            // Format room info (show all rooms if multiple)
            const roomInfo = sortedSlots.length > 0
              ? sortedSlots.map(slot => {
                  return roomsMap.get(slot.room_id) || `Room ${slot.room_id}`
                }).join(", ")
              : "-"
            
            const investment = investmentsMap[submission.id] || 0
            let status = "Pending"
            if (investment > 0) {
              status = "Scored"
            } else if (scheduleSlots.length > 0) {
              status = "Under Review"
            }
            
            return {
              id: index + 1,
              entry: submission.project_name,
              status: status,
              investment: investment > 0 ? investment.toString() : "",
              judge: judgeData.name,
              time: timeInfo, // Separate time field
              room: roomInfo, // Separate room field
              startTimeSort: startTimeForSort, // For sorting
              submissionId: submission.id, // Store submission ID for updates
            } as DashboardEntry & { time?: string; room?: string; startTimeSort?: number; submissionId?: string }
          })
          
          // Sort entries by start time (early to late) before setting state
          const sortedEntries = [...entries].sort((a, b) => {
            const timeA = (a as any).startTimeSort || 999999 // Put unscheduled at end
            const timeB = (b as any).startTimeSort || 999999
            return timeA - timeB
          })
          
          setDashboardEntries(sortedEntries as DashboardEntry[])
        } else {

          setSubmissions([])
          setInvestments({})
          setDashboardEntries([])
        }

      } catch (error) {

        toast.error("Failed to load data", {
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setLoading(false)
      }
    }

    void loadJudgeData()
  }, [selectedJudgeId, refreshKey])

  const handleInvestmentChange = (submissionId: string, value: string) => {
    setInvestmentInput(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      // Calculate what the new total would be
      const currentTotal = Object.entries(investments).reduce((sum, [id, amount]) => {
        return sum + (id === submissionId ? 0 : amount)
      }, 0)
      const newTotal = currentTotal + numValue
      
      // Warn if exceeding allocation (but allow input)
      if (newTotal > judgeAllocation && judgeAllocation > 0) {
        // Still allow input, but validation will happen on save
      }
      
      setInvestments(prev => ({
        ...prev,
        [submissionId]: numValue,
      }))
    }
  }

  const handleSaveInvestment = async (submissionId: string, investmentAmount?: number) => {
    const investment = investmentAmount !== undefined ? investmentAmount : (investments[submissionId] || 0)

    if (!judge) {
      toast.error("Judge not loaded")
      return
    }

    // Calculate current total invested (including this new investment)
    const currentTotal = Object.entries(investments).reduce((sum, [id, amount]) => {
      return sum + (id === submissionId ? investment : amount)
    }, 0)

    // Check if investment exceeds judge's allocation
    if (currentTotal > judgeAllocation) {
      const remaining = judgeAllocation - (currentTotal - investment)
      toast.error("Point limit exceeded", {
        description: `You have ${remaining.toFixed(2)} points remaining of your ${judgeAllocation.toLocaleString()}-point allocation.`,
      })
      return
    }

    try {
      // Save investment to Supabase (upsert - insert or update)
      const { error: investmentError } = await supabase
        .from("judge_investments")
        .upsert({
          judge_id: judge.id,
          submission_id: submissionId,
          amount: investment,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "judge_id,submission_id"
        })

      if (investmentError) {
        throw investmentError
      }

      // Calculate and update judge's total invested
      const updatedInvestments = { ...investments, [submissionId]: investment }
      const updatedTotal = Object.values(updatedInvestments).reduce((sum, inv) => sum + inv, 0)
      
      const { error: judgeUpdateError } = await supabase
        .from("judges")
        .update({ total_invested: updatedTotal })
        .eq("id", judge.id)

      if (judgeUpdateError) {

        // Continue anyway as investment was saved
      }

      // Update local judge state
      setJudge(prev => prev ? { ...prev, totalInvested: updatedTotal } : null)

      // Update investments map
      setInvestments(prev => ({
        ...prev,
        [submissionId]: investment,
      }))
      
      // Update dashboard entries status and investment in place
      // Don't re-sort to avoid pagination reset - sorting is already done on initial load
      setDashboardEntries(prev => prev.map(entry => {
        if ((entry as any).submissionId === submissionId) {
          return {
            ...entry,
            investment: investment.toString(),
            status: investment > 0 ? "Scored" : "Under Review",
          }
        }
        return entry
      }))

      setEditingInvestment(null)
      setInvestmentInput("")
    } catch (error) {
      toast.error("Failed to save points", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleEditInvestment = (submissionId: string, currentValue: number) => {
    setEditingInvestment(submissionId)
    setInvestmentInput(currentValue.toString())
  }

  // Open notes dialog (optionally with a project pre-selected, e.g. from table row)
  const openNotesDialog = React.useCallback((preSelectSubmissionId?: string) => {
    const sid = preSelectSubmissionId ?? submissions[0]?.id ?? ""
    setNotesDialogSubmissionId(sid)
    setNotesDialogText(sid ? (notesMap[sid] ?? "") : "")
    const projectName = sid ? (submissions.find((s) => s.id === sid)?.project_name ?? "") : ""
    setNotesDialogProjectSearch(projectName)
    setNotesDialogTab(preSelectSubmissionId ? "edit" : "view")
    setIsNotesDialogOpen(true)
  }, [submissions, notesMap])

  const notesDialogProjects = submissions.map(s => ({ id: s.id, project_name: s.project_name }))

  const projectAutocompleteMatches = React.useMemo(() => {
    const q = notesDialogProjectSearch.trim().toLowerCase()
    if (!q) return []
    return notesDialogProjects.filter((p) =>
      p.project_name.toLowerCase().includes(q)
    )
  }, [notesDialogProjectSearch, notesDialogProjects])

  React.useEffect(() => {
    setProjectAutocompleteHighlight((i) =>
      Math.min(i, Math.max(0, projectAutocompleteMatches.length - 1))
    )
  }, [projectAutocompleteMatches.length])

  const selectProjectFromAutocomplete = React.useCallback((p: { id: string; project_name: string }) => {
    setNotesDialogSubmissionId(p.id)
    setNotesDialogProjectSearch(p.project_name)
    const text = notesMap[p.id] ?? ""
    setNotesDialogText(text)
    setProjectAutocompleteOpen(false)
  }, [notesMap])

  const matchProjectFromSearch = React.useCallback(() => {
    const q = notesDialogProjectSearch.trim().toLowerCase()
    if (!q) {
      setNotesDialogSubmissionId("")
      return
    }
    const matches = notesDialogProjects.filter((p) =>
      p.project_name.toLowerCase().includes(q)
    )
    if (matches.length === 1) {
      setNotesDialogSubmissionId(matches[0].id)
      setNotesDialogProjectSearch(matches[0].project_name)
      const text = notesMap[matches[0].id] ?? ""
      setNotesDialogText(text)
    } else if (matches.length > 1) {
      const exact = matches.find((p) => p.project_name.toLowerCase() === q)
      if (exact) {
        setNotesDialogSubmissionId(exact.id)
        setNotesDialogProjectSearch(exact.project_name)
        const text = notesMap[exact.id] ?? ""
        setNotesDialogText(text)
      } else {
        setNotesDialogSubmissionId(matches[0].id)
        setNotesDialogProjectSearch(matches[0].project_name)
        const text = notesMap[matches[0].id] ?? ""
        setNotesDialogText(text)
      }
    } else {
      setNotesDialogSubmissionId("")
    }
  }, [notesDialogProjectSearch, notesDialogProjects, notesMap])

  const handleSaveNote = async () => {
    if (!judge?.id || !notesDialogSubmissionId) {
      toast.error("Select a project")
      return
    }
    setNotesDialogSaving(true)
    try {
      const { error } = await supabase
        .from("judge_notes")
        .upsert({
          judge_id: judge.id,
          submission_id: notesDialogSubmissionId,
          notes: notesDialogText.trim() || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "judge_id,submission_id" })
      if (error) throw error
      setNotesMap(prev => ({ ...prev, [notesDialogSubmissionId]: notesDialogText.trim() }))
      toast.success("Notes saved")
      setNotesDialogSubmissionId("")
      setNotesDialogText("")
    } catch (e) {
      toast.error("Failed to save notes", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setNotesDialogSaving(false)
    }
  }

  return (
    <div suppressHydrationWarning className="relative">
      <div className="animated-grid fixed inset-0 z-0" />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="relative z-10">
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle>{loadingJudgeIdentity ? "Loading..." : "Judge dashboard"}</CardTitle>
                          <CardDescription>
                            {canBrowseAllJudges
                              ? "Superadmin view: review each judge and confirm assignment coverage."
                              : judgeName
                                ? `Signed in as ${judgeName}. You can only view your assigned submissions.`
                                : "No judge profile was found for your account."}
                          </CardDescription>
                        </div>
                        {(selectedJudgeId || canBrowseAllJudges) && (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            {canBrowseAllJudges && (
                              <>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Assignment</Label>
                                  <Select
                                    value={judgeAssignmentFilter}
                                    onValueChange={(value) =>
                                      setJudgeAssignmentFilter(value as "all" | "assigned" | "unassigned")
                                    }
                                  >
                                    <SelectTrigger className="w-[160px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All judges</SelectItem>
                                      <SelectItem value="assigned">Assigned only</SelectItem>
                                      <SelectItem value="unassigned">Unassigned only</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Judge</Label>
                                  <Select
                                    value={selectedJudgeId ?? ""}
                                    onValueChange={(value) => setSelectedJudgeId(value)}
                                    disabled={filteredJudgesDirectory.length === 0}
                                  >
                                    <SelectTrigger className="w-[240px]">
                                      <SelectValue
                                        placeholder={
                                          filteredJudgesDirectory.length === 0
                                            ? "No matching judges"
                                            : "Select a judge"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {filteredJudgesDirectory.map((judgeRow) => (
                                        <SelectItem key={judgeRow.id} value={judgeRow.id}>
                                          {judgeRow.name} ({judgeRow.assignedProjects})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loading || !selectedJudgeId}
                              onClick={() => setRefreshKey((k) => k + 1)}
                            >
                              {loading ? "Refreshing…" : "Refresh timings"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!selectedJudgeId}
                              onClick={() => openNotesDialog()}
                            >
                              <IconNotes className="size-4 mr-1.5" />
                              Notes
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!judge ? (
                        selectedJudgeId && loading ? (
                          <p className="text-sm text-muted-foreground">Loading judge data...</p>
                        ) : selectedJudgeId ? (
                          <p className="text-sm text-muted-foreground">No judge data found.</p>
                        ) : canBrowseAllJudges ? (
                          <p className="text-sm text-muted-foreground">No judges match the selected assignment filter.</p>
                        ) : null
                      ) : (
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <Label className="text-muted-foreground">Your Allocation</Label>
                          <p className="text-2xl font-bold">
                            <NumberTicker value={judgeAllocation} /> pts
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            of <NumberTicker value={totalInvestmentFund} /> points total
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Points Used</Label>
                          <p className="text-2xl font-bold">
                            <NumberTicker value={judge.totalInvested} /> pts
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(judgeAllocation - judge.totalInvested) >= 0 ? (
                              <><NumberTicker value={judgeAllocation - judge.totalInvested} decimalPlaces={2} /> points remaining</>
                            ) : (
                              <span className="text-destructive">
                                <NumberTicker value={Math.abs(judgeAllocation - judge.totalInvested)} decimalPlaces={2} /> points over
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Assigned Projects</Label>
                          <p className="text-2xl font-bold">{judge.assignedProjects}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Tracks</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {judge.tracks && judge.tracks.length > 0 ? (
                              judge.tracks.map(track => (
                                <Badge key={track} variant="outline">{track}</Badge>
                              ))
                            ) : (
                              <Badge variant="outline">General</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="px-4 lg:px-6">
                  {!judge ? null : loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading submissions...
                    </div>
                  ) : dashboardEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No submissions assigned yet. Please contact admin.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <JudgesDataTable 
                        data={dashboardEntries}
                        onInvestmentChange={async (entryId: number, investment: number) => {
                          const entry = dashboardEntries.find(e => e.id === entryId)
                          if (!entry || !(entry as any).submissionId) return
                          const submissionId = (entry as any).submissionId
                          await handleSaveInvestment(submissionId, investment)
                          setDashboardEntries(prev => prev.map(e => {
                            if (e.id === entryId) {
                              return {
                                ...e,
                                investment: investment.toString(),
                                status: investment > 0 ? "Scored" : "Under Review",
                              }
                            }
                            return e
                          }))
                        }}
                        remainingAllocation={Math.max(0, judgeAllocation - judge.totalInvested)}
                        totalInvested={judge.totalInvested}
                        onOpenNotes={openNotesDialog}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Judge notes</DialogTitle>
            <DialogDescription>
              View your notes or add and edit notes for a project.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={notesDialogTab} onValueChange={(v) => setNotesDialogTab(v as "view" | "edit")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view">My notes</TabsTrigger>
              <TabsTrigger value="edit">Add / Edit note</TabsTrigger>
            </TabsList>
            <TabsContent value="view" className="mt-3">
              {(() => {
                const map = notesMap
                const projects = submissions
                const nameById = Object.fromEntries(projects.map(p => [p.id, p.project_name]))
                const entries = Object.entries(map)
                  .filter(([, text]) => text?.trim())
                  .map(([submissionId, notes]) => ({
                    submissionId,
                    projectName: nameById[submissionId] ?? "Unknown project",
                    notes: notes.trim(),
                  }))
                if (entries.length === 0) {
                  return (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      <p className="mb-2">No notes yet.</p>
                      <Button variant="outline" size="sm" onClick={() => setNotesDialogTab("edit")}>
                        Add / Edit note
                      </Button>
                    </div>
                  )
                }
                return (
                  <div className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
                    {entries.map(({ submissionId, projectName, notes }) => (
                      <div key={submissionId} className="rounded-md border p-3">
                        <p className="font-medium text-sm">{projectName}</p>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{notes}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => {
                            setNotesDialogSubmissionId(submissionId)
                            setNotesDialogProjectSearch(projectName)
                            setNotesDialogText(map[submissionId] ?? "")
                            setNotesDialogTab("edit")
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </TabsContent>
            <TabsContent value="edit" className="mt-3">
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Judge</Label>
                  <div className="rounded-md border px-3 py-2 text-sm">{judgeName || "Current judge"}</div>
                </div>
                <div className="space-y-2">
                  <Label>Project ({notesDialogProjects.length} assigned)</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search project..."
                      value={notesDialogProjectSearch}
                      onChange={(e) => {
                        setNotesDialogProjectSearch(e.target.value)
                        setProjectAutocompleteOpen(true)
                        setProjectAutocompleteHighlight(0)
                      }}
                      onFocus={() => {
                        if (notesDialogProjectSearch.trim()) setProjectAutocompleteOpen(true)
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setProjectAutocompleteOpen(false)
                          matchProjectFromSearch()
                        }, 150)
                      }}
                      onKeyDown={(e) => {
                        if (!projectAutocompleteOpen || projectAutocompleteMatches.length === 0) {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            matchProjectFromSearch()
                          }
                          return
                        }
                        if (e.key === "ArrowDown") {
                          e.preventDefault()
                          setProjectAutocompleteHighlight((i) =>
                            Math.min(i + 1, projectAutocompleteMatches.length - 1)
                          )
                          return
                        }
                        if (e.key === "ArrowUp") {
                          e.preventDefault()
                          setProjectAutocompleteHighlight((i) => Math.max(i - 1, 0))
                          return
                        }
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const p = projectAutocompleteMatches[projectAutocompleteHighlight]
                          if (p) selectProjectFromAutocomplete(p)
                          return
                        }
                        if (e.key === "Escape") {
                          setProjectAutocompleteOpen(false)
                        }
                      }}
                      className="w-full"
                    />
                    {projectAutocompleteOpen && projectAutocompleteMatches.length > 0 && (
                      <ul
                        className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover py-1 text-sm shadow-md"
                        role="listbox"
                      >
                        {projectAutocompleteMatches.map((p, i) => (
                          <li
                            key={p.id}
                            role="option"
                            aria-selected={i === projectAutocompleteHighlight}
                            className={`cursor-pointer px-3 py-2 ${i === projectAutocompleteHighlight ? "bg-accent text-accent-foreground" : ""}`}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              selectProjectFromAutocomplete(p)
                            }}
                          >
                            {p.project_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notesDialogText}
                    onChange={(e) => setNotesDialogText(e.target.value)}
                    placeholder="Write notes about this project..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              <DialogFooter showCloseButton={false} className="mt-4">
                <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNote} disabled={notesDialogSaving || !judge?.id || !notesDialogSubmissionId}>
                  {notesDialogSaving ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
