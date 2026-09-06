-- Seed data for local development
-- Run after migrations are applied

-- Insert a default admin user if none exists
-- Email: admin@shiptrack.com / Password: admin123
-- Note: Auth users must be created via the Supabase Auth API or Studio
-- This SQL only inserts the profile after the auth user exists

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('id-cards', 'id-cards', true),
  ('proofs', 'proofs', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Sample parcel for testing
-- Once you create a user via auth, you can assign parcels to them
