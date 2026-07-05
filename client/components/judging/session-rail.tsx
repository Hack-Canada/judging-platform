"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { formatSlotTime, resolveSlotRoom } from "@/lib/judging/format";
import type {
  JudgingProject,
  JudgingSlotWithStatus,
  ScheduleFilter,
} from "@/lib/judging/types";
import { cn } from "@/lib/utils";

type SessionRailProps = {
  slots: JudgingSlotWithStatus[];
  projects: JudgingProject[];
  activeProjectId: string;
  judgedIds: Set<string>;
  skippedIds: Set<string>;
  onSelect: (projectId: string) => void;
  embedded?: boolean;
};

const FILTERS: { id: ScheduleFilter; label: string }[] = [
  { id: "remaining", label: "Remaining" },
  { id: "all", label: "All" },
  { id: "judged", label: "Judged" },
  { id: "skipped", label: "Skipped" },
];

export function SessionRail({
  slots,
  projects,
  activeProjectId,
  judgedIds,
  skippedIds,
  onSelect,
  embedded = false,
}: SessionRailProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ScheduleFilter>("remaining");

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  const filteredSlots = useMemo(() => {
    const q = query.trim().toLowerCase();

    return slots.filter((slot) => {
      const project = projectMap.get(slot.projectId);
      if (!project) return false;

      const isJudged = judgedIds.has(slot.projectId);
      const isSkipped = skippedIds.has(slot.projectId);

      if (filter === "remaining" && isJudged) return false;
      if (filter === "judged" && !isJudged) return false;
      if (filter === "skipped" && !isSkipped) return false;

      if (!q) return true;
      const haystack = [project.name, project.team, ...(project.tracks ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [slots, projectMap, judgedIds, skippedIds, filter, query]);

  const remainingCount = slots.filter((s) => !judgedIds.has(s.projectId)).length;

  const inner = (
    <>
      {!embedded && (
        <>
          <h2 className="j-schedule-title">Your schedule</h2>
          <p className="mt-1 text-sm text-[var(--j-muted)]">
            {remainingCount} remaining · {slots.length} total in this stream
          </p>
        </>
      )}

      <div className={embedded ? "mt-0" : "relative mt-4"}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--j-faint)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects…"
          className="j-schedule-search"
          aria-label="Search schedule"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter schedule">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn("j-schedule-filter", filter === id && "j-schedule-filter--active")}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredSlots.length === 0 ? (
        <p className="mt-5 text-sm text-[var(--j-muted)]">
          {query.trim()
            ? "No projects match your search."
            : filter === "remaining"
              ? "All projects in this stream are marked judged."
              : "Nothing to show for this filter."}
        </p>
      ) : (
        <ol className="j-schedule-list mt-4">
          {filteredSlots.map((slot) => {
            const project = projectMap.get(slot.projectId);
            if (!project) return null;

            const isActive = slot.projectId === activeProjectId;
            const isJudged = judgedIds.has(slot.projectId);
            const isSkipped = skippedIds.has(slot.projectId);
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
                      <Check className="size-5 text-[var(--j-faint)]" aria-label="Judged" />
                    ) : isLive ? (
                      <span className="text-sm font-bold uppercase tracking-wide text-[var(--j-live)]">
                        Now
                      </span>
                    ) : isSkipped ? (
                      <span className="text-xs font-medium text-[var(--j-muted)]">Skipped</span>
                    ) : slot.status === "upcoming" ? (
                      <span className="text-sm font-medium text-[var(--j-faint)]">Next</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {filteredSlots.length > 0 && filteredSlots.length < slots.length && (
        <p className="mt-3 text-xs text-[var(--j-faint)]">
          Showing {filteredSlots.length} of {slots.length}
        </p>
      )}
    </>
  );

  if (embedded) {
    return <div className="min-w-0">{inner}</div>;
  }

  return <section className="j-schedule-panel">{inner}</section>;
}
