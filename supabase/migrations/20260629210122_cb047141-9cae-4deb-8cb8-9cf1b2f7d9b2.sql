-- Receipts bucket: service-role only. Clients must use signed URLs minted
-- by the generate-receipt-pdf edge function after permission checks.
DROP POLICY IF EXISTS "receipts service role all" ON storage.objects;
CREATE POLICY "receipts service role all"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'receipts')
WITH CHECK (bucket_id = 'receipts');