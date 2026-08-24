-- 1. Fix mutable search_path on remaining functions
ALTER FUNCTION public._tg_discount_after() SET search_path = public;
ALTER FUNCTION public._tg_grn_number() SET search_path = public;
ALTER FUNCTION public._tg_po_number() SET search_path = public;
ALTER FUNCTION public._tg_invoice_number() SET search_path = public;
ALTER FUNCTION public._tg_receipt_number() SET search_path = public;
ALTER FUNCTION public._tg_invoice_line_recompute() SET search_path = public;
ALTER FUNCTION public._tg_alloc_after() SET search_path = public;
ALTER FUNCTION public._tg_invoice_line_after() SET search_path = public;
ALTER FUNCTION public._tg_expense_number() SET search_path = public;
ALTER FUNCTION public._tg_requisition_number() SET search_path = public;

-- 2. Harden portal_my_student_ids so a caller cannot impersonate another user
CREATE OR REPLACE FUNCTION public.portal_my_student_ids(_user uuid DEFAULT auth.uid())
 RETURNS TABLE(student_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT CASE
             WHEN auth.uid() IS NULL THEN NULL::uuid
             WHEN _user = auth.uid() OR public.is_super_admin(auth.uid()) THEN _user
             ELSE auth.uid()
           END AS uid
  )
  SELECT DISTINCT sg.student_id
    FROM public.student_guardians sg
    JOIN public.guardians g ON g.id = sg.guardian_id, me
   WHERE g.portal_user_id = me.uid AND me.uid IS NOT NULL
  UNION
  SELECT s.id FROM public.students s, me
   WHERE s.portal_user_id = me.uid AND me.uid IS NOT NULL;
$function$;

-- 3. Revoke EXECUTE on SECURITY DEFINER functions from anon / public,
--    and from authenticated for internal-only (trigger / worker) functions.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    IF r.proname LIKE '\_tg\_%' OR r.proname IN ('handle_new_user','handle_new_tenant','claim_due_messages') THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', r.sig);
    ELSE
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    END IF;
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- 4. Restrict realtime-published sensitive tables to permission holders
DROP POLICY IF EXISTS tenant_select_mpesa_transactions ON public.mpesa_transactions;
DROP POLICY IF EXISTS tenant_select_mpesa_tx ON public.mpesa_transactions;
DROP POLICY IF EXISTS tenant_manage_mpesa_tx ON public.mpesa_transactions;
CREATE POLICY tenant_select_mpesa_transactions ON public.mpesa_transactions
  FOR SELECT TO authenticated
  USING (
    is_tenant_member(tenant_id) AND (
      has_perm(tenant_id, 'mpesa.view') OR has_perm(tenant_id, 'mpesa.configure')
      OR has_perm(tenant_id, 'finance.view') OR has_perm(tenant_id, 'fees.view')
    )
  );

DROP POLICY IF EXISTS "Tenant members can read vehicle locations" ON public.vehicle_locations;
CREATE POLICY "Transport staff can read vehicle locations" ON public.vehicle_locations
  FOR SELECT TO authenticated
  USING (
    is_tenant_member(tenant_id) AND (
      has_perm(tenant_id, 'transport.view') OR has_perm(tenant_id, 'transport.manage')
      OR has_perm(tenant_id, 'transport.drive')
    )
  );

DROP POLICY IF EXISTS tenant_select_whatsapp_messages ON public.whatsapp_messages;
CREATE POLICY tenant_select_whatsapp_messages ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (
    is_tenant_member(tenant_id) AND (
      has_perm(tenant_id, 'whatsapp.view') OR has_perm(tenant_id, 'whatsapp.send')
      OR has_perm(tenant_id, 'whatsapp.configure')
    )
  );

-- 5. Scope out-pass policies to authenticated role explicitly
DROP POLICY IF EXISTS view_out_passes ON public.hostel_out_passes;
CREATE POLICY view_out_passes ON public.hostel_out_passes
  FOR SELECT TO authenticated
  USING (
    (is_tenant_member(tenant_id) AND has_perm(tenant_id, 'hostel.view'))
    OR student_id IN (SELECT s.student_id FROM public.portal_my_student_ids() s)
  );
DROP POLICY IF EXISTS guardian_update_out_passes ON public.hostel_out_passes;
CREATE POLICY guardian_update_out_passes ON public.hostel_out_passes
  FOR UPDATE TO authenticated
  USING (student_id IN (SELECT s.student_id FROM public.portal_my_student_ids() s))
  WITH CHECK (student_id IN (SELECT s.student_id FROM public.portal_my_student_ids() s));