"use client";

import { useMemo, useState } from "react";
import { Search, Clock, Plus, Minus, AlertTriangle, RotateCcw } from "lucide-react";
import type { ScheduleSlot } from "@/lib/schedule";
import { DEFAULT_ROOMS } from "@/lib/schedule";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function ScheduleManager({ initialSlots }: { initialSlots: ScheduleSlot[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [query, setQuery] = useState("");
  const [room, setRoom] = useState<string>("all");
  const [globalDelay, setGlobalDelay] = useState(0);
  const [dirty, setDirty] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return slots.filter((s) => {
      if (room !== "all" && s.room !== room) return false;
      if (!q) return true;
      return (
        s.projectName.toLowerCase().includes(q) ||
        s.track.toLowerCase().includes(q)
      );
    });
  }, [slots, query, room]);

  function shiftSlot(id: string, minutes: number) {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, scheduledAt: new Date(new Date(s.scheduledAt).getTime() + minutes * 60_000).toISOString() }
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
        scheduledAt: new Date(new Date(s.scheduledAt).getTime() + globalDelay * 60_000).toISOString(),
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

        <div className="flex items-center gap-1">
          <Button
            variant={room === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoom("all")}
          >
            All rooms
          </Button>
          {DEFAULT_ROOMS.map((r) => (
            <Button
              key={r}
              variant={room === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRoom(r)}
            >
              {r.replace("Room ", "")}
            </Button>
          ))}
        </div>
      </div>

      {/* Global delay */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card px-3 py-2">
        <Clock className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Apply delay to all pitches</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => setGlobalDelay((d) => Math.max(0, d - 5))}>
            <Minus className="size-3.5" />
          </Button>
          <span className="w-16 text-center text-sm tabular-nums">{globalDelay} min</span>
          <Button variant="outline" size="icon" className="size-8" onClick={() => setGlobalDelay((d) => d + 5)}>
            <Plus className="size-3.5" />
          </Button>
        </div>
        <Button size="sm" onClick={applyGlobalDelay} disabled={globalDelay === 0}>
          Apply
        </Button>
        {dirty && (
          <Button size="sm" variant="ghost" onClick={reset} className="ml-auto">
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of {slots.length} pitches
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Time</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Track</TableHead>
              <TableHead className="w-28">Room</TableHead>
              <TableHead className="w-32 text-right">Adjust</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 100).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium tabular-nums">{fmtTime(s.scheduledAt)}</TableCell>
                <TableCell className="max-w-xs truncate">{s.projectName}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {s.track.length > 24 ? s.track.slice(0, 23) + "…" : s.track}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.room}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="icon" className="size-7" onClick={() => shiftSlot(s.id, -5)} title="5 min earlier">
                      <Minus className="size-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-7" onClick={() => shiftSlot(s.id, 5)} title="5 min later">
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filtered.length > 100 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing first 100 rows — refine your search to see more.
        </p>
      )}
    </div>
  );
}
