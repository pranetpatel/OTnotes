-- OT Notes App — Supabase schema
-- Run this in the Supabase SQL editor or via the seed script

create table if not exists recurring_schedules (
  id text primary key,
  student_name text not null,
  day_of_week integer not null,  -- 0=Sun, 1=Mon, ... 6=Sat
  time_slot_id text not null
);

create table if not exists makeup_sessions (
  id text primary key,
  student_name text not null,
  date text not null,            -- YYYY-MM-DD
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

create table if not exists assessments (
  id text primary key,
  student_name text not null,
  date text not null,            -- YYYY-MM-DD or ISO timestamp
  goal1 text,
  goal2_primary text,
  goal2_coordination text,
  goal3 text,
  safety_skills text,
  voice_note text,
  created_at timestamptz default now()
);

-- Seed default admin PIN
insert into app_settings (key, value)
values ('admin_pin', '1234')
on conflict (key) do nothing;
