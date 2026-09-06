-- ============================================================
-- GlobalSend - Neon schema (Data API + Neon Auth)
-- Derived from supabase/migrations/000_consolidated.sql
-- Differences from Supabase:
--   * profiles.id is a plain UUID; Neon Auth creates the user row
--     in `neon_auth` and the app creates the matching `profiles` row
--   * auth.uid() -> auth.user_id() (Neon pg_session_jwt / Data API)
--   * sessions + password resets live in Neon Auth (neon_auth schema) -
--     no self-hosted auth tables needed
--   * storage buckets are Neon Object Storage (S3) - configured in the
--     Neon console, not in Postgres
-- Run with: node --env-file=.env scripts/apply-schema.mjs
-- ============================================================

-- ------------------------------------------------------------------
-- 0. ROLES for the Neon Data API
--    anonymous  = requests with no JWT
--    authenticated = requests with a valid Data API JWT (role claim)
-- ------------------------------------------------------------------
DO $$ BEGIN CREATE ROLE anonymous NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------------
-- 1. PRIVILEGES - lock down the base `public` role; explicit grants follow
-- ------------------------------------------------------------------
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO anonymous, authenticated;

-- ------------------------------------------------------------------
-- 3. TABLES
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  location TEXT,
  avatar_url TEXT,
  id_card_front TEXT,
  id_card_back TEXT,
  id_verified BOOLEAN DEFAULT false,
  balance DECIMAL(12,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  account_tier TEXT DEFAULT 'basic' CHECK (account_tier IN ('basic', 'gold', 'premium', 'vip', 'vvip')),
  blocked BOOLEAN DEFAULT false,
  lock_message TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Legacy column from the self-hosted serverless auth; removed now that
-- Neon Auth manages credentials. Keep this idempotent for existing DBs.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- Legacy self-hosted auth tables (pre-Neon Auth); drop if still present.
DROP SCHEMA IF EXISTS _auth CASCADE;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id),
  receiver_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transfer', 'deposit', 'withdrawal', 'fee')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'completed')),
  description TEXT,
  reference TEXT UNIQUE,
  admin_note TEXT,
  proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  processed_by UUID REFERENCES public.profiles(id),
  recipient_details JSONB,
  deposit_method TEXT DEFAULT 'bank' CHECK (deposit_method IN ('bank', 'crypto', 'giftcard')),
  giftcard_front_url TEXT,
  giftcard_back_url TEXT,
  crypto_address TEXT,
  crypto_network TEXT
);

CREATE TABLE IF NOT EXISTS public.parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  weight TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'out_for_delivery', 'delivered', 'on_hold', 'exception')),
  fee DECIMAL(12,2) DEFAULT 0.00,
  fee_note TEXT,
  current_location TEXT,
  created_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  parcel_image TEXT,
  sender_email TEXT,
  sender_contact TEXT,
  recipient_email TEXT,
  recipient_contact TEXT,
  quantity INT DEFAULT 1,
  shipment_date DATE,
  estimated_delivery DATE
);

CREATE TABLE IF NOT EXISTS public.tracking_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID REFERENCES public.parcels(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  description TEXT,
  status TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id),
  recipient_id UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_general BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  account_type TEXT DEFAULT 'bank' CHECK (account_type IN ('bank', 'crypto')),
  crypto_network TEXT
);

CREATE TABLE IF NOT EXISTS public.upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  current_tier TEXT NOT NULL,
  requested_tier TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------
-- 4. INDEXES
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON public.transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON public.transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON public.parcels(tracking_code);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- ------------------------------------------------------------------
-- 5. FUNCTIONS
--    Defined before policies so RLS expressions can reference them.
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.user_id()::uuid), false);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_balance(
  user_id UUID,
  amount DECIMAL,
  operation TEXT
) RETURNS void AS $$
BEGIN
  IF operation = 'credit' THEN
    UPDATE public.profiles SET balance = balance + amount WHERE id = user_id;
  ELSIF operation = 'debit' THEN
    UPDATE public.profiles SET balance = balance - amount WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_parcel_by_tracking(code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'tracking_code', p.tracking_code,
    'sender_name', p.sender_name,
    'recipient_name', p.recipient_name,
    'origin', p.origin,
    'destination', p.destination,
    'weight', p.weight,
    'description', p.description,
    'status', p.status,
    'fee', p.fee,
    'fee_note', p.fee_note,
    'current_location', p.current_location,
    'parcel_image', p.parcel_image,
    'created_at', p.created_at,
    'milestones', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', m.id,
        'location', m.location,
        'description', m.description,
        'status', m.status,
        'timestamp', m.timestamp
      ) ORDER BY m.timestamp ASC)
      FROM public.tracking_milestones m WHERE m.parcel_id = p.id),
      '[]'::jsonb
    )
  ) INTO result
  FROM public.parcels p
  WHERE p.tracking_code = code;

  RETURN result;
END;
$$;

-- ------------------------------------------------------------------
-- 6. GRANTS (Data API roles)
--    anonymous  -> read-only, public-facing pieces
--    authenticated -> full CRUD, gated by RLS policies below
-- ------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Anonymous: only active company accounts (public page) + tracking RPC
GRANT SELECT ON public.company_accounts TO anonymous;

-- ------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.user_id()::uuid = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.user_id()::uuid = id)
  WITH CHECK (auth.user_id()::uuid = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.user_id()::uuid = id);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (sender_id = auth.user_id()::uuid OR receiver_id = auth.user_id()::uuid OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert transactions" ON public.transactions;
CREATE POLICY "Users can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (sender_id = auth.user_id()::uuid);

DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
CREATE POLICY "Admins can update transactions"
  ON public.transactions FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own parcels" ON public.parcels;
CREATE POLICY "Users can view own parcels"
  ON public.parcels FOR SELECT
  USING (assigned_to = auth.user_id()::uuid OR created_by = auth.user_id()::uuid OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage parcels" ON public.parcels;
CREATE POLICY "Admins manage parcels"
  ON public.parcels FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view milestones for their parcels" ON public.tracking_milestones;
CREATE POLICY "Users can view milestones for their parcels"
  ON public.tracking_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parcels
      WHERE parcels.id = tracking_milestones.parcel_id
      AND (parcels.assigned_to = auth.user_id()::uuid OR parcels.created_by = auth.user_id()::uuid OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins manage milestones" ON public.tracking_milestones;
CREATE POLICY "Admins manage milestones"
  ON public.tracking_milestones FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.user_id()::uuid);

DROP POLICY IF EXISTS "Users and admins can insert notifications" ON public.notifications;
CREATE POLICY "Users and admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (user_id = auth.user_id()::uuid OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.user_id()::uuid);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.user_id()::uuid);

DROP POLICY IF EXISTS "Users can view messages" ON public.admin_messages;
CREATE POLICY "Users can view messages"
  ON public.admin_messages FOR SELECT
  USING (recipient_id = auth.user_id()::uuid OR sender_id = auth.user_id()::uuid OR is_general = true);

DROP POLICY IF EXISTS "Admins can send messages" ON public.admin_messages;
CREATE POLICY "Admins can send messages"
  ON public.admin_messages FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active company_accounts" ON public.company_accounts;
CREATE POLICY "Anyone can view active company_accounts"
  ON public.company_accounts FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage company_accounts" ON public.company_accounts;
CREATE POLICY "Admins manage company_accounts"
  ON public.company_accounts FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own upgrade_requests" ON public.upgrade_requests;
CREATE POLICY "Users can view own upgrade_requests"
  ON public.upgrade_requests FOR SELECT
  USING (user_id = auth.user_id()::uuid OR public.is_admin());

DROP POLICY IF EXISTS "Users can create upgrade_requests" ON public.upgrade_requests;
CREATE POLICY "Users can create upgrade_requests"
  ON public.upgrade_requests FOR INSERT
  WITH CHECK (user_id = auth.user_id()::uuid);

DROP POLICY IF EXISTS "Admins manage upgrade_requests" ON public.upgrade_requests;
CREATE POLICY "Admins manage upgrade_requests"
  ON public.upgrade_requests FOR UPDATE
  USING (public.is_admin());

-- ------------------------------------------------------------------
-- 8. FUNCTION ACCESS (defined in section 5 upstream of the policies)
-- ------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.is_admin() TO anonymous;
GRANT EXECUTE ON FUNCTION public.get_parcel_by_tracking(TEXT) TO anonymous;