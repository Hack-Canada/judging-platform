"use client";

import { Trophy } from "lucide-react";
import { formatSlotTime, resolveSlotRoom } from "@/lib/judging/format";
import type { JudgingProject, JudgingSlotWithStatus } from "@/lib/judging/types";
import { cn } from "@/lib/utils";

const UP_NEXT_COUNT = 3;
/** Keep the desk strip short — full list lives in schedule → Picks. */
const VISIBLE_PICKS = 4;

type DeskQueueProps = {
  slots: JudgingSlotWithStatus[];
  projects: JudgingProject[];
  activeProjectId: string;
  judgedIds: Set<string>;
  winnerIds: Set<string>;
  onSelect: (projectId: string) => void;
};

/**
 * Desk-facing queue: keep Up next + picks on the main surface so judges
 * don't hunt the rail mid-pitch.
 */
export function DeskQueue({
  slots,
  projects,
  activeProjectId,
  judgedIds,
  winnerIds,
  onSelect,
}: DeskQueueProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const upNext = slots
    .filter(
      (slot) =>
        !judgedIds.has(slot.projectId) &&
        !winnerIds.has(slot.projectId) &&
        slot.projectId !== activeProjectId &&
        slot.status !== "done",
    )
    .slice(0, UP_NEXT_COUNT)
    .map((slot) => {
      const project = projectMap.get(slot.projectId);
      if (!project) return null;
      return { slot, project };
    })
    .filter(Boolean) as { slot: JudgingSlotWithStatus; project: JudgingProject }[];

  const picks = [...winnerIds]
    .map((id) => projectMap.get(id))
    .filter(Boolean) as JudgingProject[];

  // Newest picks first in the strip
  const visiblePicks = picks.slice(-VISIBLE_PICKS).reverse();
  const hiddenPickCount = Math.max(0, picks.length - visiblePicks.length);

  if (upNext.length === 0 && picks.length === 0) return null;

  return (
    <div className="j-desk-queue" aria-label="Queue at a glance">
      {upNext.length > 0 ? (
        <section className="j-desk-queue-block" aria-label="Up next">
          <h2 className="j-desk-queue-label">Up next</h2>
          <ul className="j-desk-queue-list">
            {upNext.map(({ slot, project }, index) => {
              const room = resolveSlotRoom(slot.room, project.room);
              return (
                <li key={slot.id}>
                  <button
                    type="button"
                    className="j-desk-queue-card"
                    onClick={() => onSelect(project.id)}
                  >
                    <span className="j-desk-queue-ord" aria-hidden>
                      {index + 1}
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="j-desk-queue-name block truncate">
                        {project.name}
                      </span>
                      <span className="j-desk-queue-meta block truncate">
                        {formatSlotTime(slot.startTime)}
                        {room ? ` · ${room}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {picks.length > 0 ? (
        <section className="j-desk-queue-block j-desk-queue-block--picks" aria-label="Your picks">
          <h2 className="j-desk-queue-label">
            <Trophy className="size-3.5" aria-hidden />
            Your picks
            <span className="j-desk-queue-count">{picks.length}</span>
          </h2>
          <ul className="j-desk-queue-picks">
            {visiblePicks.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  className={cn(
                    "j-desk-queue-pick",
                    project.id === activeProjectId && "j-desk-queue-pick--active",
                  )}
                  onClick={() => onSelect(project.id)}
                  aria-current={project.id === activeProjectId ? "true" : undefined}
                >
                  {project.name}
                </button>
              </li>
            ))}
            {hiddenPickCount > 0 ? (
              <li>
                <span
                  className="j-desk-queue-pick j-desk-queue-pick--more"
                  title="Open Schedule → Picks for the full list"
                >
                  +{hiddenPickCount} more
                </span>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
