
-- Generic audit-log trigger that captures every INSERT/UPDATE/DELETE on
-- security- or money-sensitive tables. Writes one row per mutation to
-- public.audit_logs. SECURITY DEFINER so it can write even when the
-- mutating role has restricted INSERT privileges on audit_logs.

CREATE OR REPLACE FUNCTION public._tg_write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
  v_entity_id uuid;
  v_before jsonb;
  v_after  jsonb;
BEGIN
  -- Derive tenant_id from row when present; tables we attach this to all carry it.
  BEGIN
    v_tenant := COALESCE(
      (CASE WHEN TG_OP IN ('UPDATE','INSERT') THEN (to_jsonb(NEW)->>'tenant_id')::uuid END),
      (CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN (to_jsonb(OLD)->>'tenant_id')::uuid END)
    );
  EXCEPTION WHEN others THEN v_tenant := NULL;
  END;

  -- Derive entity id from `id` column when present.
  BEGIN
    v_entity_id := COALESCE(
      (CASE WHEN TG_OP IN ('UPDATE','INSERT') THEN (to_jsonb(NEW)->>'id')::uuid END),
      (CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN (to_jsonb(OLD)->>'id')::uuid END)
    );
  EXCEPTION WHEN others THEN v_entity_id := NULL;
  END;

  IF TG_OP = 'UPDATE' THEN
    v_before := to_jsonb(OLD);
    v_after  := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after  := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after  := NULL;
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id, actor_user_id, entity_type, entity_id, action, before, after, created_at
  ) VALUES (
    v_tenant, auth.uid(), TG_TABLE_NAME, v_entity_id, lower(TG_OP), v_before, v_after, now()
  );

  RETURN COALESCE(NEW, OLD);
END $$;

-- Attach to high-sensitivity tables. Drop-and-recreate so the migration
-- is idempotent across reruns.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'students',
    'student_invoices',
    'student_payments',
    'staff',
    'payslips',
    'student_exam_results'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public._tg_write_audit_log()',
      t, t
    );
  END LOOP;
END $$;
