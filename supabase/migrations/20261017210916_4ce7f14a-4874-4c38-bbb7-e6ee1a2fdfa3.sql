CREATE POLICY "Portal users can read own school logos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] IN (SELECT tenant_id::text FROM public.portal_my_tenants())
);