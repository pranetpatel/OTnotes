import { supabase } from './supabase';
import { getSetPasswordUrl } from './appUrl';

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

async function adminStaffRequest(body: Record<string, unknown>): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Not signed in.');

  const functionsUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-create-staff`;
  const res = await fetch(functionsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error ?? `Staff admin request failed (${res.status})`);
}

/** Invite a new staff member by email — they set their own password via the link. */
export async function inviteStaff(params: {
  name: string;
  email: string;
  isOt: boolean;
  isAdmin: boolean;
}): Promise<void> {
  await adminStaffRequest({
    action: 'invite',
    name: params.name,
    email: params.email,
    isOt: params.isOt,
    isAdmin: params.isAdmin,
    redirectTo: getSetPasswordUrl(),
  });
}

/** Resend invite / password-setup email for an existing staff login. */
export async function resendStaffInvite(staffId: number): Promise<void> {
  await adminStaffRequest({
    action: 'resend_invite',
    staffId,
    email: '',
    redirectTo: getSetPasswordUrl(),
  });
}

/** Admin-triggered password reset email for a staff member. */
export async function sendStaffPasswordReset(staffId: number): Promise<void> {
  await adminStaffRequest({
    action: 'send_password_reset',
    staffId,
    email: '',
    redirectTo: getSetPasswordUrl(),
  });
}

/** Public "forgot password" — emails a reset link if the account exists. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getSetPasswordUrl(),
  });
  if (error) throw new Error(error.message);
}

/** Set or change password while authenticated via invite / recovery session. */
export async function updatePassword(password: string): Promise<void> {
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}
