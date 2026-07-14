-- OT Notes App — Migration v2
-- Adds: students table, staff table, assessment student_id/staff_id/status/review columns.
-- Run the FULL script once in the Supabase SQL editor (OTNotes project).
-- Safe to re-run (uses if not exists / on conflict where practical).

-- ---------------------------------------------------------------------------
-- 1. students
-- ---------------------------------------------------------------------------

create table if not exists students (
  id bigserial primary key,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists students_name_idx on students (lower(name));

-- Backfill from the hardcoded roster (constants/data.ts STUDENTS), then reconcile
-- any stray names that only appear in historical tables.
insert into students (name)
select v.name from (values
  ('Alex Johnson'), ('Maya Patel'), ('Liam Rodriguez'), ('Emma Chen'),
  ('Noah Williams'), ('Sophia Davis'), ('Oliver Martinez'), ('Ava Thompson'),
  ('Elijah Garcia'), ('Isabella Lee'), ('Lucas Wilson'), ('Mia Anderson'),
  ('Mason Taylor'), ('Charlotte Brown'), ('Aiden Moore')
) as v(name)
where not exists (select 1 from students s where lower(s.name) = lower(v.name));

insert into students (name)
select distinct a.student_name from assessments a
where not exists (select 1 from students s where lower(s.name) = lower(a.student_name));

insert into students (name)
select distinct r.student_name from recurring_schedules r
where not exists (select 1 from students s where lower(s.name) = lower(r.student_name));

insert into students (name)
select distinct m.student_name from makeup_sessions m
where not exists (select 1 from students s where lower(s.name) = lower(m.student_name));

insert into students (name)
select distinct o.student_name from student_goal_overrides o
where not exists (select 1 from students s where lower(s.name) = lower(o.student_name));

-- ---------------------------------------------------------------------------
-- 2. staff
-- ---------------------------------------------------------------------------

create table if not exists staff (
  id bigserial primary key,
  name text not null,
  pin text not null,
  is_ot boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists staff_name_unique_idx on staff (lower(name));

-- No existing staff data to migrate (supervisor_name was always free text).
-- Seed real staff via the new Admin UI before relying on this feature.

-- ---------------------------------------------------------------------------
-- 3. assessments: FK + review/sign-off columns
-- ---------------------------------------------------------------------------

alter table assessments add column if not exists student_id bigint references students(id);
alter table assessments add column if not exists staff_id bigint references staff(id);
alter table assessments add column if not exists status text not null default 'draft';
alter table assessments drop constraint if exists assessments_status_check;
alter table assessments add constraint assessments_status_check check (status in ('draft', 'reviewed'));
alter table assessments add column if not exists reviewed_by bigint references staff(id);
alter table assessments add column if not exists reviewed_at timestamptz;
alter table assessments add column if not exists review_notes text;

update assessments a set student_id = s.id
from students s where lower(a.student_name) = lower(s.name) and a.student_id is null;

-- staff_id stays null until real staff are seeded and future notes are saved
-- with an authenticated staff member; historical rows keep supervisor_name only.

-- ---------------------------------------------------------------------------
-- 4. recurring_schedules / makeup_sessions: add student_id
-- ---------------------------------------------------------------------------

alter table recurring_schedules add column if not exists student_id bigint references students(id);
update recurring_schedules r set student_id = s.id
from students s where lower(r.student_name) = lower(s.name) and r.student_id is null;

alter table makeup_sessions add column if not exists student_id bigint references students(id);
update makeup_sessions m set student_id = s.id
from students s where lower(m.student_name) = lower(s.name) and m.student_id is null;

-- ---------------------------------------------------------------------------
-- 5. student_goal_overrides: rebuild onto student_id primary key
-- ---------------------------------------------------------------------------

create table if not exists student_goal_overrides_new (
  student_id bigint primary key references students(id),
  focus text,
  active_goals jsonb default '[]',
  safety_skills jsonb default '[]',
  adaptations jsonb default '[]',
  progress_note text
);

insert into student_goal_overrides_new (student_id, focus, active_goals, safety_skills, adaptations, progress_note)
select s.id, o.focus, o.active_goals, o.safety_skills, o.adaptations, o.progress_note
from student_goal_overrides o
join students s on lower(o.student_name) = lower(s.name)
on conflict (student_id) do nothing;

drop table if exists student_goal_overrides;
alter table student_goal_overrides_new rename to student_goal_overrides;

-- ---------------------------------------------------------------------------
-- RLS (kept open, consistent with the rest of the schema — see SECURITY.md
-- for the tradeoff: PINs are an app-level workflow gate, not DB enforcement,
-- because the client uses the anon key only with no Supabase Auth)
-- ---------------------------------------------------------------------------

alter table students enable row level security;
alter table staff enable row level security;
alter table student_goal_overrides enable row level security;

drop policy if exists ot_students_all on students;
create policy ot_students_all on students for all using (true) with check (true);

drop policy if exists ot_staff_all on staff;
create policy ot_staff_all on staff for all using (true) with check (true);

drop policy if exists ot_goals_all on student_goal_overrides;
create policy ot_goals_all on student_goal_overrides for all using (true) with check (true);

grant all on students, staff, student_goal_overrides to anon, authenticated;
grant usage, select on sequence students_id_seq to anon, authenticated;
grant usage, select on sequence staff_id_seq to anon, authenticated;
