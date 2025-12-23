"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconUsers, IconCurrencyDollar, IconTrendingUp, IconCoins, IconPlus, IconEdit, IconTrash, IconDotsVertical } from "@tabler/icons-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Judge } from "@/lib/judges-data"
import type { AdminProject } from "@/lib/admin-projects-data"
import { defaultTracks, type Track } from "@/lib/tracks-data"
import { defaultRooms, type Room } from "@/lib/rooms-data"
import { SectionCards } from "@/components/section-cards"
import { supabase } from "@/lib/supabase-client"

const ACCESS_CODE = "111-111"
const ACCESS_CODE_KEY = "dashboard_access_code"

export default function AdminPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
  const [investmentFund, setInvestmentFund] = React.useState("10000")
  const [judgesList, setJudgesList] = React.useState<Judge[]>([])
  const [projectsList, setProjectsList] = React.useState<AdminProject[]>([])
  const [judgesPerProject, setJudgesPerProject] = React.useState(2) // Default: 2 judges per project
  const [slotDuration, setSlotDuration] = React.useState(5) // Calendar slot duration in minutes
  const [scheduleStartTime, setScheduleStartTime] = React.useState("13:00") // Default 1 PM
  const [scheduleEndTime, setScheduleEndTime] = React.useState("16:00") // Default 4 PM
  const [minInvestment, setMinInvestment] = React.useState("0") // Scoring system min investment
  const [maxInvestment, setMaxInvestment] = React.useState("1000") // Scoring system max investment
  const [isInitialized, setIsInitialized] = React.useState(false)
  
  // Judges management state
  const [isJudgeDialogOpen, setIsJudgeDialogOpen] = React.useState(false)
  const [editingJudge, setEditingJudge] = React.useState<Judge | null>(null)
  const [deleteJudgeDialogOpen, setDeleteJudgeDialogOpen] = React.useState(false)
  const [judgeToDelete, setJudgeToDelete] = React.useState<Judge | null>(null)
  const [judgeFormData, setJudgeFormData] = React.useState({
    name: "",
    email: "",
    tracks: [] as string[],
  })
  const [tracksList, setTracksList] = React.useState<Track[]>(defaultTracks)
  const [roomsList, setRoomsList] = React.useState<Room[]>(defaultRooms)
  
  // Hacker submissions state
  const [submissions, setSubmissions] = React.useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem(ACCESS_CODE_KEY)
    if (stored === ACCESS_CODE) {
      setHasAccess(true)
    } else {
      setHasAccess(false)
      router.push("/")
      return
    }

    const loadFromSupabase = async () => {
      // Load admin settings from Supabase
      const loadSettingsFromSupabase = async () => {
        try {
          const { data: settingsData, error: settingsError } = await supabase
            .from("admin_settings")
            .select("setting_key, setting_value")

          if (settingsError) {
            console.error("[Load Settings] Error loading settings:", settingsError)
            return
          }

          if (settingsData) {
            // Create a map of settings for easy lookup
            const settingsMap = new Map<string, string>()
            settingsData.forEach(setting => {
              settingsMap.set(setting.setting_key, setting.setting_value)
            })

            // Load investment fund
            const investmentFund = settingsMap.get("investment_fund")
            if (investmentFund) {
              setInvestmentFund(investmentFund)
            }

            // Load calendar settings
            const slotDuration = settingsMap.get("calendar_slot_duration")
            if (slotDuration) {
              setSlotDuration(parseInt(slotDuration) || 5)
            }

            const judgesPerProject = settingsMap.get("calendar_judges_per_project")
            if (judgesPerProject) {
              setJudgesPerProject(parseInt(judgesPerProject) || 2)
            }

            const startTime = settingsMap.get("calendar_start_time")
            if (startTime) {
              setScheduleStartTime(startTime)
            }

            const endTime = settingsMap.get("calendar_end_time")
            if (endTime) {
              setScheduleEndTime(endTime)
            }

            // Load scoring settings
            const minInvestment = settingsMap.get("scoring_min_investment")
            if (minInvestment) {
              setMinInvestment(minInvestment)
            }

            const maxInvestment = settingsMap.get("scoring_max_investment")
            if (maxInvestment) {
              setMaxInvestment(maxInvestment)
            }

            // Load tracks data
            const tracksData = settingsMap.get("tracks_data")
            if (tracksData) {
              try {
                const parsed = JSON.parse(tracksData)
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setTracksList(parsed)
                }
              } catch (e) {
                console.error("[Load Settings] Error parsing tracks_data:", e)
              }
            }

            // Load rooms data
            const roomsData = settingsMap.get("rooms_data")
            if (roomsData) {
              try {
                const parsed = JSON.parse(roomsData)
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setRoomsList(parsed)
                }
              } catch (e) {
                console.error("[Load Settings] Error parsing rooms_data:", e)
              }
            }

            console.log("[Load Settings] Successfully loaded settings from Supabase")
          }
        } catch (error) {
          console.error("[Load Settings] Failed to load settings:", error)
        }
      }

      await loadSettingsFromSupabase()
      console.log("[Load From Supabase] Starting to fetch all admin data...")
      try {
        console.log("[Load From Supabase] Making parallel queries to Supabase...")
        const [
          { data: supabaseJudges, error: judgesError }, 
          { data: supabaseSubmissions, error: submissionsError },
          { data: assignmentsData, error: assignmentsError }
        ] = await Promise.all([
          supabase
            .from("judges")
            .select("id, name, email, assigned_projects, total_invested, tracks")
            .order("created_at", { ascending: false }),
          supabase
            .from("submissions")
            .select("id, project_name, tracks"),
          supabase
            .from("judge_project_assignments")
            .select("judge_id, submission_id")
        ])
        console.log("[Load From Supabase] All queries completed")

        console.log("[Load From Supabase] Judges query result:")
        console.log("[Load From Supabase] Judges error:", judgesError)
        console.log("[Load From Supabase] Judges data:", supabaseJudges)
        const judgesArray = supabaseJudges as any[] | null
        console.log("[Load From Supabase] Judges data length:", judgesArray?.length || 0)

        if (judgesError) {
          console.error("[Load From Supabase] Error loading judges:", {
            message: judgesError.message,
            details: judgesError.details,
            hint: judgesError.hint,
            code: judgesError.code,
          })
          setJudgesList([])
        } else if (judgesArray && judgesArray.length > 0) {
          console.log("[Load From Supabase] Mapping judges data...")
          // Map judges - keeping id as string (UUID) but storing as any to match Judge type expectations
          const mappedJudges: Judge[] = judgesArray.map((row, index) => {
            const mapped = {
              id: row.id as any, // UUID string from Supabase, stored as any for compatibility
              name: row.name,
              email: row.email || "",
              assignedProjects: row.assigned_projects || 0,
              totalInvested: parseFloat(String(row.total_invested || 0)),
              tracks: row.tracks || ["General"],
            }
            console.log(`[Load From Supabase] Mapped judge ${index + 1}:`, mapped)
            return mapped
          })
          console.log("[Load From Supabase] All mapped judges:", mappedJudges)
          console.log("[Load From Supabase] Setting judges list state...")
          setJudgesList(mappedJudges)
          console.log("[Load From Supabase] Successfully loaded", mappedJudges.length, "judges")
          
          // Force a re-render check
          setTimeout(() => {
            console.log("[Load From Supabase] State check - judgesList should have", mappedJudges.length, "items")
          }, 100)
        } else if (!judgesArray || judgesArray.length === 0) {
          console.log("[Load From Supabase] No judges found, setting empty list")
          // Only set empty if we actually have no data (don't overwrite if already loaded)
          setJudgesList((prev) => prev.length > 0 ? prev : [])
        }

        if (!submissionsError && supabaseSubmissions && supabaseSubmissions.length > 0) {
          // Load assignments and map judge names to submissions
          const assignmentMap = new Map<string, string[]>() // submission_id -> judge names
          if (!assignmentsError && assignmentsData) {
            assignmentsData.forEach((assignment: any) => {
              const submissionId = assignment.submission_id
              const judge = supabaseJudges?.find((j: any) => j.id === assignment.judge_id)
              if (judge && submissionId) {
                if (!assignmentMap.has(submissionId)) {
                  assignmentMap.set(submissionId, [])
                }
                assignmentMap.get(submissionId)?.push(judge.name)
              }
            })
          }
          
          // Map submissions to AdminProject format with assignments
          const mappedProjects: AdminProject[] = (supabaseSubmissions as any[]).map((row, index) => ({
            id: index + 1, // Internal ID for AdminProject (for UI state)
            name: row.project_name ?? "Untitled Project",
            assignedJudges: assignmentMap.get(row.id) || [],
            totalInvestment: 0,
            track: (row.tracks && row.tracks.length > 0) ? row.tracks[0] : "General",
            submissionId: row.id, // Store actual submission UUID
          }))
          setProjectsList(mappedProjects as any)
        }

        // Auto-assign if there are submissions but no assignments yet
        // Use a longer delay to ensure judgesList state has been set
        if (supabaseSubmissions && supabaseSubmissions.length > 0 && 
            (!assignmentsData || assignmentsData.length === 0) &&
            judgesArray && judgesArray.length > 0) {
          console.log("[Load From Supabase] Scheduling auto-assign after judges are loaded")
          setTimeout(() => {
            console.log("[Load From Supabase] Running auto-assign now")
            autoAssignJudges(false)
          }, 500) // Increased delay to ensure state is updated
        }
      } catch (error) {
        console.error("[Load From Supabase] Failed to load admin data from Supabase:", error)
        console.error("[Load From Supabase] Error type:", typeof error)
        console.error("[Load From Supabase] Error constructor:", error?.constructor?.name)
        if (error instanceof Error) {
          console.error("[Load From Supabase] Error message:", error.message)
          console.error("[Load From Supabase] Error stack:", error.stack)
        }
      } finally {
        console.log("[Load From Supabase] Setting isInitialized to true")
        setIsInitialized(true)
      }
    }

    void loadFromSupabase()
  }, [router])
  
  // Helper function to save a setting to Supabase
  const saveSettingToSupabase = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "setting_key"
        })

      if (error) {
        console.error(`[Save Setting] Failed to save ${key}:`, error)
        throw error
      }
    } catch (error) {
      console.error(`[Save Setting] Error saving ${key}:`, error)
      throw error
    }
  }

  // Debug: Track judgesList changes
  React.useEffect(() => {
    console.log("[JudgesList State] judgesList changed, new length:", judgesList.length)
    console.log("[JudgesList State] Current judgesList:", judgesList)
  }, [judgesList])

  // Load submissions
  React.useEffect(() => {
    if (!hasAccess || !isInitialized) return

    const loadSubmissions = async () => {
      try {
        setLoadingSubmissions(true)
        const { data, error } = await supabase
          .from("submissions")
          .select("*")
          .order("submitted_at", { ascending: false })

        if (error && !error.message.includes("relation") && !error.message.includes("does not exist")) {
          console.error("Error loading submissions:", error)
          return
        }

        if (data) {
          setSubmissions(data)
        }
      } catch (error) {
        console.error("Failed to load submissions", error)
      } finally {
        setLoadingSubmissions(false)
      }
    }

    void loadSubmissions()
  }, [hasAccess, isInitialized])

  const handleAutoAssignJudgesToProjects = async () => {
    // Trigger auto-assignment
    autoAssignJudges(true)
    toast.success("Automated judging started!", {
      description: "Judges have been assigned to all projects",
    })
  }

  const loadJudgesFromSupabase = async () => {
    console.log("[Load Judges] Starting to fetch judges from Supabase...")
    try {
      console.log("[Load Judges] Making Supabase query...")
      const { data: supabaseJudges, error: judgesError } = await supabase
        .from("judges")
        .select("id, name, email, assigned_projects, total_invested, tracks")
        .order("created_at", { ascending: false })

      console.log("[Load Judges] Supabase response received")
      console.log("[Load Judges] Error:", judgesError)
      console.log("[Load Judges] Data:", supabaseJudges)
      console.log("[Load Judges] Data length:", supabaseJudges?.length || 0)

      if (judgesError) {
        console.error("[Load Judges] Error details:", {
          message: judgesError.message,
          details: judgesError.details,
          hint: judgesError.hint,
          code: judgesError.code,
        })
        toast.error("Failed to load judges", {
          description: judgesError.message,
        })
        return
      }

      if (supabaseJudges && supabaseJudges.length > 0) {
        console.log("[Load Judges] Mapping judges data...")
        console.log("[Load Judges] Raw judges data:", JSON.stringify(supabaseJudges, null, 2))
        
        const mappedJudges: Judge[] = (supabaseJudges as any[]).map((row, index) => {
          const mapped = {
            id: row.id as any,
            name: row.name,
            email: row.email || "",
            assignedProjects: row.assigned_projects || 0,
            totalInvested: parseFloat(String(row.total_invested || 0)),
            tracks: row.tracks || ["General"],
          }
          console.log(`[Load Judges] Mapped judge ${index + 1}:`, mapped)
          return mapped
        })
        
        console.log("[Load Judges] All mapped judges:", mappedJudges)
        console.log("[Load Judges] Setting judges list state...")
        setJudgesList(mappedJudges)
        console.log("[Load Judges] Successfully loaded", mappedJudges.length, "judges")
        
        // Verify state was set
        setTimeout(() => {
          console.log("[Load Judges] State verification - should trigger re-render")
        }, 50)
      } else {
        console.log("[Load Judges] No judges found in database")
        setJudgesList([])
      }
    } catch (error) {
      console.error("[Load Judges] Unexpected error:", error)
      console.error("[Load Judges] Error type:", typeof error)
      console.error("[Load Judges] Error constructor:", error?.constructor?.name)
      if (error instanceof Error) {
        console.error("[Load Judges] Error message:", error.message)
        console.error("[Load Judges] Error stack:", error.stack)
      }
      toast.error("Failed to load judges", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const handleSaveFund = async () => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          setting_key: "investment_fund",
          setting_value: investmentFund,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "setting_key"
        })

      if (error) {
        throw error
      }

      toast.success("Investment fund saved!", {
        description: `Total fund set to $${parseFloat(investmentFund).toLocaleString()}`,
      })
    } catch (error) {
      console.error("Failed to save investment fund:", error)
      toast.error("Failed to save investment fund", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleSaveCalendarSettings = async () => {
    try {
      const settingsToSave = [
        { setting_key: "calendar_slot_duration", setting_value: slotDuration.toString() },
        { setting_key: "calendar_judges_per_project", setting_value: judgesPerProject.toString() },
        { setting_key: "calendar_start_time", setting_value: scheduleStartTime },
        { setting_key: "calendar_end_time", setting_value: scheduleEndTime },
      ]

      const { error } = await supabase
        .from("admin_settings")
        .upsert(
          settingsToSave.map(s => ({
            ...s,
            updated_at: new Date().toISOString(),
          })),
          {
            onConflict: "setting_key"
          }
        )

      if (error) {
        throw error
      }

      toast.success("Calendar settings saved!", {
        description: `Schedule: ${scheduleStartTime} - ${scheduleEndTime}, Slot duration: ${slotDuration}min, Judges per project: ${judgesPerProject}`,
      })
    } catch (error) {
      console.error("Failed to save calendar settings:", error)
      toast.error("Failed to save calendar settings", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleSaveScoringSettings = async () => {
    try {
      const settingsToSave = [
        { setting_key: "scoring_min_investment", setting_value: minInvestment },
        { setting_key: "scoring_max_investment", setting_value: maxInvestment },
      ]

      const { error } = await supabase
        .from("admin_settings")
        .upsert(
          settingsToSave.map(s => ({
            ...s,
            updated_at: new Date().toISOString(),
          })),
          {
            onConflict: "setting_key"
          }
        )

      if (error) {
        throw error
      }

      toast.success("Scoring system settings saved!", {
        description: `Investment range: $${parseFloat(minInvestment).toLocaleString()} - $${parseFloat(maxInvestment).toLocaleString()}`,
      })
    } catch (error) {
      console.error("Failed to save scoring settings:", error)
      toast.error("Failed to save scoring settings", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleOpenJudgeDialog = (judge?: Judge) => {
    if (judge) {
      setEditingJudge(judge)
      setJudgeFormData({ name: judge.name, email: judge.email, tracks: judge.tracks || [] })
    } else {
      setEditingJudge(null)
      setJudgeFormData({ name: "", email: "", tracks: ["General"] })
    }
    setIsJudgeDialogOpen(true)
  }

  const handleCloseJudgeDialog = () => {
    setIsJudgeDialogOpen(false)
    setEditingJudge(null)
    setJudgeFormData({ name: "", email: "", tracks: [] })
  }

  const handleJudgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[Judge Submit] Form submitted")
    console.log("[Judge Submit] Form data:", judgeFormData)
    console.log("[Judge Submit] Editing judge:", editingJudge)
    
    if (!judgeFormData.name.trim() || !judgeFormData.email.trim()) {
      console.log("[Judge Submit] Validation failed: name or email is empty")
      toast.error("Validation error", {
        description: "Name and email are required",
      })
      return
    }

    try {
      if (editingJudge) {
        console.log("[Judge Submit] Updating existing judge...")
        // Update existing judge in Supabase
        const judgeId = typeof editingJudge.id === 'string' ? editingJudge.id : String(editingJudge.id)
        console.log("[Judge Submit] Judge ID:", judgeId)
        console.log("[Judge Submit] Update payload:", {
          name: judgeFormData.name,
          email: judgeFormData.email,
          tracks: judgeFormData.tracks.length > 0 ? judgeFormData.tracks : ["General"],
        })
        
        const { data, error } = await supabase
          .from("judges")
          .update({
            name: judgeFormData.name,
            email: judgeFormData.email,
            tracks: judgeFormData.tracks.length > 0 ? judgeFormData.tracks : ["General"],
          })
          .eq("id", judgeId)
          .select()

        console.log("[Judge Submit] Update response - data:", data)
        console.log("[Judge Submit] Update response - error:", error)

        if (error) {
          console.error("[Judge Submit] Update error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          })
          toast.error("Failed to update judge", {
            description: error.message,
          })
          return
        }

        console.log("[Judge Submit] Update successful, reloading judges...")
        toast.success("Judge updated!", {
          description: `${judgeFormData.name} has been updated`,
        })
      } else {
        console.log("[Judge Submit] Creating new judge...")
        // Create new judge in Supabase
        const insertPayload = {
          name: judgeFormData.name,
          email: judgeFormData.email,
          tracks: judgeFormData.tracks.length > 0 ? judgeFormData.tracks : ["General"],
          assigned_projects: 0,
          total_invested: 0,
        }
        console.log("[Judge Submit] Insert payload:", insertPayload)
        
        const { data, error } = await supabase
          .from("judges")
          .insert(insertPayload)
          .select()

        console.log("[Judge Submit] Insert response - data:", data)
        console.log("[Judge Submit] Insert response - error:", error)

        if (error) {
          console.error("[Judge Submit] Insert error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          })
          toast.error("Failed to create judge", {
            description: error.message,
          })
          return
        }

        console.log("[Judge Submit] Insert successful, reloading judges...")
        toast.success("Judge added!", {
          description: `${judgeFormData.name} has been added`,
        })
      }

      // Reload judges from Supabase
      await loadJudgesFromSupabase()
      handleCloseJudgeDialog()
    } catch (error) {
      console.error("[Judge Submit] Unexpected error:", error)
      console.error("[Judge Submit] Error type:", typeof error)
      console.error("[Judge Submit] Error constructor:", error?.constructor?.name)
      if (error instanceof Error) {
        console.error("[Judge Submit] Error message:", error.message)
        console.error("[Judge Submit] Error stack:", error.stack)
      }
      toast.error("Failed to save judge", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const handleDeleteJudgeClick = (judge: Judge) => {
    setJudgeToDelete(judge)
    setDeleteJudgeDialogOpen(true)
  }

  const handleDeleteJudgeConfirm = async () => {
    if (!judgeToDelete) {
      console.log("[Delete Judge] No judge to delete")
      return
    }

    console.log("[Delete Judge] Starting delete operation")
    console.log("[Delete Judge] Judge to delete:", judgeToDelete)

    try {
      const judgeId = typeof judgeToDelete.id === 'string' ? judgeToDelete.id : String(judgeToDelete.id)
      console.log("[Delete Judge] Judge ID:", judgeId)
      
      const { data, error } = await supabase
        .from("judges")
        .delete()
        .eq("id", judgeId)
        .select()

      console.log("[Delete Judge] Delete response - data:", data)
      console.log("[Delete Judge] Delete response - error:", error)

      if (error) {
        console.error("[Delete Judge] Delete error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        toast.error("Failed to delete judge", {
          description: error.message,
        })
        return
      }

      console.log("[Delete Judge] Delete successful, reloading judges...")
      toast.success("Judge deleted!", {
        description: `${judgeToDelete.name} has been removed`,
      })

      // Reload judges from Supabase
      await loadJudgesFromSupabase()
      setDeleteJudgeDialogOpen(false)
      setJudgeToDelete(null)
    } catch (error) {
      console.error("[Delete Judge] Unexpected error:", error)
      console.error("[Delete Judge] Error type:", typeof error)
      console.error("[Delete Judge] Error constructor:", error?.constructor?.name)
      if (error instanceof Error) {
        console.error("[Delete Judge] Error message:", error.message)
        console.error("[Delete Judge] Error stack:", error.stack)
      }
      toast.error("Failed to delete judge", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const autoAssignJudges = (showToast = false) => {
    console.log("[Auto Assign] Starting auto-assignment")
    console.log("[Auto Assign] Current judgesList length:", judgesList.length)
    console.log("[Auto Assign] Current projectsList length:", projectsList.length)
    
    // Don't run if we don't have judges or projects yet
    if (judgesList.length === 0 || projectsList.length === 0) {
      console.log("[Auto Assign] Skipping - judgesList or projectsList is empty")
      return
    }
    
    // Track-aware assignment: assign judges based on their track assignments
    const activeProjects = projectsList

    // Reset all project assignments
    const updatedProjects = projectsList.map(project => ({
      ...project,
      assignedJudges: [] as string[]
    }))

    // Helper function to check if a judge can judge a project's track
    const canJudgeTrack = (judge: Judge, projectTrack: string): boolean => {
      // Judges can always judge "General" track
      if (projectTrack === "General") return true
      // Judge can judge if they have the project's track assigned
      return judge.tracks?.includes(projectTrack) || false
    }

    // Assign judges to active projects respecting track restrictions
    activeProjects.forEach((project) => {
      const projectInList = updatedProjects.find(p => p.id === project.id)
      if (projectInList) {
        const projectTrack = project.track || "General"
        // Filter judges who can judge this track
        const eligibleJudges = judgesList.filter(judge => 
          canJudgeTrack(judge, projectTrack)
        )
        
        // Assign judges using round-robin from eligible judges
        for (let i = 0; i < judgesPerProject && eligibleJudges.length > 0; i++) {
          const judgeIndex = i % eligibleJudges.length
          const judge = eligibleJudges[judgeIndex]
          if (!projectInList.assignedJudges.includes(judge.name)) {
            projectInList.assignedJudges.push(judge.name)
          }
        }
      }
    })

    setProjectsList(updatedProjects)
    
    // Update judge assignedProjects count - use functional update to ensure we have latest state
    setJudgesList(currentJudges => {
      const updatedJudges = currentJudges.map(judge => {
        const assignedCount = updatedProjects.filter(p =>
          p.assignedJudges.includes(judge.name)
        ).length
        return {
          ...judge,
          assignedProjects: assignedCount
        }
      })
      console.log("[Auto Assign] Updated judges count:", updatedJudges.length)
      
      // Save assignments to Supabase (using the updated judges)
      const saveAssignmentsToSupabase = async () => {
        try {
          // First, delete all existing assignments for these submissions
          const submissionIds = updatedProjects
            .filter(p => (p as any).submissionId && p.assignedJudges.length > 0)
            .map(p => (p as any).submissionId)
          
          if (submissionIds.length > 0) {
            // Delete existing assignments for these submissions
            await supabase
              .from("judge_project_assignments")
              .delete()
              .in("submission_id", submissionIds)
          }
          
          // Create new assignments (with deduplication)
          const assignmentsMap = new Map<string, { judge_id: string; submission_id: string }>()
          
          updatedProjects.forEach((project) => {
            const submissionId = (project as any).submissionId
            if (submissionId && project.assignedJudges.length > 0) {
              // Remove duplicate judge names from assignedJudges
              const uniqueJudgeNames = Array.from(new Set(project.assignedJudges))
              
              uniqueJudgeNames.forEach((judgeName) => {
                const judge = updatedJudges.find((j: Judge) => j.name === judgeName)
                if (judge) {
                  // Convert judge.id to string (it's a UUID from Supabase)
                  const judgeId = typeof judge.id === 'string' ? judge.id : String(judge.id)
                  // Use composite key to prevent duplicates
                  const assignmentKey = `${judgeId}:${submissionId}`
                  
                  if (!assignmentsMap.has(assignmentKey)) {
                    assignmentsMap.set(assignmentKey, {
                      judge_id: judgeId,
                      submission_id: submissionId,
                    })
                  }
                }
              })
            }
          })
          
          const assignmentsToInsert = Array.from(assignmentsMap.values())
          
          if (assignmentsToInsert.length > 0) {
            // Use upsert to handle any edge cases where duplicates might still exist
            const { error: insertError } = await supabase
              .from("judge_project_assignments")
              .upsert(assignmentsToInsert, {
                onConflict: "judge_id,submission_id",
                ignoreDuplicates: false
              })
            
            if (insertError) {
              console.error("Failed to save assignments to Supabase:", insertError)
              toast.error("Failed to save assignments", {
                description: insertError.message,
              })
              return
            }
          }
          
          // Also update judge assigned_projects count in Supabase
          for (const judge of updatedJudges) {
            const judgeId = typeof judge.id === 'string' ? judge.id : String(judge.id)
            await supabase
              .from("judges")
              .update({ assigned_projects: judge.assignedProjects })
              .eq("id", judgeId)
          }
        } catch (error) {
          console.error("Error saving assignments to Supabase:", error)
        }
      }
      
      // Save assignments asynchronously
      void saveAssignmentsToSupabase()
      
      return updatedJudges
    })
    
    // Show toast notification if requested
    if (showToast) {
      const activeProjectsCount = activeProjects.length
      const totalAssignments = updatedProjects.reduce((sum, p) => sum + p.assignedJudges.length, 0)
      if (totalAssignments > 0) {
        toast.success("Judges auto-assigned!", {
          description: `${totalAssignments} judge assignment(s) across ${activeProjectsCount} active submission(s)`,
        })
      }
    }
  }

  const handleReassign = () => {
    autoAssignJudges(true)
  }

  // Calculate stats
  const totalJudgesInvestment = judgesList.reduce((sum, judge) => sum + judge.totalInvested, 0)
  const totalProjectsInvestment = projectsList.reduce((sum, project) => sum + project.totalInvestment, 0)
  const remainingFund = parseFloat(investmentFund) - totalJudgesInvestment

  if (!hasAccess) {
    return null
  }

  return (
    <div suppressHydrationWarning className="relative">
      {/* Animated Grid Background */}
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
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                      Manage judges, projects, and investment funds
                    </p>
                  </div>

                  {/* Stats Cards */}
                  <div className="mb-6">
                    <SectionCards />
                  </div>

                  {/* Live Stats */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Fund</CardTitle>
                        <IconCoins className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${parseFloat(investmentFund).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Available investment pool</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Judges Investment</CardTitle>
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${totalJudgesInvestment.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total from all judges</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Projects Investment</CardTitle>
                        <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${totalProjectsInvestment.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total project investments</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Remaining Fund</CardTitle>
                        <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${remainingFund.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Unallocated amount</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Investment Funds Configuration */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Investment Funds Configuration</CardTitle>
                      <CardDescription>
                        Set the total investment fund available for judges to allocate
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-4">
                        <div className="flex-1 max-w-sm">
                          <Label htmlFor="investment-fund">Total Investment Fund ($)</Label>
                          <Input
                            id="investment-fund"
                            type="number"
                            value={investmentFund}
                            onChange={(e) => setInvestmentFund(e.target.value)}
                            placeholder="10000"
                          />
                        </div>
                        <Button onClick={handleSaveFund}>Save Fund</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Auto Assign Judges to Projects */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Auto Assign Judges to Projects</CardTitle>
                      <CardDescription>
                        Automatically assign judges to projects respecting track restrictions. Judges can only be assigned to projects in tracks they're assigned to, or General track projects.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="flex-1 max-w-sm">
                          <Label htmlFor="judges-per-project">Judges per Project</Label>
                          <Input
                            id="judges-per-project"
                            type="number"
                            min="1"
                            max="10"
                            value={judgesPerProject}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 2
                              setJudgesPerProject(newValue)
                              // Auto-reassign when value changes
                              setTimeout(() => {
                                const updatedProjects = projectsList.map(p => ({ ...p, assignedJudges: [] }))
                                setProjectsList(updatedProjects)
                                autoAssignJudges(true) // Show toast when manually changed
                              }, 100)
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Number of judges to assign to each active project
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleReassign}>
                            Auto Assign Judges
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                          <strong>Current Assignment:</strong> Judges are automatically assigned using round-robin distribution. 
                          Each active project gets {judgesPerProject} judge(s) distributed evenly.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Judges Management */}
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Judges Management</CardTitle>
                          <CardDescription>
                            Manage judges and track their investments
                          </CardDescription>
                        </div>
                        <Button onClick={() => handleOpenJudgeDialog()} size="sm">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Judge
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Judge Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Tracks</TableHead>
                            <TableHead>Assigned Projects</TableHead>
                            <TableHead>Total Invested</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {judgesList.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                No judges found. Click "Add Judge" to create one.
                              </TableCell>
                            </TableRow>
                          ) : (
                            judgesList.map((judge, index) => (
                              <TableRow key={String(judge.id)}>
                                <TableCell className="font-medium">{judge.name}</TableCell>
                                <TableCell>{judge.email}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {(judge.tracks && judge.tracks.length > 0 ? judge.tracks : ["General"]).map((track, idx) => (
                                      <Badge key={idx} variant="outline">{track}</Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{judge.assignedProjects}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">${judge.totalInvested.toLocaleString()}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <IconDotsVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleOpenJudgeDialog(judge)}>
                                        <IconEdit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteJudgeClick(judge)}
                                        className="text-destructive"
                                      >
                                        <IconTrash className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Calendar Settings */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Calendar Settings</CardTitle>
                      <CardDescription>
                        Configure time range, slot duration and judge assignment for the calendar
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="schedule-start-time">Schedule Start Time</Label>
                          <Input
                            id="schedule-start-time"
                            type="time"
                            value={scheduleStartTime}
                            onChange={(e) => setScheduleStartTime(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Start time for judging sessions (e.g., 13:00 for 1 PM)
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="schedule-end-time">Schedule End Time</Label>
                          <Input
                            id="schedule-end-time"
                            type="time"
                            value={scheduleEndTime}
                            onChange={(e) => setScheduleEndTime(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            End time for judging sessions (e.g., 16:00 for 4 PM)
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="slot-duration">Slot Duration (minutes)</Label>
                          <Input
                            id="slot-duration"
                            type="number"
                            min="5"
                            max="60"
                            step="5"
                            value={slotDuration}
                            onChange={(e) => {
                              const newDuration = parseInt(e.target.value) || 5
                              setSlotDuration(newDuration)
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Duration of each time slot (5-60 minutes)
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="calendar-judges-per-project">Judges per Project</Label>
                          <Input
                            id="calendar-judges-per-project"
                            type="number"
                            min="1"
                            max="10"
                            value={judgesPerProject}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 2
                              setJudgesPerProject(newValue)
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Number of judges per project
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                          <strong>Calendar Range:</strong> The calendar will display slots from 30 minutes before start time ({(() => {
                            const [hour, minute] = scheduleStartTime.split(":").map(Number)
                            const totalMinutes = hour * 60 + minute - 30
                            const displayHour = Math.floor(totalMinutes / 60)
                            const displayMinute = totalMinutes % 60
                            return `${displayHour.toString().padStart(2, "0")}:${displayMinute.toString().padStart(2, "0")}`
                          })()}) to 30 minutes after end time ({(() => {
                            const [hour, minute] = scheduleEndTime.split(":").map(Number)
                            const totalMinutes = hour * 60 + minute + 30
                            const displayHour = Math.floor(totalMinutes / 60)
                            const displayMinute = totalMinutes % 60
                            return `${displayHour.toString().padStart(2, "0")}:${displayMinute.toString().padStart(2, "0")}`
                          })()})
                        </p>
                      </div>
                      <div className="mt-4">
                        <Button onClick={handleSaveCalendarSettings}>
                          Save Calendar Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scoring System Settings */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Scoring System Settings</CardTitle>
                      <CardDescription>
                        Configure investment range for scoring criteria
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="min-investment">Minimum Investment ($)</Label>
                          <Input
                            id="min-investment"
                            type="number"
                            value={minInvestment}
                            onChange={(e) => setMinInvestment(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="max-investment">Maximum Investment ($)</Label>
                          <Input
                            id="max-investment"
                            type="number"
                            value={maxInvestment}
                            onChange={(e) => setMaxInvestment(e.target.value)}
                            placeholder="1000"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button onClick={handleSaveScoringSettings}>
                          Save Scoring Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rooms Management */}
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Rooms Management</CardTitle>
                          <CardDescription>
                            Configure available rooms for calendar scheduling
                          </CardDescription>
                        </div>
                        <Button onClick={async () => {
                          const newRoom: Room = {
                            id: Math.max(...roomsList.map(r => r.id), 0) + 1,
                            name: `Room ${String.fromCharCode(65 + roomsList.length)}`,
                            capacity: 15,
                          }
                          const updated = [...roomsList, newRoom]
                          setRoomsList(updated)
                          
                          // Save to Supabase
                          try {
                            const { error } = await supabase
                              .from("admin_settings")
                              .upsert({
                                setting_key: "rooms_data",
                                setting_value: JSON.stringify(updated),
                                updated_at: new Date().toISOString(),
                              }, {
                                onConflict: "setting_key"
                              })

                            if (error) {
                              console.error("Failed to save rooms data:", error)
                            }
                          } catch (error) {
                            console.error("Failed to save rooms data:", error)
                          }
                          
                          toast.success("Room added!", {
                            description: `${newRoom.name} has been added`,
                          })
                        }} size="sm">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Room
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Room Name</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roomsList.map((room) => (
                            <TableRow key={room.id}>
                              <TableCell className="font-medium">{room.name}</TableCell>
                              <TableCell>{room.capacity || "-"}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {room.description || "-"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => {
                                    if (roomsList.length <= 1) {
                                      toast.error("Cannot delete", {
                                        description: "At least one room is required",
                                      })
                                      return
                                    }
                                    const updated = roomsList.filter(r => r.id !== room.id)
                                    setRoomsList(updated)
                                    
                                    // Save to Supabase
                                    try {
                                      const { error } = await supabase
                                        .from("admin_settings")
                                        .upsert({
                                          setting_key: "rooms_data",
                                          setting_value: JSON.stringify(updated),
                                          updated_at: new Date().toISOString(),
                                        }, {
                                          onConflict: "setting_key"
                                        })

                                      if (error) {
                                        console.error("Failed to save rooms data:", error)
                                      }
                                    } catch (error) {
                                      console.error("Failed to save rooms data:", error)
                                    }
                                    
                                    toast.success("Room deleted!", {
                                      description: `${room.name} has been removed`,
                                    })
                                  }}
                                >
                                  <IconTrash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Hacker Submissions Management */}
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Hacker Submissions</CardTitle>
                          <CardDescription>
                            Review and manage project submissions from hackers
                          </CardDescription>
                        </div>
                        <Button onClick={handleAutoAssignJudgesToProjects} size="sm">
                          Auto-Assign Judges
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingSubmissions ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Loading submissions...
                        </div>
                      ) : submissions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No submissions yet. Hackers can submit their projects using the submission form.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Project Name</TableHead>
                              <TableHead>Team Name</TableHead>
                              <TableHead>Members</TableHead>
                              <TableHead>Devpost Link</TableHead>
                              <TableHead>Tracks</TableHead>
                              <TableHead>Submitted</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {submissions.map((submission, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {submission.project_name || "-"}
                                </TableCell>
                                <TableCell>{submission.team_name || "-"}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {submission.name && (
                                      <Badge variant="outline">{submission.name}</Badge>
                                    )}
                                    {submission.members && Array.isArray(submission.members) && submission.members
                                      .filter((m: string) => m && m.trim())
                                      .map((member: string, i: number) => (
                                        <Badge key={i} variant="outline">{member}</Badge>
                                      ))}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {submission.devpost_link ? (
                                    <a
                                      href={submission.devpost_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      View Devpost
                                    </a>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {submission.tracks && Array.isArray(submission.tracks) && submission.tracks.map((track: string, i: number) => (
                                      <Badge key={i} variant="secondary">{track}</Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {submission.submitted_at
                                    ? new Date(submission.submitted_at).toLocaleDateString()
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Add/Edit Judge Dialog */}
      <Dialog open={isJudgeDialogOpen} onOpenChange={setIsJudgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingJudge ? "Edit Judge" : "New Judge"}</DialogTitle>
            <DialogDescription>
              {editingJudge
                ? "Update the judge details below."
                : "Add a new judge by filling in the details below."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJudgeSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="judge-name">Name</Label>
                <Input
                  id="judge-name"
                  value={judgeFormData.name}
                  onChange={(e) => setJudgeFormData({ ...judgeFormData, name: e.target.value })}
                  placeholder="Enter judge name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="judge-email">Email</Label>
                <Input
                  id="judge-email"
                  type="email"
                  value={judgeFormData.email}
                  onChange={(e) => setJudgeFormData({ ...judgeFormData, email: e.target.value })}
                  placeholder="Enter judge email"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Assign Tracks</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select tracks this judge can evaluate. Judges can always evaluate "General" track projects. For specific tracks (e.g., "Uber Track"), only assigned judges can evaluate those projects.
                </p>
                <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                  <div className="grid gap-2">
                    {tracksList.map((track) => (
                      <div key={track.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`track-${track.id}`}
                          checked={judgeFormData.tracks.includes(track.name)}
                          onChange={() => {
                            const newTracks = judgeFormData.tracks.includes(track.name)
                              ? judgeFormData.tracks.filter(t => t !== track.name)
                              : [...judgeFormData.tracks, track.name]
                            setJudgeFormData({ ...judgeFormData, tracks: newTracks })
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label
                          htmlFor={`track-${track.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {track.name}
                          {track.description && (
                            <span className="text-xs text-muted-foreground ml-2">
                              - {track.description}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {judgeFormData.tracks.length > 0 ? judgeFormData.tracks.join(", ") : "None (will default to General)"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseJudgeDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingJudge ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Judge Confirmation Dialog */}
      <Dialog open={deleteJudgeDialogOpen} onOpenChange={setDeleteJudgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Judge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{judgeToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteJudgeDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteJudgeConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
