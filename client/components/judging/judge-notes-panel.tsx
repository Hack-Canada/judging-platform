"use client";

import { useId } from "react";
import { notesSyncHint } from "@/components/judging/judging-footer";
import type { SyncStatus } from "@/lib/judging/use-judging-sync";
import type { JudgingProject } from "@/lib/judging/types";

type JudgeNotesPanelProps = {
  project: JudgingProject;
  notes: string;
  onChange: (notes: string) => void;
  syncStatus?: SyncStatus;
  pendingNotesCount?: number;
};

export function JudgeNotesPanel({
  project,
  notes,
  onChange,
  syncStatus,
  pendingNotesCount = 0,
}: JudgeNotesPanelProps) {
  const textareaId = useId();

  return (
    <section className="mt-10" aria-labelledby={`${textareaId}-label`}>
      <label
        id={`${textareaId}-label`}
        htmlFor={textareaId}
        className="text-xl font-semibold text-[var(--j-ink)]"
      >
        Notes
      </label>
      <p className="mt-1 text-base text-[var(--j-muted)]">
        Private notes for {project.name} — {notesSyncHint(syncStatus, pendingNotesCount)}
      </p>
      <textarea
        id={textareaId}
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What stood out? Questions to follow up on later?"
        className="j-notes-input"
      />
    </section>
  );
}
