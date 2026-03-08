
CREATE POLICY "School admins can delete exams"
ON public.exams
FOR DELETE
TO authenticated
USING (
  school_id = get_user_school_id(auth.uid())
  AND has_role(auth.uid(), 'school_admin'::app_role)
);

CREATE POLICY "School admins can delete exam results"
ON public.exam_results
FOR DELETE
TO authenticated
USING (
  school_id = get_user_school_id(auth.uid())
  AND has_role(auth.uid(), 'school_admin'::app_role)
);
