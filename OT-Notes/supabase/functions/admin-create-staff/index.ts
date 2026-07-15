// Supabase Edge Function: admin-create-staff
//
// Creates (or resets the password for) a staff member's Supabase Auth login.
// Runs server-side because creating auth.users rows requires the service-role
// key, which must never ship in the Expo client bundle. Callers must already
// be signed in as a staff member with is_admin = true — enforced below by
// re-checking the caller's own JWT against the `staff` table before doing
// anything privileged.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface CreateStaffBody {
  action: 'create' | 'reset_password';
  name?: string;
  email: string;
  password: string;
  isOt?: boolean;
  isAdmin?: boolean;
  staffId?: number; // required for reset_password
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  // Client bound to the CALLER's JWT — used only to verify who is calling.
  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: 'Invalid or expired session' }, 401);
  }

  // Service-role client — used for the actual privileged work below.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: callerStaff, error: staffLookupError } = await adminClient
    .from('staff')
    .select('id, is_admin, active')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();

  if (staffLookupError || !callerStaff || !callerStaff.is_admin || !callerStaff.active) {
    return jsonResponse({ error: 'Not authorized — admin access required' }, 403);
  }

  let body: CreateStaffBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.email || !body.password) {
    return jsonResponse({ error: 'email and password are required' }, 400);
  }

  if (body.action === 'create') {
    if (!body.name) return jsonResponse({ error: 'name is required to create staff' }, 400);

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });
    if (createError || !created?.user) {
      return jsonResponse({ error: createError?.message ?? 'Failed to create auth user' }, 400);
    }

    const { data: staffRow, error: insertError } = await adminClient
      .from('staff')
      .insert([{
        name: body.name.trim(),
        pin: '0000', // legacy column, unused once auth is live; kept NOT NULL-safe during transition
        is_ot: body.isOt ?? false,
        is_admin: body.isAdmin ?? false,
        active: true,
        auth_user_id: created.user.id,
      }])
      .select('id, name, is_ot, is_admin, active')
      .single();

    if (insertError) {
      // Roll back the auth user so we don't leave an orphaned login with no staff row.
      await adminClient.auth.admin.deleteUser(created.user.id);
      return jsonResponse({ error: insertError.message }, 400);
    }

    return jsonResponse({ staff: staffRow });
  }

  if (body.action === 'reset_password') {
    if (!body.staffId) return jsonResponse({ error: 'staffId is required to reset a password' }, 400);

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
