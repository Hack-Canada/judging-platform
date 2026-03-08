"use client"

import * as React from "react"
import {
  IconRefresh,
  IconSearch,
  IconCalendar,
  IconGavel,
  IconTag,
  IconClipboardList,
  IconAlertCircle,
} from "@tabler/icons-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { defaultRooms, type Room } from "@/lib/rooms-data"
import { supabase } from "@/lib/supabase-client"

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotRow = {
  id: string
  date: string
  start_time: string
  end_time: string
  submission_id: string
  room_id: number
  judge_ids: string[]
}

type Submission = {
  id: string
  project_name: string
  tracks: string[]
  submitter_name: string | null
}

type Judge = {
  id: string
  name: string
  email: string
  tracks: string[]
}

type EnrichedSlot = SlotRow & {
  projectName: string
  tracks: string[]
  submitterName: string | null
  roomName: string
  judgeNames: string[]
  /** Normalised to "HH:MM" */
  startTimeFmt: string
  endTimeFmt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise a time string to "HH:MM" (handles "HH:MM:SS" from Supabase) */
function fmtTime(t: string) {
  return t.slice(0, 5)
}

/** Parse "YYYY-MM-DD" as a local date (avoids UTC → local day shift) */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function fmtDateHeading(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Generate every time row from `startTime` to `endTime`
 * at `durationMins`-minute intervals, e.g. "09:00" → "09:20" → "09:40" …
 */
function generateTimeRows(
  startTime: string,
  endTime: string,
  durationMins: number,
): { key: string; start: string; end: string }[] {
  if (durationMins <= 0) return []
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  let curr = sh * 60 + sm
  const endTotal = eh * 60 + em
  const rows: { key: string; start: string; end: string }[] = []
  while (curr < endTotal) {
    const next = curr + durationMins
    const s = `${String(Math.floor(curr / 60)).padStart(2, "0")}:${String(curr % 60).padStart(2, "0")}`
    const e = `${String(Math.floor(next / 60)).padStart(2, "0")}:${String(next % 60).padStart(2, "0")}`
    rows.push({ key: `${s}|${e}`, start: s, end: e })
    curr = next
  }
  return rows
}

/** Deterministic colour per track label */
const TRACK_COLOURS: Record<string, string> = {
  General:  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  RBC:      "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  Uber:     "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  Cohere:   "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  Shopify:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  Solana:   "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  Intel:    "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
}

function trackColour(track: string): string {
  return (
    TRACK_COLOURS[track] ??
    "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Schedule Grid ────────────────────────────────────────────────────────────
// Rooms → column headers  |  Times → row headers
// Time rows are generated from admin settings (start → end at slot-duration intervals)

function ScheduleGrid({
  slots,
  rooms,
  startTime,
  endTime,
  slotDuration,
}: {
  slots: EnrichedSlot[]
  rooms: Room[]
  startTime: string
  endTime: string
  slotDuration: number
}) {
  // All configured time rows
  const timeRows = React.useMemo(
    () => generateTimeRows(startTime, endTime, slotDuration),
    [startTime, endTime, slotDuration],
  )

  // Only rooms that have at least one slot for this date (avoids ghost columns)
  const activeRooms = React.useMemo(() => {
    const usedIds = new Set(slots.map((s) => s.room_id))
    return rooms.filter((r) => usedIds.has(r.id))
  }, [slots, rooms])

  // Fast lookup: "HH:MM|HH:MM::roomId" → slot
  // Keys use normalised fmtTime so Supabase "HH:MM:SS" values still match
  const slotLookup = React.useMemo(() => {
    const map = new Map<string, EnrichedSlot>()
    slots.forEach((s) => {
      map.set(`${s.startTimeFmt}|${s.endTimeFmt}::${s.room_id}`, s)
    })
    return map
  }, [slots])

  if (timeRows.length === 0 || activeRooms.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No slots for this date.
      </p>
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border shadow-sm">
      <table className="w-full border-collapse text-sm">
        {/* ── Column headers: rooms ── */}
        <thead>
          <tr className="border-b bg-muted/60">
            {/* Corner */}
            <th className="sticky left-0 z-20 min-w-[7rem] w-28 bg-muted/60 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Time
            </th>
            {activeRooms.map((room) => (
              <th
                key={room.id}
                className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {room.name}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Rows: generated time slots ── */}
        <tbody>
          {timeRows.map(({ key, start, end }, rowIdx) => (
            <tr
              key={key}
              className={`border-b last:border-0 ${rowIdx % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              {/* Sticky time label */}
              <td className="sticky left-0 z-10 border-r bg-background px-4 py-3 align-middle">
                <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                  {start}
                </span>
                <br />
                <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                  – {end}
                </span>
              </td>

              {/* Room cells */}
              {activeRooms.map((room) => {
                const slot = slotLookup.get(`${start}|${end}::${room.id}`)

                if (!slot) {
                  return (
                    <td key={room.id} className="px-3 py-3 align-top">
                      <div className="min-h-[56px] rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10" />
                    </td>
                  )
                }

                const tracksToShow =
                  slot.tracks.length === 0 ? ["General"] : slot.tracks

                return (
                  <td key={room.id} className="px-3 py-3 align-top">
                    <div className="space-y-1.5 rounded-lg border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/30">
                      {/* Project name */}
                      <p className="line-clamp-2 text-[13px] font-semibold leading-snug">
                        {slot.projectName}
                      </p>

                      {/* Submitter */}
                      {slot.submitterName && (
                        <p className="text-[11px] leading-none text-muted-foreground">
                          by {slot.submitterName}
                        </p>
                      )}

                      {/* Tracks */}
                      <div className="flex flex-wrap gap-1">
                        {tracksToShow.map((t) => (
                          <span
                            key={t}
                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${trackColour(t)}`}
                          >
                            <IconTag className="h-2.5 w-2.5" />
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Judges */}
                      {slot.judgeNames.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          <IconGavel className="h-3 w-3 shrink-0 text-muted-foreground" />
                          {slot.judgeNames.map((name, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="rounded-full px-1.5 py-0 text-[10px]"
                            >
                              {name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="flex items-center gap-1 text-[10px] italic text-muted-foreground/60">
                          <IconGavel className="h-2.5 w-2.5" />
                          No judge assigned
                        </p>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [slots, setSlots] = React.useState<EnrichedSlot[]>([])
  const [rooms, setRooms] = React.useState<Room[]>(defaultRooms)
  const [scheduleStartTime, setScheduleStartTime] = React.useState("09:00")
  const [scheduleEndTime, setScheduleEndTime] = React.useState("18:00")
  const [slotDuration, setSlotDuration] = React.useState(20)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [activeDate, setActiveDate] = React.useState<string>("all")

  const loadData = React.useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      else setLoading(true)

      const [
        { data: slotData, error: slotErr },
        { data: submissionData, error: subErr },
        { data: judgeData, error: judgeErr },
        { data: settingsData },
      ] = await Promise.all([
        supabase
          .from("calendar_schedule_slots")
          .select("id, date, start_time, end_time, submission_id, room_id, judge_ids")
          .order("date", { ascending: true })
          .order("start_time", { ascending: true }),
        supabase
          .from("test_submissions")
          .select("id, project_name, tracks, submitter_name"),
        supabase
          .from("judges")
          .select("id, name, email, tracks"),
        // Fetch all relevant admin settings in one query
        supabase
          .from("admin_settings")
          .select("setting_key, setting_value")
          .in("setting_key", [
            "calendar_start_time",
            "calendar_end_time",
            "calendar_slot_duration",
            "rooms_data",
          ]),
      ])

      if (slotErr) throw new Error(slotErr.message)
      if (subErr) throw new Error(subErr.message)
      if (judgeErr) throw new Error(judgeErr.message)

      // Build settings map
      const settingsMap = new Map<string, string>()
      ;(settingsData ?? []).forEach((row: { setting_key: string; setting_value: string }) => {
        settingsMap.set(row.setting_key, row.setting_value)
      })

      // Apply time settings
      const startTime = settingsMap.get("calendar_start_time")
      if (startTime) setScheduleStartTime(startTime)

      const endTime = settingsMap.get("calendar_end_time")
      if (endTime) setScheduleEndTime(endTime)

      const duration = settingsMap.get("calendar_slot_duration")
      if (duration) {
        const parsed = parseInt(duration)
        if (!isNaN(parsed) && parsed > 0) setSlotDuration(parsed)
      }

      // Apply rooms settings
      let parsedRooms: Room[] = defaultRooms
      const roomsRaw = settingsMap.get("rooms_data")
      if (roomsRaw) {
        try {
          const parsed = JSON.parse(roomsRaw)
          if (Array.isArray(parsed) && parsed.length > 0) parsedRooms = parsed
        } catch {
          // fall back to defaultRooms
        }
      }
      setRooms(parsedRooms)

      // Build lookup maps
      const subMap = new Map<string, Submission>()
      ;(submissionData as Submission[] | null ?? []).forEach((s) => subMap.set(s.id, s))

      const judgeMap = new Map<string, Judge>()
      ;(judgeData as Judge[] | null ?? []).forEach((j) => judgeMap.set(j.id, j))

      const roomMap = new Map<number, Room>()
      parsedRooms.forEach((r) => roomMap.set(r.id, r))

      // Enrich slots
      const enriched: EnrichedSlot[] = (slotData as SlotRow[] | null ?? []).map((row) => {
        const sub = subMap.get(row.submission_id)
        const room = roomMap.get(row.room_id)
        const judgeIds = Array.isArray(row.judge_ids) ? row.judge_ids : []
        const judges = judgeIds.map((id) => judgeMap.get(id)).filter(Boolean) as Judge[]

        return {
          ...row,
          projectName: sub?.project_name ?? "Unknown Project",
          tracks: sub?.tracks ?? [],
          submitterName: sub?.submitter_name ?? null,
          roomName: room?.name ?? `Room ${row.room_id}`,
          judgeNames: judges.map((j) => j.name),
          startTimeFmt: fmtTime(row.start_time),
          endTimeFmt: fmtTime(row.end_time),
        }
      })

      setSlots(enriched)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load schedule")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  // ── Derived ────────────────────────────────────────────────────────────────

  const allDates = React.useMemo(
    () => [...new Set(slots.map((s) => s.date))].sort(),
    [slots],
  )

  const filtered = React.useMemo(() => {
    let list = slots
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.projectName.toLowerCase().includes(q) ||
          (s.submitterName ?? "").toLowerCase().includes(q) ||
          s.roomName.toLowerCase().includes(q) ||
          s.judgeNames.some((n) => n.toLowerCase().includes(q)) ||
          s.tracks.some((t) => t.toLowerCase().includes(q)),
      )
    }
    if (activeDate !== "all") list = list.filter((s) => s.date === activeDate)
    return list
  }, [slots, search, activeDate])

  const grouped = React.useMemo(() => {
    const map = new Map<string, EnrichedSlot[]>()
    filtered.forEach((s) => {
      if (!map.has(s.date)) map.set(s.date, [])
      map.get(s.date)!.push(s)
    })
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const uniqueProjects = new Set(slots.map((s) => s.submission_id)).size
  const uniqueJudges = new Set(slots.flatMap((s) => s.judgeNames)).size
  const unassignedCount = slots.filter((s) => s.judgeNames.length === 0).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">

            {/* ── Page header ── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Schedule Overview</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {loading
                    ? "Loading schedule…"
                    : `${scheduleStartTime} – ${scheduleEndTime} · ${slotDuration} min slots · rooms as columns`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="shrink-0 gap-1.5"
              >
                <IconRefresh className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {/* ── Error banner ── */}
            {error && (
              <Card className="border-rose-500/40 bg-rose-500/5">
                <CardContent className="flex items-center gap-2 pt-4 text-sm text-rose-600 dark:text-rose-400">
                  <IconAlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </CardContent>
              </Card>
            )}

            {/* ── Stat cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Slots"
                value={loading ? "—" : slots.length}
                icon={IconClipboardList}
              />
              <StatCard
                label="Unique Projects"
                value={loading ? "—" : uniqueProjects}
                icon={IconClipboardList}
              />
              <StatCard
                label="Judges Assigned"
                value={loading ? "—" : uniqueJudges}
                icon={IconGavel}
              />
              <StatCard
                label="Unassigned Slots"
                value={loading ? "—" : unassignedCount}
                icon={IconAlertCircle}
                sub={unassignedCount > 0 ? "need judges" : "all slots covered"}
              />
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search project, judge, room, or track…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              {allDates.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={activeDate === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveDate("all")}
                  >
                    All dates
                  </Button>
                  {allDates.map((d) => (
                    <Button
                      key={d}
                      variant={activeDate === d ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveDate(d)}
                    >
                      <IconCalendar className="mr-1 h-3.5 w-3.5" />
                      {parseLocalDate(d).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Content ── */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-52 animate-pulse rounded-xl border bg-muted"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                  <IconClipboardList className="h-10 w-10 text-muted-foreground/40" />
                  <p className="font-medium text-muted-foreground">
                    {slots.length === 0
                      ? "No slots saved yet"
                      : "No results match your search"}
                  </p>
                  <p className="text-sm text-muted-foreground/60">
                    {slots.length === 0
                      ? "Go to the Calendar page to create and save a schedule."
                      : "Try a different search term or clear the filter."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {grouped.map(([date, dateSlots]) => (
                  <section key={date}>
                    {/* Date heading */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5">
                        <IconCalendar className="h-4 w-4 text-primary-foreground" />
                        <span className="text-sm font-semibold text-primary-foreground">
                          {fmtDateHeading(date)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {dateSlots.length} slot
                        {dateSlots.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Calendar grid: rooms across top, times down the left */}
                    <ScheduleGrid
                      slots={dateSlots}
                      rooms={rooms}
                      startTime={scheduleStartTime}
                      endTime={scheduleEndTime}
                      slotDuration={slotDuration}
                    />
                  </section>
                ))}
              </div>
            )}

          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
