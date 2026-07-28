"use client";

import { Button } from "@/components/design-system";
import { formatSlotTime } from "@/lib/judging/format";
import type { BreakState } from "@/lib/judging/slots";
import type { JudgingProject } from "@/lib/judging/types";

type BreakBannerProps = {
  breakState: BreakState;
  nextProject: JudgingProject;
  onGoToNext: () => void;
};

export function BreakBanner({ breakState, nextProject, onGoToNext }: BreakBannerProps) {
  return (
    <div className="j-break-banner" role="status">
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold text-[var(--hc-ink)]">Break</span>
        <span className="text-[var(--hc-muted)]">
          {" "}
          until {formatSlotTime(breakState.nextSlot.startTime)}
        </span>
        <span className="hidden text-[var(--hc-muted)] sm:inline">
          {" "}
          · {breakState.minutesUntil} min
        </span>
        <span className="block text-[var(--hc-muted)] sm:inline">
          {" "}
          · Next: {nextProject.name}
        </span>
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={onGoToNext}
        className="min-h-10 shrink-0 px-3 text-sm"
      >
        Preview
      </Button>
    </div>
  );
}
