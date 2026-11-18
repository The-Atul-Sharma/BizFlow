import {
  MOCK_CUSTOMERS,
  MOCK_ENQUIRIES,
  MOCK_QUOTATIONS,
  MOCK_FOLLOW_UPS,
  MOCK_COMPLAINTS,
  MOCK_PAYMENTS,
  MOCK_STAFF,
  DEFAULT_SETTINGS,
} from './mockData';
import type { CRMDatabase, UserStaff } from '@/types';

const STORAGE_KEY = 'bizflow_crm:db:v1';
const CURRENT_USER_KEY = 'bizflow_crm:current_user';

export function getDatabase(): CRMDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CRMDatabase;
      if (parsed && Array.isArray(parsed.customers)) {
        if (!parsed.staff || parsed.staff.length === 0 || !parsed.staff[0].username) {
          parsed.staff = MOCK_STAFF;
        } else {
          // Migrate any legacy 'Manager' role records out cleanly
          parsed.staff = parsed.staff.filter((s) => (s.role as string) !== 'Manager');
        }
        if (!parsed.settings) {
          parsed.settings = DEFAULT_SETTINGS;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse database from localStorage:', err);
  }

  const initial: CRMDatabase = {
    customers: MOCK_CUSTOMERS,
    enquiries: MOCK_ENQUIRIES,
    quotations: MOCK_QUOTATIONS,
    followUps: MOCK_FOLLOW_UPS,
    complaints: MOCK_COMPLAINTS,
    payments: MOCK_PAYMENTS,
    staff: MOCK_STAFF,
    settings: DEFAULT_SETTINGS,
  };

  saveDatabase(initial);
  return initial;
}

export function saveDatabase(db: CRMDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    window.dispatchEvent(new Event('crm-data-updated'));
  } catch (err) {
    console.error('Failed to save database to localStorage:', err);
  }
}

export function getCurrentUser(): UserStaff | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserStaff;
    if (!parsed || !parsed.id) return null;

    // Always sync with latest staff record (so role changes or access revocation take effect)
    const db = getDatabase();
    const fresh = db.staff.find((s) => s.id === parsed.id);
    if (!fresh || !fresh.active) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    return fresh;
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
