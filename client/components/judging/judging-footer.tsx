"use client";

import type { SyncStatus } from "@/lib/judging/use-judging-sync";

export type JudgingFooterProps = {
  isJudged: boolean;
  isSkipped: boolean;
  activeSlotLive: boolean;
  notScheduled: boolean;
  showGoToLive: boolean;
  onSkip: () => void;
  onReviewed: () => void;
  onUnmark: () => void;
  onGoToLive: () => void;
};

export function JudgingFooter({
  isJudged,
  isSkipped,
  activeSlotLive,
  notScheduled,
  showGoToLive,
  onSkip,
  onReviewed,
  onUnmark,
  onGoToLive,
}: JudgingFooterProps) {
  if (isJudged) {
    return (
      <>
        <p className="hidden text-base text-[var(--j-muted)] sm:block">
          {isSkipped
            ? "Marked skipped."
            : "Marked reviewed - tap Unmark if this was a mistake."}
        </p>
        <button type="button" onClick={onUnmark} className="j-cta j-cta--outline w-full sm:w-auto">
          Unmark
        </button>
      </>
    );
  }

  const hint = activeSlotLive
    ? "Visit the table, then mark reviewed."
    : notScheduled
      ? "No slot assigned - review details or skip."
      : "Review details before your slot.";

  return (
    <>
      <p className="hidden text-base text-[var(--j-muted)] sm:block">{hint}</p>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        {showGoToLive && (
          <button
            type="button"
            onClick={onGoToLive}
            className="j-cta j-cta--outline w-full sm:hidden"
          >
            Go to live slot
          </button>
        )}
        <button type="button" onClick={onSkip} className="j-cta j-cta--secondary w-full sm:w-auto">
          Skip
        </button>
        <button
          type="button"
          onClick={onReviewed}
          className="j-cta j-cta--primary w-full sm:w-auto"
        >
          Mark reviewed
        </button>
      </div>
    </>
  );
}

export function notesSyncHint(status: SyncStatus | undefined, pendingNotes: number): string {
  if (status === "offline") return "Offline - notes save on this device until you reconnect.";
  if (status === "pending" && pendingNotes > 0) {
    return "Waiting to sync - will upload when connection is stable.";
  }
  if (status === "syncing") return "Syncing notes...";
  return "Synced to the server when online.";
}
