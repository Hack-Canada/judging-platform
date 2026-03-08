"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SchedulePageSkeleton } from "@/components/schedule-page-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase-client"
import { defaultRooms, type Room } from "@/lib/rooms-data"
import { IconSearch } from "@tabler/icons-react"

type SlotRow = {
  id: string
  date: string
  start_time: string
  end_time: string
  room_id: number
  submission_id: string
}

// Matches test_submissions columns (calendar slots reference test_submissions.id)
type SubmissionRow = {
  id: string
  project_name: string
  submitter_name: string | null
}

type HackerScheduleViewProps = {
  embedded?: boolean
}

export function HackerScheduleView({ embedded = false }: HackerScheduleViewProps) {
  const [slots, setSlots] = React.useState<SlotRow[]>([])
  const [submissions, setSubmissions] = React.useState<SubmissionRow[]>([])
  const [rooms, setRooms] = React.useState<Room[]>(defaultRooms)
  const [scheduleVisible, setScheduleVisible] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [teamSelectOpen, setTeamSelectOpen] = React.useState(false)
  const [activeSubmissionId, setActiveSubmissionId] = React.useState<string | undefined>(undefined)

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [{ data: slotData }, { data: submissionData }, { data: settingsData }, { data: visibilityData }] =
        await Promise.all([
          supabase
            .from("calendar_schedule_slots")
            .select("id, date, start_time, end_time, room_id, submission_id")
            .order("date", { ascending: true })
            .order("start_time", { ascending: true }),
          // Fix: was querying `submissions` (wrong table — slots reference test_submissions.id)
          supabase.from("test_submissions").select("id, project_name, submitter_name"),
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
    const map = new Map<string, { projectName: string }>()
    submissions.forEach((s) =>
      map.set(s.id, {
        projectName: s.project_name ?? "Untitled Project",
      }),
    )
    return map
  }, [submissions])

  const filteredSubmissions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return submissions
    return submissions.filter((sub) => {
      const name = (sub.project_name ?? "").toLowerCase()
      const submitter = (sub.submitter_name ?? "").toLowerCase()
      return name.includes(q) || submitter.includes(q)
    })
  }, [submissions, searchQuery])

  React.useEffect(() => {
    if (filteredSubmissions.length === 0) {
      setActiveSubmissionId(undefined)
      return
    }
    if (!activeSubmissionId || !filteredSubmissions.some((sub) => sub.id === activeSubmissionId)) {
      setActiveSubmissionId(filteredSubmissions[0].id)
    }
  }, [filteredSubmissions, activeSubmissionId])

  const slotsForSelectedTeam = React.useMemo(() => {
    if (!activeSubmissionId) return []
    const projectSlots = slots
      .filter((slot) => slot.submission_id === activeSubmissionId)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.start_time.localeCompare(b.start_time)
      })
    return projectSlots
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

  // Suppress the unused var warning — submissionsById is available for future use
  void submissionsById

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
                <div className="space-y-2.5">
                  <Label htmlFor="team-select" className="text-sm md:text-base">Project</Label>
                  <Select
                    value={activeSubmissionId ?? ""}
                    onOpenChange={(open) => {
                      setTeamSelectOpen(open)
                      if (!open) setSearchQuery("")
                    }}
                    onValueChange={(value) => {
                      setActiveSubmissionId(value)
                      setSearchQuery("")
                    }}
                    disabled={filteredSubmissions.length === 0}
                  >
                    <SelectTrigger id="team-select" className="h-11 w-full max-w-lg text-base">
                      <SelectValue
                        placeholder={
                          filteredSubmissions.length === 0
                            ? "No matching projects"
                            : "Select a project to view timings"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) max-h-[55vh] overflow-y-auto p-0 sm:max-h-88">
                      {teamSelectOpen && (
                        <div className="sticky top-0 z-10 border-b bg-popover/95 p-2 backdrop-blur-sm">
                          <div className="relative">
                            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search project name"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="pl-8"
                            />
                          </div>
                        </div>
                      )}
                      <div className="px-2 pb-1 pt-2 text-xs text-muted-foreground">
                        {filteredSubmissions.length} project{filteredSubmissions.length === 1 ? "" : "s"}
                      </div>
                      {filteredSubmissions.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          <span className="truncate">{sub.project_name || "Untitled Project"}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeSubmissionId && filteredSubmissions.length > 0 && (
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
                                return (
                                  <div key={slot.id} className="flex flex-col gap-2 rounded-lg border px-4 py-3 text-base transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="font-medium tracking-tight">{formatTimeRange(slot.start_time, slot.end_time)}</p>
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
      </div>
    </div>
  )
}
