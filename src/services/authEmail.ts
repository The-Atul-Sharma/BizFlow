/** Username -> synthetic email for Supabase Auth (no real inbox needed). */
export function authEmailForUsername(username: string): string {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${normalized || 'user'}@users.bizflow.app`;
}
