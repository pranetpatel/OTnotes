-- OT Notes App — Migration v4: real RLS enforcement
--
-- Replaces every "for all using (true) with check (true))" open policy with
-- policies keyed off auth.uid() via the current_staff() helper (added in
-- migrate-v3-auth.sql). Read this whole file before running it — this is the
-- one migration in this project with real "could break the live app" risk if
-- something's missed. A rollback script is at the bottom; keep it handy.
--
-- IMPORTANT: only run this after confirming Supabase Auth login works end to
-- end (Phase 3 of the auth migration) and at least one staff row has
-- is_admin = true. If nobody has auth_user_id set yet, running this will
-- lock everyone out of every table until someone does.

-- ---------------------------------------------------------------------------
-- assessments
-- ---------------------------------------------------------------------------

drop policy if exists ot_assessments_all on assessments;

create policy assessments_select on assessments for select
  using (exists (select 1 from public.current_staff() where active));

create policy assessments_insert on assessments for insert
  with check (exists (select 1 from public.current_staff() where active));

create policy assessments_update on assessments for update
  using (exists (select 1 from public.current_staff() where active));

-- No delete policy: matches existing app behavior (nothing in the app deletes
-- assessments outright aside from the explore-tab delete button — if that's
-- still wanted, add: create policy assessments_delete on assessments for delete
-- using (exists (select 1 from public.current_staff() where is_admin));

-- Enforce OT-only sign-off fields at the row level via trigger, since RLS
-- policies can't easily express "this column may only change if X."
create or replace function public.enforce_assessment_review_fields()
returns trigger
language plpgsql security definer as $$
declare
  caller record;
begin
  select * into caller from public.current_staff();

  if (new.status is distinct from old.status)
     or (new.reviewed_by is distinct from old.reviewed_by)
     or (new.reviewed_at is distinct from old.reviewed_at) then
    if new.status = 'reviewed' and not coalesce(caller.is_ot, false) then
      raise exception 'Only OT staff may sign off an assessment';
    end if;
    if new.status = 'draft' and not coalesce(caller.is_admin, false) then
      raise exception 'Only admin staff may revert a signed-off assessment to draft';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists assessments_review_guard on assessments;
create trigger assessments_review_guard
  before update on assessments
  for each row execute function public.enforce_assessment_review_fields();

-- ---------------------------------------------------------------------------
-- staff
-- ---------------------------------------------------------------------------

drop policy if exists ot_staff_all on staff;

create policy staff_select on staff for select
  using (exists (select 1 from public.current_staff()));

create policy staff_admin_write on staff for all
  using (exists (select 1 from public.current_staff() where is_admin))
  with check (exists (select 1 from public.current_staff() where is_admin));

-- ---------------------------------------------------------------------------
-- students, app_settings, recurring_schedules, makeup_sessions,
-- student_goal_overrides — read open to any active staff, writes admin-only
-- ---------------------------------------------------------------------------

drop policy if exists ot_students_all on students;
create policy students_select on students for select
  using (exists (select 1 from public.current_staff() where active));
create policy students_admin_write on students for all
  using (exists (select 1 from public.current_staff() where is_admin))
  with check (exists (select 1 from public.current_staff() where is_admin));

drop policy if exists ot_settings_all on app_settings;
create policy settings_select on app_settings for select
  using (exists (select 1 from public.current_staff() where active));
create policy settings_admin_write on app_settings for all
  using (exists (select 1 from public.current_staff() where is_admin))
  with check (exists (select 1 from public.current_staff() where is_admin));

drop policy if exists ot_recurring_all on recurring_schedules;
create policy recurring_select on recurring_schedules for select
  using (exists (select 1 from public.current_staff() where active));
create policy recurring_admin_write on recurring_schedules for all
  using (exists (select 1 from public.current_staff() where is_admin))
  with check (exists (select 1 from public.current_staff() where is_admin));

drop policy if exists ot_makeup_all on makeup_sessions;
create policy makeup_select on makeup_sessions for select
  using (exists (select 1 from public.current_staff() where active));
create policy makeup_admin_write on makeup_sessions for all
  using (exists (select 1 from public.current_staff() where is_admin))
  with check (exists (select 1 from public.current_staff() where is_admin));

drop policy if exists ot_goals_all on student_goal_overrides;
create policy goals_select on student_goal_overrides for select
  using (exists (select 1 from public.current_staff() where active));
create policy goals_admin_write on student_goal_overrides for all
  using (exists (select 1 from public.current_staff() where is_admin))
  with check (exists (select 1 from public.current_staff() where is_admin));

-- ---------------------------------------------------------------------------
-- Grants: anon should no longer have write access now that real sessions
-- exist. It only ever needs to reach auth.signInWithPassword, which doesn't
-- require table grants.
-- ---------------------------------------------------------------------------

revoke all on students, staff, assessments, recurring_schedules, makeup_sessions, student_goal_overrides, app_settings
  from anon;

-- ---------------------------------------------------------------------------
-- ROLLBACK (run this instead if something breaks and you need the app
-- working again immediately — restores the fully-open policies)
-- ---------------------------------------------------------------------------

-- drop policy if exists assessments_select on assessments;
-- drop policy if exists assessments_insert on assessments;
-- drop policy if exists assessments_update on assessments;
-- drop trigger if exists assessments_review_guard on assessments;
-- create policy ot_assessments_all on assessments for all using (true) with check (true);
--
-- drop policy if exists staff_select on staff;
-- drop policy if exists staff_admin_write on staff;
-- create policy ot_staff_all on staff for all using (true) with check (true);
--
-- drop policy if exists students_select on students;
-- drop policy if exists students_admin_write on students;
-- create policy ot_students_all on students for all using (true) with check (true);
--
-- drop policy if exists settings_select on app_settings;
-- drop policy if exists settings_admin_write on app_settings;
-- create policy ot_settings_all on app_settings for all using (true) with check (true);
--
-- drop policy if exists recurring_select on recurring_schedules;
-- drop policy if exists recurring_admin_write on recurring_schedules;
-- create policy ot_recurring_all on recurring_schedules for all using (true) with check (true);
--
-- drop policy if exists makeup_select on makeup_sessions;
-- drop policy if exists makeup_admin_write on makeup_sessions;
-- create policy ot_makeup_all on makeup_sessions for all using (true) with check (true);
--
-- drop policy if exists goals_select on student_goal_overrides;
-- drop policy if exists goals_admin_write on student_goal_overrides;
-- create policy ot_goals_all on student_goal_overrides for all using (true) with check (true);
--
-- grant all on students, staff, assessments, recurring_schedules, makeup_sessions, student_goal_overrides, app_settings
--   to anon, authenticated;
