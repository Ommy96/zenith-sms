DROP POLICY IF EXISTS "permissions_select" ON public.permissions;
CREATE POLICY "permissions_select" ON public.permissions FOR SELECT TO authenticated
USING (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.user_tenant_ids()));

DROP POLICY IF EXISTS "role_permissions_select" ON public.role_permissions;
CREATE POLICY "role_permissions_select" ON public.role_permissions FOR SELECT TO authenticated
USING (public.is_super_admin() OR EXISTS (
  SELECT 1 FROM public.roles r WHERE r.id = role_permissions.role_id
  AND ((r.tenant_id IS NULL AND r.is_system) OR r.tenant_id IN (SELECT public.user_tenant_ids()))));

DROP POLICY IF EXISTS "logos read" ON storage.objects;
CREATE POLICY "logos read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'tenant-logos' AND (public.is_super_admin() OR (storage.foldername(name))[1] IN (SELECT t::text FROM public.user_tenant_ids() t)));