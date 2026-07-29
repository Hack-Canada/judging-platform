"use client";

import { useEffect, useState } from "react";
import { getDisplayDescription, formatTeamLabel, isValidRoom, resolveSlotRoom, deriveSlotStatus } from "@/lib/judging/format";
import type { JudgingProject } from "@/lib/judging/types";
import { LocationBoard } from "./location-board";
import { SessionTimer } from "./session-timer";
import { SplitFlapTitle } from "./split-flap-title";

const MAX_TRACKS = 12;

type ProjectHeroProps = {
  project: JudgingProject;
  slotStartTime?: string;
  slotEndTime?: string;
  /** Ignored for phase UI - kept for callers; timer/pills use wall clock. */
  slotStatus?: string;
  slotRoom?: string | null;
  isJudged: boolean;
  judgedEarly?: boolean;
  /** When project has zero derivable slots from real data */
  notScheduled?: boolean;
  /** When project has multiple slots (show quiet hint) */
  multipleSlots?: boolean;
  /** Portal clock (includes server skew). Offset already baked into start/end. */
  nowMs?: number;
};

export function ProjectHero({
  project,
  slotStartTime,
  slotEndTime,
  slotRoom,
  isJudged,
  judgedEarly,
  notScheduled,
  multipleSlots,
  nowMs,
}: ProjectHeroProps) {
  const [localNow, setLocalNow] = useState(() => Date.now());

  useEffect(() => {
    if (nowMs != null || isJudged || !slotStartTime || !slotEndTime) return;
    const id = window.setInterval(() => setLocalNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [nowMs, isJudged, slotStartTime, slotEndTime]);

  const clock = nowMs ?? localNow;
  const room = resolveSlotRoom(slotRoom ?? null, project.room);
  const hasRoom = isValidRoom(room);
  const phase =
    slotStartTime && slotEndTime && !notScheduled
      ? deriveSlotStatus(slotStartTime, slotEndTime, clock)
      : null;
  const isLive = phase === "live" && !isJudged;
  const isOvertime = phase === "done" && !isJudged;
  const isUpcoming = phase === "upcoming" && !isJudged;

  return (
    <section className="j-hero" aria-label="Current judging slot">
      {isLive && <div className="j-hero-live-bar" aria-hidden />}
      {isOvertime && <div className="j-hero-overtime-bar" aria-hidden />}
      <div
        className={
          isLive
            ? "j-hero-inner j-hero-inner--live"
            : isOvertime
              ? "j-hero-inner j-hero-inner--overtime"
              : "j-hero-inner"
        }
      >
        <div
          key={project.id}
          className={hasRoom && room ? "j-hero-grid" : "j-hero-grid j-hero-grid--solo"}
        >
          {hasRoom && room ? (
            <LocationBoard room={room} isJudged={isJudged} judgedEarly={judgedEarly} />
          ) : null}

          <div className="j-hero-project flex min-w-0 flex-col gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {isLive && (
                <span className="j-live-pill">
                  <span className="j-live-pill-dot" aria-hidden />
                  Live
                </span>
              )}
              {isOvertime && (
                <span className="j-overtime-pill">Overtime</span>
              )}
              {isJudged && <span className="j-judged-pill">Judged</span>}
              {isUpcoming && (
                <span className="j-hero-muted text-sm font-semibold uppercase tracking-widest">
                  Up next
                </span>
              )}
            </div>

            <SplitFlapTitle text={project.name} className="j-hero-title" />
            <p className="j-hero-team">{formatTeamLabel(project)}</p>

            <a href="#j-scorecard" className="j-jump-notes">
              Jump to notes
            </a>

            {notScheduled && !isJudged && (
              <p className="j-hero-muted text-sm font-medium">Not scheduled</p>
            )}
            {multipleSlots && !notScheduled && (
              <p className="j-hero-faint text-xs">Showing nearest slot</p>
            )}
          </div>

          {slotStartTime && slotEndTime && !notScheduled ? (
            <div className="j-hero-aside">
              <SessionTimer
                startTime={slotStartTime}
                endTime={slotEndTime}
                isJudged={isJudged}
                variant="hero"
                nowMs={clock}
              />
            </div>
          ) : null}
        </div>
        {!hasRoom && !isJudged && (
          <p className="j-hero-muted mt-3 text-sm">Table not assigned yet</p>
        )}
      </div>
    </section>
  );
}

type ProjectDetailsProps = {
  project: JudgingProject;
};

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const description = getDisplayDescription(project);
  const visibleTracks = project.tracks.slice(0, MAX_TRACKS);
  const hiddenTrackCount = project.tracks.length - MAX_TRACKS;
  const hasTeam = project.members.length > 0;
  const hasTracks = project.tracks.length > 0;

  if (!description && !hasTeam && !hasTracks) {
    return (
      <p className="j-project-brief-empty">No project summary yet.</p>
    );
  }

  return (
    <aside className="j-project-brief" aria-label="Project brief">
      {description ? <p className="j-description">{description}</p> : null}

      {(hasTeam || hasTracks) && (
        <div className="j-project-brief-meta">
          {hasTeam ? (
            <p className="j-project-brief-team">
              <span className="j-meta-label">Team</span>
              <span>{project.members.join(", ")}</span>
            </p>
          ) : null}
          {hasTracks ? (
            <div className="j-project-brief-tracks">
              <span className="j-meta-label">Tracks</span>
              <div className="flex flex-wrap gap-1.5">
                {visibleTracks.map((track) => (
                  <span key={track} className="j-track-pill j-track-pill--quiet">
                    {track}
                  </span>
                ))}
                {hiddenTrackCount > 0 ? (
                  <span className="j-track-pill j-track-pill--quiet">
                    +{hiddenTrackCount} more
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </aside>
  );
}
