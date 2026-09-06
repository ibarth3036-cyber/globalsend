-- Migration 006: Additional parcel fields for tracking details

ALTER TABLE parcels ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS sender_contact TEXT;
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS recipient_contact TEXT;
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS shipment_date DATE;
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS estimated_delivery DATE;
