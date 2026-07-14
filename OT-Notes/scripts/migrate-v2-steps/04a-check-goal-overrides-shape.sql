-- Diagnostic — run this BEFORE step 4 and paste me the result.
-- Confirms the actual live column names/types of student_goal_overrides.

select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'student_goal_overrides'
order by ordinal_position;
