"use client";

import { Check } from "lucide-react";
import { formatSlotTime, resolveSlotRoom } from "@/lib/judging/format";
import type { JudgingProject, JudgingSlotWithStatus } from "@/lib/judging/types";
import { cn } from "@/lib/utils";

type SessionRailProps = {
  slots: JudgingSlotWithStatus[];
  projects: JudgingProject[];
  activeProjectId: string;
  judgedIds: Set<string>;
  onSelect: (projectId: string) => void;
};

export function SessionRail({
  slots,
  projects,
  activeProjectId,
  judgedIds,
  onSelect,
}: SessionRailProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <section className="j-schedule-panel">
      <h2 className="j-schedule-title">Your schedule</h2>
      <p className="mt-1 text-sm text-[var(--j-muted)]">
        {slots.length} slot{slots.length === 1 ? "" : "s"} this round
      </p>

      <ol className="mt-5">
        {slots.map((slot) => {
          const project = projectMap.get(slot.projectId);
          if (!project) return null;

          const isActive = slot.projectId === activeProjectId;
          const isJudged = judgedIds.has(slot.projectId);
          const isLive = slot.status === "live" && !isJudged;
          const room = resolveSlotRoom(slot.room, project.room);

          return (
            <li key={slot.id}>
              <button
                type="button"
                onClick={() => onSelect(slot.projectId)}
                aria-current={isActive ? "true" : undefined}
                className={cn("j-schedule-row", isLive && "j-schedule-row--live")}
              >
                <span className="j-schedule-time">{formatSlotTime(slot.startTime)}</span>
                <span className="min-w-0 text-left">
                  <span
                    className={cn(
                      "j-schedule-name block truncate",
                      isJudged && "text-[var(--j-faint)] line-through"
                    )}
                  >
                    {project.name}
                  </span>
                  {room ? (
                    <span className="j-schedule-room block truncate">{room}</span>
                  ) : (
                    <span className="j-schedule-room block text-[var(--j-faint)]">
                      Table pending
                    </span>
                  )}
                </span>
                <span className="shrink-0">
                  {isJudged ? (
                    <Check className="size-5 text-[var(--j-done)]" aria-label="Judged" />
                  ) : isLive ? (
                    <span className="text-sm font-bold uppercase tracking-wide text-[var(--j-live)]">
                      Now
                    </span>
                  ) : slot.status === "upcoming" ? (
                    <span className="text-sm font-medium text-[var(--j-faint)]">Next</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
