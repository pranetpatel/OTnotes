-- Step 1 of 5 — run alone, confirm it succeeds, then move to step 2.

create table if not exists students (
  id bigserial primary key,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists students_name_idx on students (lower(name));

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

select count(*) as student_count from students;
