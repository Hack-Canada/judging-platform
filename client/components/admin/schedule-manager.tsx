"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Clock,
  Plus,
  Minus,
  Loader2,
  Trash2,
  CalendarPlus,
  GripVertical,
  Radio,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ScheduleSlot } from "@/lib/schedule";
import { useLiveSchedule } from "@/hooks/use-live-schedule";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ProjectOption = { id: string; name: string; track: string };

// Deterministic 12-hour formatting (avoids locale-based hydration mismatch).
function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ISO <-> <input type="datetime-local"> value (local time, no seconds/zone).
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}
function shiftIso(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

// Soft, bordered "event card" accents keyed off the track name — mirrors the
// hacker schedule's card look.
const TRACK_ACCENTS = [
  "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100",
  "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100",
  "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-100",
  "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
  "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100",
  "border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-100",
  "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900 dark:border-fuchsia-500/40 dark:bg-fuchsia-500/10 dark:text-fuchsia-100",
  "border-lime-300 bg-lime-50 text-lime-900 dark:border-lime-500/40 dark:bg-lime-500/10 dark:text-lime-100",
];
function trackAccent(track: string) {
  let h = 0;
  for (let i = 0; i < track.length; i++)
    h = (h * 31 + track.charCodeAt(i)) >>> 0;
  return TRACK_ACCENTS[h % TRACK_ACCENTS.length];
}

const CELL_SEP = "__ROOM__";

type Row = {
  key: string;
  startAt: string;
  endAt: string;
  byRoom: Record<string, ScheduleSlot>;
};

type EditState = {
  id: string;
  projectName: string;
  room: string;
  track: string;
  localTime: string;
  durationMinutes: number;
};

type AddState = {
  projectId: string;
  room: string;
  localTime: string;
  durationMinutes: number;
};

// ── Live indicator ──────────────────────────────────────────────────────────
function LiveIndicator({ lastSync }: { lastSync: number }) {
  // Gate the time math behind mount so server and first client render agree
  // (Date.now() differs between them and would trip a hydration mismatch).
  const [mounted, setMounted] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = mounted
    ? Math.max(0, Math.round((Date.now() - lastSync) / 1000))
    : 0;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
      <Radio className="size-3.5 animate-pulse" />
      Live · updated {secs}s ago
    </span>
  );
}

// ── Draggable pitch card ────────────────────────────────────────────────────
function PitchCard({
  slot,
  accent,
  dimmed,
  hit,
  busy,
  onEdit,
  onNudge,
}: {
  slot: ScheduleSlot;
  accent: string;
  dimmed: boolean;
  hit: boolean;
  busy: boolean;
  onEdit: () => void;
  onNudge: (minutes: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: slot.id, disabled: busy });
  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-grab rounded-xl border-2 p-2.5 shadow-sm transition hover:shadow-md active:cursor-grabbing",
        accent,
        dimmed && "opacity-30",
        hit && "ring-2 ring-[var(--brand-primary)]",
        isDragging && "opacity-60 shadow-lg",
      )}
      onClick={onEdit}
      {...listeners}
      {...attributes}
    >
      <div className="pr-10 text-[13px] font-semibold leading-snug [font-family:var(--font-figtree)]">
        {slot.projectName}
      </div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wide opacity-80 [font-family:var(--font-jetbrains-mono)]">
        {slot.track}
      </div>
      <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNudge(-5);
          }}
          title="5 min earlier"
          disabled={busy}
          className="grid size-5 place-items-center rounded bg-white/80 text-foreground hover:bg-white"
        >
          <Minus className="size-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNudge(5);
          }}
          title="5 min later"
          disabled={busy}
          className="grid size-5 place-items-center rounded bg-white/80 text-foreground hover:bg-white"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}

// ── Droppable time×room cell ────────────────────────────────────────────────
function DropCell({
  rowKey,
  room,
  children,
}: {
  rowKey: string;
  room: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${rowKey}${CELL_SEP}${room}`,
  });
  return (
    <td
      ref={setNodeRef}
      className={cn(
        "px-2 py-2 align-top transition-colors",
        isOver && "bg-[var(--bg-primary-light)]/60",
      )}
    >
      {children}
    </td>
  );
}

export function ScheduleManager({
  initialSlots,
  rooms: roomProp,
  projects,
}: {
  initialSlots: ScheduleSlot[];
  rooms: string[];
  projects: ProjectOption[];
}) {
  const { slots, setSlots, refresh, setPaused, lastSync } =
    useLiveSchedule(initialSlots);
  const [query, setQuery] = useState("");
  const [customDelay, setCustomDelay] = useState(10);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleting, setDeleting] = useState<ScheduleSlot | null>(null);
  const [adding, setAdding] = useState<AddState | null>(null);

  // Pause polling while a local mutation is in flight so a poll can't clobber
  // an optimistic edit with stale server data.
  useEffect(() => setPaused(busy), [busy, setPaused]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const rooms = useMemo(() => {
    const present = new Set(slots.map((s) => s.room));
    const ordered = roomProp.filter((r) => present.has(r));
    const extra = [...present].filter((r) => !roomProp.includes(r)).sort();
    return [...ordered, ...extra];
  }, [slots, roomProp]);

  const roomOptions = useMemo(() => {
    const set = new Set([...roomProp, ...slots.map((s) => s.room)]);
    return [...set];
  }, [roomProp, slots]);

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
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }, [slots]);

  const q = query.trim().toLowerCase();
  const matches = (s: ScheduleSlot | undefined) =>
    !!s &&
    !!q &&
    (s.projectName.toLowerCase().includes(q) ||
      s.track.toLowerCase().includes(q));
  const matchCount = q ? slots.filter((s) => matches(s)).length : 0;

  async function patchSlot(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error ?? "Update failed");
    return data.slot as ScheduleSlot;
  }

  async function nudge(slot: ScheduleSlot, minutes: number) {
    const scheduledAt = shiftIso(slot.scheduledAt, minutes);
    setBusy(true);
    try {
      const updated = await patchSlot(slot.id, { scheduledAt });
      setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
      void refresh();
    }
  }

  // Drag-and-drop: move a pitch to a target time+room; swap if occupied.
  async function moveSlot(
    slotId: string,
    targetTime: string,
    targetRoom: string,
  ) {
    const dragged = slots.find((s) => s.id === slotId);
    if (!dragged) return;
    if (dragged.scheduledAt === targetTime && dragged.room === targetRoom)
      return;
    const occupant = slots.find(
      (s) =>
        s.id !== slotId &&
        s.scheduledAt === targetTime &&
        s.room === targetRoom,
    );

    const prev = slots;
    setBusy(true);
    setSlots((cur) =>
      cur.map((s) => {
        if (s.id === dragged.id)
          return { ...s, scheduledAt: targetTime, room: targetRoom };
        if (occupant && s.id === occupant.id)
          return { ...s, scheduledAt: dragged.scheduledAt, room: dragged.room };
        return s;
      }),
    );
    try {
      await patchSlot(dragged.id, {
        scheduledAt: targetTime,
        room: targetRoom,
      });
      if (occupant) {
        await patchSlot(occupant.id, {
          scheduledAt: dragged.scheduledAt,
          room: dragged.room,
        });
      }
      toast.success(occupant ? "Swapped two pitches" : "Pitch moved");
    } catch (err) {
      setSlots(prev);
      toast.error(err instanceof Error ? err.message : "Move failed");
    } finally {
      setBusy(false);
      void refresh();
    }
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const [targetTime, targetRoom] = String(over.id).split(CELL_SEP);
    if (!targetTime || !targetRoom) return;
    void moveSlot(String(active.id), targetTime, targetRoom);
  }

  // Quick global delay: apply immediately, offer undo.
  async function applyDelay(minutes: number) {
    if (minutes === 0) return;
    const prev = slots;
    setBusy(true);
    setSlots((cur) =>
      cur.map((s) => ({ ...s, scheduledAt: shiftIso(s.scheduledAt, minutes) })),
    );
    try {
      const res = await fetch(`/api/admin/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delayMinutes: minutes }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Delay failed");
      const sign = minutes > 0 ? "+" : "";
      toast.success(`Delayed all pitches by ${sign}${minutes} min`, {
        action: { label: "Undo", onClick: () => void applyDelay(-minutes) },
      });
    } catch (err) {
      setSlots(prev);
      toast.error(err instanceof Error ? err.message : "Delay failed");
    } finally {
      setBusy(false);
      void refresh();
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    try {
      const updated = await patchSlot(editing.id, {
        room: editing.room,
        track: editing.track,
        scheduledAt: fromLocalInput(editing.localTime),
        durationMinutes: editing.durationMinutes,
      });
      setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditing(null);
      toast.success("Pitch updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
      void refresh();
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/schedule/${deleting.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Delete failed");
      setSlots((prev) => prev.filter((s) => s.id !== deleting.id));
      toast.success(`Removed “${deleting.projectName}”`);
      setDeleting(null);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
      void refresh();
    }
  }

  async function addSlot() {
    if (!adding) return;
    if (!adding.projectId) {
      toast.error("Pick a project.");
      return;
    }
    const project = projects.find((p) => p.id === adding.projectId);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: adding.projectId,
          room: adding.room,
          track: project?.track ?? null,
          scheduledAt: fromLocalInput(adding.localTime),
          durationMinutes: adding.durationMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Add failed");
      setSlots((prev) => [...prev, data.slot]);
      setAdding(null);
      toast.success(`Added “${data.slot.projectName}”`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add failed");
    } finally {
      setBusy(false);
      void refresh();
    }
  }

  function openAdd() {
    const last = slots.reduce(
      (max, s) => Math.max(max, new Date(s.scheduledAt).getTime()),
      Date.now(),
    );
    setAdding({
      projectId: "",
      room: roomOptions[0] ?? "Room 101",
      localTime: toLocalInput(new Date(last + 5 * 60_000).toISOString()),
      durationMinutes: 5,
    });
  }

  function openEdit(s: ScheduleSlot) {
    setEditing({
      id: s.id,
      projectName: s.projectName,
      room: s.room,
      track: s.track,
      localTime: toLocalInput(s.scheduledAt),
      durationMinutes: s.durationMinutes,
    });
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects or tracks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Quick delay */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white/70 px-3 py-2">
          <Clock className="size-4 text-[var(--brand-primary)]" />
          <span className="text-sm font-semibold [font-family:var(--font-figtree)]">
            Delay all
          </span>
          {[5, 10, 15].map((m) => (
            <Button
              key={m}
              variant="outline"
              size="sm"
              className="h-8 px-2.5 font-semibold tabular-nums"
              onClick={() => applyDelay(m)}
              disabled={busy}
            >
              +{m}
            </Button>
          ))}
          <span className="mx-0.5 h-5 w-px bg-border" />
          <Input
            type="number"
            value={customDelay}
            onChange={(e) => setCustomDelay(Number(e.target.value) || 0)}
            className="h-8 w-16"
            aria-label="Custom delay minutes"
          />
          <Button
            size="sm"
            className="h-8"
            onClick={() => applyDelay(customDelay)}
            disabled={busy || customDelay === 0}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Apply"}
          </Button>
        </div>

        <Button size="sm" onClick={openAdd} disabled={busy}>
          <CalendarPlus className="size-4" /> Add pitch
        </Button>
      </div>

      {/* Summary + live status */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
        <span>
          {rowsData.length} time slots · {rooms.length} rooms · {slots.length}{" "}
          pitches
          {q && (
            <>
              {" "}
              ·{" "}
              <span className="font-medium text-foreground">
                {matchCount}
              </span>{" "}
              match “{query}”
            </>
          )}
        </span>
        <LiveIndicator lastSync={lastSync} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border bg-white/60 px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <GripVertical className="size-3.5" />
          <span className="font-medium text-foreground">Drag</span> to move
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex gap-0.5">
            <span className="grid size-4 place-items-center rounded bg-background ring-1 ring-border">
              <Minus className="size-2.5" />
            </span>
            <span className="grid size-4 place-items-center rounded bg-background ring-1 ring-border">
              <Plus className="size-2.5" />
            </span>
          </span>
          Nudge ±5
        </span>
        <span>Tap to edit</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          <span className="font-medium text-foreground">Delay all</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Radio className="size-3.5" /> Live for everyone
        </span>
      </div>

      {/* Desktop grid with drag-and-drop */}
      <DndContext id="admin-schedule-dnd" sensors={sensors} onDragEnd={onDragEnd}>
        <div className="hidden overflow-x-auto rounded-2xl border bg-white/70 shadow-sm sm:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-[var(--bg-gray)]/50">
                <th className="sticky left-0 z-10 w-32 bg-[var(--bg-gray)]/50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] [font-family:var(--font-jetbrains-mono)]">
                  Time
                </th>
                {rooms.map((r) => (
                  <th
                    key={r}
                    className="min-w-48 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] [font-family:var(--font-jetbrains-mono)]"
                  >
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowsData.map((row) => (
                <tr
                  key={row.key}
                  className="border-b last:border-0 hover:bg-[var(--bg-light)]"
                >
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 align-top font-semibold tabular-nums text-[var(--brand-secondary)]">
                    <div>{fmtTime(row.startAt)}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      – {fmtTime(row.endAt)}
                    </div>
                  </td>
                  {rooms.map((r) => {
                    const s = row.byRoom[r];
                    const hit = matches(s);
                    const dimmed = !!q && !hit;
                    return (
                      <DropCell key={r} rowKey={row.key} room={r}>
                        {s ? (
                          <PitchCard
                            slot={s}
                            accent={trackAccent(s.track)}
                            dimmed={dimmed}
                            hit={hit}
                            busy={busy}
                            onEdit={() => openEdit(s)}
                            onNudge={(m) => nudge(s, m)}
                          />
                        ) : (
                          <div className="grid h-full min-h-14 place-items-center rounded-xl border border-dashed text-xs text-muted-foreground/50">
                            —
                          </div>
                        )}
                      </DropCell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DndContext>

      {/* Mobile agenda — a time-ordered list (no drag; tap to edit, nudge ±5) */}
      <div className="space-y-4 sm:hidden">
        {rowsData.map((row) => {
          const pitches = rooms
            .map((r) => row.byRoom[r])
            .filter((s): s is ScheduleSlot => !!s);
          return (
            <div key={row.key}>
              <div className="mb-1.5 flex items-baseline gap-2">
                <span className="text-sm font-bold tabular-nums text-[var(--brand-secondary)] [font-family:var(--font-figtree)]">
                  {fmtTime(row.startAt)}
                </span>
                <span className="text-xs text-muted-foreground">
                  – {fmtTime(row.endAt)}
                </span>
              </div>
              <div className="space-y-2">
                {pitches.map((s) => {
                  const hit = matches(s);
                  const dimmed = !!q && !hit;
                  return (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEdit(s)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openEdit(s);
                        }
                      }}
                      className={cn(
                        "relative cursor-pointer rounded-xl border-2 p-3 shadow-sm",
                        trackAccent(s.track),
                        dimmed && "opacity-30",
                        hit && "ring-2 ring-[var(--brand-primary)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold [font-family:var(--font-figtree)]">
                            {s.projectName}
                          </div>
                          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide opacity-80 [font-family:var(--font-jetbrains-mono)]">
                            {s.track} · {s.room}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void nudge(s, -5);
                            }}
                            disabled={busy}
                            className="grid size-7 place-items-center rounded-lg bg-white/80 text-foreground"
                            title="5 min earlier"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void nudge(s, 5);
                            }}
                            disabled={busy}
                            className="grid size-7 place-items-center rounded-lg bg-white/80 text-foreground"
                            title="5 min later"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="truncate">
              {editing?.projectName}
            </DialogTitle>
            <DialogDescription>
              Edit this pitch — changes save to the schedule.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-room">Room</Label>
                  <NativeSelect
                    id="edit-room"
                    className="w-full"
                    value={editing.room}
                    onChange={(e) =>
                      setEditing({ ...editing, room: e.target.value })
                    }
                  >
                    {roomOptions.map((r) => (
                      <NativeSelectOption key={r} value={r}>
                        {r}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-duration">Duration (min)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    min={1}
                    value={editing.durationMinutes}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        durationMinutes: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-time">Start time</Label>
                <Input
                  id="edit-time"
                  type="datetime-local"
                  value={editing.localTime}
                  onChange={(e) =>
                    setEditing({ ...editing, localTime: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-track">Track</Label>
                <Input
                  id="edit-track"
                  value={editing.track}
                  onChange={(e) =>
                    setEditing({ ...editing, track: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() =>
                editing &&
                setDeleting(slots.find((s) => s.id === editing.id) ?? null)
              }
              disabled={busy}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />} Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={!!adding} onOpenChange={(o) => !o && setAdding(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a pitch</DialogTitle>
            <DialogDescription>
              Schedule a project into a room and time.
            </DialogDescription>
          </DialogHeader>
          {adding && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="add-project">Project</Label>
                <NativeSelect
                  id="add-project"
                  className="w-full"
                  value={adding.projectId}
                  onChange={(e) =>
                    setAdding({ ...adding, projectId: e.target.value })
                  }
                >
                  <NativeSelectOption value="">
                    Select a project…
                  </NativeSelectOption>
                  {projects.map((p) => (
                    <NativeSelectOption key={p.id} value={p.id}>
                      {p.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="add-room">Room</Label>
                  <NativeSelect
                    id="add-room"
                    className="w-full"
                    value={adding.room}
                    onChange={(e) =>
                      setAdding({ ...adding, room: e.target.value })
                    }
                  >
                    {roomOptions.map((r) => (
                      <NativeSelectOption key={r} value={r}>
                        {r}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="add-duration">Duration (min)</Label>
                  <Input
                    id="add-duration"
                    type="number"
                    min={1}
                    value={adding.durationMinutes}
                    onChange={(e) =>
                      setAdding({
                        ...adding,
                        durationMinutes: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="add-time">Start time</Label>
                <Input
                  id="add-time"
                  type="datetime-local"
                  value={adding.localTime}
                  onChange={(e) =>
                    setAdding({ ...adding, localTime: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdding(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={addSlot} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Add pitch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this pitch?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes “{deleting?.projectName}” from the schedule. The
              project submission itself is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={busy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
