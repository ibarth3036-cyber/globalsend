-- Migration 004: Account tiers, company accounts, upgrade requests, block/delete

-- Add account_tier to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_tier TEXT DEFAULT 'basic' CHECK (account_tier IN ('basic', 'gold', 'premium', 'vip', 'vvip'));

-- Add blocked column to profiles (blocks login)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;

-- Company accounts for deposit (admin configures these)
CREATE TABLE IF NOT EXISTS company_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Upgrade requests
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

ALTER TABLE company_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage company_accounts"
  ON company_accounts FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Anyone can view active company_accounts"
  ON company_accounts FOR SELECT
  USING (is_active = true OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can view own upgrade_requests"
  ON upgrade_requests FOR SELECT
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can create upgrade_requests"
  ON upgrade_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage upgrade_requests"
  ON upgrade_requests FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Fix: Add INSERT and DELETE policies for notifications (missing from original schema)
CREATE POLICY "Users and admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());
