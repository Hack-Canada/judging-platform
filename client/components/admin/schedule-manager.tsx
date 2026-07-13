"use client";

import { useMemo, useState } from "react";
import { Search, Clock, Plus, Minus, AlertTriangle, RotateCcw } from "lucide-react";
import type { ScheduleSlot } from "@/lib/schedule";
import { DEFAULT_ROOMS } from "@/lib/schedule";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Deterministic 12-hour formatting. Avoids toLocaleTimeString, whose output
// varies by runtime locale (e.g. "10:00 a.m." on the server vs "10:00 AM" on
// the client) and caused a hydration mismatch.
function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Stable per-track accent so the grid reads at a glance. Hash the track name
// into a fixed palette (works in light + dark).
const TRACK_ACCENTS = [
  "bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/20",
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
  "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/20",
  "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20",
  "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/20",
  "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-cyan-500/20",
  "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 ring-fuchsia-500/20",
  "bg-lime-500/10 text-lime-700 dark:text-lime-300 ring-lime-500/20",
];
function trackAccent(track: string) {
  let h = 0;
  for (let i = 0; i < track.length; i++) h = (h * 31 + track.charCodeAt(i)) >>> 0;
  return TRACK_ACCENTS[h % TRACK_ACCENTS.length];
}

type Row = { key: string; startAt: string; endAt: string; byRoom: Record<string, ScheduleSlot> };

export function ScheduleManager({ initialSlots }: { initialSlots: ScheduleSlot[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [query, setQuery] = useState("");
  const [globalDelay, setGlobalDelay] = useState(0);
  const [dirty, setDirty] = useState(false);

  // Rooms present in the data (fall back to the defaults for column order).
  const rooms = useMemo(() => {
    const present = new Set(slots.map((s) => s.room));
    const ordered = DEFAULT_ROOMS.filter((r) => present.has(r));
    const extra = [...present].filter((r) => !DEFAULT_ROOMS.includes(r)).sort();
    return [...ordered, ...extra];
  }, [slots]);

  // Pivot the flat slot list into grid rows keyed by time frame.
  const rowsData = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const s of slots) {
      const start = new Date(s.scheduledAt);
      const key = s.scheduledAt;
      if (!map.has(key)) {
        const end = new Date(start.getTime() + s.durationMinutes * 60_000);
        map.set(key, {
          key,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          byRoom: {},
        });
      }
      map.get(key)!.byRoom[s.room] = s;
    }
    return [...map.values()].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [slots]);

  const q = query.trim().toLowerCase();
  const matches = (s: ScheduleSlot | undefined) =>
    !!s &&
    !!q &&
    (s.projectName.toLowerCase().includes(q) || s.track.toLowerCase().includes(q));
  const matchCount = q ? slots.filter((s) => matches(s)).length : 0;

  function shiftSlot(id: string, minutes: number) {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              scheduledAt: new Date(
                new Date(s.scheduledAt).getTime() + minutes * 60_000
              ).toISOString(),
            }
          : s
      )
    );
    setDirty(true);
  }

  function applyGlobalDelay() {
    if (globalDelay === 0) return;
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        scheduledAt: new Date(
          new Date(s.scheduledAt).getTime() + globalDelay * 60_000
        ).toISOString(),
      }))
    );
    setDirty(true);
  }

  function reset() {
    setSlots(initialSlots);
    setGlobalDelay(0);
    setDirty(false);
  }

  return (
    <div className="space-y-4">
      {/* Draft banner */}
      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Draft schedule.</span>{" "}
          Generated from submissions — edits are not saved yet. Persisting needs
          the schedule tables (see <code className="text-xs">db/schedule-schema.sql</code>).
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects or tracks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card px-3 py-2">
          <Clock className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Delay all pitches</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setGlobalDelay((d) => Math.max(0, d - 5))}
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="w-16 text-center text-sm tabular-nums">{globalDelay} min</span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setGlobalDelay((d) => d + 5)}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          <Button size="sm" onClick={applyGlobalDelay} disabled={globalDelay === 0}>
            Apply
          </Button>
          {dirty && (
            <Button size="sm" variant="ghost" onClick={reset}>
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {rowsData.length} time slots · {rooms.length} rooms · {slots.length} pitches
        {q && (
          <>
            {" "}
            · <span className="font-medium text-foreground">{matchCount}</span> match “{query}”
          </>
        )}
      </p>

      {/* Grid: rows = time frames, columns = rooms, cells = project + track */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 w-32 bg-muted/50 px-3 py-2.5 text-left font-medium text-muted-foreground">
                Time
              </th>
              {rooms.map((r) => (
                <th
                  key={r}
                  className="min-w-48 px-3 py-2.5 text-left font-medium text-muted-foreground"
                >
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsData.map((row) => (
              <tr key={row.key} className="border-b last:border-0 hover:bg-muted/20">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-3 py-2 align-top font-medium tabular-nums">
                  <div>{fmtTime(row.startAt)}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    – {fmtTime(row.endAt)}
                  </div>
                </td>
                {rooms.map((r) => {
                  const s = row.byRoom[r];
                  const hit = matches(s);
                  const dimmed = q && !hit;
                  return (
                    <td key={r} className="px-2 py-2 align-top">
                      {s ? (
                        <div
                          className={cn(
                            "group relative rounded-md p-2.5 ring-1 transition",
                            trackAccent(s.track),
                            dimmed && "opacity-30",
                            hit && "ring-2 ring-foreground/40"
                          )}
                        >
                          <div className="pr-10 font-medium leading-snug text-foreground">
                            {s.projectName}
                          </div>
                          <div className="mt-1 text-xs font-medium opacity-90">
                            {s.track}
                          </div>
                          {/* Per-pitch nudge, appears on hover */}
                          <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                            <button
                              onClick={() => shiftSlot(s.id, -5)}
                              title="5 min earlier"
                              className="grid size-5 place-items-center rounded bg-background/80 text-foreground hover:bg-background"
                            >
                              <Minus className="size-3" />
                            </button>
                            <button
                              onClick={() => shiftSlot(s.id, 5)}
                              title="5 min later"
                              className="grid size-5 place-items-center rounded bg-background/80 text-foreground hover:bg-background"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid h-full min-h-14 place-items-center rounded-md border border-dashed text-xs text-muted-foreground/50">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
