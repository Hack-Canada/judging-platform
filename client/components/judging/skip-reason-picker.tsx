"use client";

import { Button } from "@/components/design-system";
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
      <p className="font-[family-name:var(--hc-font-body)] text-sm font-medium text-[var(--hc-ink)]">
        Skip <span className="font-semibold">{projectName}</span>?
      </p>
      <p className="mt-1 text-xs text-[var(--hc-muted)]">Optional reason:</p>
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
      <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={onConfirm} className="w-full sm:w-auto">
          Confirm skip
        </Button>
      </div>
    </div>
  );
}
