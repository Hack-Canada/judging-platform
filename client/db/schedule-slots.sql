-- Applied schedule schema for the Admin portal.
--
-- STATUS: APPLIED. Backs /admin/schedule with real add/edit/delete CRUD so the
-- grid persists room/time/track overrides, per-pitch nudges, and global delays.
-- Room is stored as text (matching the grid's column model) rather than a
-- separate rooms table, to keep the surface small.
--
-- Additive: introduces one new table, does not touch `projects`.

CREATE TABLE IF NOT EXISTS schedule_slots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room             text NOT NULL,
  track            text,
  scheduled_at     timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 5,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS schedule_slots_room_time_idx
  ON schedule_slots (room, scheduled_at);
CREATE INDEX IF NOT EXISTS schedule_slots_project_idx
  ON schedule_slots (project_id);
