
-- 1. Students: missing compliance fields
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS sne_category text,
  ADD COLUMN IF NOT EXISTS is_repeater boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS exit_reason text,
  ADD COLUMN IF NOT EXISTS exit_date date,
  ADD COLUMN IF NOT EXISTS transfer_in_date date,
  ADD COLUMN IF NOT EXISTS transfer_out_date date;

-- 2. Staff: TSC additions
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS tsc_job_group text,
  ADD COLUMN IF NOT EXISTS tsc_registered_subjects text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS tsc_registration_date date;

-- 3. Statutory filings log
CREATE TABLE IF NOT EXISTS public.statutory_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  filing_type text NOT NULL, -- 'paye_p10' | 'shif' | 'nssf' | 'housing_levy' | 'helb' | 'p9a' | 'tsc_returns' | 'nemis_upload'
  period_start date NOT NULL,
  period_end date NOT NULL,
  reference text,
  filed_at timestamptz,
  filed_by uuid,
  file_url text,
  amount numeric(14,2),
  notes text,
  status text NOT NULL DEFAULT 'draft', -- draft | filed | acknowledged | rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.statutory_filings TO authenticated;
GRANT ALL ON public.statutory_filings TO service_role;
ALTER TABLE public.statutory_filings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "statutory_filings_select" ON public.statutory_filings FOR SELECT TO authenticated
  USING (public.has_perm(tenant_id, 'payroll.manage') OR public.has_perm(tenant_id, 'reports.view'));
CREATE POLICY "statutory_filings_write" ON public.statutory_filings FOR INSERT TO authenticated
  WITH CHECK (public.has_perm(tenant_id, 'payroll.manage'));
CREATE POLICY "statutory_filings_update" ON public.statutory_filings FOR UPDATE TO authenticated
  USING (public.has_perm(tenant_id, 'payroll.manage'));
CREATE POLICY "statutory_filings_delete" ON public.statutory_filings FOR DELETE TO authenticated
  USING (public.has_perm(tenant_id, 'payroll.manage'));
CREATE TRIGGER trg_statutory_filings_updated_at BEFORE UPDATE ON public.statutory_filings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_statutory_filings_tenant_period ON public.statutory_filings(tenant_id, filing_type, period_end DESC);

-- 4. NEMIS credentials (sensitive; backend-only read)
CREATE TABLE IF NOT EXISTS public.nemis_credentials (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  username text NOT NULL,
  password_ciphertext text NOT NULL, -- base64 AES-GCM payload (iv|ciphertext|tag)
  last_synced_at timestamptz,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- No anon, no authenticated direct access. All access via edge functions using service_role.
GRANT ALL ON public.nemis_credentials TO service_role;
ALTER TABLE public.nemis_credentials ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies => authenticated cannot read/write directly.
CREATE TRIGGER trg_nemis_credentials_updated_at BEFORE UPDATE ON public.nemis_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Compliance export audit log
CREATE TABLE IF NOT EXISTS public.compliance_exports_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  export_type text NOT NULL, -- 'nemis_learners' | 'nemis_progression' | 'tsc_returns' | 'p9a' | 'p10' | 'shif' | 'nssf' | 'ahl' | 'helb' | 'itax_csv' | ...
  row_count integer,
  parameters jsonb DEFAULT '{}'::jsonb,
  generated_by uuid,
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.compliance_exports_log TO authenticated;
GRANT ALL ON public.compliance_exports_log TO service_role;
ALTER TABLE public.compliance_exports_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_log_select" ON public.compliance_exports_log FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "compliance_log_insert" ON public.compliance_exports_log FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));
CREATE INDEX IF NOT EXISTS idx_compliance_log_tenant ON public.compliance_exports_log(tenant_id, generated_at DESC);
