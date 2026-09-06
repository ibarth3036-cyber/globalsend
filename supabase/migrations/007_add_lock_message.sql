-- Add lock_message column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lock_message TEXT;
