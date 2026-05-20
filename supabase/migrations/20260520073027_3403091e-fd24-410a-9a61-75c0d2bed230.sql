DROP POLICY IF EXISTS "Portal read own attendance" ON public.attendance;
CREATE POLICY "Portal read own attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())));