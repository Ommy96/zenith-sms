CREATE POLICY student_activity_portal_select ON public.student_activity FOR SELECT TO authenticated
  USING (student_id IN (SELECT portal_my_student_ids()));

CREATE POLICY attendance_sessions_portal_select ON public.attendance_sessions FOR SELECT TO authenticated
  USING (id IN (SELECT ar.session_id FROM public.attendance_records ar WHERE ar.student_id IN (SELECT portal_my_student_ids())));

CREATE POLICY messages_portal_guardian_select ON public.messages FOR SELECT TO authenticated
  USING (recipient_type = 'guardian' AND recipient_id IN (SELECT g.id FROM public.guardians g WHERE g.portal_user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.portal_school_info(_tenant uuid)
RETURNS TABLE(name text, logo_url text, currency_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.name, t.logo_url, t.currency_code FROM public.tenants t
  WHERE t.id = _tenant AND _tenant IN (SELECT portal_my_tenants());
$$;
REVOKE ALL ON FUNCTION public.portal_school_info(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.portal_school_info(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.portal_update_my_guardian(
  _occupation text, _address text, _prefs jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  UPDATE public.guardians SET
    occupation = left(nullif(trim(_occupation), ''), 120),
    residential_address = left(nullif(trim(_address), ''), 300),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('notification_prefs', jsonb_build_object(
      'whatsapp', coalesce((_prefs->>'whatsapp')::boolean, true),
      'email', coalesce((_prefs->>'email')::boolean, true),
      'sms', false)),
    updated_at = now()
  WHERE portal_user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.portal_update_my_guardian(text, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.portal_update_my_guardian(text, text, jsonb) TO authenticated;