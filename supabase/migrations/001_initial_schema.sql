-- BizFlow CRM · Supabase PostgreSQL Schema with Authenticated-Only RLS
-- Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- Nobody can read or write any data using the anon/publishable key without logging in.

-- 1. Company Settings
CREATE TABLE IF NOT EXISTS public.company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT 'BizFlow',
  tagline TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  default_credit_days INTEGER NOT NULL DEFAULT 30,
  default_gst_percent NUMERIC NOT NULL DEFAULT 18,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Staff / Users & Access Control (id matches Supabase Auth user UUID)
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL DEFAULT 'auth-managed',
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Sales', 'Service')),
  mobile TEXT NOT NULL,
  email TEXT,
  zone TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Customers Directory
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  firm_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  mobile TEXT NOT NULL,
  alternate_mobile TEXT,
  email TEXT,
  category TEXT NOT NULL CHECK (category IN ('Workshop', 'Tyre Shop', 'Fitters', 'OEM', 'Dealer', 'Other')),
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  gst_status TEXT NOT NULL DEFAULT 'Active' CHECK (gst_status IN ('Active', 'Pending', 'Unregistered')),
  assigned_sales_person_id TEXT NOT NULL DEFAULT '',
  assigned_service_person_id TEXT NOT NULL DEFAULT '',
  lead_status TEXT NOT NULL DEFAULT 'warm' CHECK (lead_status IN ('hot', 'warm', 'cold', 'converted', 'lost')),
  outstanding_amount NUMERIC NOT NULL DEFAULT 0,
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  payment_terms_days INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enquiries & Leads
CREATE TABLE IF NOT EXISTS public.enquiries (
  id TEXT PRIMARY KEY,
  enquiry_number TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  firm_name TEXT NOT NULL,
  contact_person TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('Workshop', 'Tyre Shop', 'Fitters', 'OEM', 'Dealer', 'Other')),
  requirement TEXT NOT NULL,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  lead_status TEXT NOT NULL DEFAULT 'warm' CHECK (lead_status IN ('hot', 'warm', 'cold', 'converted', 'lost')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical', 'Urgent')),
  assigned_sales_person_id TEXT NOT NULL DEFAULT '',
  next_follow_up_date TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Direct Visit',
  notes TEXT,
  quotation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
  id TEXT PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL DEFAULT '',
  firm_name TEXT NOT NULL,
  contact_person TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Draft', 'Pending', 'Accepted', 'Rejected', 'Expired')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  assigned_sales_person_id TEXT NOT NULL DEFAULT '',
  valid_until TEXT NOT NULL DEFAULT '',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Follow-ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Sales' CHECK (type IN ('Sales', 'Service', 'Payment Collection', 'Quotation Review')),
  customer_id TEXT,
  enquiry_id TEXT,
  firm_name TEXT NOT NULL,
  contact_person TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT,
  assigned_person_id TEXT NOT NULL DEFAULT '',
  assigned_person_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rescheduled', 'Missed')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical', 'Urgent')),
  notes TEXT NOT NULL DEFAULT '',
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Service Complaints
CREATE TABLE IF NOT EXISTS public.service_complaints (
  id TEXT PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL DEFAULT '',
  firm_name TEXT NOT NULL,
  contact_person TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('Workshop', 'Tyre Shop', 'Fitters', 'OEM', 'Dealer', 'Other')),
  equipment_model TEXT NOT NULL,
  serial_number TEXT,
  issue_description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical', 'Urgent')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Awaiting Parts', 'Resolved', 'Closed')),
  assigned_service_person_id TEXT NOT NULL DEFAULT '',
  assigned_service_person_name TEXT NOT NULL DEFAULT '',
  reported_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_date TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Payment Receipts
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  firm_name TEXT NOT NULL,
  invoice_number TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date TEXT NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'NEFT/RTGS', 'Cheque')),
  reference_no TEXT,
  notes TEXT,
  collected_by_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_username ON public.staff (lower(username));
CREATE INDEX IF NOT EXISTS idx_customers_category ON public.customers (category);
CREATE INDEX IF NOT EXISTS idx_customers_lead_status ON public.customers (lead_status);
CREATE INDEX IF NOT EXISTS idx_enquiries_lead_status ON public.enquiries (lead_status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_date ON public.follow_ups (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.service_complaints (status);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payment_receipts (customer_id);

-- Security-Definer Auth Helpers (only executable by authenticated users)
CREATE OR REPLACE FUNCTION public.is_active_app_user()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff
    WHERE id = auth.uid()::text
      AND active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_app_user()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff
    WHERE id = auth.uid()::text
      AND active = TRUE
      AND role = 'Admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_app_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_app_user() TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin_app_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_app_user() TO authenticated;

-- Explicit table privileges (revoke anon completely; grant authenticated + service_role)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

REVOKE ALL ON TABLE
  public.company_settings,
  public.staff,
  public.customers,
  public.enquiries,
  public.quotations,
  public.follow_ups,
  public.service_complaints,
  public.payment_receipts
FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.company_settings,
  public.staff,
  public.customers,
  public.enquiries,
  public.quotations,
  public.follow_ups,
  public.service_complaints,
  public.payment_receipts
TO authenticated, service_role;

-- Enable Row Level Security on every table (blocks ALL unauthenticated / anon access)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Drop any legacy open policies
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'company_settings',
    'staff',
    'customers',
    'enquiries',
    'quotations',
    'follow_ups',
    'service_complaints',
    'payment_receipts'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "bizflow_full_access" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "app_%s" ON public.%I', tbl, tbl);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "app_staff_select" ON public.staff;
DROP POLICY IF EXISTS "app_staff_self_update" ON public.staff;
DROP POLICY IF EXISTS "app_staff_admin_manage" ON public.staff;

-- Authenticated active-user policies on all business tables
CREATE POLICY "app_company_settings" ON public.company_settings
  FOR ALL TO authenticated
  USING (public.is_active_app_user())
  WITH CHECK (public.is_active_app_user());

CREATE POLICY "app_customers" ON public.customers
  FOR ALL TO authenticated
  USING (public.is_active_app_user())
  WITH CHECK (public.is_active_app_user());

CREATE POLICY "app_enquiries" ON public.enquiries
  FOR ALL TO authenticated
  USING (public.is_active_app_user())
  WITH CHECK (public.is_active_app_user());

CREATE POLICY "app_quotations" ON public.quotations
  FOR ALL TO authenticated
  USING (public.is_active_app_user())
  WITH CHECK (public.is_active_app_user());

CREATE POLICY "app_follow_ups" ON public.follow_ups
  FOR ALL TO authenticated
  USING (public.is_active_app_user())
  WITH CHECK (public.is_active_app_user());

CREATE POLICY "app_service_complaints" ON public.service_complaints
  FOR ALL TO authenticated
  USING (public.is_active_app_user())
  WITH CHECK (public.is_active_app_user());

CREATE POLICY "app_payment_receipts" ON public.payment_receipts
  FOR ALL TO authenticated
  USING (public.is_active_app_user())
  WITH CHECK (public.is_active_app_user());

-- Staff policies: active logged-in users can read staff; Admins can manage; users can update own last_login
CREATE POLICY "app_staff_select" ON public.staff
  FOR SELECT TO authenticated
  USING (public.is_active_app_user());

CREATE POLICY "app_staff_self_update" ON public.staff
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text AND active = TRUE)
  WITH CHECK (id = auth.uid()::text AND active = TRUE);

CREATE POLICY "app_staff_admin_manage" ON public.staff
  FOR ALL TO authenticated
  USING (public.is_admin_app_user())
  WITH CHECK (public.is_admin_app_user());

-- Initial Default Company Settings row
INSERT INTO public.company_settings (id, company_name, tagline, gstin, phone, email, address, default_credit_days, default_gst_percent)
VALUES ('default', 'BizFlow', '', '', '', '', '', 30, 18)
ON CONFLICT (id) DO NOTHING;

-- Initial Admin seed row (run `npm run auth:bootstrap` to link to Supabase Auth UUID)
INSERT INTO public.staff (id, name, username, password, role, mobile, zone, active)
VALUES ('st-admin', 'Atul Sharma', 'atul', 'admin123', 'Admin', '+91 00000 00000', 'Head Office', TRUE)
ON CONFLICT (username) DO NOTHING;
