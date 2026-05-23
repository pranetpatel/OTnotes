-- Run this in the OLD project SQL editor (camsudjrqwfmnmvwbhwd)
-- if you want to keep using that Supabase URL instead of migrating to a new project.
-- The live app expects this schema (not the original scripts/schema.sql).

drop table if exists assessments cascade;

create table assessments (
  id bigserial primary key,
  student_name text not null,
  supervisor_name text not null,
  timestamp timestamptz not null,
  goal1_selections jsonb default '[]'::jsonb,
  goal2_primary_selections jsonb default '[]'::jsonb,
  goal2_coordination_selections jsonb default '[]'::jsonb,
  goal3_selections jsonb default '[]'::jsonb,
  safety_skill_selections jsonb default '[]'::jsonb,
  notes text default ''
);

-- See scripts/schema.sql for the full set of OT Notes tables.
