import type { JudgingSlot } from "./types";

const OFFSET_KEY = "hc-judging-schedule-offset";

/** Shift all slot times by N minutes (positive = event running behind). */
export function applyScheduleOffset(
  slots: JudgingSlot[],
  offsetMinutes: number
): JudgingSlot[] {
  if (!offsetMinutes) return slots;
  const ms = offsetMinutes * 60_000;
  return slots.map((slot) => ({
    ...slot,
    startTime: new Date(new Date(slot.startTime).getTime() + ms).toISOString(),
    endTime: new Date(new Date(slot.endTime).getTime() + ms).toISOString(),
  }));
}

export function loadLocalScheduleOffset(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(OFFSET_KEY);
    if (!raw) return 0;
    const n = Number(JSON.parse(raw));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function saveLocalScheduleOffset(minutes: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFSET_KEY, JSON.stringify(minutes));
  } catch {
    // ignore
  }
}

export function formatOffsetLabel(minutes: number): string | null {
  if (!minutes) return null;
  if (minutes > 0) return `${minutes} min behind`;
  return `${Math.abs(minutes)} min ahead`;
}
