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
        // Ensure staff have username/password
        if (!parsed.staff || parsed.staff.length === 0 || !parsed.staff[0].username) {
          parsed.staff = MOCK_STAFF;
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

export function resetDatabase(): CRMDatabase {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('autoops_crm:db:v1');
  localStorage.removeItem('autoops_crm:db:v2');
  return getDatabase();
}

export function getCurrentUser(): UserStaff {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) return parsed;
    }
  } catch (err) {
    console.error('Failed to get current user:', err);
  }
  const db = getDatabase();
  const defaultAdmin = db.staff.find((s) => s.role === 'Admin') || db.staff[0];
  setCurrentUser(defaultAdmin);
  return defaultAdmin;
}

export function setCurrentUser(user: UserStaff): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('crm-user-changed'));
  } catch (err) {
    console.error('Failed to set current user:', err);
  }
}
