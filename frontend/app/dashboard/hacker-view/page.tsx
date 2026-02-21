"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase-client"
import { defaultRooms, type Room } from "@/lib/rooms-data"

type SlotRow = {
  id: string
  date: string
  start_time: string
  end_time: string
  room_id: number
  submission_id: string
}

type SubmissionRow = {
  id: string
  team_name: string
  project_name: string
}

export default function HackerViewPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
  const [authLoading, setAuthLoading] = React.useState(true)
  const [slots, setSlots] = React.useState<SlotRow[]>([])
  const [submissions, setSubmissions] = React.useState<SubmissionRow[]>([])
  const [rooms, setRooms] = React.useState<Room[]>(defaultRooms)
  const [loading, setLoading] = React.useState(true)
  const [activeSubmissionId, setActiveSubmissionId] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setHasAccess(true)
        } else {
          setHasAccess(false)
          router.push("/")
        }
      } catch (error) {

        router.push("/")
      } finally {
        setAuthLoading(false)
      }
    }

    void checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setHasAccess(true)
      } else {
        setHasAccess(false)
        router.push("/")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const loadData = React.useCallback(async () => {
    if (!hasAccess) return
    try {
      setLoading(true)
      const [{ data: slotData }, { data: submissionData }, { data: settingsData }] =
        await Promise.all([
          supabase
            .from("calendar_schedule_slots")
            .select("id, date, start_time, end_time, room_id, submission_id")
            .order("date", { ascending: true })
            .order("start_time", { ascending: true }),
          supabase.from("submissions").select("id, team_name, project_name"),
          supabase
            .from("admin_settings")
            .select("setting_key, setting_value")
            .eq("setting_key", "rooms_data"),
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
    } finally {
      setLoading(false)
    }
  }, [hasAccess])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  const roomsById = React.useMemo(() => {
    const map = new Map<number, Room>()
    rooms.forEach((room) => map.set(room.id, room))
    return map
  }, [rooms])

  const submissionsById = React.useMemo(() => {
    const map = new Map<string, { teamName: string; projectName: string }>()
    submissions.forEach((s) =>
      map.set(s.id, {
        teamName: s.team_name ?? "Unknown Team",
        projectName: s.project_name ?? "Untitled Project",
      })
    )
    return map
  }, [submissions])

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
    return `${toHM(start)} – ${toHM(end)}`
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

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
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Hacker View</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void loadData()}
                          disabled={loading}
                        >
                          {loading ? "Refreshing…" : "Refresh timings"}
                        </Button>
                      </div>
                      <CardDescription className="sr-only">
                        Timings are loaded from the published calendar schedule.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loading && submissions.length === 0 && slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                      ) : submissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No teams have submitted yet. Check back later.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="team-select">Team</Label>
                            <Select
                              value={activeSubmissionId ?? ""}
                              onValueChange={(value) => setActiveSubmissionId(value)}
                            >
                              <SelectTrigger id="team-select" className="w-full max-w-sm">
                                <SelectValue placeholder="Select a team to view their timings" />
                              </SelectTrigger>
                              <SelectContent>
                                {submissions.map((sub) => (
                                  <SelectItem key={sub.id} value={sub.id}>
                                    {sub.team_name || sub.project_name || "Untitled"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {activeSubmissionId && (
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold">
                                {submissionsById.get(activeSubmissionId)?.teamName} – Judging times
                              </h3>
                              {slotsForSelectedTeam.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  No judging times scheduled yet for this team.
                                </p>
                              ) : (
                                <div className="space-y-4">
                                  {groupSlotsByDate.map(([date, dateSlots]) => (
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
                                        {dateSlots.map((slot) => {
                                          const room = roomsById.get(slot.room_id)
                                          return (
                                            <div
                                              key={slot.id}
                                              className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
                                            >
                                              <div>
                                                <p className="font-medium">
                                                  {formatTimeRange(slot.start_time, slot.end_time)}
                                                </p>
                                              </div>
                                              <p className="text-xs text-muted-foreground">
                                                Room: {room?.name ?? `Room ${slot.room_id}`}
                                              </p>
                                            </div>
                                          )
                                        })}
                                      </CardContent>
                                    </Card>
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
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}



