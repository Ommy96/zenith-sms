
REVOKE ALL ON FUNCTION public._tg_student_admission_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._tg_staff_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._tg_application_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._tg_single_primary_guardian() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_admission_number(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_staff_number(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_application_number(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_admission_number(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_staff_number(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_application_number(uuid) TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
