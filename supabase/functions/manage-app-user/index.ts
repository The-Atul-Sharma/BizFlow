import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Role = 'Admin' | 'Sales' | 'Service';

type Body =
  | {
      action: 'create';
      name: string;
      username: string;
      mobile: string;
      email?: string;
      zone: string;
      password: string;
      role: Role;
    }
  | {
      action: 'update';
      id: string;
      name: string;
      username: string;
      mobile: string;
      email?: string;
      zone: string;
      password?: string;
      role: Role;
      active?: boolean;
    }
  | {
      action: 'toggle_active';
      id: string;
      active: boolean;
    }
  | {
      action: 'delete';
      id: string;
    };

function authEmailForUsername(username: string): string {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${normalized || 'user'}@users.bizflow.app`;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: 'Server misconfigured' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: callerAuth },
      error: callerErr,
    } = await callerClient.auth.getUser();
    if (callerErr || !callerAuth) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: callerProfile } = await admin
      .from('staff')
      .select('id, role, active')
      .eq('id', callerAuth.id)
      .maybeSingle();

    if (!callerProfile?.active || callerProfile.role !== 'Admin') {
      return json({ error: 'Only Admin can manage users' }, 403);
    }

    const body = (await req.json()) as Body;

    if (body.action === 'create') {
      const username = body.username.trim().toLowerCase();
      const email = authEmailForUsername(username);
      const { data: createdAuth, error: createAuthError } = await admin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
        user_metadata: { username, name: body.name },
      });
      if (createAuthError || !createdAuth.user) {
        return json({ error: createAuthError?.message ?? 'Could not create auth user' }, 400);
      }

      const row = {
        id: createdAuth.user.id,
        name: body.name.trim(),
        username,
        mobile: body.mobile.trim(),
        email: body.email?.trim() || null,
        zone: body.zone?.trim() || '',
        password: 'auth-managed',
        role: body.role,
        active: true,
      };
      const { data: created, error: insertError } = await admin
        .from('staff')
        .insert(row)
        .select('*')
        .single();
      if (insertError) {
        await admin.auth.admin.deleteUser(createdAuth.user.id);
        return json({ error: insertError.message }, 400);
      }
      return json({ user: created });
    }

    if (body.action === 'update') {
      const username = body.username.trim().toLowerCase();
      const email = authEmailForUsername(username);
      const authPatch: { email: string; password?: string; user_metadata: Record<string, string> } = {
        email,
        user_metadata: { username, name: body.name },
      };
      if (body.password) authPatch.password = body.password;

      const { error: authUpdateError } = await admin.auth.admin.updateUserById(body.id, authPatch);
      if (authUpdateError) return json({ error: authUpdateError.message }, 400);

      const patch: Record<string, unknown> = {
        name: body.name.trim(),
        username,
        mobile: body.mobile.trim(),
        email: body.email?.trim() || null,
        zone: body.zone?.trim() || '',
        role: body.role,
      };
      if (body.password) patch.password = 'auth-managed';
      if (typeof body.active === 'boolean') patch.active = body.active;

      const { data: updated, error: updateError } = await admin
        .from('staff')
        .update(patch)
        .eq('id', body.id)
        .select('*')
        .single();
      if (updateError) return json({ error: updateError.message }, 400);
      return json({ user: updated });
    }

    if (body.action === 'toggle_active') {
      if (body.id === callerAuth.id && !body.active) {
        return json({ error: 'You cannot deactivate your own account' }, 400);
      }
      const { data: updated, error: updateError } = await admin
        .from('staff')
        .update({ active: body.active })
        .eq('id', body.id)
        .select('*')
        .single();
      if (updateError) return json({ error: updateError.message }, 400);
      return json({ user: updated });
    }

    if (body.action === 'delete') {
      if (body.id === callerAuth.id) {
        return json({ error: 'You cannot delete your own account' }, 400);
      }
      const { data: admins } = await admin
        .from('staff')
        .select('id')
        .eq('role', 'Admin')
        .eq('active', true);
      const target = await admin.from('staff').select('role').eq('id', body.id).maybeSingle();
      if (target.data?.role === 'Admin' && (admins?.length ?? 0) <= 1) {
        return json({ error: 'Cannot delete the last admin' }, 400);
      }

      const { error: deleteRowError } = await admin.from('staff').delete().eq('id', body.id);
      if (deleteRowError) return json({ error: deleteRowError.message }, 400);
      await admin.auth.admin.deleteUser(body.id);
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});
