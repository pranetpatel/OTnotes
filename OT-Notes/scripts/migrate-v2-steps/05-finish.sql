-- Step 5 of 5 — final cutover. Run after confirming step 4's migrated count
-- looks right (1 is correct if the old table only ever had 1 row).

drop table if exists student_goal_overrides;
alter table student_goal_overrides_new rename to student_goal_overrides;

-- RLS (kept open, consistent with the rest of the schema — see SECURITY.md
-- for the tradeoff: PINs are an app-level workflow gate, not DB enforcement,
-- because the client uses the anon key only with no Supabase Auth)
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

select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('students','staff','assessments','student_goal_overrides','recurring_schedules','makeup_sessions');
