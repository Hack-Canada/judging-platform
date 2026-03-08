"use client"

import * as React from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import {
  IconDoor,
  IconExternalLink,
  IconRefresh,
  IconCalendarEvent,
  IconUsers,
} from "@tabler/icons-react"

type RoomSlot = {
  submissionId: string
  projectName: string
  teamName: string
  members: string[]
  tracks: string[]
  devpostLink: string
  date: string
  startTime: string
  endTime: string
  roomId: number
  judgeNames: string[]
}

type RoomOption = {
  id: number
  label: string
}

function formatTime(time: string | null): string {
  if (!time) return ""
  const trimmed = typeof time === "string" ? time.trim() : String(time).trim()
  if (trimmed.includes(":") && trimmed.split(":").length >= 2) {
    return trimmed.substring(0, 5)
  }
  return trimmed
}

function formatRoomLabel(roomId: number, roomsMap: Map<number, string>): string {
  const configuredName = roomsMap.get(roomId)
  if (configuredName) return configuredName
  if (roomId >= 11 && roomId <= 18) return `Floor 3 Room ${roomId - 10}`
  if (roomId >= 19 && roomId <= 26) return `Floor 4 Room ${roomId - 18}`
  return `Room ${roomId}`
}

function timeToSeconds(time: string | null): number {
  if (!time) return 0
  const timeStr = typeof time === "string" ? time.trim() : String(time).trim()
  if (!timeStr) return 0
  const parts = timeStr.split(":").map((p) => parseInt(p.trim() || "0", 10))
  if (parts.length === 0) return 0
  if (parts.length === 1) return parts[0] * 3600
  if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60
  return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0)
}

export default function RoomSchedulePage() {
  const [loading, setLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [rooms, setRooms] = React.useState<RoomOption[]>([])
  const [selectedRoomId, setSelectedRoomId] = React.useState<string>("")
  const [roomSlots, setRoomSlots] = React.useState<RoomSlot[]>([])

  const allSlotsRef = React.useRef<any[]>([])
  const submissionCacheRef = React.useRef<Map<string, any>>(new Map())
  const judgesCacheRef = React.useRef<Map<string, string>>(new Map())

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)

        const [
          { data: roomsSetting },
          { data: calendarSlots },
          { data: allJudges },
        ] = await Promise.all([
          supabase
            .from("admin_settings")
            .select("setting_value")
            .eq("setting_key", "rooms_data")
            .single(),
          supabase
            .from("calendar_schedule_slots")
            .select("submission_id, judge_ids, date, start_time, end_time, room_id"),
          supabase
            .from("judges")
            .select("id, name"),
        ])

        const judgesMap = new Map<string, string>()
        allJudges?.forEach((j: { id: string; name: string }) => {
          judgesMap.set(String(j.id).toLowerCase(), j.name)
        })
        judgesCacheRef.current = judgesMap

        const roomsMap = new Map<number, string>()
        if (roomsSetting?.setting_value) {
          try {
            const parsed = JSON.parse(roomsSetting.setting_value)
            parsed.forEach((room: { id: number; name: string }) => {
              roomsMap.set(room.id, room.name)
            })
          } catch {
            // ignore
          }
        }

        allSlotsRef.current = calendarSlots || []

        const roomIdSet = new Set<number>()
        ;(calendarSlots || []).forEach((slot: any) => {
          if (slot.room_id != null) roomIdSet.add(slot.room_id)
        })
        const roomOptions: RoomOption[] = Array.from(roomIdSet)
          .sort((a, b) => a - b)
          .map((id) => ({ id, label: formatRoomLabel(id, roomsMap) }))
        setRooms(roomOptions)
        if (roomOptions.length > 0 && !selectedRoomId) {
          setSelectedRoomId(String(roomOptions[0].id))
        }

        const allSubmissionIds = Array.from(
          new Set((calendarSlots || []).map((s: any) => s.submission_id))
        )
        if (allSubmissionIds.length > 0) {
          const { data: submissionsData } = await supabase
            .from("test_submissions")
            .select("id, project_name, submitter_name, members, tracks, devpost_link")
            .in("id", allSubmissionIds)

          const cache = new Map<string, any>()
          submissionsData?.forEach((s) => cache.set(s.id, s))
          submissionCacheRef.current = cache
        }
      } catch (err) {
        toast.error("Failed to load schedule", {
          description: err instanceof Error ? err.message : "Unknown error",
        })
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [refreshKey])

  React.useEffect(() => {
    if (!selectedRoomId || loading) return

    const roomIdNum = parseInt(selectedRoomId, 10)
    const slots = allSlotsRef.current.filter((s: any) => s.room_id === roomIdNum)

    const entries: RoomSlot[] = slots.map((slot: any) => {
      const sub = submissionCacheRef.current.get(slot.submission_id)
      const judgeNames = (slot.judge_ids || []).map((jid: string) =>
        judgesCacheRef.current.get(String(jid).toLowerCase()) ?? "Unknown"
      )

      return {
        submissionId: slot.submission_id,
        projectName: sub?.project_name ?? "Unknown Project",
        teamName: sub?.submitter_name ?? "",
        members: sub?.members ?? [],
        tracks: sub?.tracks ?? [],
        devpostLink: sub?.devpost_link ?? "",
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        roomId: slot.room_id,
        judgeNames,
      }
    })

    entries.sort((a, b) => timeToSeconds(a.startTime) - timeToSeconds(b.startTime))
    setRoomSlots(entries)
  }, [selectedRoomId, loading])

  React.useEffect(() => {
    const channel = supabase
      .channel("room-schedule-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_schedule_slots" }, () =>
        setRefreshKey((k) => k + 1)
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_settings" }, () =>
        setRefreshKey((k) => k + 1)
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div suppressHydrationWarning className="relative min-h-screen">
      <div className="animated-grid fixed inset-0 z-0" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/hackcanada-logo.svg"
              alt="HackCanada Logo"
              width={32}
              height={32}
              className="flex-shrink-0"
            />
            <h1 className="text-2xl font-bold tracking-tight">Room Schedule</h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              View the full judging schedule for each room.
            </p>
            <div className="flex items-center gap-2">
              {rooms.length > 0 && (
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={String(room.id)}>
                        {room.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => setRefreshKey((k) => k + 1)}
              >
                <IconRefresh className={`size-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        {/* Room slots */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading room schedule...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <IconDoor className="size-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No rooms with scheduled slots</p>
            <p className="text-sm mt-1">The schedule hasn&apos;t been published yet.</p>
          </div>
        ) : roomSlots.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <IconCalendarEvent className="size-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No slots in this room</p>
            <p className="text-sm mt-1">Select a different room above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              {roomSlots.length} slot{roomSlots.length !== 1 ? "s" : ""} in{" "}
              <span className="font-medium text-foreground">
                {rooms.find((r) => String(r.id) === selectedRoomId)?.label}
              </span>
            </p>
            {roomSlots.map((slot, idx) => (
              <Card key={`${slot.submissionId}-${slot.startTime}-${idx}`}>
                <CardContent className="py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3 min-w-0 flex-1 items-start">
                      <div className="flex-shrink-0 w-[100px] text-center">
                        <div className="text-sm font-semibold">
                          {formatTime(slot.startTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(slot.endTime)}
                        </div>
                      </div>

                      <div className="hidden sm:block w-px self-stretch bg-border" />

                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium">{slot.projectName}</h3>
                        {slot.teamName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{slot.teamName}</p>
                        )}
                        {slot.members.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {slot.members.map((m, i) => (
                              <Badge key={i} variant="outline" className="text-xs font-normal">{m}</Badge>
                            ))}
                          </div>
                        )}
                        {slot.tracks.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {slot.tracks.map((t, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        )}
                        {slot.devpostLink && (
                          <a
                            href={slot.devpostLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                          >
                            <IconExternalLink className="size-3" />
                            Devpost
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 pl-[112px] sm:pl-0">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IconUsers className="size-3.5" />
                        <span>{slot.judgeNames.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
