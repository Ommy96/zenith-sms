REVOKE ALL ON FUNCTION public.user_tenant_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.auth_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_tenant_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auth_user_id() TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';