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
import { defaultJudges, type Judge } from "@/lib/judges-data"
import { adminProjects, type AdminProject } from "@/lib/admin-projects-data"
import { defaultTracks, type Track } from "@/lib/tracks-data"
import { defaultRooms, type Room } from "@/lib/rooms-data"

const ACCESS_CODE = "111"
const ACCESS_CODE_KEY = "dashboard_access_code"

export default function AdminPage() {
  const [hasAccess, setHasAccess] = React.useState(false)
  const [investmentFund, setInvestmentFund] = React.useState("10000")
  const [judgesList, setJudgesList] = React.useState<Judge[]>(defaultJudges)
  const [projectsList, setProjectsList] = React.useState<AdminProject[]>(adminProjects)
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

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACCESS_CODE_KEY)
      if (stored === ACCESS_CODE) {
        setHasAccess(true)
      } else {
        setHasAccess(false)
      }
      // Load saved investment fund
      const savedFund = localStorage.getItem("admin_investment_fund")
      if (savedFund) {
        setInvestmentFund(savedFund)
      }
      // Load saved calendar settings
      const savedSlotDuration = localStorage.getItem("calendar_slot_duration")
      if (savedSlotDuration) {
        setSlotDuration(parseInt(savedSlotDuration) || 5)
      }
      const savedCalendarJudgesPerProject = localStorage.getItem("calendar_judges_per_project")
      if (savedCalendarJudgesPerProject) {
        setJudgesPerProject(parseInt(savedCalendarJudgesPerProject) || 2)
      }
      const savedStartTime = localStorage.getItem("calendar_start_time")
      if (savedStartTime) {
        setScheduleStartTime(savedStartTime)
      }
      const savedEndTime = localStorage.getItem("calendar_end_time")
      if (savedEndTime) {
        setScheduleEndTime(savedEndTime)
      }
      // Load saved scoring system settings
      const savedMinInvestment = localStorage.getItem("scoring_min_investment")
      if (savedMinInvestment) {
        setMinInvestment(savedMinInvestment)
      }
      const savedMaxInvestment = localStorage.getItem("scoring_max_investment")
      if (savedMaxInvestment) {
        setMaxInvestment(savedMaxInvestment)
      }
      // Load saved judges
      const savedJudges = localStorage.getItem("judges_data")
      if (savedJudges) {
        try {
          setJudgesList(JSON.parse(savedJudges))
        } catch (e) {
          // Use default if parsing fails
        }
      }
      // Load saved tracks
      const savedTracks = localStorage.getItem("tracks_data")
      if (savedTracks) {
        try {
          setTracksList(JSON.parse(savedTracks))
        } catch (e) {
          // Use default if parsing fails
        }
      }
      // Load saved rooms
      const savedRooms = localStorage.getItem("rooms_data")
      if (savedRooms) {
        try {
          setRoomsList(JSON.parse(savedRooms))
        } catch (e) {
          // Use default if parsing fails
        }
      }
      // Load saved assignments
      const savedAssignments = localStorage.getItem("admin_judge_assignments")
      if (savedAssignments) {
        try {
          const parsed = JSON.parse(savedAssignments)
          if (parsed.projects) {
            setProjectsList(parsed.projects)
          }
          if (parsed.judges) {
            setJudgesList(parsed.judges)
          }
          if (parsed.judgesPerProject) {
            setJudgesPerProject(parsed.judgesPerProject)
          }
        } catch (e) {
          // If parsing fails, auto-assign (no toast on initial load)
          setTimeout(() => autoAssignJudges(false), 100)
        }
      } else {
        // Auto-assign on first load (no toast on initial load)
        setTimeout(() => autoAssignJudges(false), 100)
      }
      setIsInitialized(true)
    }
  }, [])

  const saveJudges = (newJudges: Judge[]) => {
    setJudgesList(newJudges)
    if (typeof window !== "undefined") {
      localStorage.setItem("judges_data", JSON.stringify(newJudges))
    }
  }

  const handleSaveFund = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_investment_fund", investmentFund)
      toast.success("Investment fund saved!", {
        description: `Total fund set to $${parseFloat(investmentFund).toLocaleString()}`,
      })
    }
  }

  const handleSaveCalendarSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("calendar_slot_duration", slotDuration.toString())
      localStorage.setItem("calendar_judges_per_project", judgesPerProject.toString())
      localStorage.setItem("calendar_start_time", scheduleStartTime)
      localStorage.setItem("calendar_end_time", scheduleEndTime)
      toast.success("Calendar settings saved!", {
        description: `Schedule: ${scheduleStartTime} - ${scheduleEndTime}, Slot duration: ${slotDuration}min, Judges per project: ${judgesPerProject}`,
      })
    }
  }

  const handleSaveScoringSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("scoring_min_investment", minInvestment)
      localStorage.setItem("scoring_max_investment", maxInvestment)
      toast.success("Scoring system settings saved!", {
        description: `Investment range: $${parseFloat(minInvestment).toLocaleString()} - $${parseFloat(maxInvestment).toLocaleString()}`,
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

  const handleJudgeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!judgeFormData.name.trim() || !judgeFormData.email.trim()) {
      toast.error("Validation error", {
        description: "Name and email are required",
      })
      return
    }

    if (editingJudge) {
      // Update existing judge
      const updated = judgesList.map(j =>
        j.id === editingJudge.id
          ? { ...j, name: judgeFormData.name, email: judgeFormData.email, tracks: judgeFormData.tracks }
          : j
      )
      saveJudges(updated)
      toast.success("Judge updated!", {
        description: `${judgeFormData.name} has been updated`,
      })
    } else {
      // Create new judge
      const newJudge: Judge = {
        id: Math.max(...judgesList.map(j => j.id), 0) + 1,
        name: judgeFormData.name,
        email: judgeFormData.email,
        assignedProjects: 0,
        totalInvested: 0,
        tracks: judgeFormData.tracks.length > 0 ? judgeFormData.tracks : ["General"],
      }
      saveJudges([...judgesList, newJudge])
      toast.success("Judge created!", {
        description: `${judgeFormData.name} has been added`,
      })
    }
    handleCloseJudgeDialog()
  }

  const handleDeleteJudgeClick = (judge: Judge) => {
    setJudgeToDelete(judge)
    setDeleteJudgeDialogOpen(true)
  }

  const handleDeleteJudgeConfirm = () => {
    if (judgeToDelete) {
      const updated = judgesList.filter(j => j.id !== judgeToDelete.id)
      saveJudges(updated)
      toast.success("Judge deleted!", {
        description: `${judgeToDelete.name} has been removed`,
      })
      setDeleteJudgeDialogOpen(false)
      setJudgeToDelete(null)
    }
  }

  const autoAssignJudges = (showToast = false) => {
    // Track-aware assignment: assign judges based on their track assignments
    const activeProjects = projectsList.filter(p => p.status === "Active")
    
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
    
    // Update judge assignedProjects count
    const updatedJudges = judgesList.map(judge => {
      const assignedCount = updatedProjects.filter(p => 
        p.assignedJudges.includes(judge.name)
      ).length
      return {
        ...judge,
        assignedProjects: assignedCount
      }
    })
    setJudgesList(updatedJudges)
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_judge_assignments", JSON.stringify({
        projects: updatedProjects,
        judges: updatedJudges,
        judgesPerProject
      }))
    }
    
    // Show toast notification if requested
    if (showToast) {
      const activeProjectsCount = activeProjects.length
      const totalAssignments = updatedProjects.reduce((sum, p) => sum + p.assignedJudges.length, 0)
      if (totalAssignments > 0) {
        toast.success("Judges auto-assigned!", {
          description: `${totalAssignments} judge assignment(s) across ${activeProjectsCount} active project(s)`,
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
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                      Manage judges, projects, and investment funds
                    </p>
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
                          {judgesList.map((judge) => (
                            <TableRow key={judge.id}>
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
                          ))}
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
                        <Button onClick={() => {
                          const newRoom: Room = {
                            id: Math.max(...roomsList.map(r => r.id), 0) + 1,
                            name: `Room ${String.fromCharCode(65 + roomsList.length)}`,
                            capacity: 15,
                          }
                          const updated = [...roomsList, newRoom]
                          setRoomsList(updated)
                          if (typeof window !== "undefined") {
                            localStorage.setItem("rooms_data", JSON.stringify(updated))
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
                                    if (typeof window !== "undefined") {
                                      localStorage.setItem("rooms_data", JSON.stringify(updated))
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

                  {/* Projects Investment Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Projects Investment Overview</CardTitle>
                      <CardDescription>
                        Live tracking of investments per project
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Track</TableHead>
                            <TableHead>Assigned Judges</TableHead>
                            <TableHead>Total Investment</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectsList.map((project) => (
                            <TableRow key={project.id}>
                              <TableCell className="font-medium">{project.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{project.track || "General"}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {project.assignedJudges.length > 0 ? (
                                    project.assignedJudges.map((judge, idx) => (
                                      <Badge key={idx} variant="outline">{judge}</Badge>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground text-sm">None</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">${project.totalInvestment.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={project.status === "Active" ? "default" : "outline"}
                                >
                                  {project.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
