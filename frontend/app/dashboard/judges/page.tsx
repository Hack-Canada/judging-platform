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
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import type { Judge } from "@/lib/judges-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { JudgesDataTable } from "@/components/judges-data-table"
import type { DashboardEntry } from "@/lib/dashboard-entries-data"
import { NumberTicker } from "@/components/ui/number-ticker"


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

export default function JudgesPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
  const [authLoading, setAuthLoading] = React.useState(true)
  const [judgeName, setJudgeName] = React.useState<string>("")
  const [judge, setJudge] = React.useState<Judge | null>(null)
  const [submissions, setSubmissions] = React.useState<JudgeSubmission[]>([])
  const [loading, setLoading] = React.useState(true)
  const [investments, setInvestments] = React.useState<Record<string, number>>({})
  const [editingInvestment, setEditingInvestment] = React.useState<string | null>(null)
  const [investmentInput, setInvestmentInput] = React.useState("")
  const [judgeNameDialogOpen, setJudgeNameDialogOpen] = React.useState(false)
  const [judgeNameInput, setJudgeNameInput] = React.useState("")
  const [judgeNameError, setJudgeNameError] = React.useState("")
  const [checkingJudge, setCheckingJudge] = React.useState(false)
  
  // Load assigned submissions for this judge
  const [assignedSubmissionIds, setAssignedSubmissionIds] = React.useState<string[]>([])
  
  // Investment fund allocation
  const [totalInvestmentFund, setTotalInvestmentFund] = React.useState(0)
  const [totalJudgesCount, setTotalJudgesCount] = React.useState(0)
  const [judgeAllocation, setJudgeAllocation] = React.useState(0)
  
  // Schedule slots mapping (submission_id -> schedule info)
  const [scheduleSlotsMap, setScheduleSlotsMap] = React.useState<Map<string, ScheduleSlotInfo[]>>(new Map())
  
  // Rooms data for display
  const [roomsMap, setRoomsMap] = React.useState<Map<number, string>>(new Map())
  
  // Dashboard entries for DataTable
  const [dashboardEntries, setDashboardEntries] = React.useState<DashboardEntry[]>([])

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setHasAccess(true)
        } else {
          setHasAccess(false)
          router.push("/")
        }
      } catch (error) {

        router.push("/")
      } finally {
        setAuthLoading(false)
      }
    }

    void checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setHasAccess(true)
      } else {
        setHasAccess(false)
        router.push("/")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Open judge name dialog when auth is complete and no judge name is set
  React.useEffect(() => {
    if (!authLoading && hasAccess && !judgeName) {
      setJudgeNameDialogOpen(true)
    }
  }, [authLoading, hasAccess, judgeName])

  const handleJudgeNameSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!judgeNameInput.trim()) {
      setJudgeNameError("Judge name is required")
      return
    }

    setCheckingJudge(true)
    setJudgeNameError("")

    try {
      const trimmedJudgeName = judgeNameInput.trim()
      
      // Check if judge exists in Supabase
      const { data: judgesData, error: judgesError } = await supabase
        .from("judges")
        .select("id, name, email")
        .eq("name", trimmedJudgeName)
        .single()

      if (judgesError) {
        setJudgeNameError("Judge not found. Please contact admin to be added as a judge.")
        setCheckingJudge(false)
        return
      }

      if (!judgesData) {
        setJudgeNameError("Judge not found. Please contact admin to be added as a judge.")
        setCheckingJudge(false)
        return
      }

      // Judge found, proceed (no localStorage storage)
      const trimmedName = trimmedJudgeName
      setJudgeName(trimmedName)
      setJudgeNameDialogOpen(false)
      setJudgeNameInput("")
      setHasAccess(true)
    } catch (error) {
      setJudgeNameError("An error occurred. Please try again.")
    } finally {
      setCheckingJudge(false)
    }
  }

  const handleClearJudgeName = () => {
    setJudgeName("")
    setJudge(null)
    setSubmissions([])
    setInvestments({})
    setJudgeNameInput("")
    setJudgeNameError("")
    setJudgeNameDialogOpen(true)
    setHasAccess(false)
  }

  React.useEffect(() => {
    if (!judgeName) return

    const loadJudgeData = async () => {
      try {
        setLoading(true)

        // Load judge from Supabase
        // Note: Using snake_case column names as per database schema (assigned_projects, total_invested)

        const { data: judgesData, error: judgesError } = await supabase
          .from("judges")
          .select("id, name, email, assigned_projects, total_invested, tracks")
          .eq("name", judgeName)
          .single()

        // Better error inspection
        if (judgesError) {
          // Judge not found - show dialog again
          setJudgeName("")
          setJudgeNameDialogOpen(true)
          setJudgeNameInput(judgeName)
          setJudgeNameError("Judge not found. Please contact admin to be added as a judge.")
          setHasAccess(false)
          return
        }

        if (!judgesData) {

          // Judge not found - show dialog again
          setJudgeName("")
          setJudgeNameDialogOpen(true)
          setJudgeNameInput(judgeName)
          setJudgeNameError("Judge not found. Please contact admin to be added as a judge.")
          setHasAccess(false)
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

        // Load total investment fund from Supabase admin_settings
        const { data: fundSetting } = await supabase
          .from("admin_settings")
          .select("setting_value")
          .eq("setting_key", "investment_fund")
          .single()
        
        const totalFund = fundSetting?.setting_value ? parseFloat(fundSetting.setting_value) : 10000
        setTotalInvestmentFund(totalFund)

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

          // Calculate per-judge allocation (equal distribution)
          const allocation = count > 0 ? totalFund / count : 0
          setJudgeAllocation(allocation)

        }

        // Load assigned submissions for this judge from calendar_schedule_slots
        // Filter calendar slots where judge_ids array contains this judge's ID

        // Fetch all calendar slots with full schedule info and filter for ones that contain this judge's ID
        // Note: We'll sort in JavaScript to ensure proper chronological order
        const { data: calendarSlotsData, error: calendarSlotsError } = await supabase
          .from("calendar_schedule_slots")
          .select("submission_id, judge_ids, date, start_time, end_time, room_id")

        if (calendarSlotsError) {


        }

        // Filter slots where judge_ids array contains the current judge's ID
        // Convert judge ID to string for comparison (it might be UUID or string)
        const judgeIdStr = String(judgeData.id)

        const assignedSlots = (calendarSlotsData || []).filter(slot => {
          const judgeIds = slot.judge_ids || []

          // Loop through judge_ids array to check if current judge's ID exists
          if (!Array.isArray(judgeIds)) {

            return false
          }
          
          // Loop through each ID in the array and compare
          for (let i = 0; i < judgeIds.length; i++) {
            const slotJudgeId = judgeIds[i]
            const slotJudgeIdStr = String(slotJudgeId)

            if (slotJudgeIdStr === judgeIdStr) {

              return true
            }
          }
          
          return false
        })

        // Extract unique submission IDs
        const assignedSubmissionIds = Array.from(
          new Set(assignedSlots.map(slot => slot.submission_id))
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
              status = "Invested"
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
  }, [judgeName])

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
      toast.error("Investment limit exceeded", {
        description: `You have $${remaining.toFixed(2)} remaining of your $${judgeAllocation.toLocaleString()} allocation.`,
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
            status: investment > 0 ? "Invested" : "Under Review",
          }
        }
        return entry
      }))

      setEditingInvestment(null)
      setInvestmentInput("")
    } catch (error) {
      toast.error("Failed to save investment", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleEditInvestment = (submissionId: string, currentValue: number) => {
    setEditingInvestment(submissionId)
    setInvestmentInput(currentValue.toString())
  }

  // Show nothing while auth is loading
  if (authLoading) {
    return null
  }

  // If no access, redirect will happen, but show nothing
  if (!hasAccess) {
    return null
  }

  return (
    <>
      {/* Judge Name Dialog */}
      <Dialog open={judgeNameDialogOpen} onOpenChange={(open) => {
        if (!open && !judgeName) {
          // Don't allow closing dialog if no judge name is set
          router.push("/")
        } else {
          setJudgeNameDialogOpen(open)
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Judge Authentication</DialogTitle>
            <DialogDescription>
              Please enter your judge name to access the judging dashboard
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJudgeNameSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="judge-name">
                  Judge Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="judge-name"
                  value={judgeNameInput}
                  onChange={(e) => {
                    setJudgeNameInput(e.target.value)
                    setJudgeNameError("")
                  }}
                  placeholder="Enter your judge name"
                  disabled={checkingJudge}
                  autoFocus
                  className={judgeNameError ? "border-destructive" : ""}
                />
                {judgeNameError && (
                  <p className="text-sm text-destructive">{judgeNameError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                disabled={checkingJudge}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={checkingJudge || !judgeNameInput.trim()}>
                {checkingJudge ? "Checking..." : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {hasAccess && judge && (
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
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Welcome, {judge.name}</CardTitle>
                          <CardDescription>
                            View and allocate funding to your assigned submissions
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearJudgeName}
                        >
                          Switch Judge
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <Label className="text-muted-foreground">Your Allocation</Label>
                          <p className="text-2xl font-bold">
                            $<NumberTicker value={judgeAllocation} />
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            of $<NumberTicker value={totalInvestmentFund} /> total
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Total Invested</Label>
                          <p className="text-2xl font-bold">
                            $<NumberTicker value={judge.totalInvested} />
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(judgeAllocation - judge.totalInvested) >= 0 ? (
                              <>$<NumberTicker value={judgeAllocation - judge.totalInvested} decimalPlaces={2} /> remaining</>
                            ) : (
                              <span className="text-destructive">
                                $<NumberTicker value={Math.abs(judgeAllocation - judge.totalInvested)} decimalPlaces={2} /> over
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
                    </CardContent>
                  </Card>
                </div>

                <div className="px-4 lg:px-6">
                  {loading ? (
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
                          // Find the entry and get submission ID
                          const entry = dashboardEntries.find(e => e.id === entryId)
                          if (!entry || !(entry as any).submissionId) return
                          
                          const submissionId = (entry as any).submissionId
                          
                          // Save to Supabase - this will update judge.totalInvested
                          await handleSaveInvestment(submissionId, investment)
                          
                          // Update entries in place to preserve pagination
                          // Only update the specific entry that changed, don't re-sort to avoid pagination reset
                          setDashboardEntries(prev => prev.map(e => {
                            if (e.id === entryId) {
                              return {
                                ...e,
                                investment: investment.toString(),
                                status: investment > 0 ? "Invested" : "Under Review",
                              }
                            }
                            return e
                          }))
                        }}
                        remainingAllocation={Math.max(0, judgeAllocation - judge.totalInvested)}
                        totalInvested={judge.totalInvested}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
      )}
    </>
  )
}
