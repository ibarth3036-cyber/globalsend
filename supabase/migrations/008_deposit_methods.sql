-- Add deposit method and crypto/giftcard support
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deposit_method TEXT DEFAULT 'bank' CHECK (deposit_method IN ('bank', 'crypto', 'giftcard'));
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS giftcard_front_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS giftcard_back_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS crypto_address TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS crypto_network TEXT;

-- Add type column to company_accounts to support crypto addresses
ALTER TABLE company_accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'bank' CHECK (account_type IN ('bank', 'crypto'));
ALTER TABLE company_accounts ADD COLUMN IF NOT EXISTS crypto_network TEXT;
