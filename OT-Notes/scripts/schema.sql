-- OT Notes App — Supabase schema (matches app code)
-- Run the FULL script in Supabase SQL Editor (OTNotes project).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists recurring_schedules (
  id text primary key,
  student_name text not null,
  day_of_week integer not null,
  time_slot_id text not null
);

create table if not exists makeup_sessions (
  id text primary key,
  student_name text not null,
  date text not null,
  time_slot_id text not null,
  note text
);

create table if not exists student_goal_overrides (
  student_name text primary key,
  focus text,
  active_goals jsonb default '[]',
  safety_skills jsonb default '[]',
  adaptations jsonb default '[]',
  progress_note text
);

create table if not exists app_settings (
  key text primary key,
  value text not null
);

-- Replace legacy assessments table (old schema used text id + different columns)
drop table if exists assessments cascade;

create table assessments (
  id bigserial primary key,
  student_name text not null,
  supervisor_name text not null,
  timestamp timestamptz not null,
  goal1_selections jsonb default '[]',
  goal2_primary_selections jsonb default '[]',
  goal2_coordination_selections jsonb default '[]',
  goal3_selections jsonb default '[]',
  safety_skill_selections jsonb default '[]',
  notes text default ''
);

insert into app_settings (key, value)
values ('admin_pin', '1234')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS (safe to re-run)
-- ---------------------------------------------------------------------------

alter table recurring_schedules enable row level security;
alter table makeup_sessions enable row level security;
alter table student_goal_overrides enable row level security;
alter table app_settings enable row level security;
alter table assessments enable row level security;

drop policy if exists ot_recurring_all on recurring_schedules;
create policy ot_recurring_all on recurring_schedules for all using (true) with check (true);

drop policy if exists ot_makeup_all on makeup_sessions;
create policy ot_makeup_all on makeup_sessions for all using (true) with check (true);

drop policy if exists ot_goals_all on student_goal_overrides;
create policy ot_goals_all on student_goal_overrides for all using (true) with check (true);

drop policy if exists ot_settings_all on app_settings;
create policy ot_settings_all on app_settings for all using (true) with check (true);

drop policy if exists ot_assessments_all on assessments;
create policy ot_assessments_all on assessments for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant all on recurring_schedules, makeup_sessions, student_goal_overrides, app_settings, assessments to anon, authenticated;
grant usage, select on sequence assessments_id_seq to anon, authenticated;
