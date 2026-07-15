import { supabase } from './supabase';

export interface StaffMember {
  id: number;
  name: string;
  isOt: boolean;
  active: boolean;
}

export async function getAllStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('id, name, is_ot, active')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    isOt: row.is_ot,
    active: row.active,
  }));
}

export async function getActiveStaff(): Promise<StaffMember[]> {
  const all = await getAllStaff();
  return all.filter(s => s.active);
}

export async function addStaff(name: string, pin: string, isOt: boolean): Promise<StaffMember> {
  const { data, error } = await supabase
    .from('staff')
    .insert([{ name: name.trim(), pin, is_ot: isOt }])
    .select('id, name, is_ot, active')
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name, isOt: data.is_ot, active: data.active };
}

export async function updateStaff(id: number, patch: { name?: string; isOt?: boolean; active?: boolean }): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.isOt !== undefined) dbPatch.is_ot = patch.isOt;
  if (patch.active !== undefined) dbPatch.active = patch.active;
  const { error } = await supabase.from('staff').update(dbPatch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setStaffPin(id: number, newPin: string): Promise<void> {
  const { error } = await supabase.from('staff').update({ pin: newPin }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function verifyStaffPin(staffId: number, pin: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('staff')
    .select('pin')
    .eq('id', staffId)
    .maybeSingle();
  if (error || !data) return false;
  return (data as any).pin === pin;
}
