-- ============================================================
-- FINANCE & BILLING MODULE
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE fee_category_enum AS ENUM ('tuition','transport','boarding','lunch','exam','activity','uniform','book','development','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status_enum AS ENUM ('draft','issued','partial','paid','overdue','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM ('cash','mpesa','airtel_money','bank_transfer','cheque','card','pos','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE discount_type_enum AS ENUM ('percent','fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE structure_applies_to_enum AS ENUM ('all','grade','class','individual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fee categories
CREATE TABLE IF NOT EXISTS public.fee_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  key fee_category_enum NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;

-- Fee structures
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  applies_to structure_applies_to_enum NOT NULL DEFAULT 'all',
  currency text NOT NULL DEFAULT 'KES',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_fee_structures_tenant ON public.fee_structures(tenant_id);

-- Fee items (lines on a structure)
CREATE TABLE IF NOT EXISTS public.fee_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  structure_id uuid NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  category fee_category_enum NOT NULL DEFAULT 'tuition',
  name text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  is_mandatory boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_fee_items_structure ON public.fee_items(structure_id);

-- Assignment of structure -> grade level or class
CREATE TABLE IF NOT EXISTS public.fee_structure_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  structure_id uuid NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_structure_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_fsa_structure ON public.fee_structure_assignments(structure_id);

-- Student invoices
CREATE TABLE IF NOT EXISTS public.student_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_number text,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  structure_id uuid REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_total numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  paid_total numeric(12,2) NOT NULL DEFAULT 0,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  status invoice_status_enum NOT NULL DEFAULT 'draft',
  issued_at date,
  due_date date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);
ALTER TABLE public.student_invoices ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_inv_tenant_status ON public.student_invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_inv_student ON public.student_invoices(student_id);

CREATE TABLE IF NOT EXISTS public.student_invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  category fee_category_enum NOT NULL DEFAULT 'tuition',
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_amount numeric(12,2) NOT NULL DEFAULT 0,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  fee_item_id uuid REFERENCES public.fee_items(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_invoice_lines ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_invline_invoice ON public.student_invoice_lines(invoice_id);

-- Fee discounts
CREATE TABLE IF NOT EXISTS public.fee_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  type discount_type_enum NOT NULL DEFAULT 'fixed',
  value numeric(12,2) NOT NULL DEFAULT 0,
  reason text,
  granted_by uuid,
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_discounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_discount_invoice ON public.fee_discounts(invoice_id);

-- Payments
CREATE TABLE IF NOT EXISTS public.student_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  method payment_method_enum NOT NULL DEFAULT 'cash',
  reference text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  received_by uuid,
  mpesa_txn_id uuid REFERENCES public.mpesa_transactions(id) ON DELETE SET NULL,
  notes text,
  is_refunded boolean NOT NULL DEFAULT false,
  refunded_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, reference)
);
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pay_student ON public.student_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_pay_tenant_date ON public.student_payments(tenant_id, paid_at DESC);

CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payment_id uuid NOT NULL REFERENCES public.student_payments(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_alloc_payment ON public.payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_alloc_invoice ON public.payment_allocations(invoice_id);

-- Receipts
CREATE TABLE IF NOT EXISTS public.student_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payment_id uuid NOT NULL REFERENCES public.student_payments(id) ON DELETE CASCADE,
  receipt_number text NOT NULL,
  pdf_url text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, receipt_number)
);
ALTER TABLE public.student_receipts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TRIGGERS to keep invoice totals/balance/status in sync
-- ============================================================
CREATE OR REPLACE FUNCTION public.recompute_invoice_totals(_invoice uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub numeric(12,2);
  v_disc numeric(12,2);
  v_paid numeric(12,2);
  v_total numeric(12,2);
  v_balance numeric(12,2);
  v_status invoice_status_enum;
  v_due date;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO v_sub FROM public.student_invoice_lines WHERE invoice_id = _invoice;
  SELECT COALESCE(SUM(
    CASE WHEN type = 'percent' THEN (v_sub * value / 100.0) ELSE value END
  ),0) INTO v_disc FROM public.fee_discounts WHERE invoice_id = _invoice;
  SELECT COALESCE(SUM(amount),0) INTO v_paid FROM public.payment_allocations WHERE invoice_id = _invoice;

  v_total := GREATEST(v_sub - v_disc, 0);
  v_balance := v_total - v_paid;

  SELECT due_date INTO v_due FROM public.student_invoices WHERE id = _invoice;

  IF v_balance <= 0 AND v_total > 0 THEN v_status := 'paid';
  ELSIF v_paid > 0 AND v_balance > 0 THEN v_status := 'partial';
  ELSIF v_due IS NOT NULL AND v_due < CURRENT_DATE AND v_balance > 0 THEN v_status := 'overdue';
  ELSE
    SELECT status INTO v_status FROM public.student_invoices WHERE id = _invoice;
    IF v_status IN ('void','draft') THEN
      -- preserve
      NULL;
    ELSE
      v_status := 'issued';
    END IF;
  END IF;

  UPDATE public.student_invoices SET
    subtotal = v_sub, discount_total = v_disc, total = v_total,
    paid_total = v_paid, balance = v_balance, status = v_status,
    updated_at = now()
  WHERE id = _invoice;
END $$;

-- Auto invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(_tenant uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(),'YYYY');
  v_seq_key text := 'invoice_seq:' || v_year;
  v_seq int;
  v_code text;
BEGIN
  SELECT COALESCE(code,'INV') INTO v_code FROM public.tenants WHERE id = _tenant;

  INSERT INTO public.tenant_settings (tenant_id, key, value)
  VALUES (_tenant, v_seq_key, jsonb_build_object('n', 1))
  ON CONFLICT DO NOTHING;

  UPDATE public.tenant_settings
  SET value = jsonb_build_object('n', COALESCE((value->>'n')::int,0) + 1),
      updated_at = now()
  WHERE tenant_id = _tenant AND key = v_seq_key
  RETURNING (value->>'n')::int INTO v_seq;

  RETURN format('%s-INV/%s/%s', v_code, v_year, lpad(v_seq::text, 5, '0'));
END $$;

CREATE OR REPLACE FUNCTION public.generate_receipt_number(_tenant uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(),'YYYY');
  v_seq_key text := 'receipt_seq:' || v_year;
  v_seq int;
  v_code text;
BEGIN
  SELECT COALESCE(code,'RCT') INTO v_code FROM public.tenants WHERE id = _tenant;
  INSERT INTO public.tenant_settings (tenant_id, key, value)
  VALUES (_tenant, v_seq_key, jsonb_build_object('n', 1))
  ON CONFLICT DO NOTHING;
  UPDATE public.tenant_settings
  SET value = jsonb_build_object('n', COALESCE((value->>'n')::int,0) + 1),
      updated_at = now()
  WHERE tenant_id = _tenant AND key = v_seq_key
  RETURNING (value->>'n')::int INTO v_seq;
  RETURN format('%s-RCT/%s/%s', v_code, v_year, lpad(v_seq::text, 5, '0'));
END $$;

CREATE OR REPLACE FUNCTION public._tg_invoice_line_recompute()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.amount := COALESCE(NEW.unit_amount,0) * COALESCE(NEW.quantity,1);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_invoice_line_amount ON public.student_invoice_lines;
CREATE TRIGGER tg_invoice_line_amount
  BEFORE INSERT OR UPDATE ON public.student_invoice_lines
  FOR EACH ROW EXECUTE FUNCTION public._tg_invoice_line_recompute();

CREATE OR REPLACE FUNCTION public._tg_invoice_line_after()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.recompute_invoice_totals(COALESCE(NEW.invoice_id, OLD.invoice_id));
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS tg_invoice_line_recompute ON public.student_invoice_lines;
CREATE TRIGGER tg_invoice_line_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.student_invoice_lines
  FOR EACH ROW EXECUTE FUNCTION public._tg_invoice_line_after();

CREATE OR REPLACE FUNCTION public._tg_alloc_after()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.recompute_invoice_totals(COALESCE(NEW.invoice_id, OLD.invoice_id));
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS tg_alloc_recompute ON public.payment_allocations;
CREATE TRIGGER tg_alloc_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_allocations
  FOR EACH ROW EXECUTE FUNCTION public._tg_alloc_after();

CREATE OR REPLACE FUNCTION public._tg_discount_after()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(NEW.invoice_id, OLD.invoice_id) IS NOT NULL THEN
    PERFORM public.recompute_invoice_totals(COALESCE(NEW.invoice_id, OLD.invoice_id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS tg_discount_recompute ON public.fee_discounts;
CREATE TRIGGER tg_discount_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.fee_discounts
  FOR EACH ROW EXECUTE FUNCTION public._tg_discount_after();

-- Updated_at triggers
DROP TRIGGER IF EXISTS tg_fs_updated ON public.fee_structures;
CREATE TRIGGER tg_fs_updated BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tg_inv_updated ON public.student_invoices;
CREATE TRIGGER tg_inv_updated BEFORE UPDATE ON public.student_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto invoice number on insert
CREATE OR REPLACE FUNCTION public._tg_invoice_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_invoice_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_invoice_number ON public.student_invoices;
CREATE TRIGGER tg_invoice_number BEFORE INSERT ON public.student_invoices
  FOR EACH ROW EXECUTE FUNCTION public._tg_invoice_number();

-- Auto receipt number on insert
CREATE OR REPLACE FUNCTION public._tg_receipt_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := public.generate_receipt_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_receipt_number ON public.student_receipts;
CREATE TRIGGER tg_receipt_number BEFORE INSERT ON public.student_receipts
  FOR EACH ROW EXECUTE FUNCTION public._tg_receipt_number();

-- ============================================================
-- PERMISSIONS
-- ============================================================
INSERT INTO public.permissions (key, category, description) VALUES
  ('finance.view','finance','View fees, invoices, payments, statements'),
  ('finance.configure','finance','Configure fee structures and items'),
  ('finance.invoice','finance','Create and edit student invoices'),
  ('finance.payment.record','finance','Record student payments'),
  ('finance.payment.refund','finance','Refund a payment'),
  ('finance.discount.grant','finance','Grant scholarships or discounts'),
  ('finance.report','finance','View finance reports and exports')
ON CONFLICT (key) DO NOTHING;

-- Grant to admin + bursar roles
DO $$
DECLARE r record; p record;
BEGIN
  FOR r IN SELECT id FROM public.roles WHERE name IN ('school_admin','bursar','accountant','super_admin','finance') LOOP
    FOR p IN SELECT id FROM public.permissions WHERE key IN
      ('finance.view','finance.configure','finance.invoice','finance.payment.record','finance.payment.refund','finance.discount.grant','finance.report')
    LOOP
      INSERT INTO public.role_permissions (role_id, permission_id) VALUES (r.id, p.id) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- RLS POLICIES
-- ============================================================
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'fee_categories','fee_structures','fee_items','fee_structure_assignments',
    'student_invoices','student_invoice_lines','fee_discounts',
    'student_payments','payment_allocations','student_receipts'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_select_%1$s ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_insert_%1$s ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_update_%1$s ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_delete_%1$s ON public.%1$s', t);
    EXECUTE format('CREATE POLICY tenant_select_%1$s ON public.%1$s FOR SELECT TO authenticated USING (is_tenant_member(tenant_id))', t);
    EXECUTE format('CREATE POLICY tenant_insert_%1$s ON public.%1$s FOR INSERT TO authenticated WITH CHECK (is_tenant_member(tenant_id))', t);
    EXECUTE format('CREATE POLICY tenant_update_%1$s ON public.%1$s FOR UPDATE TO authenticated USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id))', t);
    EXECUTE format('CREATE POLICY tenant_delete_%1$s ON public.%1$s FOR DELETE TO authenticated USING (is_tenant_member(tenant_id))', t);
  END LOOP;
END $$;

-- Seed fee categories per tenant
CREATE OR REPLACE FUNCTION public.seed_fee_categories(_tenant uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k fee_category_enum;
BEGIN
  FOR k IN SELECT unnest(ARRAY['tuition','transport','boarding','lunch','exam','activity','uniform','book','development','other']::fee_category_enum[]) LOOP
    INSERT INTO public.fee_categories(tenant_id, key, name)
    VALUES (_tenant, k, initcap(k::text))
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
