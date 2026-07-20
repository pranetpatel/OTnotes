import { supabase } from './supabase';

export interface StaffMember {
  id: number;
  name: string;
  isOt: boolean;
  isAdmin: boolean;
  active: boolean;
  hasLogin: boolean;
}

export async function getAllStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('id, name, is_ot, is_admin, active, auth_user_id')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    isOt: row.is_ot,
    isAdmin: row.is_admin,
    active: row.active,
    hasLogin: !!row.auth_user_id,
  }));
}

export async function getActiveStaff(): Promise<StaffMember[]> {
  const all = await getAllStaff();
  return all.filter(s => s.active);
}

export async function updateStaff(id: number, patch: { name?: string; isOt?: boolean; isAdmin?: boolean; active?: boolean }): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.isOt !== undefined) dbPatch.is_ot = patch.isOt;
  if (patch.isAdmin !== undefined) dbPatch.is_admin = patch.isAdmin;
  if (patch.active !== undefined) dbPatch.active = patch.active;
  const { error } = await supabase.from('staff').update(dbPatch).eq('id', id);
  if (error) throw new Error(error.message);
}
