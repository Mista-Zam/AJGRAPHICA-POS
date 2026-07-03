-- Migration: 001_create_tables
-- Description: Create all core tables for the POS system
-- This migration is safe to run on an empty database.
-- If tables already exist, each CREATE statement uses IF NOT EXISTS.

-- Enums
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

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'superadmin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Profiles (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'admin',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobbings (orders)
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

-- Order Items
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobbings ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies: authenticated users can read/write all data
-- These are permissive policies suitable for a POS frontend.

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read profiles"
    ON profiles FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert profiles"
    ON profiles FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update profiles"
    ON profiles FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read customers"
    ON customers FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert customers"
    ON customers FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update customers"
    ON customers FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete customers"
    ON customers FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read services"
    ON services FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert services"
    ON services FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update services"
    ON services FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete services"
    ON services FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read jobbings"
    ON jobbings FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert jobbings"
    ON jobbings FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update jobbings"
    ON jobbings FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete jobbings"
    ON jobbings FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read order_items"
    ON order_items FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert order_items"
    ON order_items FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update order_items"
    ON order_items FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete order_items"
    ON order_items FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read payments"
    ON payments FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert payments"
    ON payments FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update payments"
    ON payments FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete payments"
    ON payments FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read expenses"
    ON expenses FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert expenses"
    ON expenses FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update expenses"
    ON expenses FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete expenses"
    ON expenses FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read settings"
    ON settings FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert settings"
    ON settings FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update settings"
    ON settings FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete settings"
    ON settings FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read finance_records"
    ON finance_records FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert finance_records"
    ON finance_records FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update finance_records"
    ON finance_records FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete finance_records"
    ON finance_records FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
