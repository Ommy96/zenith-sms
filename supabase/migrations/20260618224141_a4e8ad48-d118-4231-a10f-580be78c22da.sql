-- Section 6.4: Web Push subscriptions per user
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subs_tenant ON public.push_subscriptions(tenant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_push_subs_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.push_subscriptions IS
  'VAPID web-push subscriptions. Users may have multiple (one per device/browser).';

-- Section 6.5: Cross-table global search RPC, tenant-scoped
CREATE OR REPLACE FUNCTION public.global_search(_tenant uuid, _q text, _limit int DEFAULT 5)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pattern text := '%' || lower(trim(_q)) || '%';
  v_students jsonb;
  v_staff jsonb;
  v_invoices jsonb;
  v_classes jsonb;
BEGIN
  IF _tenant IS NULL OR _q IS NULL OR length(trim(_q)) < 2 THEN
    RETURN jsonb_build_object(
      'students', '[]'::jsonb, 'staff', '[]'::jsonb,
      'invoices', '[]'::jsonb, 'classes', '[]'::jsonb
    );
  END IF;
  IF NOT public.is_tenant_member(_tenant) THEN
    RAISE EXCEPTION 'Not a member of this tenant';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_students
  FROM (
    SELECT id, first_name, last_name, admission_number
    FROM public.students
    WHERE tenant_id = _tenant
      AND (lower(first_name) LIKE v_pattern
        OR lower(last_name) LIKE v_pattern
        OR lower(COALESCE(admission_number,'')) LIKE v_pattern
        OR lower(first_name || ' ' || last_name) LIKE v_pattern)
    ORDER BY last_name, first_name
    LIMIT _limit
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_staff
  FROM (
    SELECT id, first_name, last_name, staff_number, email
    FROM public.staff
    WHERE tenant_id = _tenant
      AND (lower(first_name) LIKE v_pattern
        OR lower(last_name) LIKE v_pattern
        OR lower(COALESCE(staff_number,'')) LIKE v_pattern
        OR lower(COALESCE(email,'')) LIKE v_pattern)
    ORDER BY last_name, first_name
    LIMIT _limit
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_invoices
  FROM (
    SELECT i.id, i.invoice_number, i.balance, i.total, i.status,
           s.first_name, s.last_name
    FROM public.student_invoices i
    JOIN public.students s ON s.id = i.student_id
    WHERE i.tenant_id = _tenant
      AND (lower(i.invoice_number) LIKE v_pattern
        OR lower(s.first_name || ' ' || s.last_name) LIKE v_pattern
        OR lower(COALESCE(s.admission_number,'')) LIKE v_pattern)
    ORDER BY i.created_at DESC
    LIMIT _limit
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_classes
  FROM (
    SELECT id, name, grade_level
    FROM public.classes
    WHERE tenant_id = _tenant
      AND (lower(name) LIKE v_pattern
        OR lower(COALESCE(grade_level,'')) LIKE v_pattern)
    ORDER BY name
    LIMIT _limit
  ) t;

  RETURN jsonb_build_object(
    'students', v_students, 'staff', v_staff,
    'invoices', v_invoices, 'classes', v_classes
  );
END $$;

REVOKE ALL ON FUNCTION public.global_search(uuid, text, int) FROM public;
GRANT EXECUTE ON FUNCTION public.global_search(uuid, text, int) TO authenticated;

COMMENT ON FUNCTION public.global_search IS
  'Tenant-scoped fuzzy search across students, staff, invoices, classes. Returns top N of each.';