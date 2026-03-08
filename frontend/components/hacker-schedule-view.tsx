"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SchedulePageSkeleton } from "@/components/schedule-page-skeleton"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { supabase } from "@/lib/supabase-client"
import { defaultRooms, type Room } from "@/lib/rooms-data"
import { IconChevronDown, IconCheck } from "@tabler/icons-react"

type SlotRow = {
  id: string
  date: string
  start_time: string
  end_time: string
  room_id: number
  submission_id: string
  judge_ids: string[]
}

// Matches test_submissions columns (calendar slots reference test_submissions.id)
type SubmissionRow = {
  id: string
  project_name: string
  submitter_name: string | null
  tracks: string[]
}

type JudgeRow = {
  id: string
  tracks: string[]
}

type HackerScheduleViewProps = {
  embedded?: boolean
}

export function HackerScheduleView({ embedded = false }: HackerScheduleViewProps) {
  const [slots, setSlots] = React.useState<SlotRow[]>([])
  const [submissions, setSubmissions] = React.useState<SubmissionRow[]>([])
  const [judges, setJudges] = React.useState<JudgeRow[]>([])
  const [rooms, setRooms] = React.useState<Room[]>(defaultRooms)
  const [scheduleVisible, setScheduleVisible] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [comboboxOpen, setComboboxOpen] = React.useState(false)
  const [activeSubmissionId, setActiveSubmissionId] = React.useState<string | undefined>(undefined)

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [{ data: slotData }, { data: submissionData }, { data: judgesData }, { data: settingsData }, { data: visibilityData }] =
        await Promise.all([
          supabase
            .from("calendar_schedule_slots")
            .select("id, date, start_time, end_time, room_id, submission_id, judge_ids")
            .order("date", { ascending: true })
            .order("start_time", { ascending: true }),
          // Fix: was querying `submissions` (wrong table — slots reference test_submissions.id)
          supabase.from("test_submissions").select("id, project_name, submitter_name, tracks"),
          supabase.from("judges").select("id, tracks"),
          supabase
            .from("admin_settings")
            .select("setting_key, setting_value")
            .eq("setting_key", "rooms_data"),
          supabase
            .from("admin_settings")
            .select("setting_value")
            .eq("setting_key", "hacker_schedule_visibility")
            .maybeSingle(),
        ])

      setSlots((slotData as SlotRow[]) || [])
      const subs = (submissionData as SubmissionRow[]) || []
      setSubmissions(subs)
      setJudges((judgesData as JudgeRow[]) || [])
      if (subs.length > 0) {
        setActiveSubmissionId((prev) => prev ?? subs[0].id)
      }

      if (settingsData && settingsData.length > 0) {
        try {
          const parsed = JSON.parse(settingsData[0].setting_value)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRooms(parsed)
          }
        } catch {
          // ignore parse errors, fall back to default rooms
        }
      }

      setScheduleVisible(visibilityData?.setting_value === "enabled")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  const roomsById = React.useMemo(() => {
    const map = new Map<number, Room>()
    rooms.forEach((room) => map.set(room.id, room))
    return map
  }, [rooms])

  const submissionsById = React.useMemo(() => {
    const map = new Map<string, { projectName: string; tracks: string[] }>()
    submissions.forEach((s) =>
      map.set(s.id, {
        projectName: s.project_name ?? "Untitled Project",
        tracks: Array.isArray(s.tracks) ? s.tracks.filter(Boolean) : [],
      }),
    )
    return map
  }, [submissions])

  const judgesById = React.useMemo(() => {
    const map = new Map<string, { tracks: string[] }>()
    judges.forEach((judge) => {
      map.set(judge.id, {
        tracks: Array.isArray(judge.tracks) ? judge.tracks.filter(Boolean) : [],
      })
    })
    return map
  }, [judges])

  React.useEffect(() => {
    if (submissions.length > 0 && !activeSubmissionId) {
      setActiveSubmissionId(submissions[0].id)
    }
  }, [submissions, activeSubmissionId])

  const slotsForSelectedTeam = React.useMemo(() => {
    if (!activeSubmissionId) return []
    const seen = new Set<string>()
    return slots
      .filter((slot) => slot.submission_id === activeSubmissionId)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.start_time.localeCompare(b.start_time)
      })
      .filter((slot) => {
        const key = `${slot.date}|${slot.start_time}|${slot.end_time}|${slot.room_id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }, [slots, activeSubmissionId])

  const groupSlotsByDate = React.useMemo(() => {
    const map = new Map<string, SlotRow[]>()
    slotsForSelectedTeam.forEach((slot) => {
      const key = slot.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(slot)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [slotsForSelectedTeam])

  const unscheduledSubmissions = React.useMemo(() => {
    const scheduledIds = new Set(slots.map((slot) => slot.submission_id))
    return submissions.filter((sub) => !scheduledIds.has(sub.id))
  }, [submissions, slots])

  const activeSubmission = activeSubmissionId ? submissionsById.get(activeSubmissionId) : undefined

  const getSlotTracks = React.useCallback(
    (slot: SlotRow) => {
      const submissionTracks = submissionsById.get(slot.submission_id)?.tracks ?? []
      const normalizedSubmissionTracks = submissionTracks.length > 0 ? submissionTracks : ["General"]

      const matchedTracks = new Set<string>()
      const judgeIds = Array.isArray(slot.judge_ids) ? slot.judge_ids : []

      judgeIds.forEach((judgeId) => {
        const judgeTracks = judgesById.get(judgeId)?.tracks ?? []
        judgeTracks.forEach((track) => {
          if (normalizedSubmissionTracks.includes(track)) {
            matchedTracks.add(track)
          }
        })
      })

      if (matchedTracks.size > 0) {
        // Prefer sponsor (non-General) tracks so each room shows its specific track.
        // Only fall back to "General" if no sponsor tracks are matched.
        const sponsorTracks = Array.from(matchedTracks).filter((t) => t !== "General")
        return sponsorTracks.length > 0 ? sponsorTracks : ["General"]
      }

      return ["General"]
    },
    [judgesById, submissionsById]
  )

  const formatTimeRange = (start: string, end: string) => {
    const toHM = (t: string) => {
      const [h, m] = t.split(":")
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    }
    return `${toHM(start)} - ${toHM(end)}`
  }

  // Fix: parse "YYYY-MM-DD" as local date to avoid UTC midnight → previous day in negative UTC offsets
  const formatLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading && submissions.length === 0 && slots.length === 0) {
    return <SchedulePageSkeleton embedded={embedded} />
  }

  return (
    <div className={embedded ? "px-4 lg:px-6" : "min-h-screen bg-background p-4 md:p-8"}>
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-2xl">Judging Schedule</CardTitle>
              <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh timings"}
              </Button>
            </div>
            <CardDescription className="text-sm md:text-base">
              Timings are loaded from the published calendar schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!scheduleVisible ? (
              <p className="text-sm text-muted-foreground">
                Judging schedule is currently hidden by admins.
              </p>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects have been submitted yet. Check back later.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Project</Label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        disabled={submissions.length === 0}
                        className="h-11 w-full max-w-lg justify-between text-base font-normal"
                      >
                        <span className="truncate">
                          {activeSubmissionId
                            ? (submissionsById.get(activeSubmissionId)?.projectName ?? "Untitled Project")
                            : "Select a project to view timings"}
                        </span>
                        <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search project name…" />
                        <CommandList className="max-h-[55vh] sm:max-h-72">
                          <CommandEmpty>No matching projects.</CommandEmpty>
                          <CommandGroup>
                            {submissions.map((sub) => (
                              <CommandItem
                                key={sub.id}
                                value={`${sub.project_name ?? ""} ${sub.submitter_name ?? ""} ${(sub.tracks || []).join(" ")}`.trim()}
                                onSelect={() => {
                                  setActiveSubmissionId(sub.id)
                                  setComboboxOpen(false)
                                }}
                              >
                                <IconCheck
                                  className={`mr-2 size-4 shrink-0 ${activeSubmissionId === sub.id ? "opacity-100" : "opacity-0"}`}
                                />
                                <div className="min-w-0">
                                  <p className="truncate">{sub.project_name || "Untitled Project"}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {sub.tracks?.length ? sub.tracks.join(", ") : "General"}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {activeSubmission && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(activeSubmission.tracks.length > 0 ? activeSubmission.tracks : ["General"]).map((track) => (
                        <Badge key={track} variant="secondary">
                          {track}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {activeSubmissionId && (
                  <div className="space-y-4">
                    {slotsForSelectedTeam.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No judging times scheduled yet for this project.</p>
                    ) : (
                      <div className="space-y-6">
                        {groupSlotsByDate.map(([date, dateSlots]) => (
                          <div key={date} className="space-y-3">
                            <p className="text-base font-semibold tracking-tight md:text-lg">
                              {formatLocalDate(date)}
                            </p>
                            <div className="space-y-2">
                              {dateSlots.map((slot) => {
                                const room = roomsById.get(slot.room_id)
                                const slotTracks = getSlotTracks(slot)
                                return (
                                  <div key={slot.id} className="flex flex-col gap-2 rounded-lg border px-4 py-3 text-base transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-2">
                                      <p className="font-medium tracking-tight">{formatTimeRange(slot.start_time, slot.end_time)}</p>
                                      <div className="flex flex-wrap gap-2">
                                        {slotTracks.map((track) => (
                                          <Badge key={`${slot.id}-${track}`} variant="outline">
                                            {track}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{room?.name ?? `Room ${slot.room_id}`}</p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {scheduleVisible && unscheduledSubmissions.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Not Yet Scheduled</CardTitle>
              <CardDescription className="text-sm">
                The following project{unscheduledSubmissions.length === 1 ? " has" : "s have"} not been assigned a judging time yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unscheduledSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-1 rounded-lg border px-4 py-3 text-base sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2">
                      <p className="font-medium tracking-tight">{sub.project_name || "Untitled Project"}</p>
                      <div className="flex flex-wrap gap-2">
                        {(sub.tracks?.length ? sub.tracks : ["General"]).map((track) => (
                          <Badge key={`${sub.id}-${track}`} variant="outline">
                            {track}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {sub.submitter_name && (
                      <p className="text-sm text-muted-foreground">{sub.submitter_name}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
