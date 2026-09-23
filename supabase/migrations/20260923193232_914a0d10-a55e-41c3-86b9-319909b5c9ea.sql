CREATE POLICY "Service account manages staff invitations"
ON public.staff_invitations FOR ALL TO service_role
USING (true) WITH CHECK (true);