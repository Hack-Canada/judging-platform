import { ArrowUpRight } from "lucide-react";
import { getDisplayDescription, formatTeamLabel, isValidRoom, resolveSlotRoom } from "@/lib/judging/format";
import type { JudgingProject, SlotStatus } from "@/lib/judging/types";
import { LocationBoard } from "./location-board";
import { SessionTimer } from "./session-timer";

const MAX_TRACKS = 3;

type ProjectHeroProps = {
  project: JudgingProject;
  slotStartTime?: string;
  slotEndTime?: string;
  slotStatus: SlotStatus;
  slotRoom?: string | null;
  isJudged: boolean;
  judgedEarly?: boolean;
  /** When project has zero derivable slots from real data */
  notScheduled?: boolean;
  /** When project has multiple slots (show quiet hint) */
  multipleSlots?: boolean;
};

export function ProjectHero({
  project,
  slotStartTime,
  slotEndTime,
  slotStatus,
  slotRoom,
  isJudged,
  judgedEarly,
  notScheduled,
  multipleSlots,
}: ProjectHeroProps) {
  const room = resolveSlotRoom(slotRoom ?? null, project.room);
  const hasRoom = isValidRoom(room);
  const isLive = slotStatus === "live" && !isJudged;

  return (
    <section className="j-hero" aria-label="Current judging slot">
      {isLive && <div className="j-hero-live-bar" aria-hidden />}
      <div className="j-hero-inner">
        <div className={hasRoom || isJudged ? "j-hero-grid" : "j-hero-grid j-hero-grid--solo"}>
          {hasRoom && room ? (
            <LocationBoard room={room} isJudged={isJudged} judgedEarly={judgedEarly} />
          ) : isJudged ? (
            <LocationBoard
              room={room ?? project.name}
              isJudged
              judgedEarly={judgedEarly}
            />
          ) : null}

          <div className="j-hero-project flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {isLive && (
                <span className="j-live-pill">
                  <span className="j-live-pill-dot" aria-hidden />
                  Live
                </span>
              )}
              {isJudged && <span className="j-judged-pill">Judged</span>}
              {slotStatus === "upcoming" && !isJudged && (
                <span className="j-hero-muted text-sm font-semibold uppercase tracking-widest">
                  Up next
                </span>
              )}
            </div>

            <h1 className="j-hero-title">{project.name}</h1>
            <p className="j-hero-team">{formatTeamLabel(project)}</p>

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
                status={slotStatus}
                isJudged={isJudged}
                variant="hero"
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

  return (
    <div>
      {description ? (
        <p className="j-description">{description}</p>
      ) : (
        <p className="text-base leading-relaxed text-[var(--j-muted)]">
          {project.members.length > 0 ? (
            <>
              Built by <span className="font-medium text-[var(--j-ink)]">{formatTeamLabel(project)}</span>
              {project.devpostUrl
                ? " - open Devpost for the full write-up."
                : "."}
            </>
          ) : (
            <>
              No summary yet.
              {project.devpostUrl && " Open Devpost below for details."}
            </>
          )}
        </p>
      )}

      <div className="j-meta-grid">
        {project.members.length > 0 && (
          <div>
            <p className="j-meta-label">Team</p>
            <p className="text-base font-medium leading-relaxed text-[var(--j-ink)]">
              {project.members.join(", ")}
            </p>
          </div>
        )}

        {project.tracks.length > 0 && (
          <div>
            <p className="j-meta-label">Tracks</p>
            <div className="flex flex-wrap gap-1.5">
              {visibleTracks.map((track) => (
                <span key={track} className="j-track-pill j-track-pill--quiet">
                  {track}
                </span>
              ))}
              {hiddenTrackCount > 0 && (
                <span className="j-track-pill j-track-pill--quiet">
                  +{hiddenTrackCount} more
                </span>
              )}
            </div>
          </div>
        )}

        {project.devpostUrl && (
          <div className={project.members.length > 0 ? "sm:col-span-2" : ""}>
            <p className="j-meta-label">Submission</p>
            <a
              href={project.devpostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--j-action)] underline-offset-4 hover:text-[var(--j-action-hover)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--j-action)]"
            >
              Open Devpost
              <ArrowUpRight className="size-5" aria-hidden />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
