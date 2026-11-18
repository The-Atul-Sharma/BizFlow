import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  clearDatabaseCache,
  refreshFromSupabase,
} from '@/services/db';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { authEmailForUsername } from '@/services/authEmail';
import { staffService } from '@/services/api';
import type { UserStaff } from '@/types';

export function useAuth() {
  const [currentUser, setCurrentUserState] = useState<UserStaff | null>(() => getCurrentUser());

  const refresh = useCallback(() => {
    setCurrentUserState(getCurrentUser());
  }, []);

  useEffect(() => {
    window.addEventListener('crm-user-changed', refresh);
    window.addEventListener('crm-data-updated', refresh);
    window.addEventListener('storage', refresh);

    let authSub: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured()) {
      const { data } = getSupabase().auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          clearCurrentUser();
          clearDatabaseCache();
        }
      });
      authSub = data.subscription;
    }

    return () => {
      window.removeEventListener('crm-user-changed', refresh);
      window.removeEventListener('crm-data-updated', refresh);
      window.removeEventListener('storage', refresh);
      authSub?.unsubscribe();
    };
  }, [refresh]);

  const login = async (
    username: string,
    pass: string,
  ): Promise<{ success: boolean; message: string; user?: UserStaff }> => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !pass) {
      return { success: false, message: 'Please enter both username and password.' };
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      const email = authEmailForUsername(cleanUsername);

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (signInError || !authData.user) {
        return { success: false, message: 'Invalid username or password.' };
      }

      const { data: profile, error: profileErr } = await supabase
        .from('staff')
        .select('*')
        .eq('id', authData.user.id)
        .eq('active', true)
        .maybeSingle();

      if (profileErr || !profile) {
        await supabase.auth.signOut();
        clearCurrentUser();
        clearDatabaseCache();
        if (profileErr?.message?.includes('schema cache')) {
          return {
            success: false,
            message: 'Database tables not initialized yet. Run 001_initial_schema.sql in Supabase.',
          };
        }
        return {
          success: false,
          message: 'This account is inactive or not authorized. Contact Admin.',
        };
      }

      const user: UserStaff = {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        password: profile.password ?? 'auth-managed',
        role: profile.role,
        mobile: profile.mobile,
        email: profile.email ?? undefined,
        zone: profile.zone ?? '',
        active: Boolean(profile.active),
        lastLogin: new Date().toISOString(),
        createdAt: profile.created_at ?? undefined,
      };

      setCurrentUser(user);

      // Update last_login and hydrate all business tables only after authenticated
      void supabase
        .from('staff')
        .update({ last_login: user.lastLogin })
        .eq('id', user.id);

      try {
        await refreshFromSupabase();
      } catch (err) {
        console.error('Failed to hydrate CRM data after login:', err);
      }

      return { success: true, message: `Welcome back, ${user.name}!`, user };
    }

    // Local non-Supabase fallback
    const user = staffService.authenticate(cleanUsername, pass);
    if (!user) {
      const exists = staffService
        .list()
        .find((u) => u.username.toLowerCase() === cleanUsername);
      if (exists && !exists.active) {
        return {
          success: false,
          message: 'This user account has been disabled. Contact Admin.',
        };
      }
      return { success: false, message: 'Invalid username or password.' };
    }

    const updated =
      staffService.update(user.id, { lastLogin: new Date().toISOString() }) ?? user;
    setCurrentUser(updated);
    return { success: true, message: `Welcome back, ${updated.name}!`, user: updated };
  };

  const logout = () => {
    if (isSupabaseConfigured()) {
      void getSupabase()
        .auth.signOut({ scope: 'local' })
        .catch(() => {});
    }
    clearCurrentUser();
    clearDatabaseCache();
  };

  const switchUser = (user: UserStaff) => {
    setCurrentUser(user);
  };

  return {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'Admin',
    login,
    logout,
    switchUser,
  };
}
