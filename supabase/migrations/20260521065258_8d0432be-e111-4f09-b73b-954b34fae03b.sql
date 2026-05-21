
-- Student portal linkage
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS portal_user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_portal_user_id ON public.students(portal_user_id) WHERE portal_user_id IS NOT NULL;

-- Link a student by phone (used by portal OTP)
CREATE OR REPLACE FUNCTION public.portal_link_student_user(_phone text, _user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.students
     SET portal_user_id = _user_id, updated_at = now()
   WHERE regexp_replace(COALESCE(phone,''),'[^0-9]','','g') = regexp_replace(_phone,'[^0-9]','','g');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

-- Extend my-student-ids: include the student's own user id
CREATE OR REPLACE FUNCTION public.portal_my_student_ids(_user uuid DEFAULT auth.uid())
RETURNS TABLE(student_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT sg.student_id FROM public.student_guardians sg
    JOIN public.guardians g ON g.id = sg.guardian_id
   WHERE g.portal_user_id = _user
  UNION
  SELECT id FROM public.students WHERE portal_user_id = _user;
$$;

-- Tenants this portal user belongs to (guardian or student)
CREATE OR REPLACE FUNCTION public.portal_my_tenants(_user uuid DEFAULT auth.uid())
RETURNS TABLE(tenant_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT g.tenant_id FROM public.guardians g WHERE g.portal_user_id = _user
  UNION
  SELECT DISTINCT s.tenant_id FROM public.students s WHERE s.portal_user_id = _user;
$$;

-- Let portal users see announcements for their tenants
DROP POLICY IF EXISTS "portal_select_announcements" ON public.announcements;
CREATE POLICY "portal_select_announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.portal_my_tenants(auth.uid())));
