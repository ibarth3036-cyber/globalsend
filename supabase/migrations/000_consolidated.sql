-- ============================================================
-- GlobalSend Platform - Complete Database Schema
-- Consolidates all 8 migrations + fixes + improvements
-- Run ONCE against a fresh Supabase project SQL editor.
-- ============================================================

-- 0. Admin check function (SECURITY DEFINER to break RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
END;
$$;

-- ============================================================
-- 1. TABLES (all columns from every migration inlined)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transfer', 'deposit', 'withdrawal', 'fee')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'completed')),
  description TEXT,
  reference TEXT UNIQUE,
  admin_note TEXT,
  proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  processed_by UUID REFERENCES profiles(id),
  recipient_details JSONB,
  deposit_method TEXT DEFAULT 'bank' CHECK (deposit_method IN ('bank', 'crypto', 'giftcard')),
  giftcard_front_url TEXT,
  giftcard_back_url TEXT,
  crypto_address TEXT,
  crypto_network TEXT
);

CREATE TABLE IF NOT EXISTS parcels (
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
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
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

CREATE TABLE IF NOT EXISTS tracking_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  description TEXT,
  status TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id),
  recipient_id UUID REFERENCES profiles(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_general BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_accounts (
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

CREATE TABLE IF NOT EXISTS upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  current_tier TEXT NOT NULL,
  requested_tier TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcels(tracking_code);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES (using public.is_admin() to avoid recursion)
-- ============================================================

-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Admins can update transactions"
  ON transactions FOR UPDATE
  USING (public.is_admin());

-- Parcels
CREATE POLICY "Users can view own parcels"
  ON parcels FOR SELECT
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Admins manage parcels"
  ON parcels FOR ALL
  USING (public.is_admin());

-- Tracking milestones
CREATE POLICY "Users can view milestones for their parcels"
  ON tracking_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parcels
      WHERE parcels.id = tracking_milestones.parcel_id
      AND (parcels.assigned_to = auth.uid() OR parcels.created_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins manage milestones"
  ON tracking_milestones FOR ALL
  USING (public.is_admin());

-- Notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users and admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- Admin messages
CREATE POLICY "Users can view messages"
  ON admin_messages FOR SELECT
  USING (recipient_id = auth.uid() OR sender_id = auth.uid() OR is_general = true);

CREATE POLICY "Admins can send messages"
  ON admin_messages FOR INSERT
  WITH CHECK (public.is_admin());

-- Company accounts
CREATE POLICY "Anyone can view active company_accounts"
  ON company_accounts FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins manage company_accounts"
  ON company_accounts FOR ALL
  USING (public.is_admin());

-- Upgrade requests
CREATE POLICY "Users can view own upgrade_requests"
  ON upgrade_requests FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create upgrade_requests"
  ON upgrade_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage upgrade_requests"
  ON upgrade_requests FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- 5. FUNCTIONS
-- ============================================================

-- Update balance (used by admin approval)
CREATE OR REPLACE FUNCTION update_balance(
  user_id UUID,
  amount DECIMAL,
  operation TEXT
) RETURNS void AS $$
BEGIN
  IF operation = 'credit' THEN
    UPDATE profiles SET balance = balance + amount WHERE id = user_id;
  ELSIF operation = 'debit' THEN
    UPDATE profiles SET balance = balance - amount WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get parcel by tracking code (public access)
CREATE OR REPLACE FUNCTION get_parcel_by_tracking(code TEXT)
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
      FROM tracking_milestones m WHERE m.parcel_id = p.id),
      '[]'::jsonb
    )
  ) INTO result
  FROM parcels p
  WHERE p.tracking_code = code;

  RETURN result;
END;
$$;

-- Handle new user profile creation (trigger function)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, first_name, last_name, phone, gender, location,
    id_card_front, id_card_back, avatar_url, preferred_currency
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'id_card_front',
    NEW.raw_user_meta_data->>'id_card_back',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'USD')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 7. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('id-cards', 'id-cards', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. STORAGE RLS
-- ============================================================

-- Upload: any authenticated user can upload to these buckets
CREATE POLICY "Upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('proofs', 'avatars', 'id-cards')
    AND auth.uid() IS NOT NULL
  );

-- Read: anyone can view files in these public buckets
CREATE POLICY "Read files"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('proofs', 'avatars', 'id-cards'));

-- Update: only the file owner can update
CREATE POLICY "Update own files"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('proofs', 'avatars', 'id-cards') AND owner = auth.uid());

-- Delete: only the file owner can delete
CREATE POLICY "Delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('proofs', 'avatars', 'id-cards') AND owner = auth.uid());
