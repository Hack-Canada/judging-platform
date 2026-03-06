-- Run this against your existing Supabase database after the tables in schema.sql exist.
-- It enables Row Level Security (RLS) and adds policies for:
-- - public hacker submissions
-- - public schedule reads when schedule visibility is enabled
-- - judge/sponsor access to their own dashboard data
-- - admin/superadmin management access
--
-- Important:
-- - This script assumes auth roles are stored in the JWT the same way the app reads them:
--   user_metadata.role, app_metadata.role, or user_metadata.user_role
-- - Judges are matched to auth users by email address.
-- - Service-role clients still bypass RLS.
--
-- Note:
-- RLS is row-level only. Because the public schedule currently reads directly from
-- public.submissions, enabling public row access there also allows public clients to
-- request other columns from that table. If you want stronger privacy, move the public
-- schedule to a narrowed view or RPC later.

begin;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'user_role',
    'hacker'
  )
$$;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.is_admin_or_superadmin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('admin', 'superadmin')
$$;

create or replace function public.current_judge_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select j.id
  from public.judges j
  where lower(j.email) = public.current_user_email()
  limit 1
$$;

create or replace function public.is_public_schedule_visible()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_settings s
    where s.setting_key = 'hacker_schedule_visibility'
      and s.setting_value = 'enabled'
  )
$$;

create or replace function public.is_submission_assigned_to_current_judge(target_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.judge_project_assignments a
    where a.submission_id = target_submission_id
      and a.judge_id = public.current_judge_id()
  )
  or exists (
    select 1
    from public.calendar_schedule_slots s
    where s.submission_id = target_submission_id
      and public.current_judge_id() = any(s.judge_ids)
  )
$$;

alter table public.admin_settings enable row level security;
alter table public.calendar_schedule_slots enable row level security;
alter table public.judge_investments enable row level security;
alter table public.judge_notes enable row level security;
alter table public.judge_project_assignments enable row level security;
alter table public.judges enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "admin_settings_public_schedule_read" on public.admin_settings;
drop policy if exists "admin_settings_staff_read_all" on public.admin_settings;
drop policy if exists "admin_settings_admin_insert" on public.admin_settings;
drop policy if exists "admin_settings_admin_update" on public.admin_settings;
drop policy if exists "admin_settings_admin_delete" on public.admin_settings;

create policy "admin_settings_public_schedule_read"
on public.admin_settings
for select
to anon, authenticated
using (
  setting_key in ('hacker_schedule_visibility', 'rooms_data')
);

create policy "admin_settings_staff_read_all"
on public.admin_settings
for select
to authenticated
using (
  public.current_app_role() in ('judge', 'sponsor', 'admin', 'superadmin')
);

create policy "admin_settings_admin_insert"
on public.admin_settings
for insert
to authenticated
with check (
  public.is_admin_or_superadmin()
);

create policy "admin_settings_admin_update"
on public.admin_settings
for update
to authenticated
using (
  public.is_admin_or_superadmin()
)
with check (
  public.is_admin_or_superadmin()
);

create policy "admin_settings_admin_delete"
on public.admin_settings
for delete
to authenticated
using (
  public.is_admin_or_superadmin()
);

drop policy if exists "calendar_schedule_slots_public_visible_read" on public.calendar_schedule_slots;
drop policy if exists "calendar_schedule_slots_judge_read_assigned" on public.calendar_schedule_slots;
drop policy if exists "calendar_schedule_slots_admin_insert" on public.calendar_schedule_slots;
drop policy if exists "calendar_schedule_slots_admin_update" on public.calendar_schedule_slots;
drop policy if exists "calendar_schedule_slots_admin_delete" on public.calendar_schedule_slots;

create policy "calendar_schedule_slots_public_visible_read"
on public.calendar_schedule_slots
for select
to anon, authenticated
using (
  public.is_public_schedule_visible()
);

create policy "calendar_schedule_slots_judge_read_assigned"
on public.calendar_schedule_slots
for select
to authenticated
using (
  public.current_app_role() in ('judge', 'sponsor')
  and public.current_judge_id() = any(judge_ids)
);

create policy "calendar_schedule_slots_admin_insert"
on public.calendar_schedule_slots
for insert
to authenticated
with check (
  public.is_admin_or_superadmin()
);

create policy "calendar_schedule_slots_admin_update"
on public.calendar_schedule_slots
for update
to authenticated
using (
  public.is_admin_or_superadmin()
)
with check (
  public.is_admin_or_superadmin()
);

create policy "calendar_schedule_slots_admin_delete"
on public.calendar_schedule_slots
for delete
to authenticated
using (
  public.is_admin_or_superadmin()
);

drop policy if exists "judge_investments_admin_read" on public.judge_investments;
drop policy if exists "judge_investments_admin_insert" on public.judge_investments;
drop policy if exists "judge_investments_admin_update" on public.judge_investments;
drop policy if exists "judge_investments_admin_delete" on public.judge_investments;
drop policy if exists "judge_investments_judge_read_own" on public.judge_investments;
drop policy if exists "judge_investments_judge_insert_own" on public.judge_investments;
drop policy if exists "judge_investments_judge_update_own" on public.judge_investments;

create policy "judge_investments_admin_read"
on public.judge_investments
for select
to authenticated
using (
  public.is_admin_or_superadmin()
);

create policy "judge_investments_admin_insert"
on public.judge_investments
for insert
to authenticated
with check (
  public.is_admin_or_superadmin()
);

create policy "judge_investments_admin_update"
on public.judge_investments
for update
to authenticated
using (
  public.is_admin_or_superadmin()
)
with check (
  public.is_admin_or_superadmin()
);

create policy "judge_investments_admin_delete"
on public.judge_investments
for delete
to authenticated
using (
  public.is_admin_or_superadmin()
);

create policy "judge_investments_judge_read_own"
on public.judge_investments
for select
to authenticated
using (
  public.current_app_role() in ('judge', 'sponsor')
  and judge_id = public.current_judge_id()
);

create policy "judge_investments_judge_insert_own"
on public.judge_investments
for insert
to authenticated
with check (
  public.current_app_role() in ('judge', 'sponsor')
  and judge_id = public.current_judge_id()
  and public.is_submission_assigned_to_current_judge(submission_id)
);

create policy "judge_investments_judge_update_own"
on public.judge_investments
for update
to authenticated
using (
  public.current_app_role() in ('judge', 'sponsor')
  and judge_id = public.current_judge_id()
  and public.is_submission_assigned_to_current_judge(submission_id)
)
with check (
  public.current_app_role() in ('judge', 'sponsor')
  and judge_id = public.current_judge_id()
  and public.is_submission_assigned_to_current_judge(submission_id)
);

drop policy if exists "judge_notes_admin_read" on public.judge_notes;
drop policy if exists "judge_notes_admin_insert" on public.judge_notes;
drop policy if exists "judge_notes_admin_update" on public.judge_notes;
drop policy if exists "judge_notes_admin_delete" on public.judge_notes;
drop policy if exists "judge_notes_judge_read_own" on public.judge_notes;
drop policy if exists "judge_notes_judge_insert_own" on public.judge_notes;
drop policy if exists "judge_notes_judge_update_own" on public.judge_notes;

create policy "judge_notes_admin_read"
on public.judge_notes
for select
to authenticated
using (
  public.is_admin_or_superadmin()
);

create policy "judge_notes_admin_insert"
on public.judge_notes
for insert
to authenticated
with check (
  public.is_admin_or_superadmin()
);

create policy "judge_notes_admin_update"
on public.judge_notes
for update
to authenticated
using (
  public.is_admin_or_superadmin()
)
with check (
  public.is_admin_or_superadmin()
);

create policy "judge_notes_admin_delete"
on public.judge_notes
for delete
to authenticated
using (
  public.is_admin_or_superadmin()
);

create policy "judge_notes_judge_read_own"
on public.judge_notes
for select
to authenticated
using (
  public.current_app_role() in ('judge', 'sponsor')
  and judge_id = public.current_judge_id()
  and public.is_submission_assigned_to_current_judge(submission_id)
);

create policy "judge_notes_judge_insert_own"
on public.judge_notes
for insert
to authenticated
with check (
  public.current_app_role() in ('judge', 'sponsor')
  and judge_id = public.current_judge_id()
  and public.is_submission_assigned_to_current_judge(submission_id)
);

create policy "judge_notes_judge_update_own"
on public.judge_notes
for update
to authenticated
using (
  public.current_app_role() in ('judge', 'sponsor')
  and judge_id = public.current_judge_id()
  and public.is_submission_assigned_to_current_judge(submission_id)
)
with check (
  public.current_app_role() in ('judge', 'sponsor')
  and judge_id = public.current_judge_id()
  and public.is_submission_assigned_to_current_judge(submission_id)
);

drop policy if exists "judge_project_assignments_admin_read" on public.judge_project_assignments;
drop policy if exists "judge_project_assignments_admin_insert" on public.judge_project_assignments;
drop policy if exists "judge_project_assignments_admin_update" on public.judge_project_assignments;
drop policy if exists "judge_project_assignments_admin_delete" on public.judge_project_assignments;
drop policy if exists "judge_project_assignments_judge_read_own" on public.judge_project_assignments;

create policy "judge_project_assignments_admin_read"
on public.judge_project_assignments
for select
to authenticated
using (
  public.is_admin_or_superadmin()
);

create policy "judge_project_assignments_admin_insert"
on public.judge_project_assignments
for insert
to authenticated
with check (
  public.is_admin_or_superadmin()
);

create policy "judge_project_assignments_admin_update"
on public.judge_project_assignments
for update
to authenticated
using (
  public.is_admin_or_superadmin()
)
with check (
  public.is_admin_or_superadmin()
);

create policy "judge_project_assignments_admin_delete"
on public.judge_project_assignments
for delete
to authenticated
using (
  public.is_admin_or_superadmin()
);

create policy "judge_project_assignments_judge_read_own"
on public.judge_project_assignments
for select
to authenticated
using (
  public.current_app_role() in ('judge', 'sponsor')
  and judge_id = public.current_judge_id()
);

drop policy if exists "judges_admin_read" on public.judges;
drop policy if exists "judges_admin_insert" on public.judges;
drop policy if exists "judges_admin_update" on public.judges;
drop policy if exists "judges_admin_delete" on public.judges;
drop policy if exists "judges_self_read" on public.judges;
drop policy if exists "judges_self_update" on public.judges;

create policy "judges_admin_read"
on public.judges
for select
to authenticated
using (
  public.is_admin_or_superadmin()
);

create policy "judges_admin_insert"
on public.judges
for insert
to authenticated
with check (
  public.is_admin_or_superadmin()
);

create policy "judges_admin_update"
on public.judges
for update
to authenticated
using (
  public.is_admin_or_superadmin()
)
with check (
  public.is_admin_or_superadmin()
);

create policy "judges_admin_delete"
on public.judges
for delete
to authenticated
using (
  public.is_admin_or_superadmin()
);

create policy "judges_self_read"
on public.judges
for select
to authenticated
using (
  public.current_app_role() in ('judge', 'sponsor')
  and lower(email) = public.current_user_email()
);

create policy "judges_self_update"
on public.judges
for update
to authenticated
using (
  public.current_app_role() in ('judge', 'sponsor')
  and id = public.current_judge_id()
)
with check (
  public.current_app_role() in ('judge', 'sponsor')
  and id = public.current_judge_id()
);

drop policy if exists "submissions_public_insert" on public.submissions;
drop policy if exists "submissions_public_schedule_read" on public.submissions;
drop policy if exists "submissions_judge_read_assigned" on public.submissions;
drop policy if exists "submissions_admin_read" on public.submissions;
drop policy if exists "submissions_admin_insert" on public.submissions;
drop policy if exists "submissions_admin_update" on public.submissions;
drop policy if exists "submissions_admin_delete" on public.submissions;

create policy "submissions_public_insert"
on public.submissions
for insert
to anon, authenticated
with check (
  true
);

create policy "submissions_public_schedule_read"
on public.submissions
for select
to anon, authenticated
using (
  public.is_public_schedule_visible()
);

create policy "submissions_judge_read_assigned"
on public.submissions
for select
to authenticated
using (
  public.current_app_role() in ('judge', 'sponsor')
  and public.is_submission_assigned_to_current_judge(id)
);

create policy "submissions_admin_read"
on public.submissions
for select
to authenticated
using (
  public.is_admin_or_superadmin()
);

create policy "submissions_admin_insert"
on public.submissions
for insert
to authenticated
with check (
  public.is_admin_or_superadmin()
);

create policy "submissions_admin_update"
on public.submissions
for update
to authenticated
using (
  public.is_admin_or_superadmin()
)
with check (
  public.is_admin_or_superadmin()
);

create policy "submissions_admin_delete"
on public.submissions
for delete
to authenticated
using (
  public.is_admin_or_superadmin()
);

commit;
