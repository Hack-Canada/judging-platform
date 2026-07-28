"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, Trophy } from "lucide-react";
import { Card } from "@/components/design-system";
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
  winnerIds?: Set<string>;
  onSelect: (projectId: string) => void;
  embedded?: boolean;
  scheduleApproximate?: boolean;
};

const FILTERS: { id: ScheduleFilter; label: string }[] = [
  { id: "remaining", label: "Remaining" },
  { id: "all", label: "All" },
  { id: "judged", label: "Judged" },
  { id: "skipped", label: "Skipped" },
  { id: "picks", label: "Picks" },
];

const ROW_HEIGHT = 72;
const VIRTUALIZE_THRESHOLD = 40;
const UP_NEXT_COUNT = 3;

type RowProps = {
  slot: JudgingSlotWithStatus;
  project: JudgingProject;
  activeProjectId: string;
  judgedIds: Set<string>;
  skippedIds: Set<string>;
  winnerIds?: Set<string>;
  onSelect: (projectId: string) => void;
  dimmed?: boolean;
  matched?: boolean;
};

function projectMatchesQuery(project: JudgingProject, query: string) {
  if (!query) return true;
  const haystack = [
    project.name,
    project.team,
    ...(project.members ?? []),
    ...(project.tracks ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function SessionRailRow({
  slot,
  project,
  activeProjectId,
  judgedIds,
  skippedIds,
  winnerIds,
  onSelect,
  dimmed = false,
  matched = false,
}: RowProps) {
  const isActive = slot.projectId === activeProjectId;
  const isJudged = judgedIds.has(slot.projectId);
  const isSkipped = skippedIds.has(slot.projectId);
  const isWinner = winnerIds?.has(slot.projectId) ?? false;
  const isLive = slot.status === "live" && !isJudged;
  const room = resolveSlotRoom(slot.room, project.room);

  return (
    <button
      type="button"
      onClick={() => onSelect(slot.projectId)}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "j-schedule-row",
        isLive && "j-schedule-row--live",
        isJudged && "j-schedule-row--judged",
        isWinner && "j-schedule-row--winner",
        dimmed && "j-schedule-row--dim",
        matched && "j-schedule-row--match",
      )}
    >
      <span className="j-timeline-dot" aria-hidden />
      <span className="j-schedule-time">{formatSlotTime(slot.startTime)}</span>
      <span className="min-w-0 text-left">
        <span
          className={cn(
            "j-schedule-name flex items-center gap-1.5 truncate",
            isJudged && "text-[var(--hc-faint)] line-through",
          )}
        >
          {isWinner ? (
            <Trophy
              className="size-3.5 shrink-0 text-[var(--hc-muted)]"
              aria-label="Winner pick"
            />
          ) : null}
          <span className="truncate">{project.name}</span>
        </span>
        {room ? (
          <span className="j-schedule-room block truncate">{room}</span>
        ) : (
          <span className="j-schedule-room block text-[var(--hc-faint)]">
            Table pending
          </span>
        )}
      </span>
      <span className="shrink-0">
        {isJudged ? (
          <Check className="size-5 text-[var(--hc-faint)]" aria-label="Judged" />
        ) : isLive ? (
          <span className="text-sm font-bold uppercase tracking-wide text-[var(--hc-live)]">
            Now
          </span>
        ) : isSkipped ? (
          <span className="text-xs font-medium text-[var(--hc-muted)]">Skipped</span>
        ) : slot.status === "upcoming" ? (
          <span className="text-sm font-medium text-[var(--hc-faint)]">Next</span>
        ) : null}
      </span>
    </button>
  );
}

function SectionHeading({ children }: { children: string }) {
  return <h3 className="j-schedule-section-title">{children}</h3>;
}

export function SessionRail({
  slots,
  projects,
  activeProjectId,
  judgedIds,
  skippedIds,
  winnerIds,
  onSelect,
  embedded = false,
  scheduleApproximate = false,
}: SessionRailProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ScheduleFilter>("remaining");
  const listRef = useRef<HTMLDivElement>(null);

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const q = query.trim().toLowerCase();

  const chipFilteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const project = projectMap.get(slot.projectId);
      if (!project) return false;

      const isJudged = judgedIds.has(slot.projectId);
      const isSkipped = skippedIds.has(slot.projectId);
      const isWinner = winnerIds?.has(slot.projectId) ?? false;

      if (filter === "remaining" && isJudged) return false;
      if (filter === "judged" && !isJudged) return false;
      if (filter === "skipped" && !isSkipped) return false;
      if (filter === "picks" && !isWinner) return false;
      return true;
    });
  }, [slots, projectMap, judgedIds, skippedIds, winnerIds, filter]);

  const matchCount = useMemo(() => {
    if (!q) return chipFilteredSlots.length;
    return chipFilteredSlots.filter((slot) => {
      const project = projectMap.get(slot.projectId);
      return project ? projectMatchesQuery(project, q) : false;
    }).length;
  }, [chipFilteredSlots, projectMap, q]);

  const useQueueSections = filter === "remaining" || filter === "all";

  const sections = useMemo(() => {
    if (!useQueueSections) {
      return {
        now: [] as JudgingSlotWithStatus[],
        upNext: [] as JudgingSlotWithStatus[],
        later: chipFilteredSlots,
      };
    }

    const now = chipFilteredSlots.filter(
      (slot) => slot.status === "live" && !judgedIds.has(slot.projectId),
    );
    const nowIds = new Set(now.map((slot) => slot.id));
    const rest = chipFilteredSlots.filter((slot) => !nowIds.has(slot.id));
    const upNext = rest
      .filter(
        (slot) =>
          !judgedIds.has(slot.projectId) &&
          !(winnerIds?.has(slot.projectId) ?? false),
      )
      .slice(0, UP_NEXT_COUNT);
    const upNextIds = new Set(upNext.map((slot) => slot.id));
    const later = rest.filter((slot) => !upNextIds.has(slot.id));

    return { now, upNext, later };
  }, [chipFilteredSlots, judgedIds, winnerIds, useQueueSections]);

  const flatForVirtual = chipFilteredSlots;
  const useVirtual =
    !useQueueSections && flatForVirtual.length >= VIRTUALIZE_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: flatForVirtual.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  useEffect(() => {
    if (!useVirtual || !activeProjectId) return;
    const index = flatForVirtual.findIndex((s) => s.projectId === activeProjectId);
    if (index >= 0) {
      virtualizer.scrollToIndex(index, { align: "auto" });
    }
  }, [activeProjectId, flatForVirtual, useVirtual, virtualizer]);

  const { remaining: remainingCount, total } = streamProgress(
    slots,
    judgedIds,
    skippedIds,
  );

  function renderRow(slot: JudgingSlotWithStatus) {
    const project = projectMap.get(slot.projectId);
    if (!project) return null;
    const matched = Boolean(q) && projectMatchesQuery(project, q);
    const dimmed = Boolean(q) && !matched;

    return (
      <SessionRailRow
        key={slot.id}
        slot={slot}
        project={project}
        activeProjectId={activeProjectId}
        judgedIds={judgedIds}
        skippedIds={skippedIds}
        winnerIds={winnerIds}
        onSelect={onSelect}
        dimmed={dimmed}
        matched={matched}
      />
    );
  }

  const listBody =
    chipFilteredSlots.length === 0 ? (
      <p className="py-4 text-sm text-[var(--hc-muted)]">
        {filter === "remaining"
          ? "All projects in this stream are marked judged."
          : filter === "picks"
            ? "No winner picks yet - use the trophy button on a project to pick it."
            : "Nothing to show for this filter."}
      </p>
    ) : useVirtual ? (
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
        role="list"
        aria-label="Schedule projects"
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const slot = flatForVirtual[virtualRow.index];
          const project = projectMap.get(slot.projectId);
          if (!project) return null;
          const matched = Boolean(q) && projectMatchesQuery(project, q);
          const dimmed = Boolean(q) && !matched;

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
                winnerIds={winnerIds}
                onSelect={onSelect}
                dimmed={dimmed}
                matched={matched}
              />
            </div>
          );
        })}
      </div>
    ) : useQueueSections ? (
      <div className="j-schedule-sections">
        {sections.now.length > 0 ? (
          <section className="j-schedule-section" aria-label="Now">
            <SectionHeading>Now</SectionHeading>
            <ol className="j-schedule-list j-schedule-list--section">
              {sections.now.map((slot) => (
                <li key={slot.id}>{renderRow(slot)}</li>
              ))}
            </ol>
          </section>
        ) : null}

        {sections.upNext.length > 0 ? (
          <section className="j-schedule-section" aria-label="Up next">
            <SectionHeading>Up next</SectionHeading>
            <ol className="j-schedule-list j-schedule-list--section">
              {sections.upNext.map((slot) => (
                <li key={slot.id}>{renderRow(slot)}</li>
              ))}
            </ol>
          </section>
        ) : null}

        {sections.later.length > 0 ? (
          <section className="j-schedule-section" aria-label="Later">
            <SectionHeading>Later</SectionHeading>
            <ol className="j-schedule-list j-schedule-list--section">
              {sections.later.map((slot) => (
                <li key={slot.id}>{renderRow(slot)}</li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    ) : (
      <ol className="j-schedule-list">
        {chipFilteredSlots.map((slot) => (
          <li key={slot.id}>{renderRow(slot)}</li>
        ))}
      </ol>
    );

  const chrome = (
    <div className="j-schedule-chrome">
      {!embedded && (
        <>
          <h2 className="j-schedule-title">Your schedule</h2>
          <p className="mt-1 text-sm text-[var(--hc-muted)]">
            {remainingCount} remaining · {total} total in this stream
            {winnerIds && winnerIds.size > 0
              ? ` · ${winnerIds.size} pick${winnerIds.size === 1 ? "" : "s"}`
              : ""}
          </p>
        </>
      )}

      {scheduleApproximate && (
        <p className="j-schedule-approx mt-3 text-xs leading-relaxed text-[var(--hc-muted)]">
          Times are approximate for ordering - use project order and search, not
          the clock.
        </p>
      )}

      <div className={embedded ? "relative mt-0" : "relative mt-4"}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--hc-faint)]"
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

      <div
        className="mt-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filter schedule"
      >
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "j-schedule-filter",
              filter === id && "j-schedule-filter--active",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {q ? (
        <p className="mt-2 text-xs text-[var(--hc-muted)]" aria-live="polite">
          {matchCount === 0
            ? "No matches — list stays visible, dimmed"
            : `${matchCount} match${matchCount === 1 ? "" : "es"} highlighted`}
        </p>
      ) : null}
    </div>
  );

  const scroll = (
    <div
      ref={listRef}
      className="j-schedule-scroll"
      role={useVirtual || chipFilteredSlots.length === 0 ? undefined : "presentation"}
    >
      {listBody}
    </div>
  );

  if (embedded) {
    return (
      <div className="j-schedule-panel j-schedule-panel--embedded">
        {chrome}
        {scroll}
      </div>
    );
  }

  return (
    <Card className="j-schedule-panel flex min-h-0 flex-col p-5 lg:flex-1">
      {chrome}
      {scroll}
    </Card>
  );
}
