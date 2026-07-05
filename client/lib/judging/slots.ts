import { deriveSlotStatus } from "./format";
import type { JudgingSlot, JudgingSlotWithStatus } from "./types";

export function withDerivedStatus(
  slots: JudgingSlot[],
  at = Date.now()
): JudgingSlotWithStatus[] {
  return slots.map((slot) => ({
    ...slot,
    status: deriveSlotStatus(slot.startTime, slot.endTime, at),
  }));
}

export function slotsForStream(
  slots: JudgingSlotWithStatus[],
  streamId: string
): JudgingSlotWithStatus[] {
  return slots.filter((s) => s.streamId === streamId);
}

export function findLiveSlot(
  slots: JudgingSlotWithStatus[],
  judgedIds: Set<string>
): JudgingSlotWithStatus | undefined {
  return slots.find((s) => s.status === "live" && !judgedIds.has(s.projectId));
}

export function getNextUnjudgedProjectId(
  slots: JudgingSlot[],
  judgedIds: Set<string>,
  excludeProjectId?: string
): string | undefined {
  const unjudged = slots.filter((s) => !judgedIds.has(s.projectId));
  const next = unjudged.find((s) => s.projectId !== excludeProjectId) ?? unjudged[0];
  return next?.projectId;
}

export function streamProgress(
  slots: JudgingSlot[],
  judgedIds: Set<string>,
  skippedIds: Set<string> = new Set()
): { judged: number; skipped: number; total: number; remaining: number } {
  const total = slots.length;
  const skipped = slots.filter((s) => skippedIds.has(s.projectId)).length;
  const judged = slots.filter(
    (s) => judgedIds.has(s.projectId) && !skippedIds.has(s.projectId)
  ).length;
  const remaining = slots.filter((s) => !judgedIds.has(s.projectId)).length;
  return { judged, skipped, total, remaining };
}

export function slotsForProject(
  slots: JudgingSlot[],
  projectId: string
): JudgingSlot[] {
  return slots.filter((s) => s.projectId === projectId);
}

/** Pick the best slot to display when a project may have 0 or many slots. */
export function pickPrimarySlot(
  slots: JudgingSlot[],
  at = Date.now()
): JudgingSlotWithStatus | undefined {
  if (!slots.length) return undefined;
  const withStatus = withDerivedStatus(slots, at);
  const live = withStatus.find((s) => s.status === "live");
  if (live) return live;
  const upcoming = sortSlotsByTime(withStatus).find((s) => s.status === "upcoming");
  if (upcoming) return upcoming;
  return sortSlotsByTime(withStatus)[withStatus.length - 1];
}

export function sortSlotsByTime<T extends JudgingSlot>(slots: T[]): T[] {
  return [...slots].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

export function getAdjacentProjectIds(
  slots: JudgingSlot[],
  currentProjectId: string
): { prev?: string; next?: string } {
  const sorted = sortSlotsByTime(slots);
  const idx = sorted.findIndex((s) => s.projectId === currentProjectId);
  return {
    prev: idx > 0 ? sorted[idx - 1].projectId : undefined,
    next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1].projectId : undefined,
  };
}

export type BreakState = {
  nextSlot: JudgingSlotWithStatus;
  nextProjectId: string;
  minutesUntil: number;
};

/** Returns break info when between slots with a meaningful gap and nothing live. */
export function findBreakState(
  slots: JudgingSlotWithStatus[],
  judgedIds: Set<string>,
  at = Date.now()
): BreakState | null {
  if (findLiveSlot(slots, judgedIds)) return null;

  const sorted = sortSlotsByTime(slots);
  const next = sorted.find(
    (s) => s.status === "upcoming" && !judgedIds.has(s.projectId)
  );
  if (!next) return null;

  const nextStart = new Date(next.startTime).getTime();
  const msUntil = nextStart - at;
  if (msUntil <= 0) return null;

  const endedBefore = sorted.filter((s) => new Date(s.endTime).getTime() <= at);
  const lastEnded = endedBefore[endedBefore.length - 1];
  if (!lastEnded) return null;

  const gapMs = nextStart - new Date(lastEnded.endTime).getTime();
  if (gapMs < 5 * 60_000) return null;

  return {
    nextSlot: next,
    nextProjectId: next.projectId,
    minutesUntil: Math.ceil(msUntil / 60_000),
  };
}
