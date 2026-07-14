-- Step 2 of 5 — run after step 1 succeeds.

create table if not exists staff (
  id bigserial primary key,
  name text not null,
  pin text not null,
  is_ot boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists staff_name_unique_idx on staff (lower(name));

select count(*) as staff_count from staff;
