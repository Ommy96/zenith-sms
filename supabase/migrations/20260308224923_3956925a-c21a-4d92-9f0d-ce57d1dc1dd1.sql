
CREATE POLICY "School admins can delete invoices"
ON public.invoices
FOR DELETE
TO authenticated
USING (
  school_id = get_user_school_id(auth.uid())
  AND has_role(auth.uid(), 'school_admin'::app_role)
);
