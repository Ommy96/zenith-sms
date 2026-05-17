
-- Permissions
INSERT INTO public.permissions (key, description) VALUES
  ('expenses.view','View expenses'),
  ('expenses.manage','Create and edit expenses'),
  ('expenses.approve','Approve or reject expenses')
ON CONFLICT (key) DO NOTHING;

-- Grant to school_admin and bursar-like roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('school_admin','super_admin','bursar','finance_officer')
  AND p.key IN ('expenses.view','expenses.manage','expenses.approve')
ON CONFLICT DO NOTHING;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.expense_status_enum AS ENUM ('draft','submitted','approved','rejected','paid','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_payment_method_enum AS ENUM ('cash','mpesa','bank_transfer','cheque','card','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- expense_categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  gl_account_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_categories_select" ON public.expense_categories FOR SELECT
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "expense_categories_manage" ON public.expense_categories FOR ALL
  USING (public.has_perm(tenant_id, 'expenses.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'expenses.manage'));

CREATE TRIGGER trg_expense_categories_updated BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- expense_vendors
CREATE TABLE IF NOT EXISTS public.expense_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_phone text,
  contact_email text,
  tax_pin text,
  bank_name text,
  bank_account text,
  mpesa_number text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expense_vendors_tenant ON public.expense_vendors(tenant_id);
ALTER TABLE public.expense_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_vendors_select" ON public.expense_vendors FOR SELECT
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "expense_vendors_manage" ON public.expense_vendors FOR ALL
  USING (public.has_perm(tenant_id, 'expenses.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'expenses.manage'));

CREATE TRIGGER trg_expense_vendors_updated BEFORE UPDATE ON public.expense_vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  expense_number text,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES public.expense_vendors(id) ON DELETE SET NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  tax_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric(12,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
  payment_method public.expense_payment_method_enum NOT NULL DEFAULT 'cash',
  payment_reference text,
  paid_at timestamptz,
  status public.expense_status_enum NOT NULL DEFAULT 'draft',
  attachment_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON public.expenses(tenant_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(tenant_id, status);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select" ON public.expenses FOR SELECT
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "expenses_manage" ON public.expenses FOR ALL
  USING (public.has_perm(tenant_id, 'expenses.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'expenses.manage'));

CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Expense numbering
CREATE OR REPLACE FUNCTION public.generate_expense_number(_tenant uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  v_year text := to_char(now(),'YYYY');
  v_seq_key text := 'expense_seq:' || v_year;
  v_seq int; v_code text;
BEGIN
  SELECT COALESCE(code,'EXP') INTO v_code FROM public.tenants WHERE id = _tenant;
  INSERT INTO public.tenant_settings (tenant_id, key, value)
    VALUES (_tenant, v_seq_key, jsonb_build_object('n', 1))
    ON CONFLICT DO NOTHING;
  UPDATE public.tenant_settings
    SET value = jsonb_build_object('n', COALESCE((value->>'n')::int,0)+1), updated_at = now()
    WHERE tenant_id = _tenant AND key = v_seq_key
    RETURNING (value->>'n')::int INTO v_seq;
  RETURN format('%s-EXP/%s/%s', v_code, v_year, lpad(v_seq::text,5,'0'));
END $fn$;

CREATE OR REPLACE FUNCTION public._tg_expense_number()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  IF NEW.expense_number IS NULL OR NEW.expense_number = '' THEN
    NEW.expense_number := public.generate_expense_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END $fn$;

CREATE TRIGGER trg_expenses_number BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public._tg_expense_number();

-- expense_approvals
CREATE TABLE IF NOT EXISTS public.expense_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('submitted','approved','rejected','paid','voided')),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_expense ON public.expense_approvals(expense_id);
ALTER TABLE public.expense_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_approvals_select" ON public.expense_approvals FOR SELECT
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "expense_approvals_insert" ON public.expense_approvals FOR INSERT
  WITH CHECK (public.has_perm(tenant_id, 'expenses.manage'));

-- Seed common categories for new tenants helper
CREATE OR REPLACE FUNCTION public.seed_expense_categories(_tenant uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE n text;
BEGIN
  FOREACH n IN ARRAY ARRAY['Salaries & Wages','Utilities','Stationery & Supplies','Repairs & Maintenance','Transport & Fuel','Food & Catering','Cleaning','Internet & Communication','Bank Charges','Statutory Payments','Marketing','Training','Miscellaneous']
  LOOP
    INSERT INTO public.expense_categories(tenant_id, name)
      VALUES (_tenant, n) ON CONFLICT DO NOTHING;
  END LOOP;
END $fn$;
