-- Add parcel_image column
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS parcel_image TEXT;

-- RPC: Get parcel by tracking code (public, SECURITY DEFINER to bypass RLS)
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
