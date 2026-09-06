-- Fix infinite recursion in RLS policies by using SECURITY DEFINER function

-- Create admin check function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Fix other policies that query profiles
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own parcels" ON parcels;
DROP POLICY IF EXISTS "Admins manage parcels" ON parcels;
DROP POLICY IF EXISTS "Users can view milestones for their parcels" ON tracking_milestones;
DROP POLICY IF EXISTS "Admins manage milestones" ON tracking_milestones;
DROP POLICY IF EXISTS "Users can view messages" ON admin_messages;
DROP POLICY IF EXISTS "Admins can send messages" ON admin_messages;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update transactions"
  ON transactions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Users can view own parcels"
  ON parcels FOR SELECT
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Admins manage parcels"
  ON parcels FOR ALL
  USING (public.is_admin());

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

CREATE POLICY "Users can view messages"
  ON admin_messages FOR SELECT
  USING (recipient_id = auth.uid() OR sender_id = auth.uid() OR is_general = true);

CREATE POLICY "Admins can send messages"
  ON admin_messages FOR INSERT
  WITH CHECK (public.is_admin());
