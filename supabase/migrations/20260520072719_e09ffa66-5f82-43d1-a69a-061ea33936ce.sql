REVOKE ALL ON FUNCTION public.portal_link_guardian_user(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.portal_my_guardian_tenants(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.portal_my_student_ids(uuid) FROM anon;