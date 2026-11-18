import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchAllFromSupabase } from './supabaseSync';
import type { CRMDatabase, CompanySettings, UserStaff } from '@/types';

const STORAGE_KEY = 'bizflow_crm:db:v2-clean';
const CURRENT_USER_KEY = 'bizflow_crm:current_user';

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'BizFlow',
  tagline: '',
  gstin: '',
  phone: '',
  email: '',
  address: '',
  defaultCreditDays: 30,
  defaultGstPercent: 18,
};

function createEmptyDatabase(): CRMDatabase {
  return {
    customers: [],
    enquiries: [],
    quotations: [],
    followUps: [],
    complaints: [],
    payments: [],
    staff: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

let memoryDb: CRMDatabase | null = null;

function clearLegacyMockKeys() {
  try {
    localStorage.removeItem('bizflow_crm:db:v1');
    localStorage.removeItem('autoops_crm:db:v1');
    localStorage.removeItem('autoops_crm:db:v2');
  } catch {
    // ignore
  }
}

export function clearDatabaseCache(): void {
  memoryDb = createEmptyDatabase();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('crm-data-updated'));
}

export function getDatabase(): CRMDatabase {
  if (memoryDb) return memoryDb;

  clearLegacyMockKeys();

  // When Supabase is configured, never hydrate unauthenticated data from localStorage
  if (isSupabaseConfigured()) {
    memoryDb = createEmptyDatabase();
    return memoryDb;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CRMDatabase;
      if (parsed && Array.isArray(parsed.customers)) {
        parsed.staff = (parsed.staff ?? []).filter((s) => (s.role as string) !== 'Manager');
        if (!parsed.settings) parsed.settings = { ...DEFAULT_SETTINGS };
        memoryDb = parsed;
        return memoryDb;
      }
    }
  } catch (err) {
    console.error('Failed to parse database from localStorage:', err);
  }

  memoryDb = createEmptyDatabase();
  saveDatabase(memoryDb);
  return memoryDb;
}

export function saveDatabase(db: CRMDatabase): void {
  memoryDb = db;
  if (!isSupabaseConfigured()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (err) {
      console.error('Failed to save database to localStorage:', err);
    }
  }
  window.dispatchEvent(new Event('crm-data-updated'));
}

export async function refreshFromSupabase(): Promise<CRMDatabase> {
  if (!isSupabaseConfigured()) {
    return getDatabase();
  }
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  if (!session?.user) {
    clearDatabaseCache();
    return getDatabase();
  }
  const remote = await fetchAllFromSupabase();
  saveDatabase(remote);
  return remote;
}

export async function bootstrapDatabase(): Promise<void> {
  clearLegacyMockKeys();

  if (!isSupabaseConfigured()) {
    getDatabase();
    return;
  }

  const supabase = getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Not logged in -> make ZERO table API calls and ensure local cache is empty
  if (!session?.user) {
    clearCurrentUser();
    clearDatabaseCache();
    return;
  }

  // Logged in -> validate JWT with Supabase Auth and verify active staff profile
  try {
    const {
      data: { user: authUser },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !authUser) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      clearCurrentUser();
      clearDatabaseCache();
      return;
    }

    const { data: profile, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', authUser.id)
      .eq('active', true)
      .maybeSingle();

    if (error || !profile) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      clearCurrentUser();
      clearDatabaseCache();
      return;
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
      lastLogin: profile.last_login ?? undefined,
      createdAt: profile.created_at ?? undefined,
    };
    setCurrentUser(user);
    await refreshFromSupabase();
  } catch (err) {
    console.error('Failed to restore authenticated session:', err);
    clearCurrentUser();
    clearDatabaseCache();
  }
}

export function getCurrentUser(): UserStaff | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserStaff;
    if (!parsed || !parsed.id) return null;

    const db = getDatabase();
    if (db.staff.length > 0) {
      const fresh = db.staff.find((s) => s.id === parsed.id);
      if (!fresh || !fresh.active) {
        localStorage.removeItem(CURRENT_USER_KEY);
        return null;
      }
      return fresh;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to get current user:', err);
    return null;
  }
}

export function setCurrentUser(user: UserStaff): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('crm-user-changed'));
  } catch (err) {
    console.error('Failed to set current user:', err);
  }
}

export function clearCurrentUser(): void {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.dispatchEvent(new Event('crm-user-changed'));
  } catch (err) {
    console.error('Failed to clear current user:', err);
  }
}
