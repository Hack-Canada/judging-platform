import { snapToFiveMinutes } from "./format";
import { buildStreamsFromProjects } from "./streams";
import type { JudgingProject, JudgingSlot } from "./types";

export type SlotGenerationConfig = {
  /** Judging block length in minutes (default 180 = 3h). */
  windowMinutes: number;
  /** Target minutes per project visit (default 8). */
  slotMinutes: number;
  /** Block start; defaults to next 5-min boundary from now. */
  blockStart?: Date;
};

export type SlotGenerationResult = {
  slots: JudgingSlot[];
  /** True when times are compressed for ordering, not wall-clock accuracy. */
  scheduleApproximate: boolean;
};

const DEFAULT_WINDOW_MINUTES = 180;
const DEFAULT_SLOT_MINUTES = 8;
/** Above this count per stream, compress gaps to fit the window. */
const APPROXIMATE_THRESHOLD = 60;

export function readSlotGenerationConfig(): SlotGenerationConfig {
  const windowMinutes =
    Number(process.env.JUDGING_WINDOW_MINUTES ?? DEFAULT_WINDOW_MINUTES) ||
    DEFAULT_WINDOW_MINUTES;
  const slotMinutes =
    Number(process.env.JUDGING_SLOT_MINUTES ?? DEFAULT_SLOT_MINUTES) ||
    DEFAULT_SLOT_MINUTES;
  const blockStartRaw = process.env.JUDGING_BLOCK_START;
  const blockStart = blockStartRaw ? new Date(blockStartRaw) : undefined;
  return { windowMinutes, slotMinutes, blockStart };
}

function projectsInStream(projects: JudgingProject[], streamId: string): JudgingProject[] {
  return projects
    .filter((project) => {
      const tracks = project.tracks.length ? project.tracks : ["General"];
      return tracks.some(
        (track) =>
          track.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === streamId
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Build visit-order slots per track from real project rows. Times are derived
 * client-side when no judging_slots table exists — project data is from the DB.
 */
export function generateBoundedSyntheticSlots(
  projects: JudgingProject[],
  config: SlotGenerationConfig = readSlotGenerationConfig()
): SlotGenerationResult {
  const blockStart = snapToFiveMinutes(config.blockStart ?? new Date());
  const windowMs = config.windowMinutes * 60_000;
  const slotMs = config.slotMinutes * 60_000;
  const streams = buildStreamsFromProjects(projects);

  const slots: JudgingSlot[] = [];
  let scheduleApproximate = false;

  for (const stream of streams) {
    const streamProjects = projectsInStream(projects, stream.id);
    if (!streamProjects.length) continue;

    const count = streamProjects.length;
    const naiveEnd = count * slotMs;
    const compress = count > APPROXIMATE_THRESHOLD || naiveEnd > windowMs;
    if (compress) scheduleApproximate = true;

    const gapMs = compress
      ? Math.max(1, Math.floor(windowMs / Math.max(count - 1, 1)))
      : slotMs;
    const durationMs = compress ? Math.min(slotMs, gapMs) : slotMs;

    streamProjects.forEach((project, index) => {
      const start = new Date(blockStart.getTime() + index * gapMs);
      const end = new Date(start.getTime() + durationMs);
      slots.push({
        id: `slot-${stream.id}-${project.id}`,
        projectId: project.id,
        streamId: stream.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        room: project.room,
      });
    });
  }

  return { slots, scheduleApproximate };
}
