"use client";

import { useEffect, useState } from "react";
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
      <p className="min-w-0 flex-1 text-sm text-[var(--j-on-ink)]">
        <span className="font-semibold">Live now:</span>{" "}
        <span className="font-medium">{liveProject.name}</span>
        {remaining.overtime ? (
          <span style={{ color: "var(--j-overtime)" }}> · overtime {remaining.label}</span>
        ) : (
          <span className="j-hero-muted"> · {remaining.label} left</span>
        )}
        {room && <span className="j-hero-muted hidden sm:inline"> · {room}</span>}
        <span className="sr-only"> Started {formatSlotTime(liveSlot.startTime)}</span>
      </p>
      <button type="button" onClick={onGoToLive} className="j-cta j-cta--outline shrink-0 !min-h-0 !border-[rgb(245_243_239/0.35)] !px-3 !py-1.5 !text-sm !text-[var(--j-on-ink)]">
        Go there
      </button>
    </div>
  );
}
