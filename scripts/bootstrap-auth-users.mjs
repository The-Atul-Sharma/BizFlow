/**
 * Creates Supabase Auth accounts for public.staff rows (and default admin `atul` / `admin123`)
 * and rewrites staff ids to Auth UUIDs so authenticated-only RLS + login work securely.
 *
 * Usage: npm run auth:bootstrap
 * Requires VITE_SUPABASE_URL + SUPABASE_SECRET_KEY in .env
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function authEmailForUsername(username) {
  const normalized = String(username).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${normalized || 'user'}@users.bizflow.app`;
}

async function main() {
  const { data: users, error } = await admin.from('staff').select('*');
  if (error) {
    console.error('Error reading public.staff:', error.message);
    console.error('Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor first.');
    process.exit(1);
  }

  // Ensure default admin `atul` exists if table is empty
  let list = users ?? [];
  if (list.length === 0) {
    list = [
      {
        id: 'st-admin',
        name: 'Atul Sharma',
        username: 'atul',
        password: 'admin123',
        role: 'Admin',
        mobile: '+91 00000 00000',
        zone: 'Head Office',
        active: true,
      },
    ];
  }

  for (const user of list) {
    const username = String(user.username).trim().toLowerCase();
    const email = authEmailForUsername(username);
    const password =
      user.password && user.password !== 'auth-managed' ? user.password : 'admin123';

    console.log(`Bootstrapping @${username} -> ${email}`);

    const { data: listed } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existingAuth = listed?.users?.find((u) => u.email === email);

    let authId = existingAuth?.id;
    if (!authId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, name: user.name },
      });
      if (createError) {
        console.error(`  Failed: ${createError.message}`);
        continue;
      }
      authId = created.user.id;
      console.log(`  Created auth user ${authId}`);
    } else {
      await admin.auth.admin.updateUserById(authId, {
        password,
        email_confirm: true,
        user_metadata: { username, name: user.name },
      });
      console.log(`  Reused auth user ${authId}`);
    }

    if (user.id !== authId) {
      await admin.from('staff').delete().eq('id', user.id);

      const { error: insertError } = await admin.from('staff').upsert({
        id: authId,
        name: user.name,
        username,
        mobile: user.mobile ?? '',
        email: user.email ?? null,
        zone: user.zone ?? 'Head Office',
        password: 'auth-managed',
        role: user.role,
        active: user.active ?? true,
      });
      if (insertError) {
        console.error(`  Could not insert remapped staff row: ${insertError.message}`);
        continue;
      }
      console.log(`  Linked public.staff id ${user.id} -> ${authId}`);
    } else {
      await admin
        .from('staff')
        .update({ password: 'auth-managed', username })
        .eq('id', authId);
      console.log('  public.staff already linked');
    }
  }

  console.log('\nDone! Disable public signup in Supabase Auth settings.');
  console.log('Users can now sign in with their username + password (e.g. atul / admin123).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
