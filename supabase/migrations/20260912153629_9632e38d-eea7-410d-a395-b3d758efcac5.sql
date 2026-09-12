-- Lock portal_otps fully (service role bypasses RLS)
DROP POLICY IF EXISTS portal_otps_no_client_access ON public.portal_otps;
CREATE POLICY portal_otps_no_client_access ON public.portal_otps
  AS RESTRICTIVE FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- Internal-only helpers: no client execution at all
REVOKE ALL ON FUNCTION public.sync_class_enrollment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.portal_link_guardian_user(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.portal_link_student_user(text, uuid) FROM PUBLIC, anon, authenticated;

-- Helpers used inside RLS policies: signed-in users only, never anonymous
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_perm(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_my_student_ids(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_my_tenants(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_tenant_ids() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_perm(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.portal_my_student_ids(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.portal_my_tenants(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_tenant_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_class_enrollment() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.portal_link_guardian_user(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.portal_link_student_user(text, uuid) TO service_role;

NOTIFY pgrst, 'reload schema';