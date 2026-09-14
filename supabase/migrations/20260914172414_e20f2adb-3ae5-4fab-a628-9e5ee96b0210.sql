-- receipts + report-cards: service role only (no policies for anon/authenticated);
-- access is via signed URLs minted by edge functions.

-- message-attachments: staff of the tenant folder with messages.send
CREATE POLICY "attachments staff read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids())
  AND public.user_has_permission((storage.foldername(name))[1]::uuid, 'messages.send')
);
CREATE POLICY "attachments staff write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids())
  AND public.user_has_permission((storage.foldername(name))[1]::uuid, 'messages.send')
);
CREATE POLICY "attachments staff delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids())
  AND public.user_has_permission((storage.foldername(name))[1]::uuid, 'messages.send')
);

-- tenant-logos: readable by any signed-in user, writable by tenant admins in own folder
CREATE POLICY "logos read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'tenant-logos');
CREATE POLICY "logos admin write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids())
  AND public.user_has_permission((storage.foldername(name))[1]::uuid, 'tenant.settings.edit')
);
CREATE POLICY "logos admin update" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids())
  AND public.user_has_permission((storage.foldername(name))[1]::uuid, 'tenant.settings.edit')
);
CREATE POLICY "logos admin delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids())
  AND public.user_has_permission((storage.foldername(name))[1]::uuid, 'tenant.settings.edit')
);