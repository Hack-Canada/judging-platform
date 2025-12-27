"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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

  React.useEffect(() => {
    if (!hasAccess) return
    const loadData = async () => {
      try {
        setLoading(true)

        const [{ data: slotData }, { data: submissionData }, { data: settingsData }] =
          await Promise.all([
            supabase
              .from("calendar_schedule_slots")
              .select("id, date, start_time, end_time, room_id, submission_id")
              .order("date", { ascending: true })
              .order("start_time", { ascending: true }),
            supabase.from("submissions").select("id, project_name"),
            supabase
              .from("admin_settings")
              .select("setting_key, setting_value")
              .eq("setting_key", "rooms_data"),
          ])

        setSlots((slotData as SlotRow[]) || [])
        setSubmissions((submissionData as SubmissionRow[]) || [])

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
    }

    void loadData()
  }, [hasAccess])

  const roomsById = React.useMemo(() => {
    const map = new Map<number, Room>()
    rooms.forEach((room) => map.set(room.id, room))
    return map
  }, [rooms])

  const submissionsById = React.useMemo(() => {
    const map = new Map<string, string>()
    submissions.forEach((s) => map.set(s.id, s.project_name ?? "Untitled Project"))
    return map
  }, [submissions])

  const groupedBySubmission = React.useMemo(() => {
    const map = new Map<string, SlotRow[]>()
    slots.forEach((slot) => {
      if (!slot.submission_id) return
      const key = slot.submission_id
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(slot)
    })

    // Sort each project's slots by date/time
    map.forEach((projectSlots) => {
      projectSlots.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.start_time.localeCompare(b.start_time)
      })
    })

    return Array.from(map.entries())
  }, [slots])

  React.useEffect(() => {
    if (!activeSubmissionId && groupedBySubmission.length > 0) {
      setActiveSubmissionId(groupedBySubmission[0][0])
    }
  }, [groupedBySubmission, activeSubmissionId])

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
                      <CardTitle>Hacker View</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <p className="text-sm text-muted-foreground">Loading schedule…</p>
                      ) : groupedBySubmission.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No judging schedule is available yet. Please check back later.
                        </p>
                      ) : (
                        <Tabs
                          value={activeSubmissionId}
                          onValueChange={(value) => setActiveSubmissionId(value)}
                          className="space-y-4"
                        >
                          <TabsList className="w-full overflow-x-auto">
                            {groupedBySubmission.map(([submissionId]) => {
                              const projectName = submissionsById.get(submissionId) ?? "Untitled Project"
                              return (
                                <TabsTrigger
                                  key={submissionId}
                                  value={submissionId}
                                  className="whitespace-nowrap"
                                >
                                  {projectName}
                                </TabsTrigger>
                              )
                            })}
                          </TabsList>

                          {groupedBySubmission.map(([submissionId, projectSlots]) => {
                            const projectName = submissionsById.get(submissionId) ?? "Untitled Project"
                            return (
                              <TabsContent key={submissionId} value={submissionId} className="space-y-4">
                                <Card className="border-dashed">
                                  <CardHeader>
                                    <CardTitle className="text-sm">{projectName}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    {projectSlots.map((slot) => {
                                      const room = roomsById.get(slot.room_id)
                                      return (
                                        <div
                                          key={slot.id}
                                          className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
                                        >
                                          <div>
                                            <p className="font-medium">
                                              {new Date(slot.date).toLocaleDateString(undefined, {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                              })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {formatTimeRange(slot.start_time, slot.end_time)}
                                            </p>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Room: {room?.name ?? `Room ${slot.room_id}`}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            )
                          })}
                        </Tabs>
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



