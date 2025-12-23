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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconCurrencyDollar } from "@tabler/icons-react"
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

const ACCESS_CODE = "111-111"
const ACCESS_CODE_KEY = "dashboard_access_code"

type JudgeSubmission = {
  id: string
  project_name: string
  tracks: string[]
  investment: number
  team_name?: string
  devpost_link?: string
}

export default function JudgesPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
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

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem(ACCESS_CODE_KEY)
    if (stored !== ACCESS_CODE) {
      setHasAccess(false)
      router.push("/")
      return
    }

    // Always show dialog to enter judge name (no localStorage persistence)
    setJudgeNameDialogOpen(true)
    setHasAccess(false)
  }, [router])

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
      console.log("[Judge Auth] Checking if judge exists:", trimmedJudgeName)
      
      // Check if judge exists in Supabase
      console.log("[Judge Auth] Querying judges table for name:", trimmedJudgeName)
      const { data: judgesData, error: judgesError } = await supabase
        .from("judges")
        .select("id, name, email")
        .eq("name", trimmedJudgeName)
        .single()
      
      console.log("[Judge Auth] Raw query response:", { data: judgesData, error: judgesError })

      console.log("[Judge Auth] Supabase query result:", { judgesData, judgesError })

      if (judgesError) {
        console.error("[Judge Auth] Error checking judge - Raw error:", judgesError)
        console.error("[Judge Auth] Error type:", typeof judgesError)
        console.error("[Judge Auth] Error constructor:", judgesError?.constructor?.name)
        
        // Try to get all properties
        const errorDetails: Record<string, any> = {}
        for (const key in judgesError) {
          errorDetails[key] = (judgesError as any)[key]
        }
        console.error("[Judge Auth] Error properties:", errorDetails)
        
        // Try JSON stringify with replacer
        try {
          console.error("[Judge Auth] Error stringified:", JSON.stringify(judgesError, (key, value) => {
            if (value instanceof Error) {
              return {
                name: value.name,
                message: value.message,
                stack: value.stack,
                ...Object.fromEntries(Object.entries(value))
              }
            }
            return value
          }, 2))
        } catch (e) {
          console.error("[Judge Auth] Could not stringify error:", e)
        }
        
        // Check error properties
        const errorCode = (judgesError as any)?.code || (judgesError as any)?.statusCode
        const errorMessage = (judgesError as any)?.message || String(judgesError)
        const errorDetailsProp = (judgesError as any)?.details
        const errorHint = (judgesError as any)?.hint
        
        console.error("[Judge Auth] Extracted error info:", {
          code: errorCode,
          message: errorMessage,
          details: errorDetailsProp,
          hint: errorHint,
        })
        
        // Check if it's a "not found" error (PGRST116)
        const isNotFound = errorCode === "PGRST116" || 
                          errorCode === 406 || 
                          errorMessage?.includes("No rows") ||
                          errorMessage?.includes("Could not find")
        
        console.log("[Judge Auth] Is not found error?", isNotFound)
        
        setJudgeNameError("Judge not found. Please contact admin to be added as a judge.")
        setCheckingJudge(false)
        return
      }

      if (!judgesData) {
        console.warn("[Judge Auth] No judge data returned for name:", trimmedJudgeName)
        setJudgeNameError("Judge not found. Please contact admin to be added as a judge.")
        setCheckingJudge(false)
        return
      }

      console.log("[Judge Auth] Judge found:", { id: judgesData.id, name: judgesData.name, email: judgesData.email })

      if (judgesError || !judgesData) {
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
      console.error("Error checking judge:", error)
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
        console.log("[Load Judge Data] Loading data for judge:", judgeName)

        // Load judge from Supabase
        // Note: Using snake_case column names as per database schema (assigned_projects, total_invested)
        console.log("[Load Judge Data] Querying judges table for name:", judgeName)
        const { data: judgesData, error: judgesError } = await supabase
          .from("judges")
          .select("id, name, email, assigned_projects, total_invested, tracks")
          .eq("name", judgeName)
          .single()
        
        console.log("[Load Judge Data] Raw query response:", { data: judgesData, error: judgesError })

        console.log("[Load Judge Data] Judge query result:", { judgesData, judgesError })
        
        // Better error inspection
        if (judgesError) {
          console.error("[Load Judge Data] Error loading judge - Raw error:", judgesError)
          console.error("[Load Judge Data] Error type:", typeof judgesError)
          console.error("[Load Judge Data] Error constructor:", judgesError?.constructor?.name)
          
          // Try to get all properties
          const errorDetails: Record<string, any> = {}
          for (const key in judgesError) {
            errorDetails[key] = (judgesError as any)[key]
          }
          console.error("[Load Judge Data] Error properties:", errorDetails)
          
          // Try JSON stringify with replacer
          try {
            console.error("[Load Judge Data] Error stringified:", JSON.stringify(judgesError, (key, value) => {
              if (value instanceof Error) {
                return {
                  name: value.name,
                  message: value.message,
                  stack: value.stack,
                  ...Object.fromEntries(Object.entries(value))
                }
              }
              return value
            }, 2))
          } catch (e) {
            console.error("[Load Judge Data] Could not stringify error:", e)
          }
          
          // Check error properties
          const errorCode = (judgesError as any)?.code || (judgesError as any)?.statusCode
          const errorMessage = (judgesError as any)?.message || String(judgesError)
          const errorDetailsProp = (judgesError as any)?.details
          const errorHint = (judgesError as any)?.hint
          
          console.error("[Load Judge Data] Extracted error info:", {
            code: errorCode,
            message: errorMessage,
            details: errorDetailsProp,
            hint: errorHint,
          })
          
          // Check if it's a "not found" error (PGRST116)
          const isNotFound = errorCode === "PGRST116" || 
                            errorCode === 406 || 
                            errorMessage?.includes("No rows") ||
                            errorMessage?.includes("Could not find")
          
          console.log("[Load Judge Data] Is not found error?", isNotFound)
          
          // Judge not found - show dialog again
          setJudgeName("")
          setJudgeNameDialogOpen(true)
          setJudgeNameInput(judgeName)
          setJudgeNameError("Judge not found. Please contact admin to be added as a judge.")
          setHasAccess(false)
          return
        }

        if (!judgesData) {
          console.warn("[Load Judge Data] No judge data returned for name:", judgeName)
          // Judge not found - show dialog again
          setJudgeName("")
          setJudgeNameDialogOpen(true)
          setJudgeNameInput(judgeName)
          setJudgeNameError("Judge not found. Please contact admin to be added as a judge.")
          setHasAccess(false)
          return
        }

        console.log("[Load Judge Data] Raw judge data from database:", judgesData)

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
        
        console.log("[Load Judge Data] Mapped judge data:", {
          id: judgeData.id,
          name: judgeData.name,
          email: judgeData.email,
          assignedProjects: judgeData.assignedProjects,
          totalInvested: judgeData.totalInvested,
          tracks: judgeData.tracks,
        })
        setJudge(judgeData)

        // Load assigned submissions for this judge from calendar_schedule_slots
        // Filter calendar slots where judge_ids array contains this judge's ID
        console.log("[Load Judge Data] Loading assigned submissions from calendar_schedule_slots for judge_id:", judgeData.id)
        
        // Fetch all calendar slots and filter for ones that contain this judge's ID
        const { data: calendarSlotsData, error: calendarSlotsError } = await supabase
          .from("calendar_schedule_slots")
          .select("submission_id, judge_ids")

        console.log("[Load Judge Data] Calendar slots query result:", { calendarSlotsData, calendarSlotsError })

        if (calendarSlotsError) {
          console.error("[Load Judge Data] Error loading calendar slots:", calendarSlotsError)
          console.error("[Load Judge Data] Calendar slots error details:", {
            message: calendarSlotsError.message,
            details: calendarSlotsError.details,
            hint: calendarSlotsError.hint,
            code: calendarSlotsError.code,
          })
        }

        // Filter slots where judge_ids array contains the current judge's ID
        // Convert judge ID to string for comparison (it might be UUID or string)
        const judgeIdStr = String(judgeData.id)
        console.log("[Load Judge Data] Looking for judge ID in slots:", judgeIdStr)
        
        const assignedSlots = (calendarSlotsData || []).filter(slot => {
          const judgeIds = slot.judge_ids || []
          console.log("[Load Judge Data] Checking slot - submission_id:", slot.submission_id, "judge_ids:", judgeIds)
          
          // Loop through judge_ids array to check if current judge's ID exists
          if (!Array.isArray(judgeIds)) {
            console.warn("[Load Judge Data] judge_ids is not an array:", judgeIds)
            return false
          }
          
          // Loop through each ID in the array and compare
          for (let i = 0; i < judgeIds.length; i++) {
            const slotJudgeId = judgeIds[i]
            const slotJudgeIdStr = String(slotJudgeId)
            console.log(`[Load Judge Data] Comparing slot judge ID [${i}]: "${slotJudgeIdStr}" with judge ID: "${judgeIdStr}"`)
            
            if (slotJudgeIdStr === judgeIdStr) {
              console.log("[Load Judge Data] Match found! Judge is assigned to this slot")
              return true
            }
          }
          
          return false
        })

        console.log("[Load Judge Data] Filtered calendar slots for this judge:", assignedSlots)

        // Extract unique submission IDs
        const assignedSubmissionIds = Array.from(
          new Set(assignedSlots.map(slot => slot.submission_id))
        )
        
        console.log("[Load Judge Data] Assigned submission IDs from calendar:", assignedSubmissionIds)
        setAssignedSubmissionIds(assignedSubmissionIds)

        // Load submission details from Supabase (only assigned ones)
        let submissionsData: any[] | null = null
        if (assignedSubmissionIds.length > 0) {
          console.log("[Load Judge Data] Loading submission details for IDs:", assignedSubmissionIds)
          const { data, error: submissionsError } = await supabase
            .from("submissions")
            .select("id, project_name, tracks, team_name, devpost_link")
            .in("id", assignedSubmissionIds)
            .order("submitted_at", { ascending: false })
          
          console.log("[Load Judge Data] Submissions query result:", { data, error: submissionsError })

          if (submissionsError) {
            console.error("[Load Judge Data] Error loading submissions:", submissionsError)
            console.error("[Load Judge Data] Submissions error details:", {
              message: submissionsError.message,
              details: submissionsError.details,
              hint: submissionsError.hint,
              code: submissionsError.code,
            })
          } else {
            submissionsData = data
            console.log("[Load Judge Data] Loaded submissions:", submissionsData)
          }
        } else {
          console.log("[Load Judge Data] No assigned submission IDs found for this judge")
        }

        // Load investments from Supabase (using submission_id)
        console.log("[Load Judge Data] Loading investments for judge_id:", judgeData.id)
        const { data: investmentsData, error: investmentsError } = await supabase
          .from("judge_investments")
          .select("submission_id, amount")
          .eq("judge_id", judgeData.id)

        console.log("[Load Judge Data] Investments query result:", { investmentsData, investmentsError })

        if (investmentsError) {
          console.error("[Load Judge Data] Error loading investments:", investmentsError)
          console.error("[Load Judge Data] Investments error details:", {
            message: investmentsError.message,
            details: investmentsError.details,
            hint: investmentsError.hint,
            code: investmentsError.code,
          })
        } else {
          console.log("[Load Judge Data] Loaded investments:", investmentsData)
        }

        // Build investments map using submission IDs
        const investmentsMap: Record<string, number> = {}
        investmentsData?.forEach(inv => {
          investmentsMap[inv.submission_id] = parseFloat(String(inv.amount)) || 0
        })
        console.log("[Load Judge Data] Investments map:", investmentsMap)

        if (submissionsData && submissionsData.length > 0) {
          const judgeSubmissions: JudgeSubmission[] = submissionsData.map((submission: any) => ({
            id: submission.id,
            project_name: submission.project_name,
            tracks: submission.tracks || [],
            investment: investmentsMap[submission.id] || 0,
            team_name: submission.team_name,
            devpost_link: submission.devpost_link,
          }))

          console.log("[Load Judge Data] Final judge submissions:", judgeSubmissions)
          setSubmissions(judgeSubmissions)
          setInvestments(investmentsMap)
        } else {
          console.log("[Load Judge Data] No submissions to display")
          setSubmissions([])
          setInvestments({})
        }
        
        console.log("[Load Judge Data] Judge data loading completed successfully")
      } catch (error) {
        console.error("Failed to load judge data", error)
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
      setInvestments(prev => ({
        ...prev,
        [submissionId]: numValue,
      }))
    }
  }

  const handleSaveInvestment = async (submissionId: string) => {
    const investment = investments[submissionId] || 0

    if (!judge) {
      toast.error("Judge not loaded")
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
        console.error("Failed to update judge total:", judgeUpdateError)
        // Continue anyway as investment was saved
      }

      // Update local judge state
      setJudge(prev => prev ? { ...prev, totalInvested: updatedTotal } : null)

      setEditingInvestment(null)
      setInvestmentInput("")
      toast.success("Investment saved!", {
        description: `Allocated $${investment.toLocaleString()} to ${submissions.find(s => s.id === submissionId)?.project_name}`,
      })
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

  if (!hasAccess && !judgeNameDialogOpen) {
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
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label className="text-muted-foreground">Assigned Projects</Label>
                          <p className="text-2xl font-bold">{judge.assignedProjects}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Total Invested</Label>
                          <p className="text-2xl font-bold">
                            ${judge.totalInvested.toLocaleString()}
                          </p>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Assigned Submissions</CardTitle>
                      <CardDescription>
                        Allocate your investment funds to each submission scheduled for you
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Loading submissions...
                        </div>
                      ) : submissions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No submissions assigned yet. Please contact admin.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Project Name</TableHead>
                              <TableHead>Team</TableHead>
                              <TableHead>Tracks</TableHead>
                              <TableHead>Investment</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {submissions.map((submission) => (
                              <TableRow key={submission.id}>
                                <TableCell className="font-medium">{submission.project_name}</TableCell>
                                <TableCell>
                                  {submission.team_name && (
                                    <span className="text-sm text-muted-foreground">{submission.team_name}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {submission.tracks && submission.tracks.length > 0 ? (
                                      submission.tracks.map((track) => (
                                        <Badge key={track} variant="outline">{track}</Badge>
                                      ))
                                    ) : (
                                      <Badge variant="outline">General</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {editingInvestment === submission.id ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={investmentInput}
                                        onChange={(e) => {
                                          handleInvestmentChange(submission.id, e.target.value)
                                        }}
                                        className="w-32"
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveInvestment(submission.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingInvestment(null)
                                          setInvestmentInput("")
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <IconCurrencyDollar className="h-4 w-4" />
                                      <span className="font-medium">
                                        ${investments[submission.id]?.toLocaleString() || "0"}
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {editingInvestment !== submission.id && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleEditInvestment(submission.id, investments[submission.id] || 0)
                                      }
                                    >
                                      {investments[submission.id] > 0 ? "Edit" : "Allocate"}
                                    </Button>
                                  )}
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
    </div>
      )}
    </>
  )
}
