
-- Payroll periods (one per month per tenant)
CREATE TABLE public.payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  status text NOT NULL DEFAULT 'draft', -- draft | processed | paid | locked
  pay_date date,
  notes text,
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, year, month)
);

-- Per-staff compensation profile (current effective comp)
CREATE TABLE public.staff_compensation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  basic_salary numeric(12,2) NOT NULL DEFAULT 0,
  house_allowance numeric(12,2) NOT NULL DEFAULT 0,
  transport_allowance numeric(12,2) NOT NULL DEFAULT 0,
  other_allowances jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{name, amount, taxable:true}]
  recurring_deductions jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{name, amount}]
  pays_paye boolean NOT NULL DEFAULT true,
  pays_shif boolean NOT NULL DEFAULT true,
  pays_nssf boolean NOT NULL DEFAULT true,
  pays_housing_levy boolean NOT NULL DEFAULT true,
  personal_relief numeric(12,2) NOT NULL DEFAULT 2400,
  insurance_relief numeric(12,2) NOT NULL DEFAULT 0,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id)
);

-- Generated payslips
CREATE TABLE public.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  basic_salary numeric(12,2) NOT NULL DEFAULT 0,
  house_allowance numeric(12,2) NOT NULL DEFAULT 0,
  transport_allowance numeric(12,2) NOT NULL DEFAULT 0,
  other_allowances numeric(12,2) NOT NULL DEFAULT 0,
  gross_pay numeric(12,2) NOT NULL DEFAULT 0,
  taxable_pay numeric(12,2) NOT NULL DEFAULT 0,
  paye numeric(12,2) NOT NULL DEFAULT 0,
  shif numeric(12,2) NOT NULL DEFAULT 0,
  nssf numeric(12,2) NOT NULL DEFAULT 0,
  housing_levy numeric(12,2) NOT NULL DEFAULT 0,
  other_deductions numeric(12,2) NOT NULL DEFAULT 0,
  total_deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_pay numeric(12,2) NOT NULL DEFAULT 0,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb, -- breakdown of allowances/deductions
  pdf_url text,
  status text NOT NULL DEFAULT 'draft', -- draft | finalized | paid
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (period_id, staff_id)
);

CREATE INDEX idx_payslips_tenant ON public.payslips(tenant_id);
CREATE INDEX idx_payslips_staff ON public.payslips(staff_id);
CREATE INDEX idx_payroll_periods_tenant ON public.payroll_periods(tenant_id);

-- Timestamps triggers
CREATE TRIGGER trg_payroll_periods_updated BEFORE UPDATE ON public.payroll_periods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_staff_compensation_updated BEFORE UPDATE ON public.staff_compensation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_payslips_updated BEFORE UPDATE ON public.payslips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_periods_view" ON public.payroll_periods FOR SELECT
  USING (public.has_perm(tenant_id, 'payroll.view'));
CREATE POLICY "payroll_periods_manage" ON public.payroll_periods FOR ALL
  USING (public.has_perm(tenant_id, 'payroll.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'payroll.manage'));

CREATE POLICY "staff_comp_view" ON public.staff_compensation FOR SELECT
  USING (public.has_perm(tenant_id, 'payroll.view'));
CREATE POLICY "staff_comp_manage" ON public.staff_compensation FOR ALL
  USING (public.has_perm(tenant_id, 'payroll.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'payroll.manage'));

CREATE POLICY "payslips_view" ON public.payslips FOR SELECT
  USING (public.has_perm(tenant_id, 'payroll.view'));
CREATE POLICY "payslips_view_own" ON public.payslips FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = payslips.staff_id AND s.user_id = auth.uid()));
CREATE POLICY "payslips_manage" ON public.payslips FOR ALL
  USING (public.has_perm(tenant_id, 'payroll.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'payroll.manage'));

-- Seed payroll permissions if missing
INSERT INTO public.permissions (key, description) VALUES
  ('payroll.view', 'View payroll periods and payslips'),
  ('payroll.manage', 'Configure compensation, process payroll, mark paid')
ON CONFLICT (key) DO NOTHING;

-- Grant to school_admin & bursar/finance roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('school_admin','bursar','principal')
  AND p.key IN ('payroll.view','payroll.manage')
ON CONFLICT DO NOTHING;

-- Kenya statutory tax calculation function (returns jsonb breakdown)
CREATE OR REPLACE FUNCTION public.calc_kenya_payroll(
  _basic numeric, _house numeric, _transport numeric, _other_taxable numeric,
  _other_nontax numeric, _other_deductions numeric,
  _pays_paye boolean, _pays_shif boolean, _pays_nssf boolean, _pays_housing boolean,
  _personal_relief numeric, _insurance_relief numeric
) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_gross numeric := COALESCE(_basic,0)+COALESCE(_house,0)+COALESCE(_transport,0)+COALESCE(_other_taxable,0)+COALESCE(_other_nontax,0);
  v_taxable_gross numeric := COALESCE(_basic,0)+COALESCE(_house,0)+COALESCE(_transport,0)+COALESCE(_other_taxable,0);
  v_shif numeric := 0; v_nssf numeric := 0; v_housing numeric := 0;
  v_nssf_t1 numeric; v_nssf_t2 numeric;
  v_taxable numeric; v_paye_gross numeric := 0; v_paye numeric := 0;
  v_total_ded numeric; v_net numeric;
BEGIN
  -- SHIF: 2.75% of gross, min 300
  IF _pays_shif THEN v_shif := GREATEST(ROUND(v_gross * 0.0275, 2), 300); END IF;
  -- NSSF: tier I 6% of first 8000 (cap 480) + tier II 6% of 8001..72000 (cap 3840)
  IF _pays_nssf THEN
    v_nssf_t1 := LEAST(v_gross, 8000) * 0.06;
    v_nssf_t2 := GREATEST(LEAST(v_gross, 72000) - 8000, 0) * 0.06;
    v_nssf := ROUND(v_nssf_t1 + v_nssf_t2, 2);
  END IF;
  -- Affordable Housing Levy: 1.5% of gross
  IF _pays_housing THEN v_housing := ROUND(v_gross * 0.015, 2); END IF;

  -- Taxable pay = taxable gross - statutory deductions (SHIF, NSSF, AHL all allowed)
  v_taxable := v_taxable_gross - v_shif - v_nssf - v_housing;
  IF v_taxable < 0 THEN v_taxable := 0; END IF;

  -- PAYE bands (monthly, 2024 Finance Act)
  IF _pays_paye THEN
    v_paye_gross := 0;
    IF v_taxable <= 24000 THEN
      v_paye_gross := v_taxable * 0.10;
    ELSIF v_taxable <= 32333 THEN
      v_paye_gross := 24000*0.10 + (v_taxable-24000)*0.25;
    ELSIF v_taxable <= 500000 THEN
      v_paye_gross := 24000*0.10 + 8333*0.25 + (v_taxable-32333)*0.30;
    ELSIF v_taxable <= 800000 THEN
      v_paye_gross := 24000*0.10 + 8333*0.25 + 467667*0.30 + (v_taxable-500000)*0.325;
    ELSE
      v_paye_gross := 24000*0.10 + 8333*0.25 + 467667*0.30 + 300000*0.325 + (v_taxable-800000)*0.35;
    END IF;
    v_paye := GREATEST(ROUND(v_paye_gross - COALESCE(_personal_relief,0) - COALESCE(_insurance_relief,0), 2), 0);
  END IF;

  v_total_ded := v_shif + v_nssf + v_housing + v_paye + COALESCE(_other_deductions,0);
  v_net := v_gross - v_total_ded;

  RETURN jsonb_build_object(
    'gross', v_gross, 'taxable_gross', v_taxable_gross, 'taxable', v_taxable,
    'shif', v_shif, 'nssf', v_nssf, 'housing_levy', v_housing,
    'paye_gross', ROUND(v_paye_gross,2), 'paye', v_paye,
    'other_deductions', COALESCE(_other_deductions,0),
    'total_deductions', v_total_ded, 'net_pay', v_net
  );
END $$;

-- RPC: process a payroll period (idempotent, recomputes payslips for all staff with compensation)
CREATE OR REPLACE FUNCTION public.process_payroll_period(_period uuid, _user uuid DEFAULT auth.uid())
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tenant uuid; v_count int := 0; v_rec record; v_calc jsonb;
  v_other_tax numeric; v_other_nontax numeric; v_other_ded numeric;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.payroll_periods WHERE id = _period;
  IF v_tenant IS NULL THEN RAISE EXCEPTION 'Period not found'; END IF;
  IF NOT public.has_perm(v_tenant, 'payroll.manage', _user) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR v_rec IN
    SELECT s.id AS staff_id, c.*
    FROM public.staff s
    JOIN public.staff_compensation c ON c.staff_id = s.id
    WHERE s.tenant_id = v_tenant AND s.status = 'active'
  LOOP
    -- Sum custom allowances
    SELECT COALESCE(SUM(CASE WHEN (x->>'taxable')::boolean IS NOT FALSE THEN (x->>'amount')::numeric ELSE 0 END),0),
           COALESCE(SUM(CASE WHEN (x->>'taxable')::boolean IS FALSE THEN (x->>'amount')::numeric ELSE 0 END),0)
      INTO v_other_tax, v_other_nontax
    FROM jsonb_array_elements(v_rec.other_allowances) x;

    SELECT COALESCE(SUM((x->>'amount')::numeric),0) INTO v_other_ded
    FROM jsonb_array_elements(v_rec.recurring_deductions) x;

    v_calc := public.calc_kenya_payroll(
      v_rec.basic_salary, v_rec.house_allowance, v_rec.transport_allowance,
      v_other_tax, v_other_nontax, v_other_ded,
      v_rec.pays_paye, v_rec.pays_shif, v_rec.pays_nssf, v_rec.pays_housing_levy,
      v_rec.personal_relief, v_rec.insurance_relief
    );

    INSERT INTO public.payslips (
      tenant_id, period_id, staff_id,
      basic_salary, house_allowance, transport_allowance, other_allowances,
      gross_pay, taxable_pay, paye, shif, nssf, housing_levy,
      other_deductions, total_deductions, net_pay, detail, status
    ) VALUES (
      v_tenant, _period, v_rec.staff_id,
      v_rec.basic_salary, v_rec.house_allowance, v_rec.transport_allowance,
      v_other_tax + v_other_nontax,
      (v_calc->>'gross')::numeric, (v_calc->>'taxable')::numeric,
      (v_calc->>'paye')::numeric, (v_calc->>'shif')::numeric,
      (v_calc->>'nssf')::numeric, (v_calc->>'housing_levy')::numeric,
      (v_calc->>'other_deductions')::numeric, (v_calc->>'total_deductions')::numeric,
      (v_calc->>'net_pay')::numeric,
      jsonb_build_object(
        'allowances', v_rec.other_allowances,
        'deductions', v_rec.recurring_deductions,
        'calc', v_calc
      ),
      'finalized'
    )
    ON CONFLICT (period_id, staff_id) DO UPDATE SET
      basic_salary = EXCLUDED.basic_salary,
      house_allowance = EXCLUDED.house_allowance,
      transport_allowance = EXCLUDED.transport_allowance,
      other_allowances = EXCLUDED.other_allowances,
      gross_pay = EXCLUDED.gross_pay, taxable_pay = EXCLUDED.taxable_pay,
      paye = EXCLUDED.paye, shif = EXCLUDED.shif, nssf = EXCLUDED.nssf,
      housing_levy = EXCLUDED.housing_levy,
      other_deductions = EXCLUDED.other_deductions,
      total_deductions = EXCLUDED.total_deductions,
      net_pay = EXCLUDED.net_pay, detail = EXCLUDED.detail,
      status = CASE WHEN public.payslips.status = 'paid' THEN 'paid' ELSE 'finalized' END,
      updated_at = now();
    v_count := v_count + 1;
  END LOOP;

  UPDATE public.payroll_periods SET
    status = 'processed', processed_at = now(), processed_by = _user, updated_at = now()
  WHERE id = _period;
  RETURN v_count;
END $$;
