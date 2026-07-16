"use client";

import { Button } from "@/components/ui/button";
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
        <span className="font-semibold text-[var(--j-ink)]">Break</span>
        <span className="text-[var(--j-muted)]">
          {" "}
          until {formatSlotTime(breakState.nextSlot.startTime)}
        </span>
        <span className="hidden text-[var(--j-muted)] sm:inline">
          {" "}
          · {breakState.minutesUntil} min
        </span>
        <span className="block text-[var(--j-muted)] sm:inline">
          {" "}
          · Next: {nextProject.name}
        </span>
      </p>
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={onGoToNext}
        className="shrink-0 text-[var(--j-action)]"
      >
        Preview
      </Button>
    </div>
  );
}
