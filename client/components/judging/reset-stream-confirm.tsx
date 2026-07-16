"use client";

import { Button } from "@/components/ui/button";

type ResetStreamConfirmProps = {
  streamName: string;
  judgedTotal: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ResetStreamConfirm({
  streamName,
  judgedTotal,
  onConfirm,
  onCancel,
}: ResetStreamConfirmProps) {
  return (
    <div className="j-reset-confirm" role="alertdialog" aria-labelledby="reset-title">
      <p id="reset-title" className="text-sm font-semibold text-[var(--j-ink)]">
        Reset {streamName}?
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--j-muted)]">
        Clears {judgedTotal} marked project{judgedTotal === 1 ? "" : "s"}. You will need to re-mark
        each one.
      </p>
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
          Reset stream
        </Button>
      </div>
    </div>
  );
}
