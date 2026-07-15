-- OT Notes App — Migration v3: Supabase Auth linkage
-- Additive only. Old staff.pin / app_settings.admin_pin remain fully functional
-- throughout this phase — nothing is removed here. Run once in the Supabase SQL editor.

alter table staff add column if not exists auth_user_id uuid references auth.users(id);
alter table staff add column if not exists is_admin boolean not null default false;

create unique index if not exists staff_auth_user_id_unique_idx
  on staff(auth_user_id) where auth_user_id is not null;

-- Helper used by RLS policies (Phase 4) and app code: resolves the calling
-- session's staff profile via auth.uid(). SECURITY DEFINER so it can read
-- `staff` regardless of the caller's own row-level permissions on it.
create or replace function public.current_staff()
returns table (staff_id bigint, is_ot boolean, is_admin boolean, active boolean)
language sql security definer stable as $$
  select id, is_ot, is_admin, active from staff where auth_user_id = auth.uid()
$$;

select id, name, auth_user_id, is_admin, is_ot, active from staff order by name;
