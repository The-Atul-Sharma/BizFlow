import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, setCurrentUser, clearCurrentUser } from '@/services/db';
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
    return () => {
      window.removeEventListener('crm-user-changed', refresh);
      window.removeEventListener('crm-data-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const login = (
    username: string,
    pass: string,
  ): { success: boolean; message: string; user?: UserStaff } => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !pass) {
      return { success: false, message: 'Please enter both username and password.' };
    }

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
    clearCurrentUser();
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
