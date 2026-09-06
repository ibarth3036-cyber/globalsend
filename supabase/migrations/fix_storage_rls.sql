-- ============================================================
-- Storage RLS Fix — run this in Supabase SQL editor
-- ============================================================

-- 1. Drop ALL existing storage policies to start clean
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow own updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow own deletes" ON storage.objects;
DROP POLICY IF EXISTS "Upload files" ON storage.objects;
DROP POLICY IF EXISTS "Read files" ON storage.objects;
DROP POLICY IF EXISTS "Update own files" ON storage.objects;
DROP POLICY IF EXISTS "Delete own files" ON storage.objects;

-- 2. Create policies using auth.uid() IS NOT NULL
CREATE POLICY "Upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('proofs', 'avatars', 'id-cards')
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Read files"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('proofs', 'avatars', 'id-cards'));

CREATE POLICY "Update own files"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('proofs', 'avatars', 'id-cards') AND owner = auth.uid());

CREATE POLICY "Delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('proofs', 'avatars', 'id-cards') AND owner = auth.uid());

-- 3. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;
