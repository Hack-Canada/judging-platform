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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { IconPlus, IconEdit, IconTrash, IconChevronLeft, IconChevronRight, IconDeviceFloppy } from "@tabler/icons-react"
import { toast } from "sonner"
import type { Judge } from "@/lib/judges-data"
import { generateTimeSlots, getEndTime, type TimeSlot, type DaySchedule } from "@/lib/schedule-data"
import { defaultRooms, type Room } from "@/lib/rooms-data"
import { supabase } from "@/lib/supabase-client"

type CalendarSubmission = {
  id: string
  name: string
  track: string
  project_name: string
  tracks: string[]
}

const ACCESS_CODE = "111-111"
const ACCESS_CODE_KEY = "dashboard_access_code"

export default function CalendarPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [judges, setJudges] = React.useState<Judge[]>([])
  const [submissions, setSubmissions] = React.useState<CalendarSubmission[]>([])
  const [rooms, setRooms] = React.useState<Room[]>(defaultRooms)
  const [slots, setSlots] = React.useState<TimeSlot[]>([])
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingSlot, setEditingSlot] = React.useState<TimeSlot | null>(null)
  const [judgesPerProject, setJudgesPerProject] = React.useState(2)
  const [slotDuration, setSlotDuration] = React.useState(5)
  const [scheduleStartTime, setScheduleStartTime] = React.useState("13:00")
  const [scheduleEndTime, setScheduleEndTime] = React.useState("16:00")
  const [saving, setSaving] = React.useState(false)
  const [unscheduledSubmissions, setUnscheduledSubmissions] = React.useState<CalendarSubmission[]>([])

  const [formData, setFormData] = React.useState({
    startTime: "09:00",
    projectId: "",
    judgeIds: [] as (number | string)[],
    roomId: "",
  })

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

    // Load saved schedule
    const savedSchedule = localStorage.getItem(`schedule_${selectedDate}`)
    if (savedSchedule) {
      try {
        setSlots(JSON.parse(savedSchedule))
      } catch {
        // ignore parse errors
      }
    }

    const loadFromSupabase = async () => {
      try {
        // Load settings from Supabase admin_settings table
        const loadSettingsFromSupabase = async () => {
          try {
            const { data: settingsData, error: settingsError } = await supabase
              .from("admin_settings")
              .select("setting_key, setting_value")

            if (settingsError) {
              console.error("[Calendar] Error loading settings:", settingsError)
              return
            }

            if (settingsData) {
              // Create a map of settings for easy lookup
              const settingsMap = new Map<string, string>()
              settingsData.forEach(setting => {
                settingsMap.set(setting.setting_key, setting.setting_value)
              })

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

              // Load rooms data
              const roomsData = settingsMap.get("rooms_data")
              if (roomsData) {
                try {
                  const parsed = JSON.parse(roomsData)
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setRooms(parsed)
                  } else {
                    setRooms(defaultRooms)
                  }
                } catch (e) {
                  console.error("[Calendar] Error parsing rooms_data:", e)
                  setRooms(defaultRooms)
                }
              } else {
                setRooms(defaultRooms)
              }

              console.log("[Calendar] Successfully loaded settings from Supabase")
            }
          } catch (error) {
            console.error("[Calendar] Failed to load settings:", error)
            // Fallback to defaults
            setRooms(defaultRooms)
          }
        }

        await loadSettingsFromSupabase()

        // Load judges and submissions
        const [{ data: supabaseJudges, error: judgesError }, { data: supabaseSubmissions, error: submissionsError }] =
          await Promise.all([
            supabase.from("judges").select("id, name, email, tracks"),
            supabase.from("submissions").select("id, project_name, tracks"),
          ])

        if (!judgesError && supabaseJudges) {
          const mappedJudges: Judge[] = (supabaseJudges as any[]).map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email || "",
            assignedProjects: 0,
            totalInvested: 0,
            tracks: row.tracks || ["General"],
          }))
          setJudges(mappedJudges)
        }

        if (!submissionsError && supabaseSubmissions) {
          const mappedSubmissions: CalendarSubmission[] = (supabaseSubmissions as any[]).map((row) => ({
            id: row.id,
            name: row.project_name ?? "Untitled",
            project_name: row.project_name ?? "Untitled",
            track: (row.tracks && row.tracks.length > 0) ? row.tracks[0] : "General",
            tracks: row.tracks || ["General"],
          }))
          setSubmissions(mappedSubmissions)
        }

        // Note: Scheduled slots will be loaded separately when date changes
      } catch (error) {
        console.error("Failed to load calendar data from Supabase", error)
      }
    }

    void loadFromSupabase()

    // Subscribe to settings changes for real-time updates
    const settingsChannel = supabase
      .channel("admin-settings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_settings",
        },
        (payload) => {
          console.log("[Calendar] Settings changed:", payload)
          // Reload settings when they change
          void loadFromSupabase()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(settingsChannel)
    }
  }, [selectedDate, router])
  
  // Update time slots when time range changes
  React.useEffect(() => {
    // This will cause timeSlots to recalculate when settings change
    console.log("[Calendar] Time range changed:", { scheduleStartTime, scheduleEndTime, slotDuration, judgesPerProject })
  }, [scheduleStartTime, scheduleEndTime, slotDuration, judgesPerProject])

  const saveSchedule = (newSlots: TimeSlot[]) => {
    setSlots(newSlots)
    if (typeof window !== "undefined") {
      localStorage.setItem(`schedule_${selectedDate}`, JSON.stringify(newSlots))
    }
  }

  // Generate time slots dynamically based on the configured time range
  const timeSlots = React.useMemo(
    () => generateTimeSlots(selectedDate, scheduleStartTime, scheduleEndTime),
    [selectedDate, scheduleStartTime, scheduleEndTime]
  )

  const navigateDate = (days: number) => {
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + days)
    setSelectedDate(currentDate.toISOString().split("T")[0])
  }

  const handleOpenDialog = (slot?: TimeSlot, time?: string, roomId?: number) => {
    if (slot) {
      setEditingSlot(slot)
      setFormData({
        startTime: slot.startTime,
        projectId: slot.projectId, // Already a string (UUID)
        judgeIds: slot.judgeIds,
        roomId: slot.roomId.toString(),
      })
    } else {
      setEditingSlot(null)
      setFormData({
        startTime: time || (timeSlots.length > 0 ? timeSlots[0] : scheduleStartTime),
        projectId: "",
        judgeIds: [],
        roomId: roomId ? roomId.toString() : (rooms.length > 0 ? rooms[0].id.toString() : ""),
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSlot(null)
    setFormData({
      startTime: timeSlots.length > 0 ? timeSlots[0] : scheduleStartTime,
      projectId: "",
      judgeIds: [],
      roomId: rooms.length > 0 ? rooms[0].id.toString() : "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.projectId) {
      toast.error("Validation error", {
        description: "Please select a submission",
      })
      return
    }
    if (!formData.roomId) {
      toast.error("Validation error", {
        description: "Please select a room",
      })
      return
    }

    const submission = submissions.find(s => s.id === formData.projectId)
    if (!submission) return

    const selectedRoom = rooms.find(r => r.id === parseInt(formData.roomId))
    if (!selectedRoom) return

    const selectedJudges = judges.filter(j => formData.judgeIds.includes(String(j.id)) || formData.judgeIds.includes(j.id as any))
    
    const slotData: TimeSlot = {
      id: editingSlot?.id || `${selectedDate}-${formData.startTime}`,
      startTime: formData.startTime,
      endTime: getEndTime(formData.startTime, slotDuration),
      projectId: submission.id,
      projectName: submission.project_name,
      judgeIds: formData.judgeIds,
      judgeNames: selectedJudges.map(j => j.name),
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
    }

    if (editingSlot) {
      // Update existing slot
      const updated = slots.map(s =>
        s.id === editingSlot.id ? slotData : s
      )
      saveSchedule(updated)
      toast.success("Time slot updated!", {
        description: `Slot for ${submission.project_name} has been updated`,
      })
    } else {
      // Check for conflicts:
      // 1. Same room at same time = conflict
      // 2. Different rooms at same time = OK, UNLESS judges overlap
      const sameRoomConflict = slots.find(s => 
        s.startTime === formData.startTime && s.roomId === parseInt(formData.roomId)
      )
      if (sameRoomConflict) {
        toast.error("Room conflict", {
          description: `${selectedRoom.name} is already booked at this time. Please choose a different room or time.`,
        })
        return
      }
      
      // Check for judge overlaps at the same time (across all rooms)
      const slotsAtSameTime = slots.filter(s => s.startTime === formData.startTime)
      const overlappingJudges: string[] = []
      
      for (const existingSlot of slotsAtSameTime) {
        const judgeOverlap = formData.judgeIds.filter(judgeId => {
          // Compare both as strings and numbers for compatibility
          return existingSlot.judgeIds.some(id => 
            id === judgeId || String(id) === String(judgeId) || id === String(judgeId) || String(id) === judgeId
          )
        })
        if (judgeOverlap.length > 0) {
          const overlappingJudgeNames = judges
            .filter(j => {
              const judgeIdStr = String(j.id)
              return judgeOverlap.some(id => String(id) === judgeIdStr || id === j.id)
            })
            .map(j => j.name)
          overlappingJudges.push(...overlappingJudgeNames)
        }
      }
      
      if (overlappingJudges.length > 0) {
        const uniqueOverlappingJudges = [...new Set(overlappingJudges)]
        toast.error("Judge conflict", {
          description: `Judge(s) ${uniqueOverlappingJudges.join(", ")} ${uniqueOverlappingJudges.length === 1 ? "is" : "are"} already assigned at ${formData.startTime} in ${slotsAtSameTime.map(s => s.roomName).join(", ")}. Please choose different judges or a different time.`,
        })
        return
      }
      // Create new slot
      const updated = [...slots, slotData].sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
      )
      saveSchedule(updated)
      toast.success("Time slot created!", {
        description: `Slot for ${submission.project_name} has been scheduled`,
      })
    }
    handleCloseDialog()
  }

  const handleDeleteSlot = (slotId: string) => {
    const updated = slots.filter(s => s.id !== slotId)
    saveSchedule(updated)
    toast.success("Time slot deleted!", {
      description: "The time slot has been removed",
    })
  }

  const handleAutoSchedule = () => {
    const activeSubmissions = submissions
    
    // Helper function to check if a judge can judge a submission's track
    const canJudgeTrack = (judge: typeof judges[0], submissionTrack: string): boolean => {
      // Judges can always judge "General" track
      if (submissionTrack === "General") return true
      // Judge can judge if they have the submission's track assigned
      return judge.tracks?.includes(submissionTrack) || false
    }
    
    const newSlots: TimeSlot[] = []
    let currentTime = scheduleStartTime
    let submissionIndex = 0
    const usedSubmissions = new Set<string>() // Track which submissions have been scheduled (UUIDs)

    // Helper to get available rooms at a specific time
    const getAvailableRooms = (time: string): Room[] => {
      const bookedRoomIds = new Set(
        newSlots
          .filter(s => s.startTime === time)
          .map(s => s.roomId)
      )
      return rooms.filter(room => !bookedRoomIds.has(room.id))
    }

    // Helper to get next time slot
    const getNextTime = (time: string): string | null => {
      const [hours, minutes] = time.split(":").map(Number)
      const totalMinutes = hours * 60 + minutes + slotDuration
      const nextHours = Math.floor(totalMinutes / 60)
      const nextMinutes = totalMinutes % 60
      const nextTime = `${nextHours.toString().padStart(2, "0")}:${nextMinutes.toString().padStart(2, "0")}`
      
      // Check if we exceed the end time
      const [endHour, endMin] = scheduleEndTime.split(":").map(Number)
      if (nextHours > endHour || (nextHours === endHour && nextMinutes > endMin)) {
        return null
      }
      return nextTime
    }

    // Main scheduling loop: for each time slot, try to fill all rooms
    while (currentTime && submissionIndex < activeSubmissions.length) {
      const availableRooms = getAvailableRooms(currentTime)
      
      // If all rooms are filled at this time, move to next time slot
      if (availableRooms.length === 0) {
        const nextTime = getNextTime(currentTime)
        if (!nextTime) break
        currentTime = nextTime
        continue
      }

      // Try to fill each available room at this time slot
      let scheduledAtThisTime = false
      
      for (const room of availableRooms) {
        // Find next available submission that can be scheduled in this room
        let submissionAssigned = false
        
        for (let i = submissionIndex; i < activeSubmissions.length; i++) {
          const submission = activeSubmissions[i]
          
          // Skip if already used
          if (usedSubmissions.has(submission.id)) continue
          
          const submissionTrack = submission.track || "General"
          
          // Filter judges who can judge this track
          const eligibleJudges = judges.filter(judge => 
            canJudgeTrack(judge, submissionTrack)
          )
          
          if (eligibleJudges.length === 0) continue

          // Get judges already used at this time across all rooms
          // Note: Judge IDs are UUIDs (strings) from Supabase, but TimeSlot expects string[]
          const usedJudgeIdsAtTime = new Set<string>()
          newSlots
            .filter(s => s.startTime === currentTime)
            .forEach(s => {
              // Convert judgeIds to strings if they're not already
              s.judgeIds.forEach(id => usedJudgeIdsAtTime.add(String(id)))
            })

          // Filter eligible judges that are free at this time
          const availableEligibleJudges = eligibleJudges.filter(judge => {
            const judgeIdStr = String(judge.id)
            return !usedJudgeIdsAtTime.has(judgeIdStr)
          })
          
          if (availableEligibleJudges.length < judgesPerProject) {
            // Not enough free judges to schedule this submission at this time
            continue
          }
          
          // Select judges for this submission from available pool
          // Store as strings since judge IDs from Supabase are UUIDs
          const submissionJudges: string[] = []
          for (let j = 0; j < judgesPerProject; j++) {
            const judge = availableEligibleJudges[j % availableEligibleJudges.length]
            const judgeIdStr = String(judge.id)
            if (!submissionJudges.includes(judgeIdStr)) {
              submissionJudges.push(judgeIdStr)
            }
          }

          // Assign this submission to this room at this time
          const selectedJudgesList = judges.filter(j => submissionJudges.includes(String(j.id)))
          
          newSlots.push({
            id: `${selectedDate}-${currentTime}-${submission.id}-${room.id}`,
            startTime: currentTime,
            endTime: getEndTime(currentTime, slotDuration),
            projectId: submission.id,
            projectName: submission.project_name,
            judgeIds: submissionJudges as any, // Store as string array (UUIDs)
            judgeNames: selectedJudgesList.map(j => j.name),
            roomId: room.id,
            roomName: room.name,
          })

          usedSubmissions.add(submission.id)
          submissionAssigned = true
          scheduledAtThisTime = true
          break // Move to next room
        }

        // If we couldn't assign a submission to this room, continue to next room
        if (!submissionAssigned) continue
      }

      // If we scheduled something at this time, check if all rooms are filled
      // If not all rooms filled and no more submissions can be scheduled, move to next time
      if (!scheduledAtThisTime || getAvailableRooms(currentTime).length === 0) {
        const nextTime = getNextTime(currentTime)
        if (!nextTime) break
        currentTime = nextTime
      }
      
      // Update submission index to continue from where we left off
      while (submissionIndex < activeSubmissions.length && usedSubmissions.has(activeSubmissions[submissionIndex].id)) {
        submissionIndex++
      }
    }

    saveSchedule(newSlots)
    const filledSlots = timeSlots.filter(time => {
      const slotsAtTime = newSlots.filter(s => s.startTime === time)
      return slotsAtTime.length === rooms.length
    }).length
    
    toast.success("Auto-scheduled!", {
      description: `Scheduled ${newSlots.length} submissions across ${timeSlots.length} time slots. ${filledSlots} time slots have all rooms occupied.`,
    })
  }

  const handleSaveScheduleToSupabase = async () => {
    if (slots.length === 0) {
      toast.error("No schedule to save", {
        description: "Please create a schedule first using Auto Schedule",
      })
      return
    }

    try {
      setSaving(true)
      
      // First, delete existing schedule slots for this date (ignore if table doesn't exist)
      console.log("[Save Schedule] Deleting existing schedule for date:", selectedDate)
      const { error: deleteError } = await supabase
        .from("calendar_schedule_slots")
        .delete()
        .eq("date", selectedDate)

      if (deleteError) {
        const deleteErrorMsg = (deleteError as any)?.message || String(deleteError)
        // Check if it's a "table doesn't exist" error
        if (deleteErrorMsg.includes("does not exist") || 
            deleteErrorMsg.includes("relation") ||
            (deleteError as any)?.code === "42P01") {
          console.warn("[Save Schedule] Table might not exist yet, will try to create:", deleteErrorMsg)
        } else {
          console.error("[Save Schedule] Error deleting existing schedule:", {
            message: deleteErrorMsg,
            code: (deleteError as any)?.code,
            details: (deleteError as any)?.details,
          })
          // Continue anyway - we'll try to insert
        }
      } else {
        console.log("[Save Schedule] Successfully deleted existing schedule")
      }

      // Prepare slots for insertion
      // Convert judge IDs to UUID strings (they may be numbers or strings)
      const slotsToInsert = slots.map((slot, index) => {
        console.log(`[Save Schedule] Preparing slot ${index + 1}:`, {
          slot,
          judgeIds: slot.judgeIds,
          judgeIdsType: typeof slot.judgeIds,
          judgeIdsLength: slot.judgeIds?.length,
        })
        
        // Convert judge IDs to UUID strings
        // Judge IDs from Supabase are UUIDs, but they might be stored as numbers in legacy data
        const judgeIdUuids = (slot.judgeIds || []).map(id => {
          // Convert to string - judge IDs from Supabase are UUIDs
          const idStr = String(id)
          // Validate it looks like a UUID (basic check)
          if (idStr.length < 30) {
            console.warn(`[Save Schedule] Judge ID "${idStr}" doesn't look like a UUID - may need conversion`)
          }
          return idStr
        })
        
        // Ensure room_id is an integer (not a UUID)
        const roomIdInt = typeof slot.roomId === 'number' 
          ? slot.roomId 
          : parseInt(String(slot.roomId), 10)
        
        if (isNaN(roomIdInt)) {
          console.error(`[Save Schedule] Invalid room_id for slot ${index + 1}:`, slot.roomId)
          throw new Error(`Invalid room ID: ${slot.roomId}`)
        }
        
        const slotData = {
          date: selectedDate,
          start_time: slot.startTime, // Format: "HH:MM" as string
          end_time: slot.endTime, // Format: "HH:MM" as string
          submission_id: slot.projectId, // UUID string
          room_id: roomIdInt, // integer (validated)
          judge_ids: judgeIdUuids, // UUID array
        }
        
        console.log(`[Save Schedule] Slot ${index + 1} prepared:`, slotData)
        return slotData
      })

      console.log("[Save Schedule] Prepared slots to insert:", JSON.stringify(slotsToInsert, null, 2))
      console.log("[Save Schedule] Number of slots:", slotsToInsert.length)
      console.log("[Save Schedule] First slot sample:", slotsToInsert[0])
      
      // Validate that we have slots to insert
      if (slotsToInsert.length === 0) {
        toast.error("No slots to save", {
          description: "Please create a schedule first",
        })
        setSaving(false)
        return
      }
      
      // Validate first slot structure
      const firstSlot = slotsToInsert[0]
      console.log("[Save Schedule] First slot validation:", {
        hasDate: !!firstSlot.date,
        hasStartTime: !!firstSlot.start_time,
        hasEndTime: !!firstSlot.end_time,
        hasSubmissionId: !!firstSlot.submission_id,
        submissionIdType: typeof firstSlot.submission_id,
        submissionIdLength: firstSlot.submission_id?.length,
        hasRoomId: typeof firstSlot.room_id === 'number',
        hasJudgeIds: Array.isArray(firstSlot.judge_ids),
        judgeIdsLength: firstSlot.judge_ids?.length,
        judgeIdsSample: firstSlot.judge_ids?.slice(0, 2),
      })

      // Insert new schedule slots
      console.log("[Save Schedule] Calling Supabase insert...")
      const { data, error } = await supabase
        .from("calendar_schedule_slots")
        .insert(slotsToInsert)
        .select()

      console.log("[Save Schedule] Insert response - data:", data)
      console.log("[Save Schedule] Insert response - error:", error)

      if (error) {
        // Supabase errors typically have: message, details, hint, code
        const errorMessage = (error as any)?.message || "Unknown error"
        const errorDetails = (error as any)?.details || null
        const errorHint = (error as any)?.hint || null
        const errorCode = (error as any)?.code || null
        
        console.error("[Save Schedule] Error saving schedule to Supabase")
        console.error("[Save Schedule] Error object:", error)
        console.error("[Save Schedule] Error message:", errorMessage)
        console.error("[Save Schedule] Error code:", errorCode)
        console.error("[Save Schedule] Error details:", errorDetails)
        console.error("[Save Schedule] Error hint:", errorHint)
        
        // Log all properties
        if (error && typeof error === 'object') {
          console.error("[Save Schedule] All error properties:")
          Object.keys(error).forEach(key => {
            console.error(`  ${key}:`, (error as any)[key])
          })
          // Also try Object.getOwnPropertyNames for non-enumerable
          Object.getOwnPropertyNames(error).forEach(key => {
            if (!Object.keys(error).includes(key)) {
              console.error(`  [non-enumerable] ${key}:`, (error as any)[key])
            }
          })
        }
        
        // Build a detailed error message
        let errorDescription = errorMessage
        if (errorCode) {
          errorDescription += ` (Code: ${errorCode})`
        }
        if (errorDetails) {
          errorDescription += ` - ${errorDetails}`
        }
        if (errorHint) {
          errorDescription += ` Hint: ${errorHint}`
        }
        
        toast.error("Failed to save schedule", {
          description: errorDescription,
        })
        return
      }

      toast.success("Schedule saved!", {
        description: `Saved ${slots.length} time slots for ${selectedDate}`,
      })
    } catch (error) {
      console.error("Failed to save schedule to Supabase:", error)
      console.error("Error type:", typeof error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      toast.error("Failed to save schedule", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleJudgeToggle = (judgeId: number | string) => {
    setFormData(prev => ({
      ...prev,
      judgeIds: prev.judgeIds.includes(judgeId) || prev.judgeIds.includes(String(judgeId))
        ? prev.judgeIds.filter(id => id !== judgeId && id !== String(judgeId))
        : [...prev.judgeIds, judgeId],
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getConflictingJudges = (judgeIds: number[], time: string, excludeSlotId?: string): string[] => {
    const slotsAtSameTime = slots.filter(s => 
      s.startTime === time &&
      (!excludeSlotId || s.id !== excludeSlotId)
    )
    
    if (judgeIds.length === 0) return []
    
    const conflictingJudgeIds: number[] = []
    for (const slot of slotsAtSameTime) {
      for (const judgeId of judgeIds) {
        if (slot.judgeIds.includes(judgeId) && !conflictingJudgeIds.includes(judgeId)) {
          conflictingJudgeIds.push(judgeId)
        }
      }
    }
    
    return conflictingJudgeIds
      .map(jId => judges.find(j => j.id === jId)?.name)
      .filter((name): name is string => Boolean(name))
  }

  const getSlotsAtTime = (time: string): TimeSlot[] => {
    return slots.filter(s => s.startTime === time)
  }

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
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
                      <p className="text-muted-foreground">
                        Schedule judge assignments for submissions
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button onClick={handleAutoSchedule} variant="outline">
                        Auto Schedule
                      </Button>
                      {slots.length > 0 && (
                        <Button 
                          onClick={handleSaveScheduleToSupabase} 
                          disabled={saving}
                          variant="default"
                        >
                          <IconDeviceFloppy className="mr-2 h-4 w-4" />
                          {saving ? "Saving..." : "Save Schedule"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Date Navigation */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Date Selection</CardTitle>
                      <CardDescription>
                        Select the date for scheduling
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <Label>Date</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigateDate(-1)}
                            >
                              <IconChevronLeft className="h-4 w-4" />
                            </Button>
                            <Input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigateDate(1)}
                            >
                              <IconChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(selectedDate)}
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">
                            <strong>Current Settings (from Admin):</strong> Schedule: {scheduleStartTime} - {scheduleEndTime}, Slot duration: {slotDuration} minutes, Judges per project: {judgesPerProject}. 
                            <span className="text-xs block mt-1 text-blue-600 dark:text-blue-400">
                              Settings update automatically when changed in Admin page.
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Calendar displays from {(() => {
                              const [hour, minute] = scheduleStartTime.split(":").map(Number)
                              const totalMinutes = hour * 60 + minute - 10
                              const displayHour = Math.floor(totalMinutes / 60)
                              const displayMinute = totalMinutes % 60
                              return `${displayHour.toString().padStart(2, "0")}:${displayMinute.toString().padStart(2, "0")}`
                            })()} to {(() => {
                              const [hour, minute] = scheduleEndTime.split(":").map(Number)
                              const totalMinutes = hour * 60 + minute + 10
                              const displayHour = Math.floor(totalMinutes / 60)
                              const displayMinute = totalMinutes % 60
                              return `${displayHour.toString().padStart(2, "0")}:${displayMinute.toString().padStart(2, "0")}`
                            })()} (10 min buffer before/after)
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Available rooms: {rooms.map(r => r.name).join(", ")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Calendar View */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Time Slots - {formatDate(selectedDate)}</CardTitle>
                      <CardDescription>
                        Click on a time slot to assign or edit judge-submission assignments. All rooms are shown for each time frame.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[120px] sticky left-0 bg-background z-10">Time</TableHead>
                              {rooms.map((room) => (
                                <TableHead key={room.id} className="min-w-[200px]">
                                  {room.name}
                                  {room.capacity && (
                                    <span className="text-xs text-muted-foreground ml-1">({room.capacity})</span>
                                  )}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {timeSlots.map((time) => {
                              const endTime = getEndTime(time, slotDuration)
                              const slotsAtTime = getSlotsAtTime(time)
                              
                              // Create a map of roomId -> slot for quick lookup
                              const slotByRoom = new Map<number, TimeSlot>()
                              slotsAtTime.forEach(slot => {
                                slotByRoom.set(slot.roomId, slot)
                              })
                              
                              return (
                                <TableRow key={time} className="hover:bg-muted/30">
                                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                                    {time} - {endTime}
                                  </TableCell>
                                  {rooms.map((room) => {
                                    const slot = slotByRoom.get(room.id)
                                    return (
                                      <TableCell key={room.id} className="align-top">
                                        {slot ? (
                                          <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleOpenDialog(slot)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault()
                                                handleOpenDialog(slot)
                                              }
                                            }}
                                            className="group flex w-full flex-col gap-2 rounded-lg border border-border bg-gradient-to-b from-background to-muted/70 px-3 py-2 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="space-y-1">
                                                <p className="line-clamp-1 text-sm font-semibold">
                                                  {slot.projectName}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                  <Badge variant="outline" className="text-[10px]">
                                                    General: {submissions.find(s => s.id === slot.projectId)?.track || "General"}
                                                  </Badge>
                                                  <Badge variant="secondary" className="text-[10px]">
                                                    {room.name}
                                                  </Badge>
                                                </div>
                                              </div>
                                              <div className="flex flex-col items-end gap-1">
                                                <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                  {time} – {endTime}
                                                </span>
                                                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      handleOpenDialog(slot)
                                                    }}
                                                  >
                                                    <IconEdit className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      handleDeleteSlot(slot.id)
                                                    }}
                                                  >
                                                    <IconTrash className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                            {slot.judgeNames.length > 0 && (
                                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                <span className="text-[10px] font-medium text-muted-foreground">Judge:</span>
                                                {slot.judgeNames.map((name, idx) => (
                                                  <Badge
                                                    key={idx}
                                                    variant="outline"
                                                    className="rounded-full bg-background/70 text-[10px]"
                                                  >
                                                    {name}
                                                  </Badge>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div 
                                            className="p-2 border-2 border-dashed border-muted rounded-md cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors text-center"
                                            onClick={() => handleOpenDialog(undefined, time, room.id)}
                                          >
                                            <span className="text-xs text-muted-foreground">Available</span>
                                          </div>
                                        )}
                                      </TableCell>
                                    )
                                  })}
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Unscheduled Submissions */}
                {unscheduledSubmissions.length > 0 && (
                  <div className="px-4 lg:px-6">
                    <Card className="border-orange-200 dark:border-orange-900">
                      <CardHeader>
                        <CardTitle className="text-orange-600 dark:text-orange-400">
                          Unscheduled Submissions ({unscheduledSubmissions.length})
                        </CardTitle>
                        <CardDescription>
                          The following submissions do not have any judging time scheduled for {selectedDate}. 
                          Please schedule them using the calendar above.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                          {unscheduledSubmissions.map((submission) => (
                            <div
                              key={submission.id}
                              className="p-3 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-950/20"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{submission.project_name}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {submission.tracks && submission.tracks.length > 0 ? (
                                      submission.tracks.map((track) => (
                                        <Badge key={track} variant="outline" className="text-xs">
                                          {track}
                                        </Badge>
                                      ))
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        General
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Add/Edit Slot Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Time Slot" : "Create Time Slot"}</DialogTitle>
            <DialogDescription>
              {editingSlot
                ? "Update the submission and judge assignments for this time slot."
                : "Assign a project and judges to this time slot."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Time</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    step="300"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={getEndTime(formData.startTime, slotDuration)}
                    disabled
                    className="bg-muted"
                  />
                  <span className="text-sm text-muted-foreground">
                    ({slotDuration} min)
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Room</Label>
                <Select
                  value={formData.roomId}
                  onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => {
                      // Check if room is booked at this time (same room, same time = conflict)
                      const isRoomBooked = slots.some(s => 
                        s.startTime === formData.startTime && 
                        s.roomId === room.id &&
                        (!editingSlot || s.id !== editingSlot.id)
                      )
                      
                      // Check if any judges would conflict if we use this room
                      const slotsAtSameTime = slots.filter(s => 
                        s.startTime === formData.startTime &&
                        (!editingSlot || s.id !== editingSlot.id)
                      )
                      const hasJudgeConflict = formData.judgeIds.length > 0 && slotsAtSameTime.some(s => {
                        return formData.judgeIds.some(judgeId => s.judgeIds.includes(judgeId))
                      })
                      
                      const isDisabled = isRoomBooked || (hasJudgeConflict && !isRoomBooked)
                      
                      return (
                        <SelectItem 
                          key={room.id} 
                          value={room.id.toString()}
                          disabled={isDisabled}
                        >
                          {room.name}
                          {isRoomBooked && " (Room Booked)"}
                          {hasJudgeConflict && !isRoomBooked && " (Judge Conflict)"}
                          {room.capacity && ` (Capacity: ${room.capacity})`}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {(() => {
                  const selectedRoom = rooms.find(r => r.id === parseInt(formData.roomId))
                  if (!selectedRoom) return null
                  
                  const isRoomBooked = slots.some(s => 
                    s.startTime === formData.startTime && 
                    s.roomId === parseInt(formData.roomId) &&
                    (!editingSlot || s.id !== editingSlot.id)
                  )
                  
                  const conflictingJudges = getConflictingJudges(
                    formData.judgeIds,
                    formData.startTime,
                    editingSlot?.id
                  )
                  const hasJudgeConflict = conflictingJudges.length > 0
                  
                  const slotsAtSameTime = slots.filter(s => 
                    s.startTime === formData.startTime &&
                    (!editingSlot || s.id !== editingSlot.id)
                  )
                  
                  if (isRoomBooked) {
                    return (
                      <p className="text-xs text-destructive">
                        This room is already booked at {formData.startTime}. Please choose a different room or time.
                      </p>
                    )
                  }
                  if (hasJudgeConflict) {
                    return (
                      <p className="text-xs text-destructive">
                        Judge(s) {[...new Set(conflictingJudges)].join(", ")} {conflictingJudges.length === 1 ? "is" : "are"} already assigned at {formData.startTime} in {slotsAtSameTime.map(s => s.roomName).join(", ")}. Please choose different judges.
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
              <div className="grid gap-2">
                <Label>Submission</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a submission" />
                  </SelectTrigger>
                  <SelectContent>
                    {submissions.map((submission) => (
                        <SelectItem key={submission.id} value={submission.id}>
                          {submission.project_name} {submission.track && `(${submission.track})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assign Judges ({formData.judgeIds.length} selected)</Label>
                <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                  <div className="grid gap-2">
                    {(() => {
                      const selectedSubmission = submissions.find(s => s.id === formData.projectId)
                      const submissionTrack = selectedSubmission?.track || "General"
                      
                      // Filter judges based on track - they can judge if:
                      // 1. Submission is "General" track (anyone can judge), OR
                      // 2. Judge has the submission's track in their tracks array
                      const eligibleJudges = judges.filter(judge => {
                        if (submissionTrack === "General") return true
                        return judge.tracks?.includes(submissionTrack) || false
                      })
                      
                      if (eligibleJudges.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            No eligible judges for track "{submissionTrack}". Please assign judges to this track first.
                          </p>
                        )
                      }
                      
                      return eligibleJudges.map((judge) => (
                        <div key={judge.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`judge-${judge.id}`}
                            checked={formData.judgeIds.includes(judge.id) || formData.judgeIds.includes(String(judge.id))}
                            onChange={() => handleJudgeToggle(String(judge.id))}
                            className="rounded border-gray-300"
                          />
                          <Label
                            htmlFor={`judge-${judge.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {judge.name} ({judge.email})
                            {judge.tracks && judge.tracks.length > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                - {judge.tracks.join(", ")}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only judges assigned to this submission's track can be selected. Select {judgesPerProject} judge(s) per submission (currently selected: {formData.judgeIds.length})
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingSlot ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
