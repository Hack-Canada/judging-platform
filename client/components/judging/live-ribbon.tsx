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
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold text-[var(--j-live)]">Live now:</span>{" "}
        <span className="font-medium text-[var(--j-ink)]">{liveProject.name}</span>
        {remaining.overtime ? (
          <span className="text-[var(--j-overtime)]"> · overtime {remaining.label}</span>
        ) : (
          <span className="text-[var(--j-muted)]"> · {remaining.label} left</span>
        )}
        {room && (
          <span className="hidden text-[var(--j-muted)] sm:inline"> · {room}</span>
        )}
      </p>
      <button type="button" onClick={onGoToLive} className="j-live-ribbon-btn shrink-0">
        Go there
      </button>
    </div>
  );
}
