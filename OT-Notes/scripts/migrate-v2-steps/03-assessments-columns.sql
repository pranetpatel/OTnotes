-- Step 3 of 5 — run after step 2 succeeds.

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

alter table recurring_schedules add column if not exists student_id bigint references students(id);
update recurring_schedules r set student_id = s.id
from students s where lower(r.student_name) = lower(s.name) and r.student_id is null;

alter table makeup_sessions add column if not exists student_id bigint references students(id);
update makeup_sessions m set student_id = s.id
from students s where lower(m.student_name) = lower(s.name) and m.student_id is null;

select
  (select count(*) from assessments where student_id is null) as assessments_missing_student_id,
  (select count(*) from recurring_schedules where student_id is null) as recurring_missing_student_id,
  (select count(*) from makeup_sessions where student_id is null) as makeup_missing_student_id;
