import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, setCurrentUser } from '@/services/db';
import { staffService } from '@/services/api';
import type { UserStaff } from '@/types';

export function useAuth() {
  const [currentUser, setCurrentUserState] = useState<UserStaff>(() => getCurrentUser());

  const refresh = useCallback(() => {
    setCurrentUserState(getCurrentUser());
  }, []);

  useEffect(() => {
    window.addEventListener('crm-user-changed', refresh);
    window.addEventListener('crm-data-updated', refresh);
    return () => {
      window.removeEventListener('crm-user-changed', refresh);
      window.removeEventListener('crm-data-updated', refresh);
    };
  }, [refresh]);

  const login = (username: string, pass: string): { success: boolean; message: string; user?: UserStaff } => {
    const user = staffService.authenticate(username, pass);
    if (!user) {
      // Check if user exists but inactive
      const exists = staffService.list().find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (exists && !exists.active) {
        return { success: false, message: 'This user account has been disabled. Contact Admin.' };
      }
      return { success: false, message: 'Invalid username or password.' };
    }

    setCurrentUser(user);
    return { success: true, message: `Welcome back, ${user.name}!`, user };
  };

  const switchUser = (user: UserStaff) => {
    setCurrentUser(user);
  };

  return {
    currentUser,
    isAdmin: currentUser.role === 'Admin',
    isManager: currentUser.role === 'Manager' || currentUser.role === 'Admin',
    login,
    switchUser,
  };
}
