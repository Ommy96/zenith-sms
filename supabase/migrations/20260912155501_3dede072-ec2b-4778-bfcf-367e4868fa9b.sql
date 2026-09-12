
-- ============ additive columns ============
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS graduation_date date,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.guardians
  ADD COLUMN IF NOT EXISTS preferred_name text,
  ADD COLUMN IF NOT EXISTS relationship_default text,
  ADD COLUMN IF NOT EXISTS preferred_channel text NOT NULL DEFAULT 'sms',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS staff_type text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS guardians_tenant_phone_uidx
  ON public.guardians (tenant_id, phone_primary) WHERE phone_primary IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_tenant_nemis_uidx
  ON public.students (tenant_id, nemis_upi) WHERE nemis_upi IS NOT NULL;
CREATE INDEX IF NOT EXISTS students_portal_user_idx
  ON public.students (portal_user_id) WHERE portal_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS guardians_portal_user_idx
  ON public.guardians (portal_user_id) WHERE portal_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS staff_user_idx
  ON public.staff (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS students_tenant_status_idx ON public.students (tenant_id, status);
CREATE INDEX IF NOT EXISTS staff_tenant_status_idx ON public.staff (tenant_id, status);
CREATE INDEX IF NOT EXISTS staff_tenant_type_idx ON public.staff (tenant_id, staff_type);

-- ============ number generators ============
CREATE OR REPLACE FUNCTION public.generate_admission_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prefix text; next_num int;
BEGIN
  prefix := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(NULLIF(regexp_replace(admission_number, '^' || prefix || '-', ''), '')::int), 0) + 1
    INTO next_num FROM public.students
   WHERE tenant_id = p_tenant_id
     AND admission_number ~ ('^' || prefix || '-[0-9]+$');
  RETURN prefix || '-' || lpad(next_num::text, 4, '0');
END $$;

CREATE OR REPLACE FUNCTION public.generate_staff_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE next_num int;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(staff_number, '^EMP-', ''), '')::int), 0) + 1
    INTO next_num FROM public.staff
   WHERE tenant_id = p_tenant_id AND staff_number ~ '^EMP-[0-9]+$';
  RETURN 'EMP-' || lpad(next_num::text, 4, '0');
END $$;

CREATE OR REPLACE FUNCTION public.generate_application_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prefix text; next_num int;
BEGIN
  prefix := 'APP-' || to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(NULLIF(regexp_replace(application_number, '^' || prefix || '-', ''), '')::int), 0) + 1
    INTO next_num FROM public.admissions
   WHERE tenant_id = p_tenant_id AND application_number ~ ('^' || prefix || '-[0-9]+$');
  RETURN prefix || '-' || lpad(next_num::text, 4, '0');
END $$;

CREATE OR REPLACE FUNCTION public._tg_student_admission_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.admission_number IS NULL OR NEW.admission_number = '' THEN
    NEW.admission_number := public.generate_admission_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public._tg_staff_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.staff_number IS NULL OR NEW.staff_number = '' THEN
    NEW.staff_number := public.generate_staff_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public._tg_application_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
    NEW.application_number := public.generate_application_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public._tg_single_primary_guardian()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_primary_contact THEN
    UPDATE public.student_guardians
       SET is_primary_contact = false
     WHERE student_id = NEW.student_id
       AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
       AND is_primary_contact;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_students_admission_number ON public.students;
CREATE TRIGGER tg_students_admission_number BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public._tg_student_admission_number();

DROP TRIGGER IF EXISTS tg_staff_number ON public.staff;
CREATE TRIGGER tg_staff_number BEFORE INSERT ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public._tg_staff_number();

DROP TRIGGER IF EXISTS tg_single_primary_guardian ON public.student_guardians;
CREATE TRIGGER tg_single_primary_guardian BEFORE INSERT OR UPDATE ON public.student_guardians
  FOR EACH ROW EXECUTE FUNCTION public._tg_single_primary_guardian();

-- ============ staff_qualifications ============
CREATE TABLE IF NOT EXISTS public.staff_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  qualification_type text NOT NULL,
  qualification_name text NOT NULL,
  institution text,
  year_completed int,
  document_url text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_qualifications TO authenticated;
GRANT ALL ON public.staff_qualifications TO service_role;
ALTER TABLE public.staff_qualifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS staff_qual_tenant_staff_idx ON public.staff_qualifications (tenant_id, staff_id);
CREATE TRIGGER staff_qualifications_updated_at BEFORE UPDATE ON public.staff_qualifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "staff_qual_select" ON public.staff_qualifications FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND (public.user_has_permission(tenant_id,'staff.view') OR public.is_super_admin()));
CREATE POLICY "staff_qual_insert" ON public.staff_qualifications FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'staff.edit'));
CREATE POLICY "staff_qual_update" ON public.staff_qualifications FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'staff.edit'));
CREATE POLICY "staff_qual_delete" ON public.staff_qualifications FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'staff.delete'));

-- ============ staff_compensation ============
CREATE TABLE IF NOT EXISTS public.staff_compensation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  effective_from date NOT NULL,
  effective_to date,
  base_salary numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  housing_allowance numeric(12,2) NOT NULL DEFAULT 0,
  transport_allowance numeric(12,2) NOT NULL DEFAULT 0,
  other_allowances jsonb NOT NULL DEFAULT '{}'::jsonb,
  deductions jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_frequency text NOT NULL DEFAULT 'monthly',
  bank_name text,
  bank_account text,
  mpesa_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_comp_period_chk CHECK (effective_to IS NULL OR effective_to > effective_from)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_compensation TO authenticated;
GRANT ALL ON public.staff_compensation TO service_role;
ALTER TABLE public.staff_compensation ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS staff_comp_idx ON public.staff_compensation (tenant_id, staff_id, effective_from DESC);
CREATE TRIGGER staff_compensation_updated_at BEFORE UPDATE ON public.staff_compensation
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "staff_comp_select" ON public.staff_compensation FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND (public.user_has_permission(tenant_id,'staff.view') OR public.is_super_admin()));
CREATE POLICY "staff_comp_sensitive" ON public.staff_compensation AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    public.user_has_permission(tenant_id,'payroll.view')
    OR public.user_has_permission(tenant_id,'staff.view_sensitive')
    OR EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
  );
CREATE POLICY "staff_comp_insert" ON public.staff_compensation FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'payroll.run'));
CREATE POLICY "staff_comp_update" ON public.staff_compensation FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'payroll.run'));
CREATE POLICY "staff_comp_delete" ON public.staff_compensation FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'payroll.run'));

-- ============ admissions ============
CREATE TABLE IF NOT EXISTS public.admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  application_number text NOT NULL,
  applicant_full_name text NOT NULL,
  applicant_date_of_birth date,
  applicant_gender text,
  applied_for_class text,
  applied_for_academic_year text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  previous_school text,
  previous_class text,
  source text,
  stage text NOT NULL DEFAULT 'inquiry',
  assessment_score numeric,
  assessment_notes text,
  decision_notes text,
  decision_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_at timestamptz,
  enrolled_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admissions_tenant_appno_key UNIQUE (tenant_id, application_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admissions TO authenticated;
GRANT ALL ON public.admissions TO service_role;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS admissions_tenant_stage_idx ON public.admissions (tenant_id, stage);
CREATE INDEX IF NOT EXISTS admissions_tenant_created_idx ON public.admissions (tenant_id, created_at DESC);
CREATE TRIGGER admissions_updated_at BEFORE UPDATE ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_admissions_number BEFORE INSERT ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public._tg_application_number();

CREATE POLICY "admissions_select" ON public.admissions FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND (public.user_has_permission(tenant_id,'admissions.view') OR public.is_super_admin()));
CREATE POLICY "admissions_insert" ON public.admissions FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'admissions.create'));
CREATE POLICY "admissions_update" ON public.admissions FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'admissions.edit'));
CREATE POLICY "admissions_delete" ON public.admissions FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'admissions.delete'));

-- ============ admission_documents ============
CREATE TABLE IF NOT EXISTS public.admission_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  admission_id uuid NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admission_documents TO authenticated;
GRANT ALL ON public.admission_documents TO service_role;
ALTER TABLE public.admission_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS admission_docs_idx ON public.admission_documents (tenant_id, admission_id);

CREATE POLICY "admission_docs_select" ON public.admission_documents FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND (public.user_has_permission(tenant_id,'admissions.view') OR public.is_super_admin()));
CREATE POLICY "admission_docs_insert" ON public.admission_documents FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'admissions.create'));
CREATE POLICY "admission_docs_update" ON public.admission_documents FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'admissions.edit'));
CREATE POLICY "admission_docs_delete" ON public.admission_documents FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'admissions.delete'));

-- ============ permissions ============
INSERT INTO public.permissions (name, description, category) VALUES
  ('staff.create','Create staff records','staff'),
  ('admissions.view','View admission applications','admissions'),
  ('admissions.create','Create admission applications','admissions'),
  ('admissions.edit','Edit admission applications','admissions'),
  ('admissions.delete','Delete admission applications','admissions')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
 WHERE r.is_system AND r.name IN ('super_admin','school_admin','principal','deputy_principal','registrar')
   AND p.name IN ('staff.create','admissions.view','admissions.create','admissions.edit','admissions.delete')
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
