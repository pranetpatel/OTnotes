-- Diagnostic — run this to see why only 1 row matched in step 4.

-- How many rows are actually in the old table?
select count(*) as old_overrides_count from student_goal_overrides;

-- Which student_name values in the old table have NO matching student?
select o.student_name
from student_goal_overrides o
where not exists (
  select 1 from students s where lower(s.name) = lower(o.student_name)
);
