"use client";

import { Button } from "@/components/design-system";

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
      <p
        id="reset-title"
        className="font-[family-name:var(--hc-font-display)] text-sm font-semibold text-[var(--hc-ink)]"
      >
        Reset {streamName}?
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--hc-muted)]">
        Clears {judgedTotal} marked project{judgedTotal === 1 ? "" : "s"}. You will need to re-mark
        each one.
      </p>
      <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={onConfirm} className="w-full sm:w-auto">
          Reset stream
        </Button>
      </div>
    </div>
  );
}
