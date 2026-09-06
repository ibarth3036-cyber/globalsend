-- Migration 005: External transfer recipient details
-- Allow external transfers with bank info stored as JSONB

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_details JSONB;
