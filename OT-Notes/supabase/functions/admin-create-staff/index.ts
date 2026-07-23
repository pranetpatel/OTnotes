// Supabase Edge Function: admin-create-staff
//
// Invites (or re-invites) staff members and sends password-reset emails.
// Runs server-side because creating auth.users rows / sending auth mail
// requires the service-role key, which must never ship in the Expo client.
// Callers must already be signed in as staff with is_admin = true.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DEFAULT_APP_URL = Deno.env.get('APP_URL') ?? 'https://o-tnotes.vercel.app';

interface StaffAdminBody {
  action: 'invite' | 'resend_invite' | 'send_password_reset' | 'create' | 'reset_password';
  name?: string;
  email: string;
  password?: string;
  isOt?: boolean;
  isAdmin?: boolean;
  staffId?: number;
  redirectTo?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function resolveRedirectTo(requested?: string): string {
  const fallback = `${DEFAULT_APP_URL.replace(/\/$/, '')}/set-password`;
  if (!requested) return fallback;
  try {
    const url = new URL(requested);
    const allowedHosts = new Set([
      'o-tnotes.vercel.app',
      'localhost',
      '127.0.0.1',
    ]);
    // Allow the configured production host and any *.vercel.app preview.
    const hostOk =
      allowedHosts.has(url.hostname) ||
      url.hostname.endsWith('.vercel.app') ||
      url.hostname === new URL(DEFAULT_APP_URL).hostname;
    if (!hostOk) return fallback;
    if (!url.pathname.includes('set-password')) {
      url.pathname = '/set-password';
    }
    return url.toString();
  } catch {
    return fallback;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: 'Invalid or expired session' }, 401);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: callerStaff, error: staffLookupError } = await adminClient
    .from('staff')
    .select('id, is_admin, active')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();

  if (staffLookupError || !callerStaff || !callerStaff.is_admin || !callerStaff.active) {
    return jsonResponse({ error: 'Not authorized — admin access required' }, 403);
  }

  let body: StaffAdminBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const redirectTo = resolveRedirectTo(body.redirectTo);

  // --- Invite a brand-new staff member (they set their own password) ---
  if (body.action === 'invite' || body.action === 'create') {
    if (!body.email?.trim()) return jsonResponse({ error: 'email is required' }, 400);
    if (!body.name?.trim()) return jsonResponse({ error: 'name is required to invite staff' }, 400);

    const email = body.email.trim();
    const name = body.name.trim();

    // Legacy "create" with a password still works if an admin sends one,
    // but the app UI now invites without a password.
    if (body.action === 'create' && body.password && body.password.length >= 6) {
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
      });
      if (createError || !created?.user) {
        return jsonResponse({ error: createError?.message ?? 'Failed to create auth user' }, 400);
      }

      const { data: staffRow, error: insertError } = await adminClient
        .from('staff')
        .insert([{
          name,
          pin: '0000',
          is_ot: body.isOt ?? false,
          is_admin: body.isAdmin ?? false,
          active: true,
          auth_user_id: created.user.id,
        }])
        .select('id, name, is_ot, is_admin, active')
        .single();

      if (insertError) {
        await adminClient.auth.admin.deleteUser(created.user.id);
        return jsonResponse({ error: insertError.message }, 400);
      }

      return jsonResponse({ staff: staffRow });
    }

    let authUserId: string | null = null;

    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: { full_name: name },
      }
    );

    if (!inviteError && invited?.user) {
      authUserId = invited.user.id;
    } else {
      // User may already exist from a dashboard invite — look them up and
      // send a recovery email so they can still set a password.
      const { data: listed, error: listError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (listError) {
        return jsonResponse({ error: inviteError?.message ?? listError.message }, 400);
      }
      const existing = listed.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) {
        return jsonResponse({ error: inviteError?.message ?? 'Failed to send invite' }, 400);
      }
      authUserId = existing.id;
      const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) {
        return jsonResponse({ error: resetError.message }, 400);
      }
    }

    const { data: staffRow, error: insertError } = await adminClient
      .from('staff')
      .insert([{
        name,
        pin: '0000',
        is_ot: body.isOt ?? false,
        is_admin: body.isAdmin ?? false,
        active: true,
        auth_user_id: authUserId,
      }])
      .select('id, name, is_ot, is_admin, active')
      .single();

    if (insertError) {
      // Only roll back auth users we just created via invite (not pre-existing).
      if (!inviteError && authUserId) {
        await adminClient.auth.admin.deleteUser(authUserId);
      }
      return jsonResponse({ error: insertError.message }, 400);
    }

    return jsonResponse({ staff: staffRow, invited: !inviteError });
  }

  // --- Resend invite email for an existing staff auth user ---
  if (body.action === 'resend_invite') {
    if (!body.staffId) return jsonResponse({ error: 'staffId is required' }, 400);

    const { data: targetStaff, error: targetError } = await adminClient
      .from('staff')
      .select('auth_user_id, name')
      .eq('id', body.staffId)
      .maybeSingle();

    if (targetError || !targetStaff?.auth_user_id) {
      return jsonResponse({ error: 'Staff member not found or has no login yet' }, 404);
    }

    const { data: userRes, error: getUserError } = await adminClient.auth.admin.getUserById(
      targetStaff.auth_user_id
    );
    if (getUserError || !userRes?.user?.email) {
      return jsonResponse({ error: getUserError?.message ?? 'Could not load staff email' }, 400);
    }

    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(userRes.user.email, {
      redirectTo,
      data: { full_name: targetStaff.name },
    });
    if (inviteError) {
      // Existing users often can't be re-invited — fall back to recovery email.
      const { error: resetError } = await adminClient.auth.resetPasswordForEmail(userRes.user.email, {
        redirectTo,
      });
      if (resetError) {
        return jsonResponse({
          error: resetError.message || inviteError.message,
        }, 400);
      }
      return jsonResponse({ ok: true, via: 'recovery' });
    }

    return jsonResponse({ ok: true, via: 'invite' });
  }

  // --- Send password-reset email (forgot password / admin reset) ---
  if (body.action === 'send_password_reset') {
    if (!body.staffId) return jsonResponse({ error: 'staffId is required' }, 400);

    const { data: targetStaff, error: targetError } = await adminClient
      .from('staff')
      .select('auth_user_id')
      .eq('id', body.staffId)
      .maybeSingle();

    if (targetError || !targetStaff?.auth_user_id) {
      return jsonResponse({ error: 'Staff member not found or has no login yet' }, 404);
    }

    const { data: userRes, error: getUserError } = await adminClient.auth.admin.getUserById(
      targetStaff.auth_user_id
    );
    if (getUserError || !userRes?.user?.email) {
      return jsonResponse({ error: getUserError?.message ?? 'Could not load staff email' }, 400);
    }

    const { error: resetError } = await adminClient.auth.resetPasswordForEmail(userRes.user.email, {
      redirectTo,
    });
    if (resetError) return jsonResponse({ error: resetError.message }, 400);
    return jsonResponse({ ok: true });
  }

  // Legacy direct password reset (kept for compatibility)
  if (body.action === 'reset_password') {
    if (!body.staffId) return jsonResponse({ error: 'staffId is required to reset a password' }, 400);
    if (!body.password || body.password.length < 6) {
      return jsonResponse({ error: 'password must be at least 6 characters' }, 400);
    }

    const { data: targetStaff, error: targetError } = await adminClient
      .from('staff')
      .select('auth_user_id')
      .eq('id', body.staffId)
      .maybeSingle();

    if (targetError || !targetStaff?.auth_user_id) {
      return jsonResponse({ error: 'Staff member not found or has no login yet' }, 404);
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      targetStaff.auth_user_id,
      { password: body.password }
    );
    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400);
    }

    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: 'Unknown action' }, 400);
});
