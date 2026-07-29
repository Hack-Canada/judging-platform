"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  deriveSlotStatus,
  formatRelativeUntil,
  formatSlotTime,
  getSlotProgress,
  getTimeRemaining,
} from "@/lib/judging/format";
import { LedDigits } from "./led-digits";

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type TimerRingProps = {
  /** 0-100, how much of the slot has elapsed (ignored when waiting) */
  progress: number;
  overtime: boolean;
  /** Pre-start countdown: empty ring, waiting for the slot */
  waiting?: boolean;
  label: string;
  caption: string;
};

/**
 * Signature session clock: the remaining arc drains clockwise as the slot
 * runs. Turns amber in the final fifth, pulses solid amber in overtime.
 * LED digits sit in the center like a desk instrument.
 */
function TimerRing({ progress, overtime, waiting, label, caption }: TimerRingProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const dashOffset = waiting || overtime ? 0 : (RING_CIRCUMFERENCE * clamped) / 100;
  const low = !overtime && !waiting && clamped >= 80;
  const tone = waiting ? "waiting" : overtime ? "overtime" : low ? "low" : "default";

  return (
    <div
      className={cn(
        "j-timer-ring",
        waiting && "j-timer-ring--waiting",
        low && "j-timer-ring--low",
        overtime && "j-timer-ring--overtime"
      )}
      role="progressbar"
      aria-valuenow={waiting ? 0 : overtime ? 100 : Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={
        waiting ? "Time until slot starts" : overtime ? "Session overtime" : "Time used in slot"
      }
    >
      <svg viewBox="0 0 80 80" aria-hidden>
        <circle className="j-timer-ring-track" cx="40" cy="40" r={RING_RADIUS} />
        {!waiting && (
          <circle
            className="j-timer-ring-fill"
            cx="40"
            cy="40"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        )}
      </svg>
      <span className="j-timer-ring-text">
        <LedDigits label={label} tone={tone} className="j-timer-ring-led" />
        <span className="j-timer-ring-caption">{caption}</span>
      </span>
    </div>
  );
}

type SessionTimerProps = {
  startTime: string;
  endTime: string;
  isJudged: boolean;
  variant?: "hero" | "inline";
  /**
   * Optional wall clock (e.g. portal adjustedNow). When omitted, ticks locally.
   * Phase is always derived from this clock vs start/end - never from a printed status.
   */
  nowMs?: number;
};

/**
 * Per-session countdown for the project the judge is viewing.
 * Uses wall clock against this slot's start/end (offset already applied upstream).
 * Past end → overtime/elapsed, never a stale "starts in N min."
 */
export function SessionTimer({
  startTime,
  endTime,
  isJudged,
  variant = "inline",
  nowMs,
}: SessionTimerProps) {
  const [localNow, setLocalNow] = useState(() => Date.now());

  useEffect(() => {
    if (isJudged || nowMs != null) return;
    const id = window.setInterval(() => setLocalNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isJudged, nowMs]);

  const now = nowMs ?? localNow;
  const phase = deriveSlotStatus(startTime, endTime, now);
  const remaining = getTimeRemaining(endTime, now);
  const heroClass = variant === "hero" ? "j-hero-timer" : "text-sm";

  if (isJudged) {
    return (
      <p className="j-hero-muted text-base font-medium sm:text-lg">
        You marked this project as judged
      </p>
    );
  }

  if (phase === "done" || remaining.overtime) {
    if (variant === "hero") {
      return (
        <div className="j-timer-hero">
          <TimerRing progress={100} overtime label={remaining.label} caption="over" />
          <p className="j-hero-faint text-xs">
            Slot ended {formatSlotTime(endTime)} · keep timing this visit
          </p>
        </div>
      );
    }
    return (
      <div>
        <p className={heroClass}>
          <span className="j-timer-overtime">Overtime {remaining.label}</span>
        </p>
        <p className="j-hero-faint mt-1 text-xs">
          Slot ended {formatSlotTime(endTime)} · keep timing this visit
        </p>
      </div>
    );
  }

  if (phase === "upcoming") {
    const untilStart = getTimeRemaining(startTime, now);
    if (variant === "hero") {
      return (
        <div className="j-timer-hero">
          <TimerRing
            progress={0}
            overtime={false}
            waiting
            label={untilStart.label}
            caption="until"
          />
          <p className="j-hero-faint text-xs">Starts {formatSlotTime(startTime)}</p>
        </div>
      );
    }
    return (
      <p className={`${heroClass} j-hero-muted`}>
        Starts {formatSlotTime(startTime)}
        <span className="j-hero-faint"> · {formatRelativeUntil(startTime, now)}</span>
      </p>
    );
  }

  const progress = getSlotProgress(startTime, endTime, now);

  if (variant === "hero") {
    return (
      <div className="j-timer-hero">
        <TimerRing progress={progress} overtime={false} label={remaining.label} caption="left" />
        <p className="j-hero-faint text-xs">Until {formatSlotTime(endTime)}</p>
      </div>
    );
  }

  return (
    <div>
      <p className={heroClass}>
        <span className="j-timer-live">{remaining.label}</span>
        <span className="j-hero-faint"> left</span>
      </p>
      <p className="j-hero-faint mt-1 text-xs">Until {formatSlotTime(endTime)}</p>
    </div>
  );
}
