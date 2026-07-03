-- Migration: 002_adapt_existing
-- Description: Adapts existing tables and creates missing tables for POS system.
-- Preserves all existing data (tables are empty but we use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- === 1. CREATE MISSING ENUMS ===
DO $$ BEGIN
  CREATE TYPE job_type AS ENUM ('T-Shirt', 'Polo Shirt', 'Tarpaulin', 'Uniform', 'Alteration', 'Jacket', 'Other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fabric AS ENUM ('Cotton', 'Sublimation');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('Urgent', 'In Progress', 'For Pickup', 'Done', 'Normal');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('Unpaid', 'Partial', 'Paid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE job_stage AS ENUM ('Received', 'In Progress', 'For Pickup', 'Completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- === 2. EXTEND EXISTING TABLES ===

-- customers: add contact_number and address columns if missing
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- profiles: add missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ALTER COLUMN name DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;

-- orders: already exists, we'll create jobbings as a new table instead

-- === 3. CREATE MISSING TABLES ===

-- Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobbings (new order/job management table)
CREATE TABLE IF NOT EXISTS jobbings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  address TEXT,
  job_type job_type NOT NULL,
  description TEXT NOT NULL,
  fabric fabric,
  quantity INTEGER NOT NULL DEFAULT 1,
  pickup_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  down_payment DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status job_status NOT NULL DEFAULT 'Normal',
  stage job_stage NOT NULL DEFAULT 'Received',
  payment_status payment_status NOT NULL DEFAULT 'Unpaid',
  notes TEXT NOT NULL DEFAULT '',
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  attachment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobbings_status ON jobbings(status);
CREATE INDEX IF NOT EXISTS idx_jobbings_stage ON jobbings(stage);
CREATE INDEX IF NOT EXISTS idx_jobbings_pickup_date ON jobbings(pickup_date);
CREATE INDEX IF NOT EXISTS idx_jobbings_created_at ON jobbings(created_at);

-- Order Items (linked to jobbings)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jobbing_id UUID NOT NULL REFERENCES jobbings(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_jobbing_id ON order_items(jobbing_id);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jobbing_id UUID NOT NULL REFERENCES jobbings(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_jobbing_id ON payments(jobbing_id);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Finance Records (denormalized view of completed jobbings)
CREATE TABLE IF NOT EXISTS finance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jobbing_id UUID NOT NULL REFERENCES jobbings(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  job_type job_type NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  down_payment DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'Unpaid',
  pickup_date DATE NOT NULL,
  completed_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_records_completed_at ON finance_records(completed_at);
CREATE INDEX IF NOT EXISTS idx_finance_records_jobbing_id ON finance_records(jobbing_id);

-- === 4. RLS POLICIES ===

-- Enable RLS on new tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobbings ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;

-- Helper function to create policy if not exists
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  policy_name TEXT,
  table_name TEXT,
  action TEXT,
  roles TEXT,
  using_expr TEXT DEFAULT 'true',
  check_expr TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = table_name
      AND policyname = policy_name
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR %s TO %s USING (%s)',
      policy_name, table_name, action, roles, using_expr
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Services policies
SELECT create_policy_if_not_exists('Services select', 'services', 'SELECT', 'authenticated');
SELECT create_policy_if_not_exists('Services insert', 'services', 'INSERT', 'authenticated');
SELECT create_policy_if_not_exists('Services update', 'services', 'UPDATE', 'authenticated');
SELECT create_policy_if_not_exists('Services delete', 'services', 'DELETE', 'authenticated');

-- Jobbings policies
SELECT create_policy_if_not_exists('Jobbings select', 'jobbings', 'SELECT', 'authenticated');
SELECT create_policy_if_not_exists('Jobbings insert', 'jobbings', 'INSERT', 'authenticated');
SELECT create_policy_if_not_exists('Jobbings update', 'jobbings', 'UPDATE', 'authenticated');
SELECT create_policy_if_not_exists('Jobbings delete', 'jobbings', 'DELETE', 'authenticated');

-- Order items policies
SELECT create_policy_if_not_exists('Order items select', 'order_items', 'SELECT', 'authenticated');
SELECT create_policy_if_not_exists('Order items insert', 'order_items', 'INSERT', 'authenticated');
SELECT create_policy_if_not_exists('Order items update', 'order_items', 'UPDATE', 'authenticated');
SELECT create_policy_if_not_exists('Order items delete', 'order_items', 'DELETE', 'authenticated');

-- Payments policies
SELECT create_policy_if_not_exists('Payments select', 'payments', 'SELECT', 'authenticated');
SELECT create_policy_if_not_exists('Payments insert', 'payments', 'INSERT', 'authenticated');
SELECT create_policy_if_not_exists('Payments update', 'payments', 'UPDATE', 'authenticated');
SELECT create_policy_if_not_exists('Payments delete', 'payments', 'DELETE', 'authenticated');

-- Expenses policies
SELECT create_policy_if_not_exists('Expenses select', 'expenses', 'SELECT', 'authenticated');
SELECT create_policy_if_not_exists('Expenses insert', 'expenses', 'INSERT', 'authenticated');
SELECT create_policy_if_not_exists('Expenses update', 'expenses', 'UPDATE', 'authenticated');
SELECT create_policy_if_not_exists('Expenses delete', 'expenses', 'DELETE', 'authenticated');

-- Settings policies
SELECT create_policy_if_not_exists('Settings select', 'settings', 'SELECT', 'authenticated');
SELECT create_policy_if_not_exists('Settings insert', 'settings', 'INSERT', 'authenticated');
SELECT create_policy_if_not_exists('Settings update', 'settings', 'UPDATE', 'authenticated');
SELECT create_policy_if_not_exists('Settings delete', 'settings', 'DELETE', 'authenticated');

-- Finance records policies
SELECT create_policy_if_not_exists('Finance records select', 'finance_records', 'SELECT', 'authenticated');
SELECT create_policy_if_not_exists('Finance records insert', 'finance_records', 'INSERT', 'authenticated');
SELECT create_policy_if_not_exists('Finance records update', 'finance_records', 'UPDATE', 'authenticated');
SELECT create_policy_if_not_exists('Finance records delete', 'finance_records', 'DELETE', 'authenticated');

DROP FUNCTION IF EXISTS create_policy_if_not_exists;
