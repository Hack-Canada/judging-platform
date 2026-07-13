"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { formatSlotTime, resolveSlotRoom } from "@/lib/judging/format";
import { streamProgress } from "@/lib/judging/slots";
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
  scheduleApproximate?: boolean;
};

const FILTERS: { id: ScheduleFilter; label: string }[] = [
  { id: "remaining", label: "Remaining" },
  { id: "all", label: "All" },
  { id: "judged", label: "Judged" },
  { id: "skipped", label: "Skipped" },
];

const ROW_HEIGHT = 72;
const VIRTUALIZE_THRESHOLD = 40;

type RowProps = {
  slot: JudgingSlotWithStatus;
  project: JudgingProject;
  activeProjectId: string;
  judgedIds: Set<string>;
  skippedIds: Set<string>;
  onSelect: (projectId: string) => void;
};

function SessionRailRow({
  slot,
  project,
  activeProjectId,
  judgedIds,
  skippedIds,
  onSelect,
}: RowProps) {
  const isActive = slot.projectId === activeProjectId;
  const isJudged = judgedIds.has(slot.projectId);
  const isSkipped = skippedIds.has(slot.projectId);
  const isLive = slot.status === "live" && !isJudged;
  const room = resolveSlotRoom(slot.room, project.room);

  return (
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
            isJudged && "text-muted-foreground/70 line-through"
          )}
        >
          {project.name}
        </span>
        {room ? (
          <span className="j-schedule-room block truncate">{room}</span>
        ) : (
          <span className="j-schedule-room block text-muted-foreground/70">Table pending</span>
        )}
      </span>
      <span className="shrink-0">
        {isJudged ? (
          <Check className="size-5 text-muted-foreground/70" aria-label="Judged" />
        ) : isLive ? (
          <span className="text-sm font-bold uppercase tracking-wide text-destructive">
            Now
          </span>
        ) : isSkipped ? (
          <span className="text-xs font-medium text-muted-foreground">Skipped</span>
        ) : slot.status === "upcoming" ? (
          <span className="text-sm font-medium text-muted-foreground/70">Next</span>
        ) : null}
      </span>
    </button>
  );
}

export function SessionRail({
  slots,
  projects,
  activeProjectId,
  judgedIds,
  skippedIds,
  onSelect,
  embedded = false,
  scheduleApproximate = false,
}: SessionRailProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ScheduleFilter>("remaining");
  const listRef = useRef<HTMLDivElement>(null);

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

  const useVirtual = filteredSlots.length >= VIRTUALIZE_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: filteredSlots.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  useEffect(() => {
    if (!useVirtual || !activeProjectId) return;
    const index = filteredSlots.findIndex((s) => s.projectId === activeProjectId);
    if (index >= 0) {
      virtualizer.scrollToIndex(index, { align: "auto" });
    }
  }, [activeProjectId, filteredSlots, useVirtual, virtualizer]);

  const { remaining: remainingCount, total } = streamProgress(
    slots,
    judgedIds,
    skippedIds
  );

  const listContent =
    filteredSlots.length === 0 ? (
      <p className="mt-5 text-sm text-muted-foreground">
        {query.trim()
          ? "No projects match your search."
          : filter === "remaining"
            ? "All projects in this stream are marked judged."
            : "Nothing to show for this filter."}
      </p>
    ) : useVirtual ? (
      <div
        ref={listRef}
        className="j-schedule-list mt-4"
        role="list"
        aria-label="Schedule projects"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const slot = filteredSlots[virtualRow.index];
            const project = projectMap.get(slot.projectId);
            if (!project) return null;

            return (
              <div
                key={slot.id}
                role="listitem"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <SessionRailRow
                  slot={slot}
                  project={project}
                  activeProjectId={activeProjectId}
                  judgedIds={judgedIds}
                  skippedIds={skippedIds}
                  onSelect={onSelect}
                />
              </div>
            );
          })}
        </div>
      </div>
    ) : (
      <ol className="j-schedule-list mt-4">
        {filteredSlots.map((slot) => {
          const project = projectMap.get(slot.projectId);
          if (!project) return null;

          return (
            <li key={slot.id}>
              <SessionRailRow
                slot={slot}
                project={project}
                activeProjectId={activeProjectId}
                judgedIds={judgedIds}
                skippedIds={skippedIds}
                onSelect={onSelect}
              />
            </li>
          );
        })}
      </ol>
    );

  const inner = (
    <>
      {!embedded && (
        <>
          <h2 className="j-schedule-title">Your schedule</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {remainingCount} remaining · {total} total in this stream
          </p>
        </>
      )}

      {scheduleApproximate && (
        <p className="j-schedule-approx mt-3 text-xs leading-relaxed text-muted-foreground">
          Times are approximate for ordering - use project order and search, not the clock.
        </p>
      )}

      <div className={embedded ? "mt-0" : "relative mt-4"}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects..."
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

      {listContent}

      {filteredSlots.length > 0 && filteredSlots.length < slots.length && (
        <p className="mt-3 text-xs text-muted-foreground/70">
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
