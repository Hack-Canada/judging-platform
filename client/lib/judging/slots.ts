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
