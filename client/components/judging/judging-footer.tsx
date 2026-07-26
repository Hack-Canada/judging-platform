"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/design-system";
import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/lib/judging/use-judging-sync";

export type JudgingFooterProps = {
  isJudged: boolean;
  isSkipped: boolean;
  isWinner: boolean;
  activeSlotLive: boolean;
  notScheduled: boolean;
  onSkip: () => void;
  onReviewed: () => void;
  onUnmark: () => void;
  onToggleWinner: () => void;
};

function WinnerToggle({
  isWinner,
  onToggleWinner,
  className,
}: {
  isWinner: boolean;
  onToggleWinner: () => void;
  className?: string;
}) {
  const [popping, setPopping] = useState(false);

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (!isWinner) setPopping(true);
        onToggleWinner();
      }}
      aria-pressed={isWinner}
      title={isWinner ? "Remove from your winner picks" : "Pick as a winner"}
      className={cn(
        isWinner && "j-winner-armed",
        popping && "j-winner-flash",
        className
      )}
    >
      <Trophy
        onAnimationEnd={() => setPopping(false)}
        className={cn(
          "size-4",
          isWinner ? "text-[var(--hc-muted)]" : "text-[var(--hc-faint)]",
          popping && "j-trophy-pop"
        )}
        aria-hidden
      />
      <span className="hidden sm:inline">{isWinner ? "Winner pick" : "Pick winner"}</span>
      <span className="sm:hidden">{isWinner ? "Picked" : "Winner"}</span>
    </Button>
  );
}

function KeyHints({ keys }: { keys: [string, string][] }) {
  return (
    <p className="j-kbd-hints" aria-hidden>
      {keys.map(([key, action]) => (
        <span key={key} className="j-kbd-hint">
          <kbd>{key}</kbd> {action}
        </span>
      ))}
    </p>
  );
}

export function JudgingFooter({
  isJudged,
  isSkipped,
  isWinner,
  activeSlotLive,
  notScheduled,
  onSkip,
  onReviewed,
  onUnmark,
  onToggleWinner,
}: JudgingFooterProps) {
  if (isJudged) {
    return (
      <>
        <div className="hidden sm:block">
          <p className="text-base text-[var(--hc-muted)]">
            {isSkipped
              ? "Marked skipped."
              : "Marked reviewed - tap Unmark if this was a mistake."}
          </p>
          <KeyHints
            keys={[
              ["U", "unmark"],
              ["W", "winner"],
              ["← →", "browse"],
            ]}
          />
        </div>
        <div className="flex w-full flex-row items-stretch gap-2 sm:w-auto sm:items-center sm:gap-3">
          <WinnerToggle
            isWinner={isWinner}
            onToggleWinner={onToggleWinner}
            className="min-w-0 flex-1 sm:flex-none"
          />
          <Button variant="outline" onClick={onUnmark} className="min-w-0 flex-1 sm:flex-none">
            Unmark
          </Button>
        </div>
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
      <div className="hidden sm:block">
        <p className="text-base text-[var(--hc-muted)]">{hint}</p>
        <KeyHints
          keys={[
            ["J", "reviewed"],
            ["S", "skip"],
            ["W", "winner"],
            ["← →", "browse"],
          ]}
        />
      </div>
      <div className="flex w-full flex-row items-stretch gap-2 sm:w-auto sm:items-center sm:gap-3">
        <WinnerToggle
          isWinner={isWinner}
          onToggleWinner={onToggleWinner}
          className="min-w-0 flex-1 px-2 sm:flex-none sm:px-6"
        />
        <Button variant="outline" onClick={onSkip} className="min-w-0 flex-1 sm:flex-none">
          Skip
        </Button>
        <Button
          variant="primary"
          onClick={onReviewed}
          className="j-desk-press min-w-0 flex-[1.35] px-2 sm:flex-none sm:px-6"
        >
          <span className="hidden sm:inline">Mark reviewed</span>
          <span className="sm:hidden">Reviewed</span>
        </Button>
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
