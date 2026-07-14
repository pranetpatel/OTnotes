-- Diagnostic — confirms every table with RLS enabled also has a policy.
-- If any table shows rls_enabled = true and policy_count = 0, the anon-key
-- client will get blocked (empty results / permission errors) on that table.

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.polname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('students','staff','assessments','student_goal_overrides','recurring_schedules','makeup_sessions','app_settings')
group by c.relname, c.relrowsecurity
order by c.relname;
