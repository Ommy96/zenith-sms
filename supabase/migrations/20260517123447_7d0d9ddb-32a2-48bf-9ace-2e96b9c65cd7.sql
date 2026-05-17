-- Enums
DO $$ BEGIN
  CREATE TYPE fee_frequency_enum AS ENUM ('per_term','per_year','one_off','monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_channel_enum AS ENUM ('sms','whatsapp','email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend fee_items (NULL learner_category = applies to all)
ALTER TABLE public.fee_items
  ADD COLUMN IF NOT EXISTS frequency fee_frequency_enum NOT NULL DEFAULT 'per_term',
  ADD COLUMN IF NOT EXISTS applies_to_terms jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS late_fee_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee_after_days int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS learner_category public.learner_category_enum;

-- Extend fee_structures
ALTER TABLE public.fee_structures
  ADD COLUMN IF NOT EXISTS grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS learner_category public.learner_category_enum;

-- Scholarships
CREATE TABLE IF NOT EXISTS public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  type discount_type_enum NOT NULL DEFAULT 'percent',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  eligibility_criteria text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_scholarships_tenant ON public.scholarships(tenant_id);

CREATE TABLE IF NOT EXISTS public.student_fee_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  scholarship_id uuid REFERENCES public.scholarships(id) ON DELETE SET NULL,
  custom_amount numeric(12,2),
  reason text,
  approved_by uuid,
  valid_from date,
  valid_until date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_fee_adjustments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sfa_student ON public.student_fee_adjustments(student_id);

CREATE TABLE IF NOT EXISTS public.payment_reminders_config (
  tenant_id uuid PRIMARY KEY,
  channels reminder_channel_enum[] NOT NULL DEFAULT ARRAY['sms','whatsapp']::reminder_channel_enum[],
  days_before_due int[] NOT NULL DEFAULT ARRAY[7,3,1],
  days_after_due int[] NOT NULL DEFAULT ARRAY[1,7,14,30],
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_reminders_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  channel reminder_channel_enum NOT NULL,
  recipient text,
  message text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reminder_log_invoice ON public.reminder_log(invoice_id);

-- M-Pesa tenant-scoping
ALTER TABLE public.mpesa_config
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS callback_url text,
  ADD COLUMN IF NOT EXISTS security_credential text;

ALTER TABLE public.mpesa_transactions
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS matched_payment_id uuid REFERENCES public.student_payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS account_reference_raw text,
  ADD COLUMN IF NOT EXISTS resolved_by uuid,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_mpesa_receipt_per_tenant
  ON public.mpesa_transactions (tenant_id, mpesa_receipt)
  WHERE tenant_id IS NOT NULL;

ALTER TABLE public.mpesa_stk_requests
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Tenant policies (additive to existing legacy school-scoped ones)
DROP POLICY IF EXISTS tenant_select_mpesa_config ON public.mpesa_config;
CREATE POLICY tenant_select_mpesa_config ON public.mpesa_config FOR SELECT TO authenticated
  USING (tenant_id IS NOT NULL AND is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_manage_mpesa_config ON public.mpesa_config;
CREATE POLICY tenant_manage_mpesa_config ON public.mpesa_config FOR ALL TO authenticated
  USING (tenant_id IS NOT NULL AND has_perm(tenant_id,'mpesa.configure'))
  WITH CHECK (tenant_id IS NOT NULL AND has_perm(tenant_id,'mpesa.configure'));

DROP POLICY IF EXISTS tenant_select_mpesa_tx ON public.mpesa_transactions;
CREATE POLICY tenant_select_mpesa_tx ON public.mpesa_transactions FOR SELECT TO authenticated
  USING (tenant_id IS NOT NULL AND is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_manage_mpesa_tx ON public.mpesa_transactions;
CREATE POLICY tenant_manage_mpesa_tx ON public.mpesa_transactions FOR ALL TO authenticated
  USING (tenant_id IS NOT NULL AND is_tenant_member(tenant_id))
  WITH CHECK (tenant_id IS NOT NULL AND is_tenant_member(tenant_id));

DROP POLICY IF EXISTS tenant_select_stk ON public.mpesa_stk_requests;
CREATE POLICY tenant_select_stk ON public.mpesa_stk_requests FOR SELECT TO authenticated
  USING (tenant_id IS NOT NULL AND is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_manage_stk ON public.mpesa_stk_requests;
CREATE POLICY tenant_manage_stk ON public.mpesa_stk_requests FOR ALL TO authenticated
  USING (tenant_id IS NOT NULL AND is_tenant_member(tenant_id))
  WITH CHECK (tenant_id IS NOT NULL AND is_tenant_member(tenant_id));

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['scholarships','student_fee_adjustments','payment_reminders_config','reminder_log']) LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_select_%1$s ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_manage_%1$s ON public.%1$s', t);
    EXECUTE format('CREATE POLICY tenant_select_%1$s ON public.%1$s FOR SELECT TO authenticated USING (is_tenant_member(tenant_id))', t);
    EXECUTE format('CREATE POLICY tenant_manage_%1$s ON public.%1$s FOR ALL TO authenticated USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id))', t);
  END LOOP;
END $$;

-- Permissions
INSERT INTO public.permissions (key, category, description) VALUES
  ('mpesa.configure','finance','Configure M-Pesa credentials and callback URLs'),
  ('payroll.view','payroll','View payroll runs and slips'),
  ('payroll.process','payroll','Create and process payroll runs'),
  ('payroll.configure','payroll','Configure payroll formulas and bank exports'),
  ('expenses.view','expenses','View school expenses'),
  ('expenses.create','expenses','Submit expense claims'),
  ('expenses.approve','expenses','Approve or reject expense claims')
ON CONFLICT (key) DO NOTHING;

DO $$
DECLARE r record; p record;
BEGIN
  FOR r IN SELECT id FROM public.roles WHERE name IN ('school_admin','bursar','accountant','super_admin','finance') LOOP
    FOR p IN SELECT id FROM public.permissions WHERE key IN
      ('mpesa.configure','payroll.view','payroll.process','payroll.configure',
       'expenses.view','expenses.create','expenses.approve')
    LOOP
      INSERT INTO public.role_permissions (role_id, permission_id) VALUES (r.id, p.id) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Reconciliation helpers
CREATE OR REPLACE FUNCTION public.normalize_account_ref(_raw text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT regexp_replace(upper(COALESCE(_raw,'')), '[^A-Z0-9]', '', 'g');
$$;

CREATE OR REPLACE FUNCTION public.manual_reconcile_mpesa(
  _txn uuid, _student uuid, _invoice uuid DEFAULT NULL, _user uuid DEFAULT auth.uid()
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tx record; v_payment uuid; v_invoice uuid := _invoice; v_existing uuid;
BEGIN
  SELECT * INTO v_tx FROM public.mpesa_transactions WHERE id = _txn;
  IF v_tx IS NULL THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF v_tx.tenant_id IS NULL THEN RAISE EXCEPTION 'Transaction has no tenant'; END IF;

  IF v_tx.matched_payment_id IS NOT NULL THEN RETURN v_tx.matched_payment_id; END IF;

  SELECT id INTO v_existing FROM public.student_payments
    WHERE tenant_id = v_tx.tenant_id AND reference = v_tx.mpesa_receipt LIMIT 1;
  IF v_existing IS NOT NULL THEN
    UPDATE public.mpesa_transactions SET
      matched_payment_id = v_existing, matched_student_id = _student,
      matched_invoice_id = v_invoice, status = 'matched',
      resolved_by = _user, resolved_at = now()
    WHERE id = _txn;
    RETURN v_existing;
  END IF;

  IF v_invoice IS NULL THEN
    SELECT id INTO v_invoice FROM public.student_invoices
      WHERE tenant_id = v_tx.tenant_id AND student_id = _student
        AND balance > 0 AND status NOT IN ('void','draft')
      ORDER BY COALESCE(due_date, issued_at, created_at::date) ASC LIMIT 1;
  END IF;

  INSERT INTO public.student_payments (
    tenant_id, student_id, amount, method, reference, paid_at, received_by, notes
  ) VALUES (
    v_tx.tenant_id, _student, v_tx.amount, 'mpesa', v_tx.mpesa_receipt,
    v_tx.transaction_time, _user,
    'Auto-reconciled from M-Pesa ' || COALESCE(v_tx.phone,'')
  ) RETURNING id INTO v_payment;

  IF v_invoice IS NOT NULL THEN
    INSERT INTO public.payment_allocations (tenant_id, payment_id, invoice_id, amount)
    VALUES (v_tx.tenant_id, v_payment, v_invoice,
            LEAST(v_tx.amount, (SELECT balance FROM public.student_invoices WHERE id = v_invoice)));
  END IF;

  INSERT INTO public.student_receipts (tenant_id, payment_id, receipt_number)
    VALUES (v_tx.tenant_id, v_payment, '');

  UPDATE public.mpesa_transactions SET
    matched_payment_id = v_payment, matched_student_id = _student,
    matched_invoice_id = v_invoice, status = 'matched',
    resolved_by = _user, resolved_at = now()
  WHERE id = _txn;
  RETURN v_payment;
END $$;

CREATE OR REPLACE FUNCTION public._tg_mpesa_auto_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_norm text; v_student uuid;
BEGIN
  IF NEW.tenant_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.matched_payment_id IS NOT NULL OR NEW.status = 'matched' THEN RETURN NEW; END IF;

  v_norm := public.normalize_account_ref(COALESCE(NEW.account_reference, NEW.bill_ref_number));
  SELECT id INTO v_student FROM public.students
    WHERE tenant_id = NEW.tenant_id
      AND public.normalize_account_ref(admission_number) = v_norm
    LIMIT 1;

  IF v_student IS NOT NULL THEN
    PERFORM public.manual_reconcile_mpesa(NEW.id, v_student, NULL, NULL);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_mpesa_auto_match ON public.mpesa_transactions;
CREATE TRIGGER tg_mpesa_auto_match AFTER INSERT ON public.mpesa_transactions
  FOR EACH ROW EXECUTE FUNCTION public._tg_mpesa_auto_match();
