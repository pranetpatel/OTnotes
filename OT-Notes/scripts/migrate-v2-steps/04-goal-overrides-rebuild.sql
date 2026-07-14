-- Step 4 of 5 — run after confirming steps 1-3 succeeded and the 04a diagnostic
-- matched: student_name text, focus text, active_goals jsonb, safety_skills jsonb,
-- adaptations jsonb, progress_note text.

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

select count(*) as overrides_migrated from student_goal_overrides_new;
