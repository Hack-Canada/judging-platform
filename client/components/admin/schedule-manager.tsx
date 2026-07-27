"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Clock,
  Plus,
  Minus,
  RotateCcw,
  Loader2,
  Trash2,
  CalendarPlus,
} from "lucide-react";
import type { ScheduleSlot } from "@/lib/schedule";
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
  for (let i = 0; i < track.length; i++)
    h = (h * 31 + track.charCodeAt(i)) >>> 0;
  return TRACK_ACCENTS[h % TRACK_ACCENTS.length];
}

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

export function ScheduleManager({
  initialSlots,
  rooms: roomProp,
  projects,
}: {
  initialSlots: ScheduleSlot[];
  rooms: string[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [slots, setSlots] = useState(initialSlots);
  const [query, setQuery] = useState("");
  const [globalDelay, setGlobalDelay] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleting, setDeleting] = useState<ScheduleSlot | null>(null);
  const [adding, setAdding] = useState<AddState | null>(null);

  const rooms = useMemo(() => {
    const present = new Set(slots.map((s) => s.room));
    const ordered = roomProp.filter((r) => present.has(r));
    const extra = [...present].filter((r) => !roomProp.includes(r)).sort();
    return [...ordered, ...extra];
  }, [slots, roomProp]);

  // All room options for the edit/add dialogs (defaults + any already in use).
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

  async function nudge(slot: ScheduleSlot, minutes: number) {
    const scheduledAt = new Date(
      new Date(slot.scheduledAt).getTime() + minutes * 60_000,
    ).toISOString();
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/schedule/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Update failed");
      setSlots((prev) =>
        prev.map((s) => (s.id === data.slot.id ? data.slot : s)),
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function applyGlobalDelay() {
    if (globalDelay === 0) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delayMinutes: globalDelay }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Delay failed");
      setSlots((prev) =>
        prev.map((s) => ({
          ...s,
          scheduledAt: new Date(
            new Date(s.scheduledAt).getTime() + globalDelay * 60_000,
          ).toISOString(),
        })),
      );
      toast.success(`Delayed all pitches by ${globalDelay} min`);
      setGlobalDelay(0);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delay failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/schedule/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: editing.room,
          track: editing.track,
          scheduledAt: fromLocalInput(editing.localTime),
          durationMinutes: editing.durationMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Update failed");
      setSlots((prev) =>
        prev.map((s) => (s.id === data.slot.id ? data.slot : s)),
      );
      setEditing(null);
      toast.success("Pitch updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
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
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
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
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add failed");
    } finally {
      setBusy(false);
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

  return (
    <div className="space-y-4">
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
          <span className="text-sm font-medium">Delay all</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setGlobalDelay((d) => Math.max(0, d - 5))}
              disabled={busy}
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="w-16 text-center text-sm tabular-nums">
              {globalDelay} min
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setGlobalDelay((d) => d + 5)}
              disabled={busy}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          <Button
            size="sm"
            onClick={applyGlobalDelay}
            disabled={globalDelay === 0 || busy}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            Apply
          </Button>
        </div>
        <Button size="sm" onClick={openAdd} disabled={busy}>
          <CalendarPlus className="size-4" /> Add pitch
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {rowsData.length} time slots · {rooms.length} rooms · {slots.length}{" "}
        pitches
        {q && (
          <>
            {" "}
            · <span className="font-medium text-foreground">
              {matchCount}
            </span>{" "}
            match “{query}”
          </>
        )}
        <span className="ml-1 text-emerald-600 dark:text-emerald-400">
          · saved to DB
        </span>
      </p>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex gap-0.5">
            <span className="grid size-4 place-items-center rounded bg-background ring-1 ring-border">
              <Minus className="size-2.5" />
            </span>
            <span className="grid size-4 place-items-center rounded bg-background ring-1 ring-border">
              <Plus className="size-2.5" />
            </span>
          </span>
          Hover a pitch to shift it 5 min earlier / later — saves right away
        </span>
        <span>Click a pitch to edit its room, time, track, or duration</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          <span className="font-medium">Delay all</span> shifts every pitch at
          once — takes effect on Apply
        </span>
      </div>

      {/* Grid */}
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
              <tr
                key={row.key}
                className="border-b last:border-0 hover:bg-muted/20"
              >
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
                            "group relative cursor-pointer rounded-md p-2.5 ring-1 transition hover:ring-2 hover:ring-foreground/30",
                            trackAccent(s.track),
                            dimmed && "opacity-30",
                            hit && "ring-2 ring-foreground/40",
                          )}
                          onClick={() =>
                            setEditing({
                              id: s.id,
                              projectName: s.projectName,
                              room: s.room,
                              track: s.track,
                              localTime: toLocalInput(s.scheduledAt),
                              durationMinutes: s.durationMinutes,
                            })
                          }
                        >
                          <div className="pr-10 font-medium leading-snug text-foreground">
                            {s.projectName}
                          </div>
                          <div className="mt-1 text-xs font-medium opacity-90">
                            {s.track}
                          </div>
                          <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                nudge(s, -5);
                              }}
                              title="5 min earlier"
                              disabled={busy}
                              className="grid size-5 place-items-center rounded bg-background/80 text-foreground hover:bg-background"
                            >
                              <Minus className="size-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                nudge(s, 5);
                              }}
                              title="5 min later"
                              disabled={busy}
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
