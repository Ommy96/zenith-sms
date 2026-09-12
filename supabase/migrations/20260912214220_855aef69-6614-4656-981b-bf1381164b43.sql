
-- ============ PERMISSIONS ============
INSERT INTO public.permissions (name, description, category) VALUES
  ('expenses.view','View expenses','finance'),
  ('expenses.create','Create expenses','finance'),
  ('expenses.approve','Approve expenses','finance'),
  ('expenses.pay','Mark expenses paid','finance'),
  ('invoices.void','Void or write off invoices','finance'),
  ('payments.reverse','Reverse payments','finance')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.tenant_id IS NULL AND r.name IN ('super_admin','school_admin','principal','bursar')
  AND p.name IN ('expenses.view','expenses.create','expenses.approve','expenses.pay',
                 'invoices.void','payments.reverse','invoices.view','invoices.create',
                 'payments.view','payments.record','fees.view','fees.structure',
                 'payroll.view','payroll.run')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.tenant_id IS NULL AND r.name = 'accounts_clerk'
  AND p.name IN ('fees.view','invoices.view','invoices.create','payments.view',
                 'payments.record','expenses.view','expenses.create')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.tenant_id IS NULL AND r.name = 'class_teacher'
  AND p.name IN ('fees.view','invoices.view')
ON CONFLICT DO NOTHING;

-- ============ TABLES ============
CREATE TABLE public.fee_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('tuition','boarding','transport','meals','activities','exams','uniform','books','other','penalty','deposit')),
  is_refundable boolean NOT NULL DEFAULT false,
  is_optional boolean NOT NULL DEFAULT false,
  vat_applicable boolean NOT NULL DEFAULT false,
  vat_rate numeric(5,2) NOT NULL DEFAULT 0,
  accounting_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE CASCADE,
  scholar_type text CHECK (scholar_type IN ('day','boarding','weekly_boarding','international')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX fee_structures_unique_combo ON public.fee_structures
  (tenant_id, academic_year_id, COALESCE(grade_level_id,'00000000-0000-0000-0000-000000000000'::uuid), COALESCE(scholar_type,''));

CREATE TABLE public.fee_structure_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fee_structure_id uuid NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  fee_item_id uuid NOT NULL REFERENCES public.fee_items(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES' CHECK (currency ~ '^[A-Z]{3}$'),
  due_date_offset_days integer NOT NULL DEFAULT 0,
  is_mandatory boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX fee_structure_items_unique_combo ON public.fee_structure_items
  (fee_structure_id, fee_item_id, COALESCE(term_id,'00000000-0000-0000-0000-000000000000'::uuid));

CREATE TABLE public.student_fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id uuid NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX student_fee_structures_one_active
  ON public.student_fee_structures (student_id, academic_year_id) WHERE unassigned_at IS NULL;

CREATE TABLE public.student_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE CASCADE,
  discount_type text NOT NULL CHECK (discount_type IN ('sibling','staff_child','scholarship','financial_aid','bursary','promotional','other')),
  name text NOT NULL,
  amount numeric(14,2),
  percentage numeric(5,2),
  applies_to_fee_items uuid[],
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (amount IS NOT NULL OR percentage IS NOT NULL)
);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount_total numeric(14,2) NOT NULL DEFAULT 0,
  vat_total numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  amount_paid numeric(14,2) NOT NULL DEFAULT 0,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES' CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','partial','paid','overdue','cancelled','written_off')),
  notes text,
  created_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  issued_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);
CREATE INDEX invoices_tenant_student_idx ON public.invoices (tenant_id, student_id, issue_date DESC);
CREATE INDEX invoices_tenant_status_idx ON public.invoices (tenant_id, status);
CREATE INDEX invoices_tenant_due_idx ON public.invoices (tenant_id, due_date) WHERE status <> 'paid';

CREATE TABLE public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  fee_item_id uuid REFERENCES public.fee_items(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(8,2) NOT NULL DEFAULT 1,
  unit_amount numeric(14,2) NOT NULL,
  discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invoice_line_items_invoice_idx ON public.invoice_line_items (invoice_id);

CREATE TABLE public.credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  credit_note_number text NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES' CHECK (currency ~ '^[A-Z]{3}$'),
  reason text NOT NULL CHECK (reason IN ('refund','write_off','discount_after_bill','error_correction','goodwill')),
  description text,
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, credit_note_number)
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payment_number text NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES' CHECK (currency ~ '^[A-Z]{3}$'),
  method text NOT NULL CHECK (method IN ('mpesa','cash','bank_transfer','cheque','card','mobile_wallet','other')),
  reference text,
  payer_name text,
  payer_phone text,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','reversed','failed','refunded')),
  paid_at timestamptz NOT NULL DEFAULT now(),
  received_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  bank_account text,
  notes text,
  idempotency_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, payment_number)
);
CREATE UNIQUE INDEX payments_idempotency_idx ON public.payments (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX payments_tenant_student_idx ON public.payments (tenant_id, student_id, paid_at DESC);
CREATE INDEX payments_tenant_method_idx ON public.payments (tenant_id, method, paid_at DESC);
CREATE INDEX payments_tenant_status_idx ON public.payments (tenant_id, status);

CREATE TABLE public.payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  allocated_at timestamptz NOT NULL DEFAULT now(),
  allocated_by uuid REFERENCES public.staff(id) ON DELETE SET NULL
);
CREATE INDEX payment_allocations_payment_idx ON public.payment_allocations (tenant_id, payment_id);
CREATE INDEX payment_allocations_invoice_idx ON public.payment_allocations (tenant_id, invoice_id);

CREATE TABLE public.student_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  receipt_number text NOT NULL,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES' CHECK (currency ~ '^[A-Z]{3}$'),
  pdf_url text,
  pdf_generated_at timestamptz,
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  is_regenerated boolean NOT NULL DEFAULT false,
  regenerated_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, receipt_number)
);
CREATE INDEX student_receipts_student_idx ON public.student_receipts (tenant_id, student_id, issued_at DESC);

CREATE TABLE public.mpesa_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  environment text NOT NULL CHECK (environment IN ('sandbox','production')),
  shortcode_type text NOT NULL CHECK (shortcode_type IN ('paybill','till')),
  shortcode text NOT NULL,
  initiator_name text,
  consumer_key_encrypted text,
  consumer_secret_encrypted text,
  passkey_encrypted text,
  callback_registered boolean NOT NULL DEFAULT false,
  callback_registered_at timestamptz,
  is_active boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, environment)
);

CREATE TABLE public.mpesa_c2b_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  business_shortcode text NOT NULL,
  transaction_type text NOT NULL,
  transaction_id text NOT NULL UNIQUE,
  transaction_time timestamptz NOT NULL,
  amount numeric(14,2) NOT NULL,
  msisdn text NOT NULL,
  bill_ref_number text,
  first_name text,
  middle_name text,
  last_name text,
  matched_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  matched_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  matched_payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  match_status text NOT NULL DEFAULT 'pending' CHECK (match_status IN ('pending','matched','unmatched','ambiguous','ignored','error')),
  match_reason text,
  matched_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  matched_at timestamptz,
  raw_payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mpesa_c2b_tenant_time_idx ON public.mpesa_c2b_transactions (tenant_id, transaction_time DESC);
CREATE INDEX mpesa_c2b_tenant_match_idx ON public.mpesa_c2b_transactions (tenant_id, match_status);
CREATE INDEX mpesa_c2b_shortcode_idx ON public.mpesa_c2b_transactions (business_shortcode, transaction_time DESC);

CREATE TABLE public.mpesa_stk_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL,
  msisdn text NOT NULL,
  account_reference text NOT NULL,
  transaction_desc text,
  checkout_request_id text,
  merchant_request_id text,
  result_code integer,
  result_desc text,
  mpesa_receipt_number text,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','pending','success','failed','cancelled','timeout')),
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  initiated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  raw_response jsonb
);
CREATE UNIQUE INDEX mpesa_stk_checkout_idx ON public.mpesa_stk_requests (checkout_request_id) WHERE checkout_request_id IS NOT NULL;
CREATE INDEX mpesa_stk_tenant_status_idx ON public.mpesa_stk_requests (tenant_id, status, initiated_at DESC);
CREATE INDEX mpesa_stk_tenant_student_idx ON public.mpesa_stk_requests (tenant_id, student_id, initiated_at DESC);

CREATE TABLE public.fee_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('gentle','firm','final','legal_notice')),
  channel text NOT NULL CHECK (channel IN ('sms','whatsapp','email','letter')),
  sent_to text NOT NULL,
  amount_owed_at_send numeric(14,2) NOT NULL,
  message_id uuid,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_by uuid REFERENCES public.staff(id) ON DELETE SET NULL
);
CREATE INDEX fee_reminders_student_idx ON public.fee_reminders (tenant_id, student_id, sent_at DESC);

CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  accounting_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  expense_number text NOT NULL,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  vendor_name text,
  description text NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES' CHECK (currency ~ '^[A-Z]{3}$'),
  vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  payment_method text,
  payment_reference text,
  expense_date date NOT NULL,
  paid_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected','cancelled')),
  requested_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_at timestamptz,
  paid_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  receipt_url text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, expense_number)
);

CREATE TABLE public.payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  period_type text NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('monthly','weekly','biweekly','daily')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  pay_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','calculated','approved','paid','closed')),
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, start_date, end_date),
  CHECK (end_date > start_date)
);

CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payroll_period_id uuid NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_compensation_id uuid REFERENCES public.staff_compensation(id) ON DELETE CASCADE,
  base_salary numeric(14,2) NOT NULL,
  allowances_total numeric(14,2) NOT NULL DEFAULT 0,
  gross_pay numeric(14,2) NOT NULL,
  paye_tax numeric(14,2) NOT NULL DEFAULT 0,
  nssf_contribution numeric(14,2) NOT NULL DEFAULT 0,
  nhif_contribution numeric(14,2) NOT NULL DEFAULT 0,
  shif_contribution numeric(14,2) NOT NULL DEFAULT 0,
  housing_levy numeric(14,2) NOT NULL DEFAULT 0,
  other_deductions numeric(14,2) NOT NULL DEFAULT 0,
  deductions_total numeric(14,2) NOT NULL DEFAULT 0,
  net_pay numeric(14,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('bank','mpesa','cash')),
  payment_reference text,
  payslip_url text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_period_id, staff_id)
);

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prefix text; next_num int;
BEGIN
  prefix := 'INV/' || to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(NULLIF(regexp_replace(invoice_number, '^' || prefix || '/', ''), '')::int), 0) + 1
  INTO next_num FROM invoices
  WHERE tenant_id = p_tenant_id AND invoice_number ~ ('^' || prefix || '/[0-9]+$');
  RETURN prefix || '/' || lpad(next_num::text, 5, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.generate_payment_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prefix text; next_num int;
BEGIN
  prefix := 'PAY/' || to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(NULLIF(regexp_replace(payment_number, '^' || prefix || '/', ''), '')::int), 0) + 1
  INTO next_num FROM payments
  WHERE tenant_id = p_tenant_id AND payment_number ~ ('^' || prefix || '/[0-9]+$');
  RETURN prefix || '/' || lpad(next_num::text, 5, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prefix text; next_num int;
BEGIN
  prefix := 'RCT/' || to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(NULLIF(regexp_replace(receipt_number, '^' || prefix || '/', ''), '')::int), 0) + 1
  INTO next_num FROM student_receipts
  WHERE tenant_id = p_tenant_id AND receipt_number ~ ('^' || prefix || '/[0-9]+$');
  RETURN prefix || '/' || lpad(next_num::text, 5, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.generate_credit_note_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prefix text; next_num int;
BEGIN
  prefix := 'CRN/' || to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(NULLIF(regexp_replace(credit_note_number, '^' || prefix || '/', ''), '')::int), 0) + 1
  INTO next_num FROM credit_notes
  WHERE tenant_id = p_tenant_id AND credit_note_number ~ ('^' || prefix || '/[0-9]+$');
  RETURN prefix || '/' || lpad(next_num::text, 5, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.generate_expense_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prefix text; next_num int;
BEGIN
  prefix := 'EXP/' || to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(NULLIF(regexp_replace(expense_number, '^' || prefix || '/', ''), '')::int), 0) + 1
  INTO next_num FROM expenses
  WHERE tenant_id = p_tenant_id AND expense_number ~ ('^' || prefix || '/[0-9]+$');
  RETURN prefix || '/' || lpad(next_num::text, 5, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.recompute_invoice_totals(p_invoice_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_subtotal numeric; v_discount numeric; v_vat numeric; v_paid numeric; v_total numeric; v_balance numeric;
BEGIN
  SELECT COALESCE(SUM(line_total),0), COALESCE(SUM(discount_amount),0), COALESCE(SUM(vat_amount),0)
  INTO v_subtotal, v_discount, v_vat FROM invoice_line_items WHERE invoice_id = p_invoice_id;
  SELECT COALESCE(SUM(amount),0) INTO v_paid FROM payment_allocations WHERE invoice_id = p_invoice_id;
  v_total := v_subtotal;
  v_balance := v_total - v_paid;
  UPDATE invoices SET
    subtotal = v_subtotal, discount_total = v_discount, vat_total = v_vat,
    total = v_total, amount_paid = v_paid, balance = v_balance,
    status = CASE
      WHEN status IN ('cancelled','written_off','draft') THEN status
      WHEN v_balance <= 0 AND v_total > 0 THEN 'paid'
      WHEN v_paid > 0 AND v_balance > 0 THEN 'partial'
      WHEN due_date IS NOT NULL AND due_date < current_date AND v_balance > 0 THEN 'overdue'
      ELSE status END,
    updated_at = now()
  WHERE id = p_invoice_id;
END; $$;

CREATE OR REPLACE FUNCTION public.calc_kenya_paye(p_gross numeric)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE tax numeric := 0;
BEGIN
  IF p_gross <= 24000 THEN tax := p_gross * 0.10;
  ELSIF p_gross <= 32333 THEN tax := 2400 + (p_gross - 24000) * 0.25;
  ELSIF p_gross <= 500000 THEN tax := 4483.25 + (p_gross - 32333) * 0.30;
  ELSIF p_gross <= 800000 THEN tax := 144783.35 + (p_gross - 500000) * 0.325;
  ELSE tax := 242283.35 + (p_gross - 800000) * 0.35;
  END IF;
  tax := GREATEST(tax - 2400, 0);
  RETURN round(tax, 2);
END; $$;

CREATE OR REPLACE FUNCTION public.calc_kenya_payroll(p_staff_id uuid, p_gross numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE v_paye numeric; v_nssf numeric; v_shif numeric; v_housing numeric; v_net numeric; v_deductions numeric;
BEGIN
  v_paye := calc_kenya_paye(p_gross);
  v_nssf := round(LEAST(p_gross * 0.06, 2160), 2);
  v_shif := round(p_gross * 0.0275, 2);
  v_housing := round(p_gross * 0.015, 2);
  v_deductions := v_paye + v_nssf + v_shif + v_housing;
  v_net := p_gross - v_deductions;
  RETURN jsonb_build_object('gross', p_gross, 'paye', v_paye, 'nssf', v_nssf,
    'shif', v_shif, 'housing_levy', v_housing, 'total_deductions', v_deductions, 'net_pay', v_net);
END; $$;

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public._tg_invoice_number() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN NEW.invoice_number := generate_invoice_number(NEW.tenant_id); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public._tg_payment_number() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN NEW.payment_number := generate_payment_number(NEW.tenant_id); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public._tg_receipt_number() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN NEW.receipt_number := generate_receipt_number(NEW.tenant_id); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public._tg_credit_note_number() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN IF NEW.credit_note_number IS NULL OR NEW.credit_note_number = '' THEN NEW.credit_note_number := generate_credit_note_number(NEW.tenant_id); END IF; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public._tg_expense_number() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN IF NEW.expense_number IS NULL OR NEW.expense_number = '' THEN NEW.expense_number := generate_expense_number(NEW.tenant_id); END IF; RETURN NEW; END; $$;

ALTER TABLE public.invoices ALTER COLUMN invoice_number DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN payment_number DROP NOT NULL;
ALTER TABLE public.student_receipts ALTER COLUMN receipt_number DROP NOT NULL;
ALTER TABLE public.credit_notes ALTER COLUMN credit_note_number DROP NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN expense_number DROP NOT NULL;

CREATE TRIGGER trg_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public._tg_invoice_number();
CREATE TRIGGER trg_payment_number BEFORE INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public._tg_payment_number();
CREATE TRIGGER trg_receipt_number BEFORE INSERT ON public.student_receipts FOR EACH ROW EXECUTE FUNCTION public._tg_receipt_number();
CREATE TRIGGER trg_credit_note_number BEFORE INSERT ON public.credit_notes FOR EACH ROW EXECUTE FUNCTION public._tg_credit_note_number();
CREATE TRIGGER trg_expense_number BEFORE INSERT ON public.expenses FOR EACH ROW EXECUTE FUNCTION public._tg_expense_number();

CREATE OR REPLACE FUNCTION public._tg_recompute_invoice() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM recompute_invoice_totals(OLD.invoice_id); RETURN OLD; END IF;
  PERFORM recompute_invoice_totals(NEW.invoice_id);
  IF TG_OP = 'UPDATE' AND OLD.invoice_id IS DISTINCT FROM NEW.invoice_id THEN
    PERFORM recompute_invoice_totals(OLD.invoice_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_line_items_recompute AFTER INSERT OR UPDATE OR DELETE ON public.invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION public._tg_recompute_invoice();
CREATE TRIGGER trg_allocations_recompute AFTER INSERT OR UPDATE OR DELETE ON public.payment_allocations
  FOR EACH ROW EXECUTE FUNCTION public._tg_recompute_invoice();

CREATE OR REPLACE FUNCTION public._tg_payment_status_refresh() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT invoice_id FROM payment_allocations WHERE payment_id = NEW.id LOOP
    PERFORM recompute_invoice_totals(r.invoice_id);
  END LOOP;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_payment_refresh AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public._tg_payment_status_refresh();

CREATE OR REPLACE FUNCTION public._tg_mpesa_match_student() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_student uuid; v_count int;
BEGIN
  IF NEW.matched_student_id IS NULL AND NEW.tenant_id IS NOT NULL AND NEW.bill_ref_number IS NOT NULL THEN
    SELECT count(*), min(id) INTO v_count, v_student FROM students
    WHERE tenant_id = NEW.tenant_id AND upper(trim(admission_number)) = upper(trim(NEW.bill_ref_number));
    IF v_count = 1 THEN
      NEW.matched_student_id := v_student;
      NEW.match_status := 'matched';
      NEW.match_reason := 'Auto-matched on admission number';
    ELSIF v_count > 1 THEN
      NEW.match_status := 'ambiguous';
      NEW.match_reason := 'Multiple students share this admission number';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_mpesa_match BEFORE INSERT ON public.mpesa_c2b_transactions
  FOR EACH ROW EXECUTE FUNCTION public._tg_mpesa_match_student();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['fee_items','fee_structures','fee_structure_items','student_fee_structures',
    'student_discounts','invoices','invoice_line_items','credit_notes','payments','student_receipts',
    'mpesa_config','expense_categories','expenses','payroll_periods','payroll_runs'] LOOP
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- ============ RLS + GRANTS ============
DO $$
DECLARE
  rec record;
  cfg constant jsonb := '[
    {"t":"fee_items","v":"fees.view","w":"fees.structure"},
    {"t":"fee_structures","v":"fees.view","w":"fees.structure"},
    {"t":"fee_structure_items","v":"fees.view","w":"fees.structure"},
    {"t":"student_fee_structures","v":"fees.view","w":"fees.structure"},
    {"t":"student_discounts","v":"fees.view","w":"fees.structure"},
    {"t":"invoices","v":"invoices.view","w":"invoices.create"},
    {"t":"invoice_line_items","v":"invoices.view","w":"invoices.create"},
    {"t":"credit_notes","v":"invoices.view","w":"invoices.create"},
    {"t":"payments","v":"payments.view","w":"payments.record"},
    {"t":"payment_allocations","v":"payments.view","w":"payments.record"},
    {"t":"student_receipts","v":"payments.view","w":"payments.record"},
    {"t":"mpesa_config","v":"tenant.settings.edit","w":"tenant.settings.edit"},
    {"t":"mpesa_c2b_transactions","v":"payments.view","w":"payments.record"},
    {"t":"mpesa_stk_requests","v":"payments.view","w":"payments.record"},
    {"t":"fee_reminders","v":"fees.view","w":"messages.send"},
    {"t":"expense_categories","v":"expenses.view","w":"expenses.create"},
    {"t":"expenses","v":"expenses.view","w":"expenses.create"},
    {"t":"payroll_periods","v":"payroll.view","w":"payroll.run"},
    {"t":"payroll_runs","v":"payroll.view","w":"payroll.run"}
  ]'::jsonb;
BEGIN
  FOR rec IN SELECT * FROM jsonb_to_recordset(cfg) AS x(t text, v text, w text) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.t);
    IF rec.t <> 'mpesa_config' THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', rec.t);
    END IF;
    EXECUTE format('GRANT ALL ON public.%I TO service_role', rec.t);

    IF rec.t = 'mpesa_c2b_transactions' THEN
      EXECUTE format($f$CREATE POLICY "%1$s_select" ON public.%1$s FOR SELECT TO authenticated
        USING (is_super_admin() OR (tenant_id IN (SELECT user_tenant_ids()) AND user_has_permission(tenant_id, %2$L)))$f$, rec.t, rec.v);
    ELSE
      EXECUTE format($f$CREATE POLICY "%1$s_select" ON public.%1$s FOR SELECT TO authenticated
        USING (tenant_id IN (SELECT user_tenant_ids()) AND (user_has_permission(tenant_id, %2$L) OR is_super_admin()))$f$, rec.t, rec.v);
    END IF;

    EXECUTE format($f$CREATE POLICY "%1$s_insert" ON public.%1$s FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT user_tenant_ids()) AND (user_has_permission(tenant_id, %2$L) OR is_super_admin()))$f$, rec.t, rec.w);
    EXECUTE format($f$CREATE POLICY "%1$s_update" ON public.%1$s FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT user_tenant_ids()) AND (user_has_permission(tenant_id, %2$L) OR is_super_admin()))
      WITH CHECK (tenant_id IN (SELECT user_tenant_ids()) AND (user_has_permission(tenant_id, %2$L) OR is_super_admin()))$f$, rec.t, rec.w);
    EXECUTE format($f$CREATE POLICY "%1$s_delete" ON public.%1$s FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT user_tenant_ids()) AND (user_has_permission(tenant_id, %2$L) OR is_super_admin()))$f$, rec.t, rec.w);
  END LOOP;
END $$;

-- mpesa_config: hide credential columns from authenticated entirely
GRANT SELECT (id, tenant_id, environment, shortcode_type, shortcode, initiator_name,
  callback_registered, callback_registered_at, is_active, notes, created_at, updated_at),
  INSERT, UPDATE (environment, shortcode_type, shortcode, initiator_name, callback_registered,
  callback_registered_at, is_active, notes), DELETE
ON public.mpesa_config TO authenticated;

-- Portal parent access
CREATE POLICY "invoices_portal_select" ON public.invoices FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM portal_my_student_ids(auth.uid()))
         AND status IN ('issued','partial','paid','overdue'));
CREATE POLICY "invoice_line_items_portal_select" ON public.invoice_line_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id
    AND i.student_id IN (SELECT student_id FROM portal_my_student_ids(auth.uid()))
    AND i.status IN ('issued','partial','paid','overdue')));
CREATE POLICY "payments_portal_select" ON public.payments FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM portal_my_student_ids(auth.uid())) AND status = 'confirmed');
CREATE POLICY "student_receipts_portal_select" ON public.student_receipts FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM portal_my_student_ids(auth.uid())));
CREATE POLICY "mpesa_stk_portal_select" ON public.mpesa_stk_requests FOR SELECT TO authenticated
  USING (initiated_by = auth.uid());
CREATE POLICY "student_fee_structures_portal_select" ON public.student_fee_structures FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM portal_my_student_ids(auth.uid())));
CREATE POLICY "student_discounts_portal_select" ON public.student_discounts FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM portal_my_student_ids(auth.uid())));

NOTIFY pgrst, 'reload schema';
