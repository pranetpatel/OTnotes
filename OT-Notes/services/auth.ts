import { supabase } from './supabase';

export interface StaffProfile {
  id: number;
  name: string;
  isOt: boolean;
  isAdmin: boolean;
  active: boolean;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentStaffProfile(): Promise<StaffProfile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('staff')
    .select('id, name, is_ot, is_admin, active')
    .eq('auth_user_id', userId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    isOt: data.is_ot,
    isAdmin: data.is_admin,
    active: data.active,
  };
}

/**
 * Verifies a password for a specific staff login without disturbing the
 * caller's own active session — used for the OT sign-off re-auth step, where
 * a currently logged-in supervisor must not be silently swapped to the OT's
 * identity just by confirming the OT's password.
 */
export async function verifyStaffPassword(email: string, password: string): Promise<boolean> {
  const { data: before } = await supabase.auth.getSession();
  const restoreToken = before?.session?.refresh_token ?? null;

  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  const ok = !error;

  if (restoreToken) {
    await supabase.auth.refreshSession({ refresh_token: restoreToken });
  } else if (ok) {
    // The verification call itself established a session but there was no
    // prior one to restore — sign back out so this call stays read-only.
    await supabase.auth.signOut();
  }

  return ok;
}

export async function createStaffLogin(params: {
  name: string;
  email: string;
  password: string;
  isOt: boolean;
  isAdmin: boolean;
}): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Not signed in.');

  const functionsUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-create-staff`;
  const res = await fetch(functionsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'create', ...params }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? `Failed to create staff login (${res.status})`);
}

export async function resetStaffPassword(staffId: number, password: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Not signed in.');

  const functionsUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-create-staff`;
  const res = await fetch(functionsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'reset_password', staffId, password, email: '' }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? `Failed to reset password (${res.status})`);
}
