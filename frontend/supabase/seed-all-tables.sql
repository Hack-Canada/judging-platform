-- Seed script for all tables (admin_settings, submissions, judges, calendar_schedule_slots, judge_investments, judge_project_assignments)
-- Run this in your Supabase SQL Editor. Order respects foreign keys.
-- Uses fixed UUIDs for seed rows so references stay valid.

-- =============================================================================
-- 1. ADMIN_SETTINGS (no dependencies)
-- =============================================================================
INSERT INTO public.admin_settings (setting_key, setting_value, updated_at)
VALUES
  ('investment_fund', '10000', now()),
  ('calendar_slot_duration', '5', now()),
  ('calendar_judges_per_project', '2', now()),
  ('calendar_start_time', '13:00', now()),
  ('calendar_end_time', '16:00', now()),
  ('scoring_min_investment', '0', now()),
  ('scoring_max_investment', '1000', now()),
  ('tracks_data', '["General","RBC Track","Uber Track","Solo Hack","Beginners Hack"]', now()),
  ('rooms_data', '[{"id":1,"name":"Room A"},{"id":2,"name":"Room B"},{"id":3,"name":"Room C"}]', now())
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = EXCLUDED.updated_at;

-- =============================================================================
-- 2. SUBMISSIONS (no dependencies)
-- =============================================================================
INSERT INTO public.submissions (id, name, team_name, members, devpost_link, project_name, tracks, submitted_at, created_at)
VALUES
  ('a0000001-0001-4000-8000-000000000001', 'Alex Smith', 'Awesome Builders', ARRAY['Jordan Lee', 'Taylor Kim'], 'https://devpost.com/software/smart-assistant', 'Smart Assistant', ARRAY['General', 'RBC Track'], now() - interval '5 days', now() - interval '5 days'),
  ('a0000001-0001-4000-8000-000000000002', 'Morgan Davis', 'Brilliant Coders', ARRAY['Casey Brown'], 'https://devpost.com/software/ai-dashboard', 'AI Dashboard', ARRAY['General', 'Uber Track'], now() - interval '4 days', now() - interval '4 days'),
  ('a0000001-0001-4000-8000-000000000003', 'Riley Wilson', 'Creative Makers', ARRAY['Cameron Green', 'Quinn Hall'], 'https://devpost.com/software/health-tracker', 'Health Tracker', ARRAY['General'], now() - interval '3 days', now() - interval '3 days'),
  ('a0000001-0001-4000-8000-000000000004', 'Avery Clark', 'Dynamic Hackers', ARRAY['Sage Adams'], 'https://devpost.com/software/finance-hub', 'Finance Hub', ARRAY['General', 'RBC Track', 'Uber Track'], now() - interval '2 days', now() - interval '2 days'),
  ('a0000001-0001-4000-8000-000000000005', 'Jordan Taylor', 'Fast Innovators', ARRAY[]::text[], 'https://devpost.com/software/edu-platform', 'Edu Platform', ARRAY['Beginners Hack'], now() - interval '1 day', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. JUDGES (no dependencies)
-- =============================================================================
INSERT INTO public.judges (id, name, email, assigned_projects, total_invested, tracks, created_at)
VALUES
  ('b0000001-0001-4000-8000-000000000001', 'Judge Alice', 'alice@hackcanada.test', 2, 0, ARRAY['General', 'RBC Track'], now()),
  ('b0000001-0001-4000-8000-000000000002', 'Judge Bob', 'bob@hackcanada.test', 2, 0, ARRAY['General', 'Uber Track'], now()),
  ('b0000001-0001-4000-8000-000000000003', 'Judge Carol', 'carol@hackcanada.test', 1, 0, ARRAY['General'], now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. CALENDAR_SCHEDULE_SLOTS (depends: submissions, judges)
-- =============================================================================
INSERT INTO public.calendar_schedule_slots (date, start_time, end_time, submission_id, room_id, judge_ids, created_at, updated_at)
VALUES
  (current_date, '13:00', '13:05', 'a0000001-0001-4000-8000-000000000001', 1, ARRAY['b0000001-0001-4000-8000-000000000001', 'b0000001-0001-4000-8000-000000000002']::uuid[], now(), now()),
  (current_date, '13:05', '13:10', 'a0000001-0001-4000-8000-000000000002', 1, ARRAY['b0000001-0001-4000-8000-000000000001', 'b0000001-0001-4000-8000-000000000003']::uuid[], now(), now()),
  (current_date, '13:10', '13:15', 'a0000001-0001-4000-8000-000000000003', 2, ARRAY['b0000001-0001-4000-8000-000000000002', 'b0000001-0001-4000-8000-000000000003']::uuid[], now(), now()),
  (current_date, '13:15', '13:20', 'a0000001-0001-4000-8000-000000000004', 2, ARRAY['b0000001-0001-4000-8000-000000000001']::uuid[], now(), now()),
  (current_date, '13:20', '13:25', 'a0000001-0001-4000-8000-000000000005', 3, ARRAY['b0000001-0001-4000-8000-000000000003']::uuid[], now(), now());

-- =============================================================================
-- 5. JUDGE_INVESTMENTS (depends: judges, submissions)
-- =============================================================================
INSERT INTO public.judge_investments (judge_id, submission_id, amount, created_at, updated_at)
VALUES
  ('b0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000001', 250, now(), now()),
  ('b0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000002', 100, now(), now()),
  ('b0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000001', 300, now(), now()),
  ('b0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000003', 0, now(), now()),
  ('b0000001-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000003', 150, now(), now());

-- =============================================================================
-- 6. JUDGE_PROJECT_ASSIGNMENTS (depends: judges, submissions)
-- =============================================================================
INSERT INTO public.judge_project_assignments (judge_id, submission_id, created_at)
VALUES
  ('b0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000001', now()),
  ('b0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000002', now()),
  ('b0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000001', now()),
  ('b0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000003', now()),
  ('b0000001-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000003', now()),
  ('b0000001-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000005', now());

-- Optional: update judges.assigned_projects to match assignment counts
UPDATE public.judges j
SET assigned_projects = (
  SELECT count(*) FROM public.judge_project_assignments a WHERE a.judge_id = j.id
);

-- Optional: update judges.total_invested to match investments
UPDATE public.judges j
SET total_invested = coalesce((
  SELECT sum(amount) FROM public.judge_investments i WHERE i.judge_id = j.id
), 0);
