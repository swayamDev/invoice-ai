-- =============================================================
-- INVOICE AI - Complete Supabase SQL Setup
-- Run this entire script in your Supabase SQL Editor
-- =============================================================

-- ─── Drop existing tables if re-running ───
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ─── Profiles ───────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  logo_url TEXT,
  default_currency TEXT DEFAULT 'USD',
  default_tax_rate DECIMAL(5,2) DEFAULT 0,
  default_payment_terms INTEGER DEFAULT 14,
  invoice_prefix TEXT DEFAULT 'INV-',
  default_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Clients ────────────────────────────────────────────────
-- NOTE: references auth.users directly (not profiles) so inserts
-- work even before profile is fully populated
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  avatar_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Invoices ───────────────────────────────────────────────
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'unpaid', 'paid')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency TEXT DEFAULT 'USD',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(12,2),
  -- Sender info stored per invoice for historical accuracy
  sender_name TEXT,
  sender_email TEXT,
  sender_company TEXT,
  sender_address TEXT,
  sender_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Invoice Items ──────────────────────────────────────────
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  rate DECIMAL(12,2) DEFAULT 0,
  amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Activity Log ───────────────────────────────────────────
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Enable Row Level Security ──────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies: Profiles ─────────────────────────────────
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ─── RLS Policies: Clients ──────────────────────────────────
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- ─── RLS Policies: Invoices ─────────────────────────────────
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoices_insert" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoices_update" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "invoices_delete" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- ─── RLS Policies: Invoice Items ────────────────────────────
CREATE POLICY "invoice_items_select" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_items_insert" ON public.invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_items_update" ON public.invoice_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_items_delete" ON public.invoice_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

-- ─── RLS Policies: Activity Log ─────────────────────────────
CREATE POLICY "activity_log_select" ON public.activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Auto-create profile on signup ──────────────────────────
-- This is the KEY fix: profile is created automatically when a
-- user signs up, so all FK references work immediately.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, business_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Auto-update updated_at timestamps ──────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Indexes for performance ─────────────────────────────────
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);

-- ─── Done! ───────────────────────────────────────────────────
-- Your database is now ready. Tables created:
-- ✅ profiles (auto-created on signup via trigger)
-- ✅ clients  (references auth.users directly)
-- ✅ invoices (full schema with all columns)
-- ✅ invoice_items (with cascade delete)
-- ✅ activity_log
-- All RLS policies, indexes, and triggers configured.
