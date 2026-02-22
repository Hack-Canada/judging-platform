"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { defaultTracks } from "@/lib/tracks-data"
import { defaultRooms, type Room } from "@/lib/rooms-data"
import { supabase } from "@/lib/supabase-client"


export default function HackersPage() {
  const searchParams = useSearchParams()
  const [submitting, setSubmitting] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1)
  const [createdSubmissionId, setCreatedSubmissionId] = React.useState<string | null>(null)
  const [scheduleSlots, setScheduleSlots] = React.useState<
    { id: string; date: string; start_time: string; end_time: string; room_id: number; submission_id?: string | null }[]
  >([])
  const [loadingSchedule, setLoadingSchedule] = React.useState(false)
  const [rooms, setRooms] = React.useState<Room[]>(defaultRooms)
  const [viewAllSchedules, setViewAllSchedules] = React.useState(false)
  const [scheduleProjects, setScheduleProjects] = React.useState<{ id: string; name: string }[]>([])
  const [currentProjectIndex, setCurrentProjectIndex] = React.useState(0)
  const [formData, setFormData] = React.useState({
    teamName: "",
    members: ["", "", "", ""], // Up to 4 members (first = primary contact)
    devpostLink: "",
    projectName: "",
    tracks: [] as string[], // Selected tracks/categories
  })

  // Load rooms from admin settings so names match the main calendar
  React.useEffect(() => {
    const loadRooms = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_settings")
          .select("setting_key, setting_value")
          .eq("setting_key", "rooms_data")

        if (error) {

          return
        }

        if (data && data.length > 0) {
          const value = data[0].setting_value
          try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setRooms(parsed)
            }
          } catch (e) {

          }
        }
      } catch (error) {

      }
    }

    void loadRooms()
  }, [])

  const loadScheduleForSubmission = React.useCallback(
    async (submissionId: string, projectName?: string) => {
      try {
        setLoadingSchedule(true)
        const { data, error } = await supabase
          .from("calendar_schedule_slots")
          .select("id, date, start_time, end_time, room_id")
          .eq("submission_id", submissionId)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true })

        if (error) {

          toast.error("Failed to load schedule", {
            description: error.message,
          })
          return
        }

        const slots =
          (data as { id: string; date: string; start_time: string; end_time: string; room_id: number }[]) || []
        setScheduleSlots(slots)

        if (slots.length > 0) {
          setCurrentStep(3)
          // For single-submission view, track just this project in the navigator
          if (projectName) {
            setScheduleProjects([{ id: submissionId, name: projectName }])
            setCurrentProjectIndex(0)
          }
        } else {
          // No slots yet – keep step 2 (pending) but remember the project
          if (projectName) {
            setScheduleProjects([{ id: submissionId, name: projectName }])
            setCurrentProjectIndex(0)
          }
        }
      } catch (error) {

        toast.error("Failed to load schedule", {
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setLoadingSchedule(false)
      }
    },
    []
  )

  // Testing helper: load schedule for all submissions instead of just this hacker
  const loadAllSchedules = React.useCallback(async () => {
    try {
      setLoadingSchedule(true)

      const [{ data: slotsData, error: slotsError }, { data: submissionsData, error: submissionsError }] =
        await Promise.all([
          supabase
            .from("calendar_schedule_slots")
            .select("id, date, start_time, end_time, room_id, submission_id")
            .order("date", { ascending: true })
            .order("start_time", { ascending: true }),
          supabase.from("submissions").select("id, project_name"),
        ])

      if (slotsError) {

        toast.error("Failed to load schedule", {
          description: slotsError.message,
        })
        return
      }

      const slots =
        (slotsData as {
          id: string
          date: string
          start_time: string
          end_time: string
          room_id: number
          submission_id?: string | null
        }[]) || []

      // Build project list for navigator from submissions that actually have slots
      const projectNameMap = new Map<string, string>()
      if (submissionsData && !submissionsError) {
        ;(submissionsData as { id: string; project_name: string }[]).forEach((sub) => {
          projectNameMap.set(sub.id, sub.project_name ?? "Untitled Project")
        })
      }

      const projectIdsWithSlots = Array.from(
        new Set(slots.map((s) => s.submission_id).filter((id): id is string => !!id)),
      )

      const projectsForNavigator = projectIdsWithSlots.map((id) => ({
        id,
        name: projectNameMap.get(id) ?? "Untitled Project",
      }))

      setScheduleProjects(projectsForNavigator)
      setCurrentProjectIndex(0)

      // Store all slots; filtering per project happens in a memoized selector
      setScheduleSlots(slots)
      if (slots.length > 0) {
        setCurrentStep(3)
      }
    } catch (error) {

      toast.error("Failed to load schedule", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoadingSchedule(false)
    }
  }, [])

  // Allow skipping the submission step via URL: /dashboard/hackers?view=schedule
  React.useEffect(() => {
    const view = searchParams.get("view")
    if (view === "schedule") {
      setCurrentStep((prev) => (prev < 2 ? 2 : prev))
      setViewAllSchedules(true)
      void loadAllSchedules()
    }
  }, [searchParams, loadAllSchedules])

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...formData.members]
    newMembers[index] = value
    setFormData({ ...formData, members: newMembers })
  }

  const handleTrackToggle = (trackName: string) => {
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks.includes(trackName)
        ? prev.tracks.filter(t => t !== trackName)
        : [...prev.tracks, trackName],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.teamName.trim()) {
      toast.error("Validation error", {
        description: "Team name is required",
      })
      return
    }

    if (!formData.members[0].trim()) {
      toast.error("Validation error", {
        description: "At least one team member name is required (list yourself first).",
      })
      return
    }

    if (!formData.projectName.trim()) {
      toast.error("Validation error", {
        description: "Project name is required",
      })
      return
    }

    if (!formData.devpostLink.trim()) {
      toast.error("Validation error", {
        description: "Devpost link is required",
      })
      return
    }

    if (formData.tracks.length === 0) {
      toast.error("Validation error", {
        description: "Please select at least one category/track",
      })
      return
    }

    // Validate devpost link format
    try {
      new URL(formData.devpostLink)
    } catch {
      toast.error("Validation error", {
        description: "Please enter a valid Devpost URL",
      })
      return
    }

    try {
      setSubmitting(true)

      // Filter out empty members
      const validMembers = formData.members.filter((m) => m.trim() !== "")

      // Create submission in Supabase (primary contact = first team member)
      const submissionData = {
        name: validMembers[0].trim(),
        team_name: formData.teamName.trim(),
        members: validMembers,
        devpost_link: formData.devpostLink.trim(),
        project_name: formData.projectName.trim(),
        tracks: formData.tracks,
        submitted_at: new Date().toISOString(),
      }

      const { data: inserted, error: submissionError } = await supabase
        .from("submissions")
        .insert([submissionData])
        .select()
        .single()

      if (submissionError || !inserted) {
        throw submissionError || new Error("Failed to create submission")
      }

      // Move to step 2 (pending schedule) and track this submission
      setCreatedSubmissionId(inserted.id as string)
      setCurrentStep(2)

      toast.success("Submission received!", {
        description: "Your project has been recorded and is pending schedule.",
      })

      // Reset form
      setFormData({
        teamName: "",
        members: ["", "", "", ""],
        devpostLink: "",
        projectName: "",
        tracks: [],
      })

      // Try to load schedule immediately in case it's already set
      void loadScheduleForSubmission(inserted.id as string)
    } catch (error) {

      toast.error("Failed to submit", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatTimeRange = (start: string, end: string) => {
    const format = (t: string) => {
      const [h, m] = t.split(":")
      return `${h?.padStart(2, "0")}:${m?.padStart(2, "0")}`
    }
    return `${format(start)} – ${format(end)}`
  }

  // Determine which project's schedule to show in the calendar section
  const currentProjectId = React.useMemo(() => {
    if (viewAllSchedules) {
      const current = scheduleProjects[currentProjectIndex]
      return current?.id ?? null
    }
    return createdSubmissionId
  }, [viewAllSchedules, scheduleProjects, currentProjectIndex, createdSubmissionId])

  const slotsForCurrentProject = React.useMemo(() => {
    if (!viewAllSchedules || !currentProjectId) {
      // In single-submission mode, scheduleSlots are already filtered to that submission
      return scheduleSlots
    }
    return scheduleSlots.filter((slot) => slot.submission_id === currentProjectId)
  }, [viewAllSchedules, currentProjectId, scheduleSlots])

  const groupSlotsByDate = React.useMemo(() => {
    const map = new Map<
      string,
      { id: string; date: string; start_time: string; end_time: string; room_id: number; submission_id?: string | null }[]
    >()
    slotsForCurrentProject.forEach((slot) => {
      const key = slot.date
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(slot)
    })
    map.forEach((slots) => {
      slots.sort((a, b) => a.start_time.localeCompare(b.start_time))
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [slotsForCurrentProject])

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
                      <CardTitle>Project Submission</CardTitle>
                      <CardDescription>
                        Submit your hackathon project and then see when it will be judged.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* 3-step indicator */}
                      <div className="mb-6 flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-4">
                          <span className={currentStep >= 1 ? "font-semibold" : "text-muted-foreground"}>
                            1. Submit project
                          </span>
                          <span className={currentStep >= 2 ? "font-semibold" : "text-muted-foreground"}>
                            2. Pending schedule
                          </span>
                          <span className={currentStep >= 3 ? "font-semibold" : "text-muted-foreground"}>
                            3. Judging time
                          </span>
                        </div>
                      </div>

                      {!createdSubmissionId ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="teamName">
                            Team Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="teamName"
                            value={formData.teamName}
                            onChange={(e) =>
                              setFormData({ ...formData, teamName: e.target.value })
                            }
                            placeholder="Team Awesome"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Team members <span className="text-destructive">*</span>
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            List yourself first, then add up to 3 more (optional).
                          </p>
                          <div className="grid gap-2">
                            {formData.members.map((member, index) => (
                              <Input
                                key={index}
                                value={member}
                                onChange={(e) => handleMemberChange(index, e.target.value)}
                                placeholder={
                                  index === 0
                                    ? "Your name (required)"
                                    : `Teammate ${index + 1} (optional)`
                                }
                                required={index === 0}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="projectName">
                            Project Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="projectName"
                            value={formData.projectName}
                            onChange={(e) =>
                              setFormData({ ...formData, projectName: e.target.value })
                            }
                            placeholder="Amazing Hack Project"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="devpostLink">
                            Devpost Link <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="devpostLink"
                            type="url"
                            value={formData.devpostLink}
                            onChange={(e) =>
                              setFormData({ ...formData, devpostLink: e.target.value })
                            }
                            placeholder="https://devpost.com/software/your-project"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Categories/Tracks <span className="text-destructive">*</span>
                          </Label>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="grid gap-4 md:grid-cols-2">
                                {defaultTracks.map((track) => (
                                  <div key={track.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`track-${track.id}`}
                                      checked={formData.tracks.includes(track.name)}
                                      onCheckedChange={() => handleTrackToggle(track.name)}
                                    />
                                    <Label
                                      htmlFor={`track-${track.id}`}
                                      className="text-sm font-normal cursor-pointer flex-1"
                                    >
                                      {track.name}
                                      {track.description && (
                                        <span className="text-muted-foreground ml-2">
                                          - {track.description}
                                        </span>
                                      )}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-xs text-muted-foreground">
                            Select all categories/tracks your project applies to
                          </p>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setFormData({
                                teamName: "",
                                members: ["", "", "", ""],
                                devpostLink: "",
                                projectName: "",
                                tracks: [],
                              })
                            }}
                          >
                            Clear
                          </Button>
                          <Button type="submit" disabled={submitting}>
                            {submitting ? "Submitting..." : "Submit Project"}
                          </Button>
                        </div>
                      </form>
                      ) : (
                        <div className="space-y-6">
                          {/* Pending / controls section */}
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Your submission has been received and is currently{" "}
                              <span className="font-semibold">pending schedule</span>. Once organizers schedule your
                              judging slot, it will appear below.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  viewAllSchedules
                                    ? loadAllSchedules()
                                    : createdSubmissionId &&
                                      loadScheduleForSubmission(
                                        createdSubmissionId,
                                        scheduleProjects[0]?.name ?? "Your Project"
                                      )
                                }
                                disabled={loadingSchedule}
                              >
                                {loadingSchedule ? "Checking schedule..." : "Refresh schedule"}
                              </Button>
                              <div className="flex items-center gap-2 text-xs">
                                <Checkbox
                                  id="view-all-schedules"
                                  checked={viewAllSchedules}
                                  onCheckedChange={(checked) => {
                                    const value = Boolean(checked)
                                    setViewAllSchedules(value)
                                    if (value) {
                                      void loadAllSchedules()
                                    } else if (createdSubmissionId) {
                                      void loadScheduleForSubmission(
                                        createdSubmissionId,
                                        scheduleProjects[0]?.name ?? "Your Project"
                                      )
                                    }
                                  }}
                                />
                                <Label htmlFor="view-all-schedules" className="text-xs cursor-pointer">
                                  View all projects schedule (testing only)
                                </Label>
                              </div>
                            </div>
                          </div>

                          {/* Calendar-style schedule view */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={!viewAllSchedules && scheduleProjects.length <= 1}
                                onClick={() =>
                                  setCurrentProjectIndex((prev) => (prev > 0 ? prev - 1 : prev))
                                }
                              >
                                ‹
                              </Button>
                              <div className="flex-1 text-center text-sm font-medium truncate">
                                {viewAllSchedules
                                  ? scheduleProjects[currentProjectIndex]?.name ?? "Select a project"
                                  : scheduleProjects[0]?.name ?? "Your Project"}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={
                                  !viewAllSchedules ||
                                  scheduleProjects.length === 0 ||
                                  currentProjectIndex >= scheduleProjects.length - 1
                                }
                                onClick={() =>
                                  setCurrentProjectIndex((prev) =>
                                    prev < scheduleProjects.length - 1 ? prev + 1 : prev
                                  )
                                }
                              >
                                ›
                              </Button>
                            </div>
                            <h3 className="text-base font-semibold">
                              {viewAllSchedules ? "Judging schedule (testing view)" : "Your judging schedule"}
                            </h3>
                            {scheduleSlots.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No schedule has been set yet. Please check back later or use the refresh button above.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {groupSlotsByDate.map(([date, slots]) => (
                                  <Card key={date} className="border-dashed">
                                    <CardHeader>
                                      <CardTitle className="text-sm">
                                        {new Date(date).toLocaleDateString(undefined, {
                                          weekday: "short",
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      {slots.map((slot) => {
                                        const room = rooms.find((r) => r.id === slot.room_id)
                                        return (
                                          <div
                                            key={slot.id}
                                            className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
                                          >
                                            <div>
                                              <p className="font-medium">
                                                {formatTimeRange(slot.start_time, slot.end_time)}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                Room: {room?.name ?? `Room ${slot.room_id}`}
                                              </p>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
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
  )
}
