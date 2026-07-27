"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/design-system";
import {
  formatSlotTime,
  getTimeRemaining,
  resolveSlotRoom,
} from "@/lib/judging/format";
import type { JudgingProject, JudgingSlotWithStatus } from "@/lib/judging/types";

type LiveRibbonProps = {
  liveSlot: JudgingSlotWithStatus;
  liveProject: JudgingProject;
  onGoToLive: () => void;
};

export function LiveRibbon({ liveSlot, liveProject, onGoToLive }: LiveRibbonProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = getTimeRemaining(liveSlot.endTime, now);
  const room = resolveSlotRoom(liveSlot.room, liveProject.room);

  return (
    <div className="j-live-ribbon" role="status">
      <span className="j-live-ribbon-beacon" aria-hidden>
        <span className="j-live-ribbon-beacon-dot" />
        Now
      </span>
      <p className="min-w-0 flex-1 text-sm text-[var(--hc-on-ink)]">
        <span className="font-semibold">{liveProject.name}</span>
        {remaining.overtime ? (
          <span className="j-timer-overtime"> · overtime {remaining.label}</span>
        ) : (
          <span className="j-hero-muted"> · {remaining.label} left</span>
        )}
        {room && <span className="j-hero-muted hidden sm:inline"> · {room}</span>}
        <span className="sr-only"> Started {formatSlotTime(liveSlot.startTime)}</span>
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onGoToLive}
        className="j-live-ribbon-go min-h-9 shrink-0 border-[rgb(255_255_255/0.35)] bg-transparent px-3 text-sm text-[var(--hc-on-ink)] hover:border-[rgb(255_255_255/0.5)] hover:bg-[rgb(255_255_255/0.1)]"
      >
        Go there
      </Button>
    </div>
  );
}
