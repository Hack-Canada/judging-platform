"use client";

import { useState } from "react";
import { Clock, Minus, Plus, RotateCcw } from "lucide-react";
import { Card } from "@/components/design-system";
import { formatOffsetLabel } from "@/lib/judging/schedule-offset";
import { cn } from "@/lib/utils";

type DelayControlProps = {
  offsetMinutes: number;
  /** Called with the server-confirmed offset after a successful update. */
  onApplied: (minutes: number) => void;
  /** Compact, no Card wrapper - for the mobile schedule drawer. */
  embedded?: boolean;
  /**
   * Collapse behind a summary row. This control retimes every judge desk, so
   * it stays one click away rather than sitting open on the judging surface.
   */
  collapsible?: boolean;
};

type Patch = { addMinutes: number } | { scheduleOffsetMinutes: number };

async function patchOffset(body: Patch): Promise<number | null> {
  try {
    const res = await fetch("/api/judging-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { scheduleOffsetMinutes?: number };
    const minutes = Number(data.scheduleOffsetMinutes);
    return Number.isFinite(minutes) ? minutes : null;
  } catch {
    return null;
  }
}

/**
 * Lets any judge shift the shared schedule when pitches run behind.
 * Writes the global offset; every judge's portal picks it up within ~10s.
 */
export function DelayControl({
  offsetMinutes,
  onApplied,
  embedded = false,
  collapsible = false,
}: DelayControlProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [pulse, setPulse] = useState<"up" | "down" | "clear" | null>(null);

  async function apply(body: Patch, kind: "up" | "down" | "clear") {
    setBusy(true);
    setError(false);
    setPulse(kind);
    const next = await patchOffset(body);
    setBusy(false);
    window.setTimeout(() => setPulse(null), 320);
    if (next === null) {
      setError(true);
      return;
    }
    onApplied(next);
  }

  const statusLabel = formatOffsetLabel(offsetMinutes) ?? "On time";
  const behind = offsetMinutes > 0;

  const summaryRow = (
    <>
      <span className="j-delay-icon" aria-hidden>
        <Clock className="size-3.5" />
      </span>
      <span className="font-[family-name:var(--hc-font-display)] text-base font-semibold tracking-[-0.02em] text-[var(--hc-ink)]">
        Schedule pace
      </span>
      <span
        className={cn(
          "j-delay-status ml-auto",
          behind && "j-delay-status--behind",
          pulse === "up" && "j-delay-status--pulse-up",
          pulse === "down" && "j-delay-status--pulse-down",
          pulse === "clear" && "j-delay-status--pulse-clear",
        )}
      >
        {statusLabel}
      </span>
    </>
  );

  const inner = (
    <>
      {!collapsible && (
        <div className="flex items-center gap-2">{summaryRow}</div>
      )}

      {!embedded && !collapsible && (
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--hc-muted)]">
          Running late? Nudge every judge desk. Updates in about 10 seconds.
        </p>
      )}

      <div
        className={cn("j-delay-controls mt-3", embedded && "j-delay-controls--embedded")}
        role="group"
        aria-label="Adjust event delay"
      >
        <div className="j-delay-stepper">
          <button
            type="button"
            className="j-delay-step"
            title="Catch up 5 minutes"
            aria-label="Catch up 5 minutes"
            disabled={busy || offsetMinutes <= 0}
            onClick={() => apply({ addMinutes: -5 }, "down")}
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <div className="j-delay-stepper-value" aria-live="polite">
            <span className="j-delay-stepper-num tabular-nums">
              {offsetMinutes}
            </span>
            <span className="j-delay-stepper-unit">min</span>
          </div>
          <button
            type="button"
            className="j-delay-step"
            title="Add 5 minutes of delay"
            aria-label="Add 5 minutes of delay"
            disabled={busy}
            onClick={() => apply({ addMinutes: 5 }, "up")}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>

        <button
          type="button"
          className="j-delay-quick"
          title="Add 10 minutes of delay"
          disabled={busy}
          onClick={() => apply({ addMinutes: 10 }, "up")}
        >
          +10
        </button>

        <button
          type="button"
          className="j-delay-reset"
          title="Clear delay — back on time"
          aria-label="Clear delay"
          disabled={busy || offsetMinutes === 0}
          onClick={() => apply({ scheduleOffsetMinutes: 0 }, "clear")}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          <span className="j-delay-reset-text">On time</span>
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-[var(--hc-live)]" role="alert">
          Could not update the delay — check your connection and try again.
        </p>
      )}
    </>
  );

  if (collapsible) {
    return (
      <details className="j-delay-disclosure">
        <summary className="j-delay-summary">{summaryRow}</summary>
        <div className="j-delay-disclosure-body">{inner}</div>
      </details>
    );
  }

  if (embedded) {
    return <div className="j-delay-embedded">{inner}</div>;
  }

  return <Card className="j-delay-card p-5">{inner}</Card>;
}
