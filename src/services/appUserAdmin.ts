import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserStaff } from '@/types';

export type ManageAppUserInput =
  | {
      action: 'create';
      name: string;
      username: string;
      mobile: string;
      email?: string;
      zone: string;
      password: string;
      role: UserStaff['role'];
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
      role: UserStaff['role'];
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

function mapStaffRow(r: any): UserStaff {
  return {
    id: r.id,
    name: r.name,
    username: r.username,
    password: r.password ?? 'auth-managed',
    role: r.role,
    mobile: r.mobile,
    email: r.email ?? undefined,
    zone: r.zone ?? '',
    active: Boolean(r.active),
    lastLogin: r.last_login ?? undefined,
    createdAt: r.created_at ?? undefined,
  };
}

export async function manageAppUser(input: ManageAppUserInput): Promise<UserStaff | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  const supabase = getSupabase();

  // 1. Toggle active status works directly via Admin RLS on public.staff (no Edge Function required)
  if (input.action === 'toggle_active') {
    const { data, error } = await supabase
      .from('staff')
      .update({ active: input.active })
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapStaffRow(data);
  }

  // 2. Profile updates (and changing your OWN password) work directly without requiring the Edge Function
  if (input.action === 'update') {
    let {
      data: { user: currentAuth },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !currentAuth) {
      const refreshed = await supabase.auth.refreshSession();
      currentAuth = refreshed.data.user;
      if (!currentAuth) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        throw new Error('Your session expired. Please sign out and sign in again.');
      }
    }

    const { data: existing } = await supabase
      .from('staff')
      .select('username')
      .eq('id', input.id)
      .maybeSingle();

    const usernameChanged =
      existing && existing.username.toLowerCase() !== input.username.trim().toLowerCase();
    const isSelf = currentAuth?.id === input.id;

    // Can update directly if: not changing username, AND (no password change OR changing own password)
    if (!usernameChanged && (!input.password || isSelf)) {
      if (input.password && isSelf) {
        const { error: pwErr } = await supabase.auth.updateUser({
          password: input.password,
        });
        if (pwErr) throw new Error(pwErr.message);
      }

      const patch: Record<string, unknown> = {
        name: input.name.trim(),
        mobile: input.mobile.trim(),
        email: input.email?.trim() || null,
        zone: input.zone?.trim() || '',
        role: input.role,
      };
      if (typeof input.active === 'boolean') patch.active = input.active;

      const { data, error } = await supabase
        .from('staff')
        .update(patch)
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapStaffRow(data);
    }
  }

  // 3. Operations that modify other users' Auth accounts (create user, delete user, reset another user's password/username)
  const { data, error } = await supabase.functions.invoke('manage-app-user', {
    body: input,
  });
  if (error) {
    const msg = error.message || '';
    if (msg.includes('Failed to send a request') || msg.includes('Edge Function')) {
      throw new Error(
        'Edge Function "manage-app-user" is not deployed in Supabase yet. Deploy supabase/functions/manage-app-user/index.ts in Supabase Dashboard -> Edge Functions.',
      );
    }
    throw new Error(msg || 'User admin request failed');
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }
  if (input.action === 'delete') return null;
  return mapStaffRow(data.user);
}
