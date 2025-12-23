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
import { IconPlus, IconEdit, IconTrash, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
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

  const [formData, setFormData] = React.useState({
    startTime: "09:00",
    projectId: "",
    judgeIds: [] as number[],
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

    // Load settings from admin (read-only)
    const savedJudgesPerProject = localStorage.getItem("calendar_judges_per_project")
    if (savedJudgesPerProject) {
      setJudgesPerProject(parseInt(savedJudgesPerProject) || 2)
    }
    const savedSlotDuration = localStorage.getItem("calendar_slot_duration")
    if (savedSlotDuration) {
      setSlotDuration(parseInt(savedSlotDuration) || 5)
    }
    const savedStartTime = localStorage.getItem("calendar_start_time")
    if (savedStartTime) {
      setScheduleStartTime(savedStartTime)
    }
    const savedEndTime = localStorage.getItem("calendar_end_time")
    if (savedEndTime) {
      setScheduleEndTime(savedEndTime)
    }

    // Load saved rooms (merge with defaults to ensure all rooms are present)
    const savedRooms = localStorage.getItem("rooms_data")
    if (savedRooms) {
      try {
        const parsedRooms = JSON.parse(savedRooms)
        if (parsedRooms && Array.isArray(parsedRooms) && parsedRooms.length > 0) {
          setRooms(parsedRooms)
        } else {
          setRooms(defaultRooms)
        }
      } catch {
        setRooms(defaultRooms)
      }
    } else {
      setRooms(defaultRooms)
    }

    const loadFromSupabase = async () => {
      try {
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
      } catch (error) {
        console.error("Failed to load calendar data from Supabase", error)
      }
    }

    void loadFromSupabase()
  }, [selectedDate, router])
  
  // Update time slots when time range changes
  React.useEffect(() => {
    // This will cause timeSlots to recalculate
  }, [scheduleStartTime, scheduleEndTime])

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

    const selectedJudges = judges.filter(j => formData.judgeIds.includes(j.id))
    
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
        const judgeOverlap = formData.judgeIds.filter(judgeId => 
          existingSlot.judgeIds.includes(judgeId)
        )
        if (judgeOverlap.length > 0) {
          const overlappingJudgeNames = judges
            .filter(j => judgeOverlap.includes(j.id))
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
          const usedJudgeIdsAtTime = new Set<number>()
          newSlots
            .filter(s => s.startTime === currentTime)
            .forEach(s => s.judgeIds.forEach(id => usedJudgeIdsAtTime.add(id)))

          // Filter eligible judges that are free at this time
          const availableEligibleJudges = eligibleJudges.filter(judge => !usedJudgeIdsAtTime.has(judge.id))
          
          if (availableEligibleJudges.length < judgesPerProject) {
            // Not enough free judges to schedule this submission at this time
            continue
          }
          
          // Select judges for this submission from available pool
          const submissionJudges: number[] = []
          for (let j = 0; j < judgesPerProject; j++) {
            const judge = availableEligibleJudges[j % availableEligibleJudges.length]
            if (!submissionJudges.includes(judge.id)) {
              submissionJudges.push(judge.id)
            }
          }

          // Assign this submission to this room at this time
          const selectedJudgesList = judges.filter(j => submissionJudges.includes(j.id))
          
          newSlots.push({
            id: `${selectedDate}-${currentTime}-${submission.id}-${room.id}`,
            startTime: currentTime,
            endTime: getEndTime(currentTime, slotDuration),
            projectId: submission.id,
            projectName: submission.project_name,
            judgeIds: submissionJudges,
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

  const handleJudgeToggle = (judgeId: number) => {
    setFormData(prev => ({
      ...prev,
      judgeIds: prev.judgeIds.includes(judgeId)
        ? prev.judgeIds.filter(id => id !== judgeId)
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
                            <strong>Current Settings:</strong> Schedule: {scheduleStartTime} - {scheduleEndTime}, Slot duration: {slotDuration} minutes, Judges per project: {judgesPerProject}. 
                            These settings can be changed in the Admin page.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Calendar displays from {(() => {
                              const [hour, minute] = scheduleStartTime.split(":").map(Number)
                              const totalMinutes = hour * 60 + minute - 30
                              const displayHour = Math.floor(totalMinutes / 60)
                              const displayMinute = totalMinutes % 60
                              return `${displayHour.toString().padStart(2, "0")}:${displayMinute.toString().padStart(2, "0")}`
                            })()} to {(() => {
                              const [hour, minute] = scheduleEndTime.split(":").map(Number)
                              const totalMinutes = hour * 60 + minute + 30
                              const displayHour = Math.floor(totalMinutes / 60)
                              const displayMinute = totalMinutes % 60
                              return `${displayHour.toString().padStart(2, "0")}:${displayMinute.toString().padStart(2, "0")}`
                            })()} (30 min buffer before/after)
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
                            checked={formData.judgeIds.includes(judge.id)}
                            onChange={() => handleJudgeToggle(judge.id)}
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
