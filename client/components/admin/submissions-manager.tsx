"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Pencil, Trash2, Loader2, Users } from "lucide-react";
import type { Project } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type EditState = {
  id: string;
  project_name: string;
  tracks: string; // comma-separated in the form
  submitter_name: string;
  submitter_email: string;
  members: string; // newline-separated in the form
};

function toEditState(p: Project): EditState {
  return {
    id: p.id,
    project_name: p.project_name,
    tracks: p.tracks.join(", "),
    submitter_name: p.submitter_name ?? "",
    submitter_email: p.submitter_email ?? "",
    members: p.members.join("\n"),
  };
}

export function SubmissionsManager({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) ||
        p.tracks.some((t) => t.toLowerCase().includes(q)) ||
        (p.submitter_name ?? "").toLowerCase().includes(q) ||
        (p.submitter_email ?? "").toLowerCase().includes(q) ||
        p.members.some((m) => m.toLowerCase().includes(q))
    );
  }, [projects, query]);

  async function save() {
    if (!editing) return;
    if (!editing.project_name.trim()) {
      toast.error("Project name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/submissions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: editing.project_name,
          tracks: editing.tracks,
          submitter_name: editing.submitter_name,
          submitter_email: editing.submitter_email,
          members: editing.members,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Update failed");
      setProjects((prev) => prev.map((p) => (p.id === data.project.id ? data.project : p)));
      setEditing(null);
      toast.success("Submission updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      const res = await fetch(`/api/admin/submissions/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Delete failed");
      setProjects((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success(`Deleted “${deleting.project_name}”`);
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyDelete(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects, tracks, submitters, members…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
        {projects.length} submissions
      </p>

      {/* Mobile: stacked cards (the 5-column table is unreadable on phones). */}
      <div className="space-y-2 sm:hidden">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-[color:var(--bg-gray-dark)]/60 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold text-[var(--brand-secondary)]">
                  {p.project_name}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {p.submitter_name ?? "—"}
                  {p.submitter_email ? ` · ${p.submitter_email}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setEditing(toEditState(p))}
                  title="Edit"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleting(p)}
                  title="Delete"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {p.tracks.slice(0, 3).map((t) => (
                <Badge key={t} variant="secondary" className="font-normal">
                  {t.length > 22 ? t.slice(0, 21) + "…" : t}
                </Badge>
              ))}
              {p.tracks.length > 3 && (
                <Badge variant="outline" className="font-normal">
                  +{p.tracks.length - 3}
                </Badge>
              )}
              <span className="ml-auto inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                <Users className="size-3.5" />
                {p.members.length}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            No submissions match “{query}”.
          </div>
        )}
      </div>

      {/* Desktop: full table. */}
      <div className="hidden max-h-[70vh] overflow-auto rounded-md border sm:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Tracks</TableHead>
              <TableHead>Submitter</TableHead>
              <TableHead className="w-20 text-center">Team</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="max-w-xs font-medium">{p.project_name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {p.tracks.slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary" className="font-normal">
                        {t.length > 22 ? t.slice(0, 21) + "…" : t}
                      </Badge>
                    ))}
                    {p.tracks.length > 3 && (
                      <Badge variant="outline" className="font-normal">
                        +{p.tracks.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="font-medium">{p.submitter_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{p.submitter_email ?? ""}</div>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Users className="size-3.5" />
                    {p.members.length}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setEditing(toEditState(p))}
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleting(p)}
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No submissions match “{query}”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit submission</DialogTitle>
            <DialogDescription>
              Changes are saved to the <code className="text-xs">projects</code> table.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="project_name">Project name</Label>
                <Input
                  id="project_name"
                  value={editing.project_name}
                  onChange={(e) => setEditing({ ...editing, project_name: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tracks">Tracks</Label>
                <Input
                  id="tracks"
                  value={editing.tracks}
                  onChange={(e) => setEditing({ ...editing, tracks: e.target.value })}
                  placeholder="Comma-separated"
                />
                <p className="text-xs text-muted-foreground">Separate multiple tracks with commas.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="submitter_name">Submitter name</Label>
                  <Input
                    id="submitter_name"
                    value={editing.submitter_name}
                    onChange={(e) => setEditing({ ...editing, submitter_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="submitter_email">Submitter email</Label>
                  <Input
                    id="submitter_email"
                    type="email"
                    value={editing.submitter_email}
                    onChange={(e) => setEditing({ ...editing, submitter_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="members">Team members</Label>
                <Textarea
                  id="members"
                  value={editing.members}
                  onChange={(e) => setEditing({ ...editing, members: e.target.value })}
                  rows={4}
                  placeholder="One member per line"
                />
                <p className="text-xs text-muted-foreground">One member per line.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{deleting?.project_name}” from the submissions
              table. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={busyDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busyDelete && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
