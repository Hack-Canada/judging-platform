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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { IconUsers, IconCurrencyDollar, IconTrendingUp, IconCoins, IconPlus, IconEdit, IconTrash, IconDotsVertical, IconTrophy } from "@tabler/icons-react"
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
import { DashboardAdminSkeleton } from "@/components/page-skeletons"
import { supabase } from "@/lib/supabase-client"
import { Skeleton } from "@/components/ui/skeleton"
import {
  autoAssignByTrackMatch,
  autoAssignByRoomAndTrack,
  buildSchedulePerJudgeRoom,
  type JudgeRoomMap,
} from "@/lib/judging-autoassign"
import { Textarea } from "@/components/ui/textarea"


export default function AdminPage() {
  type LeaderboardEntry = {
    submissionId: string
    projectName: string
    teamName: string
    tracks: string[]
    totalPoints: number
    judgeCount: number
    submittedAt: string | null
  }

  const POINTS_PER_JUDGE = 20
  const TARGET_JUDGES_PER_PROJECT = 3
  const [investmentFund, setInvestmentFund] = React.useState(String(POINTS_PER_JUDGE))
  const [judgesList, setJudgesList] = React.useState<Judge[]>([])
  const [projectsList, setProjectsList] = React.useState<AdminProject[]>([])
  const [slotDuration, setSlotDuration] = React.useState("5") // Calendar slot duration in minutes
  const [scheduleStartTime, setScheduleStartTime] = React.useState("10:00") // Default 10 AM
  const [scheduleEndTime, setScheduleEndTime] = React.useState("17:00") // Default 5 PM
  const [minInvestment, setMinInvestment] = React.useState("0")
  const [maxInvestment, setMaxInvestment] = React.useState(String(POINTS_PER_JUDGE))
  const [hackerScheduleVisibilityEnabled, setHackerScheduleVisibilityEnabled] = React.useState(false)
  const [savingHackerScheduleVisibility, setSavingHackerScheduleVisibility] = React.useState(false)
  const [scheduleDate, setScheduleDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [publishingSchedule, setPublishingSchedule] = React.useState(false)
  const [clearingSchedule, setClearingSchedule] = React.useState(false)
  const [clearingAssignments, setClearingAssignments] = React.useState(false)
  const [isInitialized, setIsInitialized] = React.useState(false)
  
  // Judges management state
  const [isJudgeDialogOpen, setIsJudgeDialogOpen] = React.useState(false)
  const [editingJudge, setEditingJudge] = React.useState<Judge | null>(null)
  const [deleteJudgeDialogOpen, setDeleteJudgeDialogOpen] = React.useState(false)
  const [judgeToDelete, setJudgeToDelete] = React.useState<Judge | null>(null)
  const [judgeFormData, setJudgeFormData] = React.useState({
    name: "",
    email: "",
    pin: "",
    tracks: [] as string[],
  })
  const [tracksList, setTracksList] = React.useState<Track[]>(defaultTracks)
  const [roomsList, setRoomsList] = React.useState<Room[]>(defaultRooms)
  
  // Hacker submissions state
  const [submissions, setSubmissions] = React.useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = React.useState(false)
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = React.useState(false)
  
  // Track if assignments have been modified and need saving
  const [assignmentsModified, setAssignmentsModified] = React.useState(false)
  const [savingAssignments, setSavingAssignments] = React.useState(false)
  const [scheduleQuality, setScheduleQuality] = React.useState({
    slots: 0,
    roomMoves: 0,
    unscheduled: 0,
  })
  const [manualAssignmentDialogOpen, setManualAssignmentDialogOpen] = React.useState(false)
  const [manualProjectsList, setManualProjectsList] = React.useState<AdminProject[]>([])

  // Judge-room assignment state: judgeId → roomId
  const [judgeRoomAssignments, setJudgeRoomAssignments] = React.useState<Record<string, number>>({})

  // CSV import state
  type ParsedProject = {
    project_name: string
    devpost_link: string | null
    tracks: string[]
    submitter_name: string | null
    submitter_email: string | null
    members: string[]
  }
  const [csvImportOpen, setCsvImportOpen] = React.useState(false)
  const [csvText, setCsvText] = React.useState("")
  const [csvPreview, setCsvPreview] = React.useState<ParsedProject[] | null>(null)
  const [csvImporting, setCsvImporting] = React.useState(false)

  // Backup state
  type BackupSnapshot = {
    id: string
    snapshot_at: string
    triggered_by: string
    row_counts: Record<string, number> | null
    error_info: string | null
  }
  const [backupSnapshots, setBackupSnapshots] = React.useState<BackupSnapshot[]>([])
  const [backupLoading, setBackupLoading] = React.useState(false)

  // Room editing helpers
  const handleRoomChange = (id: number, updates: Partial<Room>) => {
    setRoomsList((prev) =>
      prev.map((room) =>
        room.id === id ? { ...room, ...updates } : room,
      ),
    )
  }

  const saveRoomsToSupabase = async (updatedRooms: Room[]) => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert(
          {
            setting_key: "rooms_data",
            setting_value: JSON.stringify(updatedRooms),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "setting_key",
          },
        )

      if (error) {

        toast.error("Failed to save rooms", {
          description: error.message,
        })
        return
      }

      toast.success("Rooms updated", {
        description: "Room settings have been saved",
      })
    } catch (error) {

      toast.error("Failed to save rooms", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }
  
  // Track stats state
  const [trackStats, setTrackStats] = React.useState<Map<string, {
    trackName: string
    submissionCount: number
    totalInvestment: number
    averageInvestment: number
    judgeCount: number
  }>>(new Map())

  // Load track stats function (defined at component level for reuse)
  const loadTrackStats = React.useCallback(async (submissionsData: any[], judgesData: any[]) => {
    try {
      // Get all submissions with their tracks
      const submissionTracksMap = new Map<string, string[]>() // submission_id -> tracks[]
      submissionsData.forEach((sub: any) => {
        const tracks = sub.tracks && Array.isArray(sub.tracks) ? sub.tracks : ["General"]
        submissionTracksMap.set(sub.id, tracks)
      })
      
      // Get all investments
      const { data: investmentsData, error: investmentsError } = await supabase
        .from("judge_investments")
        .select("submission_id, amount")
      
      if (investmentsError) {

        return
      }
      
      // Calculate investment per submission
      const submissionInvestments = new Map<string, number>() // submission_id -> total investment
      investmentsData?.forEach((inv: any) => {
        const current = submissionInvestments.get(inv.submission_id) || 0
        submissionInvestments.set(inv.submission_id, current + parseFloat(String(inv.amount || 0)))
      })
      
      // Aggregate stats by track
      const statsMap = new Map<string, {
        submissionIds: Set<string>
        totalInvestment: number
        judgeIds: Set<string>
      }>()
      
      // Process each submission
      submissionsData.forEach((sub: any) => {
        const tracks = submissionTracksMap.get(sub.id) || ["General"]
        const investment = submissionInvestments.get(sub.id) || 0
        
        tracks.forEach((track: string) => {
          if (!statsMap.has(track)) {
            statsMap.set(track, {
              submissionIds: new Set(),
              totalInvestment: 0,
              judgeIds: new Set(),
            })
          }
          
          const stats = statsMap.get(track)!
          stats.submissionIds.add(sub.id)
          stats.totalInvestment += investment
        })
      })
      
      // Count judges per track
      judgesData.forEach((judge: any) => {
        const judgeTracks = judge.tracks && Array.isArray(judge.tracks) ? judge.tracks : ["General"]
        judgeTracks.forEach((track: string) => {
          if (statsMap.has(track)) {
            statsMap.get(track)!.judgeIds.add(judge.id)
          }
        })
        // All judges can judge General
        if (statsMap.has("General")) {
          statsMap.get("General")!.judgeIds.add(judge.id)
        }
      })
      
      // Convert to final stats format
      const finalStats = new Map<string, {
        trackName: string
        submissionCount: number
        totalInvestment: number
        averageInvestment: number
        judgeCount: number
      }>()
      
      statsMap.forEach((stats, trackName) => {
        const submissionCount = stats.submissionIds.size
        const totalInvestment = stats.totalInvestment
        const averageInvestment = submissionCount > 0 ? totalInvestment / submissionCount : 0
        const judgeCount = stats.judgeIds.size
        
        finalStats.set(trackName, {
          trackName,
          submissionCount,
          totalInvestment,
          averageInvestment,
          judgeCount,
        })
      })
      
      setTrackStats(finalStats)

    } catch (error) {

    }
  }, [])

  const findMatchingSubmission = React.useCallback((sourceRow: any, existingRows: any[]) => {
    const normalizedDevpostLink = (sourceRow?.devpost_link || "").trim()
    if (normalizedDevpostLink) {
      const byDevpost = existingRows.find(
        (row) => (row.devpost_link || "").trim().toLowerCase() === normalizedDevpostLink.toLowerCase(),
      )
      if (byDevpost) return byDevpost
    }

    const normalizedProjectName = (sourceRow?.project_name || "").trim().toLowerCase()
    if (!normalizedProjectName) return null

    return (
      existingRows.find(
        (row) => (row.project_name || "").trim().toLowerCase() === normalizedProjectName,
      ) || null
    )
  }, [])

  const loadLeaderboard = React.useCallback(async () => {
    try {
      setLoadingLeaderboard(true)
      const [{ data: submissionsData, error: submissionsError }, { data: investmentsData, error: investmentsError }] = await Promise.all([
        supabase
          .from("test_submissions")
          .select("id, project_name, tracks, created_at"),
        supabase
          .from("judge_investments")
          .select("submission_id, judge_id, amount"),
      ])

      if (submissionsError) throw submissionsError
      if (investmentsError) throw investmentsError

      const bySubmission = new Map<string, { totalPoints: number; judges: Set<string> }>()
      ;(investmentsData || []).forEach((investment: any) => {
        const amount = parseFloat(String(investment.amount || 0))
        if (!Number.isFinite(amount)) return

        const existing = bySubmission.get(investment.submission_id) || {
          totalPoints: 0,
          judges: new Set<string>(),
        }
        existing.totalPoints += amount
        if (investment.judge_id) {
          existing.judges.add(String(investment.judge_id))
        }
        bySubmission.set(investment.submission_id, existing)
      })

      const nextLeaderboard: LeaderboardEntry[] = (submissionsData || []).map((submission: any) => {
        const pointsData = bySubmission.get(submission.id)
        return {
          submissionId: submission.id,
          projectName: submission.project_name || "Untitled Project",
          teamName: submission.team_name || "-",
          tracks: Array.isArray(submission.tracks) ? submission.tracks : ["General"],
          totalPoints: pointsData?.totalPoints || 0,
          judgeCount: pointsData?.judges.size || 0,
          submittedAt: submission.submitted_at || submission.created_at || null,
        }
      })

      nextLeaderboard.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
        return (a.submittedAt || "").localeCompare(b.submittedAt || "")
      })

      setLeaderboard(nextLeaderboard)
    } catch (error) {
      toast.error("Failed to load leaderboard", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoadingLeaderboard(false)
    }
  }, [])

  React.useEffect(() => {
    const loadFromSupabase = async () => {
      // Load admin settings from Supabase
      const loadSettingsFromSupabase = async () => {
        try {
          const { data: settingsData, error: settingsError } = await supabase
            .from("admin_settings")
            .select("setting_key, setting_value")

          if (settingsError) {

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
              const parsed = parseFloat(investmentFund)
              setInvestmentFund(
                Number.isFinite(parsed) && parsed > 0 && parsed <= 100
                  ? String(parsed)
                  : String(POINTS_PER_JUDGE)
              )
            }

            // Load calendar settings
            const slotDuration = settingsMap.get("calendar_slot_duration")
            if (slotDuration) {
              setSlotDuration(slotDuration)
            }

            const startTime = settingsMap.get("calendar_start_time")
            if (startTime) {
              setScheduleStartTime(startTime)
            }

            const endTime = settingsMap.get("calendar_end_time")
            if (endTime) {
              setScheduleEndTime(endTime)
            }

            const selectedDate = settingsMap.get("calendar_selected_date")
            if (selectedDate) {
              setScheduleDate(selectedDate)
            }

            // Load scoring settings
            const minInvestment = settingsMap.get("scoring_min_investment")
            if (minInvestment) {
              setMinInvestment(minInvestment)
            }

            const maxInvestment = settingsMap.get("scoring_max_investment")
            if (maxInvestment) {
              const parsed = parseFloat(maxInvestment)
              setMaxInvestment(
                Number.isFinite(parsed) && parsed > 0 && parsed <= 100
                  ? String(parsed)
                  : String(POINTS_PER_JUDGE)
              )
            }

            const hackerScheduleVisibility = settingsMap.get("hacker_schedule_visibility")
            if (hackerScheduleVisibility) {
              setHackerScheduleVisibilityEnabled(hackerScheduleVisibility === "enabled")
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

              }
            }

            // Load judge-room assignments
            const judgeRoomsData = settingsMap.get("judge_room_assignments")
            if (judgeRoomsData) {
              try {
                const parsed = JSON.parse(judgeRoomsData)
                if (parsed && typeof parsed === "object") {
                  setJudgeRoomAssignments(parsed)
                }
              } catch (e) {

              }
            }

          }
        } catch (error) {

        }
      }

      try {

        await loadSettingsFromSupabase()

        const [
          { data: supabaseJudges, error: judgesError }, 
          { data: supabaseSubmissions, error: submissionsError },
          { data: assignmentsData, error: assignmentsError },
          { data: persistedSubmissions }
        ] = await Promise.all([
          supabase
            .from("judges")
            .select("id, name, email, assigned_projects, total_invested, tracks")
            .order("created_at", { ascending: false }),
          supabase
            .from("test_submissions")
            .select("id, project_name, devpost_link, submitter_name, submitter_email, members, tracks, created_at"),
          supabase
            .from("judge_project_assignments")
            .select("judge_id, submission_id"),
          supabase
            .from("submissions")
            .select("id, project_name, devpost_link")
        ])



        const judgesArray = supabaseJudges as any[] | null

        if (judgesError) {

          setJudgesList([])
        } else if (judgesArray && judgesArray.length > 0) {

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

            return mapped
          })


          setJudgesList(mappedJudges)

          // Force a re-render check
          setTimeout(() => {

          }, 100)
        } else if (!judgesArray || judgesArray.length === 0) {

          // Only set empty if we actually have no data (don't overwrite if already loaded)
          setJudgesList((prev) => prev.length > 0 ? prev : [])
        }

        if (!submissionsError && supabaseSubmissions && supabaseSubmissions.length > 0) {
          // Load assignments and map judge names to submissions
          const assignmentMap = new Map<string, string[]>() // submission_id -> judge names
          const assignmentSetBySubmission = new Map<string, Set<string>>()
          if (!assignmentsError && assignmentsData) {
            assignmentsData.forEach((assignment: any) => {
              const submissionId = assignment.submission_id
              const judge = supabaseJudges?.find((j: any) => j.id === assignment.judge_id)
              if (judge && submissionId) {
                if (!assignmentSetBySubmission.has(submissionId)) {
                  assignmentSetBySubmission.set(submissionId, new Set())
                }
                assignmentSetBySubmission.get(submissionId)?.add(judge.name)
              }
            })
            assignmentSetBySubmission.forEach((judgeNames, submissionId) => {
              assignmentMap.set(submissionId, Array.from(judgeNames))
            })
          }
          
          // Map submissions to AdminProject format with assignments
          const mappedProjects: AdminProject[] = (supabaseSubmissions as any[]).map((row, index) => {
            const testId = String(row.id)
            return {
              id: index + 1,
              name: row.project_name ?? "Untitled Project",
              assignedJudges: assignmentMap.get(testId) || [],
              totalInvestment: 0,
              tracks: (row.tracks && Array.isArray(row.tracks) && row.tracks.length > 0)
                ? row.tracks
                : ["General"],
              submissionId: testId,
              sourceSubmissionId: testId,
            } as AdminProject
          })
          setProjectsList(mappedProjects as any)
        }

        // Load track stats
        await loadTrackStats(supabaseSubmissions || [], judgesArray || [])
        
        // Auto-assign in UI if there are submissions but no assignments yet (state only; user can click to save)
        if (supabaseSubmissions && supabaseSubmissions.length > 0 && 
            (!assignmentsData || assignmentsData.length === 0) &&
            judgesArray && judgesArray.length > 0) {
          setTimeout(() => autoAssignJudges(false), 500)
        }
      } catch (error) {



        if (error instanceof Error) {


        }
      } finally {

        setIsInitialized(true)
      }
    }

    void loadFromSupabase()
  }, [findMatchingSubmission, loadTrackStats])
  
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

        throw error
      }
    } catch (error) {

      throw error
    }
  }

  // Debug: Track judgesList changes
  React.useEffect(() => {


  }, [judgesList])

  // Load submissions
  React.useEffect(() => {
    if (!isInitialized) return

    const loadSubmissions = async () => {
      try {
        setLoadingSubmissions(true)
        const { data, error } = await supabase
          .from("test_submissions")
          .select("*")
          .order("created_at", { ascending: false })

        if (error && !error.message.includes("relation") && !error.message.includes("does not exist")) {

          return
        }

        if (data) {
          setSubmissions(data)
        }
      } catch (error) {

      } finally {
        setLoadingSubmissions(false)
      }
    }

    void loadSubmissions()
  }, [isInitialized])

  React.useEffect(() => {
    if (!isInitialized) return

    void loadLeaderboard()

    const channel = supabase
      .channel("admin-live-leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "judge_investments" },
        () => {
          void loadLeaderboard()
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "test_submissions" },
        () => {
          void loadLeaderboard()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [isInitialized, loadLeaderboard])

  // Backup helpers
  const fetchBackupSnapshots = React.useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    const res = await fetch("/api/admin/backup", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json()
      setBackupSnapshots(json.snapshots ?? [])
    }
  }, [])

  const triggerBackupSnapshot = async () => {
    setBackupLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error("Not authenticated")
      const res = await fetch("/api/admin/backup/trigger", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Unknown error")
      }
      toast.success("Backup snapshot created")
      await fetchBackupSnapshots()
    } catch (err) {
      toast.error("Backup failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setBackupLoading(false)
    }
  }

  const downloadBackupSnapshot = async (id: string, snapshotAt: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    const res = await fetch(`/api/admin/backup?id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      toast.error("Failed to download snapshot")
      return
    }
    const json = await res.json()
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `backup-${snapshotAt.replace(/[:.]/g, "-")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  React.useEffect(() => {
    if (!isInitialized) return
    void fetchBackupSnapshots()
  }, [isInitialized, fetchBackupSnapshots])

  const loadJudgesFromSupabase = async () => {

    try {

      const { data: supabaseJudges, error: judgesError } = await supabase
        .from("judges")
        .select("id, name, email, assigned_projects, total_invested, tracks")
        .order("created_at", { ascending: false })




      if (judgesError) {

        toast.error("Failed to load judges", {
          description: judgesError.message,
        })
        return
      }

      if (supabaseJudges && supabaseJudges.length > 0) {

        
        const mappedJudges: Judge[] = (supabaseJudges as any[]).map((row, index) => {
          const mapped = {
            id: row.id as any,
            name: row.name,
            email: row.email || "",
            assignedProjects: row.assigned_projects || 0,
            totalInvested: parseFloat(String(row.total_invested || 0)),
            tracks: row.tracks || ["General"],
          }

          return mapped
        })


      setJudgesList(mappedJudges)

      // Reload track stats after judges are updated
      if (submissions.length > 0) {
        loadTrackStats(submissions, mappedJudges)
      }
        
        // Verify state was set
        setTimeout(() => {

        }, 50)
      } else {

        setJudgesList([])
      }
    } catch (error) {



      if (error instanceof Error) {


      }
      toast.error("Failed to load judges", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const saveJudgeRoomAssignment = async (judgeId: string, roomId: number) => {
    const next = { ...judgeRoomAssignments, [judgeId]: roomId }
    setJudgeRoomAssignments(next)
    try {
      await saveSettingToSupabase("judge_room_assignments", JSON.stringify(next))
    } catch {
      toast.error("Failed to save room assignment")
    }
  }

  // CSV parsing: one row per track, grouped by project_name / devpost_link
  const parseCsvForImport = (raw: string): ParsedProject[] => {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) return []

    // Parse a single CSV line respecting quoted fields
    const parseLine = (line: string): string[] => {
      const fields: string[] = []
      let field = ""
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') { field += '"'; i++ }
          else if (ch === '"') { inQuotes = false }
          else { field += ch }
        } else {
          if (ch === '"') { inQuotes = true }
          else if (ch === ',') { fields.push(field.trim()); field = "" }
          else { field += ch }
        }
      }
      fields.push(field.trim())
      return fields
    }

    const [, ...dataLines] = lines // skip header
    const byKey = new Map<string, ParsedProject>()

    for (const line of dataLines) {
      const cols = parseLine(line)
      const project_name = cols[0]?.trim() || ""
      const devpost_link = cols[1]?.trim() || null
      const track = cols[2]?.trim() || ""
      const submitter_name = cols[3]?.trim() || null
      const submitter_email = cols[4]?.trim() || null
      const membersRaw = cols[5]?.trim() || ""
      const members = membersRaw
        ? membersRaw.split(/[;,]/).map((m) => m.trim()).filter(Boolean)
        : []

      if (!project_name) continue

      const key = devpost_link || project_name

      if (!byKey.has(key)) {
        byKey.set(key, {
          project_name,
          devpost_link: devpost_link || null,
          tracks: [],
          submitter_name,
          submitter_email,
          members,
        })
      }

      const entry = byKey.get(key)!
      if (track && !entry.tracks.includes(track)) {
        entry.tracks.push(track)
      }
    }

    return Array.from(byKey.values())
  }

  const handleCsvParse = () => {
    const parsed = parseCsvForImport(csvText)
    if (parsed.length === 0) {
      toast.error("No projects found", { description: "Check that your CSV has a header row and data rows." })
      return
    }
    setCsvPreview(parsed)
  }

  const handleCsvImport = async () => {
    if (!csvPreview || csvPreview.length === 0) return
    try {
      setCsvImporting(true)

      // Clear existing test_submissions
      const { error: deleteError } = await supabase
        .from("test_submissions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")

      if (deleteError) throw deleteError

      // Insert in batches of 20
      const BATCH = 20
      for (let i = 0; i < csvPreview.length; i += BATCH) {
        const batch = csvPreview.slice(i, i + BATCH)
        const { error: insertError } = await supabase.from("test_submissions").insert(batch)
        if (insertError) throw insertError
      }

      toast.success(`Imported ${csvPreview.length} project(s)`, {
        description: "test_submissions table has been replaced.",
      })

      // Reload submissions + projects list
      const [{ data: newSubs }, { data: assignments }] = await Promise.all([
        supabase.from("test_submissions").select("id, project_name, tracks"),
        supabase.from("judge_project_assignments").select("judge_id, submission_id"),
      ])

      if (newSubs) {
        const assignmentMap = new Map<string, string[]>()
        if (assignments) {
          assignments.forEach((a: any) => {
            const judge = judgesList.find((j: any) => String(j.id) === String(a.judge_id))
            if (judge && a.submission_id) {
              if (!assignmentMap.has(a.submission_id)) assignmentMap.set(a.submission_id, [])
              assignmentMap.get(a.submission_id)!.push(judge.name)
            }
          })
        }
        const mapped = (newSubs as any[]).map((row, index) => ({
          id: index + 1,
          name: row.project_name ?? "Untitled Project",
          assignedJudges: assignmentMap.get(row.id) || [],
          totalInvestment: 0,
          tracks: Array.isArray(row.tracks) && row.tracks.length > 0 ? row.tracks : [],
          submissionId: row.id,
        }))
        setProjectsList(mapped as any)
        setSubmissions(newSubs as any[])
      }

      setCsvImportOpen(false)
      setCsvText("")
      setCsvPreview(null)
    } catch (error) {
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setCsvImporting(false)
    }
  }

  const handleSaveFund = async () => {
    const parsedPoints = parseFloat(investmentFund)
    if (!Number.isFinite(parsedPoints) || parsedPoints <= 0) {
      toast.error("Invalid points value", {
        description: "Points per judge must be a positive number.",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          setting_key: "investment_fund",
          setting_value: String(parsedPoints),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "setting_key"
        })

      if (error) {
        throw error
      }

      setInvestmentFund(String(parsedPoints))
      toast.success("Points setting saved!", {
        description: `Points per judge set to ${parsedPoints.toLocaleString()} points.`,
      })
    } catch (error) {

      toast.error("Failed to save points setting", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleSaveCalendarSettings = async () => {
    try {
      const settingsToSave = [
        { setting_key: "calendar_slot_duration", setting_value: slotDuration },
        { setting_key: "calendar_judges_per_project", setting_value: String(TARGET_JUDGES_PER_PROJECT) },
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
        description: `Schedule: ${scheduleStartTime} - ${scheduleEndTime}, Slot duration: ${slotDuration}min, Judges per project: ${TARGET_JUDGES_PER_PROJECT}`,
      })
    } catch (error) {

      toast.error("Failed to save calendar settings", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const persistSelectedCalendarDate = async (nextDate: string) => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert(
          {
            setting_key: "calendar_selected_date",
            setting_value: nextDate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" }
        )

      if (error) {
        throw error
      }
    } catch (error) {
      toast.error("Failed to save calendar date", {
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
        description: `Points range: ${parseFloat(minInvestment).toLocaleString()} - ${parseFloat(maxInvestment).toLocaleString()} points`,
      })
    } catch (error) {

      toast.error("Failed to save scoring settings", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleSaveHackerScheduleVisibility = async (nextEnabled: boolean) => {
    setSavingHackerScheduleVisibility(true)
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert(
          {
            setting_key: "hacker_schedule_visibility",
            setting_value: nextEnabled ? "enabled" : "disabled",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "setting_key",
          }
        )

      if (error) throw error

      toast.success("Hacker schedule visibility updated", {
        description: nextEnabled
          ? "Hackers can now view the published judging schedule."
          : "Hackers can no longer view the judging schedule.",
      })
    } catch (error) {
      setHackerScheduleVisibilityEnabled((current) => !current)
      toast.error("Failed to update visibility", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setSavingHackerScheduleVisibility(false)
    }
  }

  const syncJudgeAuthPin = async (payload: { name: string; email: string; pin: string }) => {
    const getAccessToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        return session.access_token
      }

      const { data, error } = await supabase.auth.refreshSession()
      if (error || !data.session?.access_token) {
        throw new Error("Session expired. Please sign in again.")
      }

      return data.session.access_token
    }

    const makeRequest = async (accessToken: string) =>
      fetch("/api/judges/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

    let response = await makeRequest(await getAccessToken())

    if (response.status === 401) {
      const { data, error } = await supabase.auth.refreshSession()
      if (error || !data.session?.access_token) {
        throw new Error("Session expired. Please sign in again.")
      }
      response = await makeRequest(data.session.access_token)
    }

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || "Failed to configure judge PIN login")
    }
  }

  const handleOpenJudgeDialog = (judge?: Judge) => {
    if (judge) {
      setEditingJudge(judge)
      setJudgeFormData({ name: judge.name, email: judge.email, pin: "", tracks: judge.tracks || [] })
    } else {
      setEditingJudge(null)
      setJudgeFormData({ name: "", email: "", pin: "", tracks: [] })
    }
    setIsJudgeDialogOpen(true)
  }

  const handleCloseJudgeDialog = () => {
    setIsJudgeDialogOpen(false)
    setEditingJudge(null)
    setJudgeFormData({ name: "", email: "", pin: "", tracks: [] })
  }

  const handleJudgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()



    if (!judgeFormData.name.trim() || !judgeFormData.email.trim()) {

      toast.error("Validation error", {
        description: "Name and email are required",
      })
      return
    }
    const normalizedEmail = judgeFormData.email.trim().toLowerCase()
    const normalizedPin = judgeFormData.pin.trim()
    const shouldResetPin = normalizedPin.length > 0
    if (!editingJudge && !/^\d{6}$/.test(normalizedPin)) {
      toast.error("Validation error", {
        description: "PIN is required and must be exactly 6 digits.",
      })
      return
    }
    if (editingJudge && shouldResetPin && !/^\d{6}$/.test(normalizedPin)) {
      toast.error("Invalid PIN", {
        description: "Reset PIN must be exactly 6 digits.",
      })
      return
    }
    if (editingJudge && editingJudge.email.trim().toLowerCase() !== normalizedEmail && !/^\d{6}$/.test(normalizedPin)) {
      toast.error("PIN required", {
        description: "Set a 6-digit PIN when changing a judge email so login is provisioned for the new email.",
      })
      return
    }

    try {
      if (editingJudge) {

        // Update existing judge in Supabase
        const judgeId = typeof editingJudge.id === 'string' ? editingJudge.id : String(editingJudge.id)


        const { data, error } = await supabase
          .from("judges")
          .update({
            name: judgeFormData.name,
            email: normalizedEmail,
            tracks: judgeFormData.tracks.length > 0 ? judgeFormData.tracks : ["General"],
          })
          .eq("id", judgeId)
          .select()


        if (error) {

          toast.error("Failed to update judge", {
            description: error.message,
          })
          return
        }

      } else {

        // Create new judge in Supabase
        const insertPayload = {
          name: judgeFormData.name,
          email: normalizedEmail,
          tracks: judgeFormData.tracks.length > 0 ? judgeFormData.tracks : ["General"],
          assigned_projects: 0,
          total_invested: 0,
        }

        const { data, error } = await supabase
          .from("judges")
          .insert(insertPayload)
          .select()


        if (error) {

          toast.error("Failed to create judge", {
            description: error.message,
          })
          return
        }
      }

      if (shouldResetPin) {
        await syncJudgeAuthPin({
          name: judgeFormData.name.trim(),
          email: normalizedEmail,
          pin: normalizedPin,
        })
      }

      toast.success(editingJudge ? "Judge updated!" : "Judge added!", {
        description: editingJudge
          ? shouldResetPin
            ? `${judgeFormData.name}'s login PIN has been reset.`
            : `${judgeFormData.name} has been updated.`
          : `${judgeFormData.name} has been added with a 6-digit login PIN.`,
      })

      // Reload judges from Supabase
      await loadJudgesFromSupabase()
      handleCloseJudgeDialog()
    } catch (error) {



      if (error instanceof Error) {


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

      return
    }


    try {
      const judgeId = typeof judgeToDelete.id === 'string' ? judgeToDelete.id : String(judgeToDelete.id)

      const { data, error } = await supabase
        .from("judges")
        .delete()
        .eq("id", judgeId)
        .select()


      if (error) {

        toast.error("Failed to delete judge", {
          description: error.message,
        })
        return
      }

      toast.success("Judge deleted!", {
        description: `${judgeToDelete.name} has been removed`,
      })

      // Reload judges from Supabase
      await loadJudgesFromSupabase()
      setDeleteJudgeDialogOpen(false)
      setJudgeToDelete(null)
    } catch (error) {



      if (error instanceof Error) {


      }
      toast.error("Failed to delete judge", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const autoAssignJudges = (showToast = false) => {



    // Don't run if we don't have judges or projects yet
    if (judgesList.length === 0 || projectsList.length === 0) {

      return
    }
    
    const activeProjects = projectsList

    // Use room-aware assignment if any judge has a room assigned,
    // otherwise fall back to the original per-judge track match
    const hasRoomAssignments = Object.keys(judgeRoomAssignments).length > 0
    const judgeRoomMap: JudgeRoomMap = new Map(
      Object.entries(judgeRoomAssignments).map(([judgeId, roomId]) => [judgeId, roomId])
    )
    const assignmentResult = hasRoomAssignments
      ? autoAssignByRoomAndTrack(judgesList, projectsList, judgeRoomMap)
      : autoAssignByTrackMatch(judgesList, projectsList)
    const updatedProjects = assignmentResult.updatedProjects

    setProjectsList(updatedProjects)
    
    // Update judge assignedProjects count - use functional update to ensure we have latest state
    const updatedJudges = judgesList.map((judge) => {
      const assignedCount = assignmentResult.judgeAssignedCountByName.get(judge.name) ?? 0
      return {
        ...judge,
        assignedProjects: assignedCount,
      }
    })

    setJudgesList(currentJudges => {
      const merged = currentJudges.map(judge => {
        const assignedCount = assignmentResult.judgeAssignedCountByName.get(judge.name) ?? 0
        return {
          ...judge,
          assignedProjects: assignedCount,
        }
      })

      return merged
    })
    
    // Show toast notification if requested
    if (showToast) {
      const activeProjectsCount = activeProjects.length
      const totalAssignments = updatedProjects.reduce((sum, p) => sum + p.assignedJudges.length, 0)
      if (totalAssignments > 0) {
        toast.success("Judges auto-assigned!", {
          description: `${totalAssignments} judge assignment(s) across ${activeProjectsCount} submission(s) by track match.`,
        })
      }
    }

    if (assignmentResult.underAssignedProjects.length > 0) {
      toast.warning("Some projects need more eligible judges", {
        description: `${assignmentResult.underAssignedProjects.length} project(s) received fewer than 2 judges due to track/availability constraints.`,
      })
    }

    return {
      updatedProjects,
      updatedJudges,
      underAssignedProjects: assignmentResult.underAssignedProjects,
    }
  }

  const handleSaveAssignments = async (projectsOverride?: AdminProject[], judgesOverride?: Judge[]) => {
    const sourceProjects = projectsOverride ?? projectsList
    const sourceJudges = judgesOverride ?? judgesList

    if (sourceProjects.length === 0) {
      toast.error("No assignments to save")
      return
    }

    try {
      setSavingAssignments(true)

      const sourceSubmissionIds = sourceProjects
        .map((project) => String((project as any).sourceSubmissionId || ""))
        .filter(Boolean)

      const sourceRowsById = new Map<string, any>()
      if (sourceSubmissionIds.length > 0) {
        const { data: sourceRows, error: sourceRowsError } = await supabase
          .from("test_submissions")
          .select("id, project_name, devpost_link, submitter_name, submitter_email, members, tracks, created_at")
          .in("id", sourceSubmissionIds)

        if (sourceRowsError) throw sourceRowsError
        ;(sourceRows || []).forEach((row: any) => {
          sourceRowsById.set(String(row.id), row)
        })
      }

      const resolvedProjects: AdminProject[] = []
      for (const project of sourceProjects) {
        // Use test_submissions ID directly — no submissions table roundtrip needed
        const submissionId =
          (project as any).submissionId
            ? String((project as any).submissionId)
            : (project as any).sourceSubmissionId
              ? String((project as any).sourceSubmissionId)
              : undefined

        resolvedProjects.push({
          ...project,
          submissionId,
        } as AdminProject)
      }
      
      // Get all submission IDs that have assignments
      const submissionIds = resolvedProjects
        .filter(p => (p as any).submissionId)
        .map(p => (p as any).submissionId)
      
      if (submissionIds.length > 0) {
        // Delete existing assignments for these submissions
        const { error: deleteError } = await supabase
          .from("judge_project_assignments")
          .delete()
          .in("submission_id", submissionIds)

        if (deleteError) {
          throw deleteError
        }
      }
      
      // Create new assignments (with deduplication)
      const assignmentsMap = new Map<string, { judge_id: string; submission_id: string }>()
      
      resolvedProjects.forEach((project) => {
        const submissionId = (project as any).submissionId
        if (submissionId && project.assignedJudges.length > 0) {
          // Remove duplicate judge names from assignedJudges
          const uniqueJudgeNames = Array.from(new Set(project.assignedJudges))
          
          uniqueJudgeNames.forEach((judgeName) => {
            const judge = sourceJudges.find((j: Judge) => j.name === judgeName)
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
          throw insertError
        }
      }
      
      // Update judge assigned_projects count in Supabase
      for (const judge of sourceJudges) {
        const judgeId = typeof judge.id === 'string' ? judge.id : String(judge.id)
        await supabase
          .from("judges")
          .update({ assigned_projects: judge.assignedProjects })
          .eq("id", judgeId)
      }

      setProjectsList(resolvedProjects)
      setAssignmentsModified(false)
      toast.success("Assignments saved!", {
        description: `Saved ${assignmentsToInsert.length} judge assignment(s)`,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : "Unknown error"

      toast.error("Failed to save assignments", {
        description: errorMessage,
      })
    } finally {
      setSavingAssignments(false)
    }
  }

  const buildJudgesWithAssignedCounts = (sourceProjects: AdminProject[], sourceJudges: Judge[]) => {
    return sourceJudges.map((judge) => {
      const assignedCount = sourceProjects.filter((project) =>
        project.assignedJudges.includes(judge.name),
      ).length
      return {
        ...judge,
        assignedProjects: assignedCount,
      }
    })
  }

  const handleOpenManualAssignmentDialog = () => {
    const snapshot = projectsList.map((project) => ({
      ...project,
      assignedJudges: [...project.assignedJudges],
    }))
    setManualProjectsList(snapshot)
    setManualAssignmentDialogOpen(true)
  }

  const handleToggleManualJudge = (projectId: number, judgeName: string) => {
    setManualProjectsList((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project

        const hasJudge = project.assignedJudges.includes(judgeName)
        if (hasJudge) {
          return {
            ...project,
            assignedJudges: project.assignedJudges.filter((name) => name !== judgeName),
          }
        }

        if (project.assignedJudges.length >= 3) {
          toast.error("Max 3 judges per project", {
            description: "Remove one assigned judge before adding another.",
          })
          return project
        }

        return {
          ...project,
          assignedJudges: [...project.assignedJudges, judgeName],
        }
      }),
    )
  }

  const handleSaveManualAssignments = async () => {
    const manualProjectsWithSubmission = manualProjectsList.filter((project) => Boolean(project.submissionId))
    const missingJudgeProjects = manualProjectsWithSubmission.filter((project) => project.assignedJudges.length < 1)

    if (missingJudgeProjects.length > 0) {
      toast.error("Every project needs at least 1 judge", {
        description: `${missingJudgeProjects.length} project(s) currently have no assigned judge.`,
      })
      return
    }

    const updatedJudges = buildJudgesWithAssignedCounts(manualProjectsList, judgesList)
    setProjectsList(manualProjectsList)
    setJudgesList(updatedJudges)
    await handleSaveAssignments(manualProjectsList, updatedJudges)
    setManualAssignmentDialogOpen(false)
  }

  /** One-click: auto-assign judges then save to DB. */
  const handleAutoAssignAndSave = async () => {
    const assignmentResult = autoAssignJudges(false)
    if (!assignmentResult) {
      return
    }
    setAssignmentsModified(true)
    await handleSaveAssignments(assignmentResult.updatedProjects, assignmentResult.updatedJudges)
  }

  /** Build calendar_schedule_slots from current assignments and publish. */
  const handlePublishSchedule = async () => {
    const parsedSlotDuration = parseInt(slotDuration, 10)
    if (!Number.isFinite(parsedSlotDuration) || parsedSlotDuration <= 0) {
      toast.error("Invalid slot duration", {
        description: "Enter a valid number of minutes greater than 0.",
      })
      return
    }

    if (projectsList.length === 0 || judgesList.length === 0) {
      toast.error("No submissions or judges", {
        description: "Auto-assign judges first, then publish.",
      })
      return
    }
    if (roomsList.length === 0) {
      toast.error("No rooms", {
        description: "Add at least one room before publishing the schedule.",
      })
      return
    }

    const subsWithJudges = projectsList
      .filter((p) => (p as any).submissionId && p.assignedJudges.length > 0)
      .map((p) => {
        const submissionId = (p as any).submissionId
        const judgeIds = p.assignedJudges
          .map((name) => {
            const id = judgesList.find((j) => j.name === name)?.id
            return id !== undefined && id !== null ? String(id) : null
          })
          .filter((id): id is string => id !== null)
        return {
          submissionId,
          projectName: p.name,
          judgeIds,
        }
      })
      .filter((s) => s.judgeIds.length > 0)

    if (subsWithJudges.length === 0) {
      toast.error("No assignments", {
        description: "Run 'Auto-assign judges' first, then publish.",
      })
      return
    }

    // Build judgeRoomMap from current judgeRoomAssignments state
    const judgeRoomMap: JudgeRoomMap = new Map(
      Object.entries(judgeRoomAssignments).map(([judgeId, roomId]) => [judgeId, roomId])
    )

    // Warn if any assigned judge has no room
    const allAssignedJudgeIds = subsWithJudges.flatMap((s) => s.judgeIds)
    const judgesWithoutRoom = [...new Set(allAssignedJudgeIds)].filter(
      (id) => !judgeRoomMap.has(id)
    )
    if (judgesWithoutRoom.length > 0) {
      const names = judgesWithoutRoom
        .map((id) => judgesList.find((j) => String(j.id) === id)?.name ?? id)
        .join(", ")
      toast.warning("Some judges have no room assigned", {
        description: `Assign a room to: ${names}`,
      })
      return
    }

    const { slots, unscheduledSubmissionIds, roomMoveCount } = buildSchedulePerJudgeRoom({
      submissions: subsWithJudges.map((submission) => ({
        submissionId: submission.submissionId,
        judgeIds: submission.judgeIds,
      })),
      judgeRoomMap,
      scheduleDate,
      startTime: scheduleStartTime,
      endTime: scheduleEndTime,
      slotDurationMinutes: parsedSlotDuration,
    })

    if (slots.length === 0) {
      toast.error("No schedulable slots", {
        description: "No valid schedule could be generated for the selected date/time window.",
      })
      return
    }

    try {
      setPublishingSchedule(true)
      await supabase.from("calendar_schedule_slots").delete().eq("date", scheduleDate)
      const { error: insertErr } = await supabase
        .from("calendar_schedule_slots")
        .insert(slots)

      if (insertErr) throw insertErr

      await supabase.from("admin_settings").upsert(
        [
          { setting_key: "calendar_slot_duration", setting_value: String(parsedSlotDuration), updated_at: new Date().toISOString() },
          { setting_key: "calendar_judges_per_project", setting_value: String(TARGET_JUDGES_PER_PROJECT), updated_at: new Date().toISOString() },
          { setting_key: "calendar_start_time", setting_value: scheduleStartTime, updated_at: new Date().toISOString() },
          { setting_key: "calendar_end_time", setting_value: scheduleEndTime, updated_at: new Date().toISOString() },
          { setting_key: "calendar_selected_date", setting_value: scheduleDate, updated_at: new Date().toISOString() },
        ],
        { onConflict: "setting_key" }
      )

      toast.success("Schedule published!", {
        description: `${slots.length} slot(s) for ${scheduleDate}. Judges and Calendar view updated.`,
      })
      setScheduleQuality({
        slots: slots.length,
        roomMoves: roomMoveCount,
        unscheduled: unscheduledSubmissionIds.length,
      })
      if (unscheduledSubmissionIds.length > 0) {
        toast.warning("Some submissions were not scheduled", {
          description: `${unscheduledSubmissionIds.length} submission(s) could not fit time/room/judge constraints for this window.`,
        })
      }
      window.dispatchEvent(new CustomEvent("schedulePublished", { detail: { date: scheduleDate } }))
    } catch (error) {
      toast.error("Failed to publish schedule", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setPublishingSchedule(false)
    }
  }

  /** Clear schedule for the selected date (calendar_schedule_slots). */
  const handleClearSchedule = async () => {
    if (!confirm(`Clear all schedule slots for ${scheduleDate}? This cannot be undone.`)) return
    const loadingId = toast.loading("Clearing schedule...")
    try {
      setClearingSchedule(true)
      const { error } = await supabase
        .from("calendar_schedule_slots")
        .delete()
        .eq("date", scheduleDate)
      if (error) throw error
      toast.dismiss(loadingId)
      toast.success("Schedule cleared", {
        description: `All slots for ${scheduleDate} have been removed. Calendar view updated.`,
        duration: 4000,
      })
      window.dispatchEvent(new CustomEvent("schedulePublished", { detail: { date: scheduleDate } }))
    } catch (error) {
      toast.dismiss(loadingId)
      toast.error("Failed to clear schedule", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setClearingSchedule(false)
    }
  }

  /** Clear all judge–project assignments and reset judge counts. */
  const handleClearAssignments = async () => {
    if (!confirm("Clear all judge assignments to projects? Judges will see no assigned submissions until you auto-assign again.")) return
    const loadingId = toast.loading("Clearing judge assignments...")
    try {
      setClearingAssignments(true)
      const { error: deleteError } = await supabase
        .from("judge_project_assignments")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")
      if (deleteError) throw deleteError
      for (const judge of judgesList) {
        const judgeId = typeof judge.id === "string" ? judge.id : String(judge.id)
        await supabase.from("judges").update({ assigned_projects: 0 }).eq("id", judgeId)
      }
      setProjectsList((prev) =>
        prev.map((p) => ({ ...p, assignedJudges: [] as string[] }))
      )
      setJudgesList((prev) =>
        prev.map((j) => ({ ...j, assignedProjects: 0 }))
      )
      setAssignmentsModified(false)
      toast.dismiss(loadingId)
      toast.success("Judge assignments cleared", {
        description: "All judge–project assignments have been removed. Run Auto-assign again to reassign.",
        duration: 4000,
      })
    } catch (error) {
      toast.dismiss(loadingId)
      toast.error("Failed to clear assignments", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setClearingAssignments(false)
    }
  }

  // Calculate stats
  const pointsPerJudge = parseFloat(investmentFund) || POINTS_PER_JUDGE
  const totalJudgesInvestment = judgesList.reduce((sum, judge) => sum + judge.totalInvested, 0)
  const totalProjectsInvestment = leaderboard.reduce((sum, project) => sum + project.totalPoints, 0)
  const totalPointsBudget = pointsPerJudge * judgesList.length
  const remainingFund = totalPointsBudget - totalJudgesInvestment
  const projectsWithSubmission = projectsList.filter((project) => Boolean((project as any).submissionId))
  const projectsWithNoJudge = projectsWithSubmission.filter((project) => project.assignedJudges.length === 0).length
  const projectsWithJudge = projectsWithSubmission.filter((project) => project.assignedJudges.length > 0).length
  const assignedJudgesBySubmission = React.useMemo(() => {
    const map = new Map<string, string[]>()
    projectsList.forEach((project) => {
      if (project.submissionId) {
        map.set(project.submissionId, project.assignedJudges)
      }
    })
    return map
  }, [projectsList])

  if (!isInitialized) {
    return <DashboardAdminSkeleton />
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
                    <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
                    <p className="text-muted-foreground">
                      Auto-assign judges to submissions, then publish the schedule
                    </p>
                  </div>

                  {/* Live Stats */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Points Budget</CardTitle>
                        <IconCoins className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalPointsBudget.toLocaleString()} pts</div>
                        <p className="text-xs text-muted-foreground">Points available across all judges</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Judge Points Used</CardTitle>
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalJudgesInvestment.toLocaleString()} pts</div>
                        <p className="text-xs text-muted-foreground">Total from all judges</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Project Points</CardTitle>
                        <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalProjectsInvestment.toLocaleString()} pts</div>
                        <p className="text-xs text-muted-foreground">Total points assigned to projects</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Remaining Points</CardTitle>
                        <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{remainingFund.toLocaleString()} pts</div>
                        <p className="text-xs text-muted-foreground">Unallocated points</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <IconTrophy className="h-5 w-5 text-amber-500" />
                            Live Leaderboard
                          </CardTitle>
                          <CardDescription>
                            Projects ranked by total points invested by judges.
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => void loadLeaderboard()}>
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingLeaderboard ? (
                        <div className="space-y-3">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="grid grid-cols-6 gap-3 border-b pb-3 last:border-b-0">
                              <Skeleton className="h-5 w-12" />
                              <Skeleton className="h-5 w-28" />
                              <Skeleton className="h-5 w-24" />
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="ml-auto h-5 w-16" />
                              <Skeleton className="ml-auto h-5 w-10" />
                            </div>
                          ))}
                        </div>
                      ) : leaderboard.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No projects yet.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[70px]">Rank</TableHead>
                              <TableHead>Project</TableHead>
                              <TableHead>Team</TableHead>
                              <TableHead>Tracks</TableHead>
                              <TableHead className="text-right">Points</TableHead>
                              <TableHead className="text-right">Judges</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leaderboard.slice(0, 10).map((entry, index) => (
                              <TableRow key={entry.submissionId}>
                                <TableCell>
                                  <Badge variant={index < 3 ? "default" : "secondary"}>
                                    #{index + 1}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{entry.projectName}</TableCell>
                                <TableCell>{entry.teamName}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {entry.tracks.map((track) => (
                                      <Badge key={`${entry.submissionId}-${track}`} variant="outline">{track}</Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {entry.totalPoints.toLocaleString()} pts
                                </TableCell>
                                <TableCell className="text-right">
                                  {entry.judgeCount}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  {/* Points Configuration */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Points Configuration</CardTitle>
                      <CardDescription>
                        Set how many points each judge can allocate (default 20)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-4">
                        <div className="flex-1 max-w-sm">
                          <Label htmlFor="investment-fund">Points Per Judge</Label>
                          <Input
                            id="investment-fund"
                            type="number"
                            value={investmentFund}
                            onChange={(e) => setInvestmentFund(e.target.value)}
                            placeholder="20"
                          />
                        </div>
                        <Button onClick={handleSaveFund}>Save Points</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Hacker Schedule Visibility</CardTitle>
                      <CardDescription>
                        Control whether hackers can view the published judging schedule on the public submission page.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={hackerScheduleVisibilityEnabled}
                            disabled={savingHackerScheduleVisibility}
                            onCheckedChange={(checked) => {
                              setHackerScheduleVisibilityEnabled(checked)
                              void handleSaveHackerScheduleVisibility(checked)
                            }}
                            id="hacker-schedule-visibility"
                          />
                          <Label htmlFor="hacker-schedule-visibility">
                            Allow hackers to view judging schedule
                          </Label>
                        </div>
                        {savingHackerScheduleVisibility ? (
                          <span className="text-sm text-muted-foreground">Saving...</span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 1: Auto-assign judges to submissions */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Step 1: Auto-assign judges to submissions</CardTitle>
                      <CardDescription>
                        Assigns each submission to the judge who owns that track. Each submission gets one slot per matched judge. Publish the schedule in Step 2.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <Button onClick={handleAutoAssignAndSave} disabled={savingAssignments}>
                          {savingAssignments ? "Saving..." : "Auto-assign judges"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleClearAssignments}
                          disabled={clearingAssignments}
                        >
                          {clearingAssignments ? "Clearing..." : "Clear judge assignments"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle>Assignment Quality</CardTitle>
                          <CardDescription>
                            Priority checks for assignment and schedule quality.
                          </CardDescription>
                        </div>
                        <Button type="button" variant="outline" onClick={handleOpenManualAssignmentDialog}>
                          Manually Edit Assignments
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">Total submissions</p>
                          <p className="text-lg font-semibold">{projectsWithSubmission.length}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">Submissions assigned</p>
                          <p className="text-lg font-semibold">{projectsWithJudge} / {projectsWithSubmission.length}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">No judge match</p>
                          <p className={`text-lg font-semibold ${projectsWithNoJudge > 0 ? "text-destructive" : ""}`}>{projectsWithNoJudge}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">Last publish slots</p>
                          <p className="text-lg font-semibold">{scheduleQuality.slots}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Last publish: {scheduleQuality.slots} slot(s), {scheduleQuality.unscheduled} unscheduled submission(s).
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step 2: Publish schedule */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Step 2: Publish schedule</CardTitle>
                      <CardDescription>
                        Build the calendar from current assignments. Judges will see their assigned submissions on the Judges view.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="schedule-date">Date</Label>
                          <Input
                            id="schedule-date"
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => {
                              const nextDate = e.target.value
                              setScheduleDate(nextDate)
                              void persistSelectedCalendarDate(nextDate)
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="schedule-start-time">Start time</Label>
                          <Input
                            id="schedule-start-time"
                            type="time"
                            value={scheduleStartTime}
                            onChange={(e) => setScheduleStartTime(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="schedule-end-time">End time</Label>
                          <Input
                            id="schedule-end-time"
                            type="time"
                            value={scheduleEndTime}
                            onChange={(e) => setScheduleEndTime(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="slot-duration">Slot duration (min)</Label>
                          <Input
                            id="slot-duration"
                            type="text"
                            inputMode="numeric"
                            value={slotDuration}
                            onChange={(e) => setSlotDuration(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-2 justify-end">
                          <Button onClick={handlePublishSchedule} disabled={publishingSchedule}>
                            {publishingSchedule ? "Publishing..." : "Publish schedule"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleClearSchedule}
                            disabled={clearingSchedule}
                          >
                            {clearingSchedule ? "Clearing..." : "Clear schedule"}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        &quot;Clear schedule&quot; removes all slots for the selected date above. Calendar and Judges view will update.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Judges Management */}
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Judges Management</CardTitle>
                          <CardDescription>
                            Manage judges, reset manual PIN login, and track point allocations
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
                            <TableHead>Room</TableHead>
                            <TableHead>Assigned Projects</TableHead>
                            <TableHead>Points Used</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {judgesList.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                                  <Select
                                    value={judgeRoomAssignments[String(judge.id)] !== undefined
                                      ? String(judgeRoomAssignments[String(judge.id)])
                                      : ""}
                                    onValueChange={(val) => {
                                      void saveJudgeRoomAssignment(String(judge.id), parseInt(val))
                                    }}
                                  >
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                      <SelectValue placeholder="No room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roomsList.map((room) => (
                                        <SelectItem key={room.id} value={String(room.id)}>
                                          {room.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{judge.assignedProjects}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">{judge.totalInvested.toLocaleString()} pts</TableCell>
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
                                        Edit / Reset PIN
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
                          const nextId =
                            roomsList.length > 0
                              ? Math.max(...roomsList.map((r) => r.id)) + 1
                              : 1
                          const newRoom: Room = {
                            id: nextId,
                            name: `Room ${String.fromCharCode(65 + roomsList.length)}`,
                            description: "",
                          }
                          const updated = [...roomsList, newRoom]
                          setRoomsList(updated)

                          await saveRoomsToSupabase(updated)

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
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roomsList.map((room) => (
                            <TableRow key={room.id}>
                              <TableCell className="font-medium">
                                <Input
                                  value={room.name}
                                  onChange={(e) =>
                                    handleRoomChange(room.id, { name: e.target.value })
                                  }
                                  onBlur={() => saveRoomsToSupabase(roomsList)}
                                  placeholder="Room name"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={room.description || ""}
                                  onChange={(e) =>
                                    handleRoomChange(room.id, {
                                      description: e.target.value,
                                    })
                                  }
                                  onBlur={() => saveRoomsToSupabase(roomsList)}
                                  placeholder="Description / notes"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={async () => {
                                    if (roomsList.length <= 1) {
                                      toast.error("Cannot delete", {
                                        description: "At least one room is required",
                                      })
                                      return
                                    }
                                    const updated = roomsList.filter(
                                      (r) => r.id !== room.id,
                                    )
                                    setRoomsList(updated)

                                    await saveRoomsToSupabase(updated)

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

                  {/* Submissions */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Submissions ({submissions.length})</CardTitle>
                      <CardDescription>
                        Project submissions from hackers. Use Step 1 above to assign judges.
                      </CardDescription>
                      {submissions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3">
                          {(() => {
                            const sponsorTracks = [
                              "Most technically complex AI hack",
                              "Best Virtual Reality & WebXR Hack: Immersive Experiences for the Open Web",
                              "Reactiv - ClipKit Lab",
                              "Tailscale Integration Challenge",
                              "Stan - Build in Public, Win in Public",
                              "Cloudinary Challenge",
                              "Backboard.io - Best use of Backboard",
                              "Vivirion Solutions - Best Practical Healthcare Hack",
                              "Google - Build with AI Track",
                              "SPUR Founder Track - Build a Real Canadian Startup",
                            ];
                            const trackCounts = new Map<string, number>();
                            sponsorTracks.forEach(track => trackCounts.set(track, 0));
                            submissions.forEach(sub => {
                              if (sub.tracks && Array.isArray(sub.tracks)) {
                                sub.tracks.forEach((track: string) => {
                                  if (sponsorTracks.includes(track)) {
                                    trackCounts.set(track, (trackCounts.get(track) || 0) + 1);
                                  }
                                });
                              }
                            });
                            return sponsorTracks.map(track => (
                              <div key={track} className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs">
                                <span className="font-medium">{track}</span>
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">{trackCounts.get(track)}</Badge>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {loadingSubmissions ? (
                        <div className="space-y-3">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="grid grid-cols-7 gap-3 border-b pb-3 last:border-b-0">
                              <Skeleton className="h-5 w-28" />
                              <Skeleton className="h-5 w-24" />
                              <Skeleton className="h-5 w-36" />
                              <Skeleton className="h-5 w-28" />
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-5 w-24" />
                              <Skeleton className="h-5 w-20" />
                            </div>
                          ))}
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
                              <TableHead>Assigned Judges</TableHead>
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
                                  <div className="flex flex-wrap gap-1">
                                    {(assignedJudgesBySubmission.get(submission.id) || []).length > 0 ? (
                                      (assignedJudgesBySubmission.get(submission.id) || []).map((judgeName, i) => (
                                        <Badge key={i} variant="secondary">{judgeName}</Badge>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
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

                  {/* Database Backups */}
                  <Card className="mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Database Backups</CardTitle>
                        <CardDescription>
                          Automatic snapshots every 10 minutes via pg_cron. Download any snapshot as JSON.
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={triggerBackupSnapshot}
                        disabled={backupLoading}
                      >
                        {backupLoading ? "Creating..." : "Take Snapshot Now"}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {backupSnapshots.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No snapshots yet. Snapshots will appear here once pg_cron is configured or you take one manually.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Time</TableHead>
                              <TableHead>Source</TableHead>
                              <TableHead>Row Counts</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Download</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {backupSnapshots.slice(0, 10).map((snap) => (
                              <TableRow key={snap.id}>
                                <TableCell className="text-sm">
                                  {new Date(snap.snapshot_at).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={snap.triggered_by === "pg_cron" ? "secondary" : "outline"}>
                                    {snap.triggered_by}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {snap.row_counts ? (
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(snap.row_counts).map(([table, count]) => (
                                        <Badge key={table} variant="outline" className="text-xs font-normal">
                                          {table.replace("judge_", "").replace("calendar_", "cal_")}: {count}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {snap.error_info ? (
                                    <Badge variant="destructive">Partial</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-green-700 bg-green-100">OK</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadBackupSnapshot(snap.id, snap.snapshot_at)}
                                  >
                                    Download
                                  </Button>
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
      <Dialog open={manualAssignmentDialogOpen} onOpenChange={setManualAssignmentDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Manual Judge Assignment</DialogTitle>
            <DialogDescription>
              Adjust judge assignments per project when needed. Keep 2-3 judges when possible; each project must have at least 1.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Project</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Available Judges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manualProjectsList.filter((project) => Boolean(project.submissionId)).map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {project.assignedJudges.length > 0 ? (
                          project.assignedJudges.map((judgeName, idx) => (
                            <Badge key={idx} variant="secondary">{judgeName}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {judgesList.map((judge) => {
                          const checked = project.assignedJudges.includes(judge.name)
                          return (
                            <label key={`${project.id}-${judge.id}`} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleManualJudge(project.id, judge.name)}
                              />
                              <span>{judge.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setManualAssignmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveManualAssignments} disabled={savingAssignments}>
              {savingAssignments ? "Saving..." : "Save assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Judge Dialog */}
      <Dialog open={isJudgeDialogOpen} onOpenChange={setIsJudgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingJudge ? "Edit Judge" : "New Judge"}</DialogTitle>
            <DialogDescription>
              {editingJudge
                ? "Update judge details and set a new PIN only if you want to reset login."
                : "Add a new judge and set their manual PIN for /judge-login."}
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
                <Label htmlFor="judge-pin">{editingJudge ? "PIN (optional reset)" : "PIN"}</Label>
                <Input
                  id="judge-pin"
                  type="password"
                  inputMode="numeric"
                  value={judgeFormData.pin}
                  onChange={(e) => setJudgeFormData({ ...judgeFormData, pin: e.target.value })}
                  placeholder={editingJudge ? "Leave blank to keep current PIN" : "Enter PIN (e.g., 123456)"}
                  required={!editingJudge}
                  minLength={6}
                  maxLength={6}
                  pattern="\d{6}"
                />
                <p className="text-xs text-muted-foreground">
                  Judge login uses email + a 6-digit PIN only. Magic-link login is not used.
                </p>
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

      {/* CSV Import Dialog */}
      <Dialog open={csvImportOpen} onOpenChange={(open) => {
        setCsvImportOpen(open)
        if (!open) { setCsvText(""); setCsvPreview(null) }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Submissions from CSV</DialogTitle>
            <DialogDescription>
              Paste your CSV below. Expected format (one row per track):
              <code className="block mt-1 text-xs bg-muted rounded px-2 py-1">
                project_name,devpost_link,tracks,submitter_name,submitter_email,members
              </code>
              Members can be semicolon or comma separated within their cell. This will <strong>replace all existing submissions</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              className="font-mono text-xs min-h-[180px]"
              placeholder={"project_name,devpost_link,tracks,submitter_name,submitter_email,members\nMy Project,https://devpost.com/...,General,Jane Doe,jane@example.com,Jane Doe;Bob Smith"}
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setCsvPreview(null) }}
            />

            <Button variant="outline" onClick={handleCsvParse} disabled={!csvText.trim()}>
              Parse &amp; Preview
            </Button>

            {csvPreview && csvPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{csvPreview.length} project(s) found — preview:</p>
                <div className="max-h-[240px] overflow-y-auto rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Tracks</TableHead>
                        <TableHead>Members</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.slice(0, 20).map((proj, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{proj.project_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {proj.tracks.map((t, ti) => (
                                <Badge key={ti} variant="outline" className="text-xs">{t}</Badge>
                              ))}
                              {proj.tracks.length === 0 && <span className="text-muted-foreground text-xs">none</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {proj.members.slice(0, 3).join(", ")}{proj.members.length > 3 ? ` +${proj.members.length - 3}` : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                      {csvPreview.length > 20 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground text-xs py-2">
                            … and {csvPreview.length - 20} more
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setCsvImportOpen(false); setCsvText(""); setCsvPreview(null) }}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!csvPreview || csvPreview.length === 0 || csvImporting}
              onClick={() => void handleCsvImport()}
            >
              {csvImporting ? "Importing..." : `Import ${csvPreview?.length ?? 0} project(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
