-- Migration v5 — adds columns for the new Super Swims tracking sheet format
-- (Participation, Support Required, Strategies Used, per-goal comments).
-- Safe to re-run. Existing rows keep their legacy goal1_selections/etc data;
-- the app falls back to that legacy display when these new columns are empty.

alter table assessments add column if not exists participation_selections jsonb default '[]';
alter table assessments add column if not exists support_selections jsonb default '[]';
alter table assessments add column if not exists strategy_selections jsonb default '[]';
alter table assessments add column if not exists strategy_other text default '';
alter table assessments add column if not exists goal_comments jsonb default '[]';
