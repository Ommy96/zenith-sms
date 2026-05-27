
-- Tenant DPO contact
CREATE TABLE public.tenant_dpo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  registration_number text,
  appointed_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_dpo TO authenticated;
GRANT ALL ON public.tenant_dpo TO service_role;
ALTER TABLE public.tenant_dpo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dpo_select" ON public.tenant_dpo FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "dpo_manage" ON public.tenant_dpo FOR ALL TO authenticated
  USING (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin())
  WITH CHECK (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin());
CREATE TRIGGER trg_dpo_updated BEFORE UPDATE ON public.tenant_dpo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Subject Access Requests
CREATE TYPE public.sar_status_enum AS ENUM ('pending','in_progress','fulfilled','rejected','cancelled');
CREATE TYPE public.sar_subject_type_enum AS ENUM ('parent','student','staff','other');

CREATE TABLE public.subject_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subject_type public.sar_subject_type_enum NOT NULL,
  subject_name text NOT NULL,
  subject_email text,
  subject_phone text,
  subject_id_number text,
  related_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  related_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  request_details text,
  status public.sar_status_enum NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  due_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  fulfilled_at timestamptz,
  fulfilled_by uuid REFERENCES auth.users(id),
  package_url text,
  rejection_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_access_requests TO authenticated;
GRANT INSERT ON public.subject_access_requests TO anon;
GRANT ALL ON public.subject_access_requests TO service_role;
ALTER TABLE public.subject_access_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sar_admin_select" ON public.subject_access_requests FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "sar_anon_insert" ON public.subject_access_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "sar_auth_insert" ON public.subject_access_requests FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY "sar_manage" ON public.subject_access_requests FOR UPDATE TO authenticated
  USING (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin())
  WITH CHECK (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin());
CREATE POLICY "sar_delete" ON public.subject_access_requests FOR DELETE TO authenticated
  USING (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin());
CREATE TRIGGER trg_sar_updated BEFORE UPDATE ON public.subject_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_sar_tenant_status ON public.subject_access_requests(tenant_id, status);

-- Right to erasure
CREATE TYPE public.erasure_status_enum AS ENUM ('pending','approved','rejected','completed');

CREATE TABLE public.erasure_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subject_type public.sar_subject_type_enum NOT NULL,
  subject_name text NOT NULL,
  subject_email text,
  related_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  related_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  reason text,
  legal_basis_retention text,
  status public.erasure_status_enum NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  completed_at timestamptz,
  erased_records_summary jsonb,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erasure_requests TO authenticated;
GRANT ALL ON public.erasure_requests TO service_role;
ALTER TABLE public.erasure_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "era_select" ON public.erasure_requests FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "era_insert" ON public.erasure_requests FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY "era_manage" ON public.erasure_requests FOR UPDATE TO authenticated
  USING (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin())
  WITH CHECK (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin());
CREATE POLICY "era_delete" ON public.erasure_requests FOR DELETE TO authenticated
  USING (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin());
CREATE TRIGGER trg_era_updated BEFORE UPDATE ON public.erasure_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Consent records (cookie banner, marketing)
CREATE TABLE public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id text,
  consent_type text NOT NULL,
  granted boolean NOT NULL,
  policy_version text,
  user_agent text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.consent_records TO authenticated;
GRANT INSERT ON public.consent_records TO anon;
GRANT ALL ON public.consent_records TO service_role;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_anon_insert" ON public.consent_records FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "consent_auth_insert" ON public.consent_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "consent_select" ON public.consent_records FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));

-- Privacy policy + ToS
CREATE TYPE public.policy_kind_enum AS ENUM ('privacy_policy','terms_of_service','cookie_policy','dpia');

CREATE TABLE public.privacy_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind public.policy_kind_enum NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  title text NOT NULL,
  body_markdown text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_policies TO authenticated;
GRANT SELECT ON public.privacy_policies TO anon;
GRANT ALL ON public.privacy_policies TO service_role;
ALTER TABLE public.privacy_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pol_public_select" ON public.privacy_policies FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "pol_auth_select" ON public.privacy_policies FOR SELECT TO authenticated USING (is_published = true OR public.is_tenant_member(tenant_id));
CREATE POLICY "pol_manage" ON public.privacy_policies FOR ALL TO authenticated
  USING (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin())
  WITH CHECK (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin());
CREATE TRIGGER trg_pol_updated BEFORE UPDATE ON public.privacy_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_pol_tenant_kind ON public.privacy_policies(tenant_id, kind);

-- DPIA assessments
CREATE TABLE public.dpia_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  processing_activity text NOT NULL,
  data_categories text[],
  lawful_basis text,
  risks jsonb DEFAULT '[]'::jsonb,
  mitigations jsonb DEFAULT '[]'::jsonb,
  residual_risk text,
  assessor_name text,
  reviewed_at date,
  next_review_at date,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dpia_assessments TO authenticated;
GRANT ALL ON public.dpia_assessments TO service_role;
ALTER TABLE public.dpia_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dpia_select" ON public.dpia_assessments FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "dpia_manage" ON public.dpia_assessments FOR ALL TO authenticated
  USING (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin())
  WITH CHECK (public.has_role_in_tenant(tenant_id,'school_admin') OR public.is_super_admin());
CREATE TRIGGER trg_dpia_updated BEFORE UPDATE ON public.dpia_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tenant data hosting region (disclosure)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS data_hosting_region text DEFAULT 'EU (Frankfurt)';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS data_retention_years integer DEFAULT 7;
