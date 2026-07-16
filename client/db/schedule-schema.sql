-- PROPOSED schedule schema for the Admin portal.
--
-- STATUS: NOT YET APPLIED. These tables do not exist in the database yet.
-- The schedule is shared infrastructure (Judge, Volunteer, Hacker portals all
-- read it), so this needs sign-off from the lead before we run it. The Admin
-- schedule manager currently derives a *draft* schedule in-memory from the
-- `projects` table; once these tables exist we swap that for real reads/writes.
--
-- Only additive: introduces new tables, does not touch `projects`.

CREATE TABLE IF NOT EXISTS rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,           -- e.g. "Room 101"
  location    text,                    -- floor / building note
  capacity    int,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_slots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_id           uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  track             text,                          -- which track this pitch is for
  scheduled_at      timestamptz NOT NULL,          -- planned start time
  duration_minutes  int NOT NULL DEFAULT 5,
  delay_minutes     int NOT NULL DEFAULT 0,        -- admin-applied delay
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','pitching','done','skipped')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS schedule_slots_room_time_idx
  ON schedule_slots (room_id, scheduled_at);
CREATE INDEX IF NOT EXISTS schedule_slots_project_idx
  ON schedule_slots (project_id);

-- Global schedule adjustments (e.g. "everything delayed 1h") that the Hacker
-- portal can surface as a banner/pop-up per the planning board.
CREATE TABLE IF NOT EXISTS schedule_announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message     text NOT NULL,
  delay_minutes int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
