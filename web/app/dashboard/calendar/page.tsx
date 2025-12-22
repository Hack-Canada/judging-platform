"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AccessCodeDialog } from "@/components/access-code-dialog"
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
import { defaultJudges } from "@/lib/judges-data"
import { defaultProjects } from "@/lib/projects-data"
import { generateTimeSlots, getEndTime, type TimeSlot, type DaySchedule } from "@/lib/schedule-data"
import { defaultRooms, type Room } from "@/lib/rooms-data"

const ACCESS_CODE = "111"
const ACCESS_CODE_KEY = "dashboard_access_code"

export default function CalendarPage() {
  const [hasAccess, setHasAccess] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [judges] = React.useState(defaultJudges)
  const [projects] = React.useState(defaultProjects)
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
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACCESS_CODE_KEY)
      if (stored === ACCESS_CODE) {
        setHasAccess(true)
      } else {
        setHasAccess(false)
      }
      // Load saved schedule
      const savedSchedule = localStorage.getItem(`schedule_${selectedDate}`)
      if (savedSchedule) {
        try {
          setSlots(JSON.parse(savedSchedule))
        } catch (e) {
          // Use default if parsing fails
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
          // Ensure we have at least the default rooms
          if (parsedRooms && Array.isArray(parsedRooms) && parsedRooms.length > 0) {
            setRooms(parsedRooms)
          } else {
            setRooms(defaultRooms)
          }
        } catch (e) {
          // Use default if parsing fails
          setRooms(defaultRooms)
        }
      } else {
        setRooms(defaultRooms)
      }
    }
  }, [selectedDate])
  
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
        projectId: slot.projectId.toString(),
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
        description: "Please select a project",
      })
      return
    }
    if (!formData.roomId) {
      toast.error("Validation error", {
        description: "Please select a room",
      })
      return
    }

    const project = projects.find(p => p.id === parseInt(formData.projectId))
    if (!project) return

    const selectedRoom = rooms.find(r => r.id === parseInt(formData.roomId))
    if (!selectedRoom) return

    const selectedJudges = judges.filter(j => formData.judgeIds.includes(j.id))
    
    const slotData: TimeSlot = {
      id: editingSlot?.id || `${selectedDate}-${formData.startTime}`,
      startTime: formData.startTime,
      endTime: getEndTime(formData.startTime, slotDuration),
      projectId: project.id,
      projectName: project.name,
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
        description: `Slot for ${project.name} has been updated`,
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
        description: `Slot for ${project.name} has been scheduled`,
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
    const activeProjects = projects.filter(p => p.status === "Active")
    
    // Helper function to check if a judge can judge a project's track
    const canJudgeTrack = (judge: typeof judges[0], projectTrack: string): boolean => {
      // Judges can always judge "General" track
      if (projectTrack === "General") return true
      // Judge can judge if they have the project's track assigned
      return judge.tracks?.includes(projectTrack) || false
    }
    
    const newSlots: TimeSlot[] = []
    // Use the configured start time for auto-scheduling
    let currentTime = scheduleStartTime

    for (let projectIndex = 0; projectIndex < activeProjects.length; projectIndex++) {
      const project = activeProjects[projectIndex]
      const projectTrack = project.track || "General"
      
      // Filter judges who can judge this track
      const eligibleJudges = judges.filter(judge => 
        canJudgeTrack(judge, projectTrack)
      )
      
      if (eligibleJudges.length === 0) {
        // Skip projects with no eligible judges
        continue
      }
      
      const projectJudges: number[] = []
      for (let i = 0; i < judgesPerProject && eligibleJudges.length > 0; i++) {
        const judgeIndex = i % eligibleJudges.length
        const judge = eligibleJudges[judgeIndex]
        if (!projectJudges.includes(judge.id)) {
          projectJudges.push(judge.id)
        }
      }

      const selectedJudgesList = judges.filter(j => projectJudges.includes(j.id))
      
      // Assign to a room - try to find available room without judge conflicts
      let assignedRoom: Room | null = null
      let assignedTime = currentTime
      
      // Try to assign at current time across rooms
      for (const room of rooms) {
        // Check if room is available at this time
        const isRoomBooked = newSlots.some(s => 
          s.startTime === assignedTime && s.roomId === room.id
        )
        
        if (isRoomBooked) continue
        
        // Check for judge conflicts at this time (across all rooms)
        const slotsAtSameTime = newSlots.filter(s => s.startTime === assignedTime)
        const hasJudgeConflict = slotsAtSameTime.some(s => {
          return projectJudges.some(judgeId => s.judgeIds.includes(judgeId))
        })
        
        if (!hasJudgeConflict) {
          assignedRoom = room
          break
        }
      }
      
      // If no room available at current time, move to next time slot
      if (!assignedRoom) {
        const [hours, minutes] = currentTime.split(":").map(Number)
        const totalMinutes = hours * 60 + minutes + slotDuration
        const nextHours = Math.floor(totalMinutes / 60)
        const nextMinutes = totalMinutes % 60
        assignedTime = `${nextHours.toString().padStart(2, "0")}:${nextMinutes.toString().padStart(2, "0")}`
        
        // Stop if we exceed the end time
        const [endHour, endMin] = scheduleEndTime.split(":").map(Number)
        if (nextHours > endHour || (nextHours === endHour && nextMinutes > endMin)) break
        
        // Try again with next time slot - use first available room
        assignedRoom = rooms[0] // Use first room for next time slot
        currentTime = assignedTime
      } else {
        currentTime = assignedTime
      }
      
      if (assignedRoom) {
        newSlots.push({
          id: `${selectedDate}-${assignedTime}-${project.id}-${assignedRoom.id}`,
          startTime: assignedTime,
          endTime: getEndTime(assignedTime, slotDuration),
          projectId: project.id,
          projectName: project.name,
          judgeIds: projectJudges,
          judgeNames: selectedJudgesList.map(j => j.name),
          roomId: assignedRoom.id,
          roomName: assignedRoom.name,
        })
        
        // Move to next time slot for next project
        const [hours, minutes] = assignedTime.split(":").map(Number)
        const totalMinutes = hours * 60 + minutes + slotDuration
        const nextHours = Math.floor(totalMinutes / 60)
        const nextMinutes = totalMinutes % 60
        currentTime = `${nextHours.toString().padStart(2, "0")}:${nextMinutes.toString().padStart(2, "0")}`
        
        // Stop if we exceed the end time
        const [endHour, endMin] = scheduleEndTime.split(":").map(Number)
        if (nextHours > endHour || (nextHours === endHour && nextMinutes > endMin)) break
      }
    }

    saveSchedule(newSlots)
    toast.success("Auto-scheduled!", {
      description: `Scheduled ${newSlots.length} projects for ${selectedDate}`,
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
    return <AccessCodeDialog />
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
                        Schedule judge assignments for projects
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
                        Click on a time slot to assign or edit judge-project assignments. All rooms are shown for each time frame.
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
                                          <div className="space-y-2 p-2 bg-muted/50 rounded-md">
                                            <div className="flex items-center justify-between gap-2">
                                              <Badge variant="default" className="text-xs">
                                                {slot.projectName}
                                              </Badge>
                                              <div className="flex items-center gap-1">
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
                                            <Badge variant="outline" className="text-xs">
                                              {projects.find(p => p.id === slot.projectId)?.track || "General"}
                                            </Badge>
                                            {slot.judgeNames.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-2">
                                                {slot.judgeNames.map((name, idx) => (
                                                  <Badge key={idx} variant="outline" className="text-xs">
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
                ? "Update the project and judge assignments for this time slot."
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
                <Label>Project</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects
                      .filter(p => p.status === "Active")
                      .map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name} {project.track && `(${project.track})`}
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
                      const selectedProject = projects.find(p => p.id === parseInt(formData.projectId))
                      const projectTrack = selectedProject?.track || "General"
                      
                      // Filter judges based on track - they can judge if:
                      // 1. Project is "General" track (anyone can judge), OR
                      // 2. Judge has the project's track in their tracks array
                      const eligibleJudges = judges.filter(judge => {
                        if (projectTrack === "General") return true
                        return judge.tracks?.includes(projectTrack) || false
                      })
                      
                      if (eligibleJudges.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            No eligible judges for track "{projectTrack}". Please assign judges to this track first.
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
                  Only judges assigned to this project's track can be selected. Select {judgesPerProject} judge(s) per project (currently selected: {formData.judgeIds.length})
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
