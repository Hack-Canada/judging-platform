import type { Project } from "@/lib/queries";
import { getSql } from "@/lib/db";

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
  durationMinutes: number = DEFAULT_DURATION_MINUTES,
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

// ---------------------------------------------------------------------------
// Persistence. The schedule lives in `schedule_slots` (db/schedule-slots.sql)
// so admin edits — nudges, delays, room/track/time overrides — actually save.
// `id` here is the schedule_slots row id (not the project id).
// ---------------------------------------------------------------------------

// Seed the table once from the derived draft, so there's a schedule to edit.
// No-op if slots already exist. Returns the number of rows inserted.
export async function seedScheduleIfEmpty(
  projects: Project[],
): Promise<number> {
  const sql = getSql();
  const existing = await sql`SELECT count(*)::int AS c FROM schedule_slots`;
  if (existing[0].c > 0 || projects.length === 0) return 0;

  const draft = deriveSchedule(projects);
  const projectIds = draft.map((s) => s.id);
  const rooms = draft.map((s) => s.room);
  const tracks = draft.map((s) => s.track);
  const times = draft.map((s) => s.scheduledAt);
  const durations = draft.map((s) => s.durationMinutes);

  await sql`
    INSERT INTO schedule_slots (project_id, room, track, scheduled_at, duration_minutes)
    SELECT * FROM unnest(
      ${projectIds}::uuid[], ${rooms}::text[], ${tracks}::text[],
      ${times}::timestamptz[], ${durations}::int[]
    )
  `;
  return draft.length;
}

export async function getScheduleSlots(): Promise<ScheduleSlot[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT s.id, s.room, s.track, s.scheduled_at, s.duration_minutes,
           p.project_name
    FROM schedule_slots s
    JOIN projects p ON p.id = s.project_id
    ORDER BY s.scheduled_at ASC, s.room ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    projectName: r.project_name,
    track: r.track ?? "General",
    room: r.room,
    scheduledAt: new Date(r.scheduled_at).toISOString(),
    durationMinutes: r.duration_minutes,
  }));
}

export type SlotUpdate = {
  room?: string;
  track?: string | null;
  scheduledAt?: string;
  durationMinutes?: number;
};

export async function updateSlot(
  id: string,
  fields: SlotUpdate,
): Promise<ScheduleSlot | null> {
  const sql = getSql();
  const rows = await sql`
    UPDATE schedule_slots s SET
      room             = COALESCE(${fields.room ?? null}, s.room),
      track            = COALESCE(${fields.track ?? null}, s.track),
      scheduled_at     = COALESCE(${fields.scheduledAt ?? null}::timestamptz, s.scheduled_at),
      duration_minutes = COALESCE(${fields.durationMinutes ?? null}, s.duration_minutes),
      updated_at       = now()
    WHERE s.id = ${id}
    RETURNING s.id, s.room, s.track, s.scheduled_at, s.duration_minutes,
              (SELECT project_name FROM projects WHERE id = s.project_id) AS project_name
  `;
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    projectName: r.project_name,
    track: r.track ?? "General",
    room: r.room,
    scheduledAt: new Date(r.scheduled_at).toISOString(),
    durationMinutes: r.duration_minutes,
  };
}

export async function deleteSlot(id: string): Promise<boolean> {
  const sql = getSql();
  const rows =
    await sql`DELETE FROM schedule_slots WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function createSlot(input: {
  projectId: string;
  room: string;
  track: string | null;
  scheduledAt: string;
  durationMinutes: number;
}): Promise<ScheduleSlot | null> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO schedule_slots (project_id, room, track, scheduled_at, duration_minutes)
    VALUES (${input.projectId}, ${input.room}, ${input.track},
            ${input.scheduledAt}::timestamptz, ${input.durationMinutes})
    RETURNING id, room, track, scheduled_at, duration_minutes,
              (SELECT project_name FROM projects WHERE id = ${input.projectId}) AS project_name
  `;
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    projectName: r.project_name,
    track: r.track ?? "General",
    room: r.room,
    scheduledAt: new Date(r.scheduled_at).toISOString(),
    durationMinutes: r.duration_minutes,
  };
}

// Shift every slot by N minutes (global delay). Returns rows affected.
export async function applyGlobalDelay(minutes: number): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    UPDATE schedule_slots
    SET scheduled_at = scheduled_at + (${minutes} * interval '1 minute'),
        updated_at = now()
    RETURNING id
  `;
  return rows.length;
}
