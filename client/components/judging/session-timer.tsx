"use client";

import { useEffect, useState } from "react";
import {
  formatRelativeUntil,
  formatSlotTime,
  getSlotProgress,
  getTimeRemaining,
} from "@/lib/judging/format";
import type { SlotStatus } from "@/lib/judging/types";

type SessionTimerProps = {
  startTime: string;
  endTime: string;
  status: SlotStatus;
  isJudged: boolean;
  variant?: "hero" | "inline";
};

export function SessionTimer({
  startTime,
  endTime,
  status,
  isJudged,
  variant = "inline",
}: SessionTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const needsTick = status === "live" || status === "upcoming";

  useEffect(() => {
    if (!needsTick) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [needsTick]);

  const remaining = getTimeRemaining(endTime, now);
  const heroClass = variant === "hero" ? "j-hero-timer" : "text-sm";

  if (isJudged) {
    return (
      <p className={`${heroClass} j-hero-muted`}>You marked this project as judged</p>
    );
  }

  if (status === "done") {
    return (
      <p className={`${heroClass} j-hero-subtle`}>Ended {formatSlotTime(endTime)}</p>
    );
  }

  if (status === "upcoming") {
    const relative = formatRelativeUntil(startTime, now);
    return (
      <p className={`${heroClass} j-hero-muted`}>
        Starts {formatSlotTime(startTime)}
        <span className="j-hero-faint"> · {relative}</span>
      </p>
    );
  }

  if (remaining.overtime) {
    return (
      <div>
        <p className={heroClass}>
          <span className="text-[var(--j-overtime)]">Overtime {remaining.label}</span>
        </p>
      </div>
    );
  }

  const progress = getSlotProgress(startTime, endTime, now);

  return (
    <div>
      <p className={heroClass}>
        <span className="text-[var(--j-live)]">{remaining.label}</span>
        <span className="j-hero-faint"> left</span>
      </p>
      {variant === "hero" && (
        <div
          className="j-slot-progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Time remaining in slot"
        >
          <div className="j-slot-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
