"use client";

import { Button } from "@/components/ui/button";
import type { SkipReason } from "@/lib/judging/types";
import { cn } from "@/lib/utils";

const REASONS: { id: SkipReason; label: string }[] = [
  { id: "absent", label: "Absent" },
  { id: "not_ready", label: "Not ready" },
  { id: "wrong_track", label: "Wrong track" },
];

type SkipReasonPickerProps = {
  projectName: string;
  selected?: SkipReason | null;
  onSelect: (reason: SkipReason | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SkipReasonPicker({
  projectName,
  selected,
  onSelect,
  onConfirm,
  onCancel,
}: SkipReasonPickerProps) {
  return (
    <div className="j-skip-picker" role="group" aria-label="Skip reason">
      <p className="text-sm font-medium text-[var(--j-ink)]">
        Skip <span className="font-semibold">{projectName}</span>?
      </p>
      <p className="mt-1 text-xs text-[var(--j-muted)]">Optional reason:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {REASONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(selected === id ? null : id)}
            className={cn("j-skip-chip", selected === id && "j-skip-chip--active")}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onConfirm}
          className="flex-1 text-[var(--j-action)] sm:flex-none"
        >
          Confirm skip
        </Button>
      </div>
    </div>
  );
}
