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
  project_name: string
  tracks: string[]
}


export default function CalendarPage() {
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
    const loadFromSupabase = async () => {
      try {
        // Load settings from Supabase admin_settings table
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

                  setRooms(defaultRooms)
                }
              } else {
                setRooms(defaultRooms)
              }

            }
          } catch (error) {

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
          const rows = supabaseJudges as { id: string; name: string; email?: string; tracks?: string[] }[]
          setJudges(rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email || "",
            assignedProjects: 0,
            totalInvested: 0,
            tracks: row.tracks || ["General"],
          })) as unknown as Judge[])
        }

        if (!submissionsError && supabaseSubmissions) {
          const mappedSubmissions: CalendarSubmission[] = (supabaseSubmissions as { id: string; project_name?: string; tracks?: string[] }[]).map((row) => ({
            id: row.id,
            name: row.project_name ?? "Untitled",
            project_name: row.project_name ?? "Untitled",
            tracks: row.tracks || ["General"],
          }))
          setSubmissions(mappedSubmissions)
        }

        // Slots for selectedDate are loaded in loadSlotsForDate effect below
      } catch (error) {

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
        () => {
          // Reload settings when they change
          void loadFromSupabase()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(settingsChannel)
    }
  }, [selectedDate])
  
  // Load slots from Supabase for selectedDate (so Admin-published schedule shows up)
  const loadSlotsForDate = React.useCallback(async (date: string) => {
    const { data: rows, error } = await supabase
      .from("calendar_schedule_slots")
      .select("id, date, start_time, end_time, submission_id, room_id, judge_ids")
      .eq("date", date)
      .order("start_time", { ascending: true })

    if (error) {
      setSlots([])
      return
    }
    if (!rows || rows.length === 0) {
      setSlots([])
      return
    }
    type SlotRow = { id: string; start_time: string; end_time: string; submission_id: string; room_id: number; judge_ids?: string[] }
    const timeSlotsMapped: TimeSlot[] = (rows as SlotRow[]).map((row) => {
      const startTime = typeof row.start_time === "string"
        ? row.start_time.slice(0, 5)
        : row.start_time
      const endTime = typeof row.end_time === "string"
        ? row.end_time.slice(0, 5)
        : row.end_time
      const sub = submissions.find((s) => s.id === row.submission_id)
      const room = rooms.find((r) => r.id === row.room_id)
      const judgeIds = Array.isArray(row.judge_ids) ? row.judge_ids : []
      const judgeNames = judgeIds
        .map((id: string) => judges.find((j) => String(j.id) === String(id))?.name)
        .filter(Boolean) as string[]
      return {
        id: row.id,
        startTime,
        endTime,
        projectId: row.submission_id,
        projectName: sub?.project_name ?? "Unknown",
        judgeIds,
        judgeNames,
        roomId: row.room_id,
        roomName: room?.name ?? `Room ${row.room_id}`,
      }
    })
    setSlots(timeSlotsMapped)
  }, [submissions, rooms, judges])

  React.useEffect(() => {
    void loadSlotsForDate(selectedDate)
  }, [selectedDate, loadSlotsForDate])

  // When Admin publishes schedule, refetch slots for current date
  React.useEffect(() => {
    const onSchedulePublished = () => {
      void loadSlotsForDate(selectedDate)
    }
    window.addEventListener("schedulePublished", onSchedulePublished)
    return () => window.removeEventListener("schedulePublished", onSchedulePublished)
  }, [selectedDate, loadSlotsForDate])

  // Update time slots when time range changes
  React.useEffect(() => {
    // This will cause timeSlots to recalculate when settings change

  }, [scheduleStartTime, scheduleEndTime, slotDuration, judgesPerProject])

  const saveSchedule = (newSlots: TimeSlot[]) => {
    // Update local state; persistence is handled via Supabase save action
    setSlots(newSlots)
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

    const selectedJudges = judges.filter(j => formData.judgeIds.some(id => String(id) === String(j.id)))
    
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

  const handleSaveScheduleToSupabase = async () => {
    if (slots.length === 0) {
      toast.error("No schedule to save", {
        description: "Publish a schedule from the Admin page first, or add slots manually.",
      })
      return
    }

    try {
      setSaving(true)
      
      // First, delete existing schedule slots for this date (ignore if table doesn't exist)

      const { error: deleteError } = await supabase
        .from("calendar_schedule_slots")
        .delete()
        .eq("date", selectedDate)

      if (deleteError) {
        const err = deleteError as { message?: string; code?: string }
        const deleteErrorMsg = err?.message || String(deleteError)
        // Check if it's a "table doesn't exist" error
        if (deleteErrorMsg.includes("does not exist") ||
            deleteErrorMsg.includes("relation") ||
            err?.code === "42P01") {
          // Table doesn't exist - that's okay, we'll create it
        } else {
          toast.error("Failed to delete existing schedule", {
            description: deleteErrorMsg,
          })
          // Continue anyway - we'll try to insert
        }
      }

      // Prepare slots for insertion
      // Convert judge IDs to UUID strings (they may be numbers or strings)
      const slotsToInsert = slots.map((slot, index) => {

        // Convert judge IDs to UUID strings
        // Judge IDs from Supabase are UUIDs, but they might be stored as numbers in legacy data
        const judgeIdUuids = (slot.judgeIds || []).map(id => {
          // Convert to string - judge IDs from Supabase are UUIDs
          const idStr = String(id)
          // Validate it looks like a UUID (basic check)
          if (idStr.length < 30) {

          }
          return idStr
        })
        
        // Ensure room_id is an integer (not a UUID)
        const roomIdInt = typeof slot.roomId === 'number' 
          ? slot.roomId 
          : parseInt(String(slot.roomId), 10)
        
        if (isNaN(roomIdInt)) {

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

        return slotData
      })



      // Validate that we have slots to insert
      if (slotsToInsert.length === 0) {
        toast.error("No slots to save", {
          description: "Please create a schedule first",
        })
        setSaving(false)
        return
      }
      
      // Insert new schedule slots

      const { data, error } = await supabase
        .from("calendar_schedule_slots")
        .insert(slotsToInsert)
        .select()


      if (error) {
        // Supabase errors typically have: message, details, hint, code
        const err = error as { message?: string; details?: string; hint?: string; code?: string }
        const errorMessage = err?.message || "Unknown error"
        const errorDetails = err?.details ?? null
        const errorHint = err?.hint ?? null
        const errorCode = err?.code ?? null






        // Log all properties (for debugging)
        if (error && typeof error === "object") {
          Object.keys(error).forEach(() => {})
          Object.getOwnPropertyNames(error).forEach((key) => {
            if (!Object.keys(error).includes(key)) {
              void key
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


      if (error instanceof Error) {


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

  const getConflictingJudges = (judgeIds: (string | number)[], time: string, excludeSlotId?: string): string[] => {
    const slotsAtSameTime = slots.filter(s => 
      s.startTime === time &&
      (!excludeSlotId || s.id !== excludeSlotId)
    )
    
    if (judgeIds.length === 0) return []
    
    const conflictingJudgeIds: (string | number)[] = []
    for (const slot of slotsAtSameTime) {
      for (const judgeId of judgeIds) {
        const matches = slot.judgeIds.some(id => String(id) === String(judgeId))
        if (matches && !conflictingJudgeIds.some(id => String(id) === String(judgeId))) {
          conflictingJudgeIds.push(judgeId)
        }
      }
    }
    
    return conflictingJudgeIds
      .map(jId => judges.find(j => String(j.id) === String(jId))?.name)
      .filter((name): name is string => Boolean(name))
  }

  const getSlotsAtTime = (time: string): TimeSlot[] => {
    return slots.filter(s => s.startTime === time)
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
                                  {"capacity" in room && (room as Room & { capacity?: number }).capacity != null && (
                                    <span className="text-xs text-muted-foreground ml-1">({(room as Room & { capacity?: number }).capacity})</span>
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
                                                    General: {submissions.find(s => s.id === slot.projectId)?.tracks?.[0] ?? "General"}
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
                    {submissions.map((submission) => {
                      const sponsorTracks = (submission.tracks || []).filter((t) => t !== "General")
                      const trackLabel =
                        sponsorTracks.length > 0
                          ? sponsorTracks.join(", ")
                          : "General"
                      return (
                        <SelectItem key={submission.id} value={submission.id}>
                          {submission.project_name} ({trackLabel})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assign Judges ({formData.judgeIds.length} selected)</Label>
                <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                  <div className="grid gap-2">
                    {(() => {
                      const selectedSubmission = submissions.find(s => s.id === formData.projectId)
                      const submissionTracks = selectedSubmission?.tracks && selectedSubmission.tracks.length > 0
                        ? selectedSubmission.tracks
                        : ["General"]
                      const sponsorTracks = submissionTracks.filter((t) => t !== "General")
                      const isGeneralOnly = sponsorTracks.length === 0
                      
                      // Filter judges based on tracks:
                      // - General-only submissions: any judge can judge.
                      // - Sponsor submissions: only judges with at least one sponsor track.
                      const eligibleJudges = judges.filter(judge => {
                        if (isGeneralOnly) return true
                        return sponsorTracks.some(track => judge.tracks?.includes(track))
                      })
                      
                      if (eligibleJudges.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            No eligible judges for sponsor track &quot;{sponsorTracks.join(", ")}&quot;. Please assign judges to this track first.
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
                  General-only submissions can be judged by any judge. Sponsor-track submissions (e.g. RBC, Uber) can only be judged by judges assigned to those sponsor tracks. Select {judgesPerProject} judge(s) per submission (currently selected: {formData.judgeIds.length}).
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
