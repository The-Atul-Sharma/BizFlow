import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISH_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISH_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  console.log(`Checking Supabase tables on ${url}...`);

  const tables = [
    'company_settings',
    'staff',
    'customers',
    'enquiries',
    'quotations',
    'follow_ups',
    'service_complaints',
    'payment_receipts',
  ];

  const missing = [];
  for (const tbl of tables) {
    const { error } = await supabase.from(tbl).select('id').limit(1);
    if (error) {
      missing.push({ table: tbl, message: error.message });
    }
  }

  if (missing.length > 0) {
    console.error('Some tables are missing or inaccessible:');
    for (const m of missing) {
      console.error(` - ${m.table}: ${m.message}`);
    }
    console.error(
      '\nRun supabase/migrations/001_initial_schema.sql in your Supabase SQL Editor first, then re-run this script.',
    );
    process.exit(2);
  }

  // Upsert default company settings
  const { error: settingsErr } = await supabase.from('company_settings').upsert({
    id: 'default',
    company_name: 'BizFlow',
    tagline: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    default_credit_days: 30,
    default_gst_percent: 18,
    updated_at: new Date().toISOString(),
  });
  if (settingsErr) {
    console.error('Failed to upsert company_settings:', settingsErr.message);
    process.exit(1);
  }

  // Remove old placeholder 'admin' if present and upsert 'atul' / 'admin123'
  await supabase.from('staff').delete().eq('username', 'admin');

  const { error: staffErr } = await supabase.from('staff').upsert(
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
    { onConflict: 'username' },
  );

  if (staffErr) {
    console.error('Failed to upsert default admin user:', staffErr.message);
    process.exit(1);
  }

  console.log('Verified all 8 tables and upserted default admin account (username: atul).');
}

void run();
