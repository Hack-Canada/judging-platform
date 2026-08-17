"use client";

import { useEffect, useId, useRef } from "react";
import { Star } from "lucide-react";
import { Card } from "@/components/design-system";
import { notesSyncHint } from "@/components/judging/judging-footer";
import type { SyncStatus } from "@/lib/judging/use-judging-sync";
import type { JudgingProject } from "@/lib/judging/types";
import { cn } from "@/lib/utils";

const NOTE_PROMPTS = [
  "Strong demo",
  "Clear problem",
  "Tech depth",
  "Needs polish",
  "Follow up",
];

const NOTES_MIN_PX = 160;

type JudgeNotesPanelProps = {
  project: JudgingProject;
  notes: string;
  onChange: (notes: string) => void;
  syncStatus?: SyncStatus;
  pendingNotesCount?: number;
  rating?: number | null;
  onRate?: (rating: number | null) => void;
};

function RatingRow({
  rating,
  onRate,
}: {
  rating: number | null;
  onRate: (rating: number | null) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-[var(--hc-ink)]">
        Rating <span className="font-normal text-[var(--hc-faint)]">(optional)</span>
      </span>
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Optional rating out of 5"
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = rating !== null && value <= rating;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              onClick={() => onRate(rating === value ? null : value)}
              className="flex size-9 items-center justify-center rounded-[var(--hc-radius)] transition-colors hover:bg-[var(--hc-paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hc-action)]"
            >
              <Star
                className={cn(
                  "size-5",
                  filled
                    ? "fill-[var(--hc-muted)] text-[var(--hc-muted)]"
                    : "text-[var(--hc-border)]"
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
      {rating !== null ? (
        <button
          type="button"
          onClick={() => onRate(null)}
          className="text-sm text-[var(--hc-muted)] underline underline-offset-2 hover:text-[var(--hc-ink)]"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

function appendPrompt(notes: string, prompt: string) {
  const trimmed = notes.trimEnd();
  if (!trimmed) return `• ${prompt}`;
  if (trimmed.toLowerCase().includes(prompt.toLowerCase())) return notes;
  const sep = trimmed.endsWith("\n") ? "" : "\n";
  return `${trimmed}${sep}• ${prompt}`;
}

export function JudgeNotesPanel({
  project,
  notes,
  onChange,
  syncStatus,
  pendingNotesCount = 0,
  rating = null,
  onRate,
}: JudgeNotesPanelProps) {
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Extra line so the last typed line isn't clipped under padding / chrome
    el.style.height = `${Math.max(el.scrollHeight + 8, NOTES_MIN_PX)}px`;
  }, [notes, project.id]);

  return (
    <Card
      id="j-scorecard"
      className="j-notes-panel j-scorecard flex flex-1 flex-col p-4 sm:p-6"
      aria-labelledby={`${textareaId}-label`}
    >
      <div className="j-scorecard-head">
        <label
          id={`${textareaId}-label`}
          htmlFor={textareaId}
          className="font-[family-name:var(--hc-font-display)] text-2xl font-semibold tracking-[-0.02em] text-[var(--hc-ink)]"
        >
          Scorecard
        </label>
        <span className="j-scorecard-tag" aria-hidden>
          Private
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--hc-muted)] sm:text-base">
        Notes for {project.name}. {notesSyncHint(syncStatus, pendingNotesCount)}
      </p>
      {onRate ? <RatingRow rating={rating} onRate={onRate} /> : null}
      <div
        className="j-note-prompts"
        role="group"
        aria-label="Quick note prompts"
      >
        {NOTE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="j-note-prompt"
            onClick={() => onChange(appendPrompt(notes, prompt))}
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="j-scorecard-body">
        <textarea
          ref={textareaRef}
          id={textareaId}
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What stood out? Questions to follow up on later?"
          className="j-notes-input j-scorecard-input"
          rows={5}
        />
      </div>
    </Card>
  );
}
