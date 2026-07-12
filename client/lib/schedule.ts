import type { Project } from "@/lib/queries";

// Draft schedule generation. Until the real `schedule_slots` table exists
// (see db/schedule-schema.sql), we derive a plausible schedule from the
// submissions so the Admin schedule manager has something to show and edit.

export type ScheduleSlot = {
  id: string; // project id
  projectName: string;
  track: string;
  room: string;
  scheduledAt: string; // ISO
  durationMinutes: number;
};

export const DEFAULT_ROOMS = ["Room 101", "Room 102", "Room 103", "Room 104"];
export const DEFAULT_DURATION_MINUTES = 5;

// Start pitches at 10:00 local on the day of the earliest submission (fallback: today).
function scheduleStart(projects: Project[]): Date {
  const first = projects.find((p) => p.submitted_at)?.submitted_at;
  const base = first ? new Date(first) : new Date();
  base.setHours(10, 0, 0, 0);
  return base;
}

export function deriveSchedule(
  projects: Project[],
  rooms: string[] = DEFAULT_ROOMS,
  durationMinutes: number = DEFAULT_DURATION_MINUTES
): ScheduleSlot[] {
  const start = scheduleStart(projects).getTime();
  return projects.map((p, i) => {
    const room = rooms[i % rooms.length];
    const slotIndex = Math.floor(i / rooms.length);
    const scheduledAt = new Date(start + slotIndex * durationMinutes * 60_000);
    return {
      id: p.id,
      projectName: p.project_name,
      track: p.tracks[0] ?? "General",
      room,
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes,
    };
  });
}
