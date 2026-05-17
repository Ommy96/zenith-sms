
-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.gender_enum AS ENUM ('male','female','other','prefer_not_to_say');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.enrollment_status_enum AS ENUM ('active','alumni','transferred','dropped_out','suspended','deceased','on_leave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.learner_category_enum AS ENUM ('day_scholar','boarder','weekly_boarder','special_needs');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.blood_group_enum AS ENUM ('A+','A-','B+','B-','O+','O-','AB+','AB-','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.guardian_relationship_enum AS ENUM ('father','mother','guardian','grandparent','uncle','aunt','sibling','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.employment_type_enum AS ENUM ('permanent','contract','part_time','intern','casual','bom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.document_owner_type_enum AS ENUM ('student','staff','guardian');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STUDENTS — extend
-- ============================================================
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS preferred_name text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  -- gov IDs (all countries; UI hides irrelevant)
  ADD COLUMN IF NOT EXISTS nemis_upi text,
  ADD COLUMN IF NOT EXISTS birth_certificate_number text,
  ADD COLUMN IF NOT EXISTS birth_certificate_serial text,
  ADD COLUMN IF NOT EXISTS knec_assessment_number text,
  ADD COLUMN IF NOT EXISTS kcpe_index_number text,
  ADD COLUMN IF NOT EXISTS kcse_index_number text,
  ADD COLUMN IF NOT EXISTS huduma_number text,
  ADD COLUMN IF NOT EXISTS national_id_number text,
  ADD COLUMN IF NOT EXISTS lin text,
  ADD COLUMN IF NOT EXISTS une_index_number text,
  ADD COLUMN IF NOT EXISTS prems_number text,
  ADD COLUMN IF NOT EXISTS necta_index_number text,
  ADD COLUMN IF NOT EXISTS reb_student_id text,
  ADD COLUMN IF NOT EXISTS moe_student_id text,
  -- academic
  ADD COLUMN IF NOT EXISTS current_class_id uuid,
  ADD COLUMN IF NOT EXISTS stream text,
  ADD COLUMN IF NOT EXISTS admission_grade text,
  ADD COLUMN IF NOT EXISTS previous_school text,
  ADD COLUMN IF NOT EXISTS house text,
  ADD COLUMN IF NOT EXISTS enrollment_status public.enrollment_status_enum DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS expected_graduation_year int,
  ADD COLUMN IF NOT EXISTS learner_category public.learner_category_enum DEFAULT 'day_scholar',
  -- contact
  ADD COLUMN IF NOT EXISTS residential_address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS county_or_region text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
  -- medical
  ADD COLUMN IF NOT EXISTS blood_group public.blood_group_enum DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS chronic_conditions text,
  ADD COLUMN IF NOT EXISTS medications text,
  ADD COLUMN IF NOT EXISTS doctor_name text,
  ADD COLUMN IF NOT EXISTS doctor_phone text,
  ADD COLUMN IF NOT EXISTS nhif_or_shif_number text,
  ADD COLUMN IF NOT EXISTS insurance_provider text,
  ADD COLUMN IF NOT EXISTS insurance_policy_number text,
  ADD COLUMN IF NOT EXISTS last_medical_checkup date,
  ADD COLUMN IF NOT EXISTS immunization_status jsonb DEFAULT '{}'::jsonb,
  -- SEN
  ADD COLUMN IF NOT EXISTS has_special_needs boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS special_needs_details text,
  ADD COLUMN IF NOT EXISTS iep_on_file boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accommodations text;

CREATE UNIQUE INDEX IF NOT EXISTS students_tenant_admission_uniq
  ON public.students(tenant_id, admission_number) WHERE admission_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS students_tenant_class_idx ON public.students(tenant_id, current_class_id);
CREATE INDEX IF NOT EXISTS students_nemis_idx ON public.students(tenant_id, nemis_upi);

-- ============================================================
-- GUARDIANS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  full_name text NOT NULL,
  phone_primary text,
  phone_secondary text,
  whatsapp_number text,
  email text,
  national_id_number text,
  occupation text,
  employer text,
  residential_address text,
  photo_url text,
  portal_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS guardians_tenant_idx ON public.guardians(tenant_id);
CREATE INDEX IF NOT EXISTS guardians_phone_idx ON public.guardians(tenant_id, phone_primary);

DROP POLICY IF EXISTS tenant_select_guardians ON public.guardians;
CREATE POLICY tenant_select_guardians ON public.guardians FOR SELECT TO authenticated
  USING (is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_insert_guardians ON public.guardians;
CREATE POLICY tenant_insert_guardians ON public.guardians FOR INSERT TO authenticated
  WITH CHECK (is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_update_guardians ON public.guardians;
CREATE POLICY tenant_update_guardians ON public.guardians FOR UPDATE TO authenticated
  USING (has_perm(tenant_id, 'students.edit')) WITH CHECK (has_perm(tenant_id, 'students.edit'));
DROP POLICY IF EXISTS tenant_delete_guardians ON public.guardians;
CREATE POLICY tenant_delete_guardians ON public.guardians FOR DELETE TO authenticated
  USING (has_perm(tenant_id, 'students.edit'));

-- ============================================================
-- STUDENT_GUARDIANS junction
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  guardian_id uuid NOT NULL,
  relationship public.guardian_relationship_enum NOT NULL DEFAULT 'guardian',
  is_primary_contact boolean NOT NULL DEFAULT false,
  receives_communications boolean NOT NULL DEFAULT true,
  has_pickup_authorization boolean NOT NULL DEFAULT true,
  has_financial_responsibility boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, guardian_id)
);
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS student_guardians_one_primary
  ON public.student_guardians(student_id) WHERE is_primary_contact = true;
CREATE INDEX IF NOT EXISTS student_guardians_student_idx ON public.student_guardians(student_id);
CREATE INDEX IF NOT EXISTS student_guardians_guardian_idx ON public.student_guardians(guardian_id);

DROP POLICY IF EXISTS tenant_select_sg ON public.student_guardians;
CREATE POLICY tenant_select_sg ON public.student_guardians FOR SELECT TO authenticated
  USING (is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_insert_sg ON public.student_guardians;
CREATE POLICY tenant_insert_sg ON public.student_guardians FOR INSERT TO authenticated
  WITH CHECK (is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_update_sg ON public.student_guardians;
CREATE POLICY tenant_update_sg ON public.student_guardians FOR UPDATE TO authenticated
  USING (has_perm(tenant_id, 'students.edit')) WITH CHECK (has_perm(tenant_id, 'students.edit'));
DROP POLICY IF EXISTS tenant_delete_sg ON public.student_guardians;
CREATE POLICY tenant_delete_sg ON public.student_guardians FOR DELETE TO authenticated
  USING (has_perm(tenant_id, 'students.edit'));

-- ============================================================
-- DOCUMENTS (polymorphic)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  owner_type public.document_owner_type_enum NOT NULL,
  owner_id uuid NOT NULL,
  doc_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS documents_owner_idx ON public.documents(tenant_id, owner_type, owner_id);

DROP POLICY IF EXISTS tenant_select_documents ON public.documents;
CREATE POLICY tenant_select_documents ON public.documents FOR SELECT TO authenticated
  USING (is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_insert_documents ON public.documents;
CREATE POLICY tenant_insert_documents ON public.documents FOR INSERT TO authenticated
  WITH CHECK (is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_update_documents ON public.documents;
CREATE POLICY tenant_update_documents ON public.documents FOR UPDATE TO authenticated
  USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_delete_documents ON public.documents;
CREATE POLICY tenant_delete_documents ON public.documents FOR DELETE TO authenticated
  USING (is_tenant_member(tenant_id));

-- ============================================================
-- STUDENT_ACTIVITY timeline
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  actor_user_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS student_activity_student_idx ON public.student_activity(student_id, occurred_at DESC);

DROP POLICY IF EXISTS tenant_select_sa ON public.student_activity;
CREATE POLICY tenant_select_sa ON public.student_activity FOR SELECT TO authenticated
  USING (is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_insert_sa ON public.student_activity;
CREATE POLICY tenant_insert_sa ON public.student_activity FOR INSERT TO authenticated
  WITH CHECK (is_tenant_member(tenant_id));

-- ============================================================
-- STAFF — extend
-- ============================================================
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS staff_number text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS gender public.gender_enum,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS national_id_number text,
  ADD COLUMN IF NOT EXISTS tsc_number text,
  ADD COLUMN IF NOT EXISTS kra_pin text,
  ADD COLUMN IF NOT EXISTS nssf_number text,
  ADD COLUMN IF NOT EXISTS nhif_or_shif_number text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_branch text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS employment_type public.employment_type_enum DEFAULT 'permanent',
  ADD COLUMN IF NOT EXISTS date_employed date,
  ADD COLUMN IF NOT EXISTS date_of_confirmation date,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS reports_to uuid,
  ADD COLUMN IF NOT EXISTS subjects_taught jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS classes_taught jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS highest_qualification text,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS year_qualified int,
  ADD COLUMN IF NOT EXISTS professional_certifications jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS salary_scale text,
  ADD COLUMN IF NOT EXISTS gross_salary numeric,
  ADD COLUMN IF NOT EXISTS next_of_kin_name text,
  ADD COLUMN IF NOT EXISTS next_of_kin_phone text,
  ADD COLUMN IF NOT EXISTS next_of_kin_relation text,
  ADD COLUMN IF NOT EXISTS address text;

CREATE UNIQUE INDEX IF NOT EXISTS staff_tenant_number_uniq
  ON public.staff(tenant_id, staff_number) WHERE staff_number IS NOT NULL;

-- ============================================================
-- PERMISSIONS + ROLES seed
-- ============================================================
INSERT INTO public.permissions (key, category, description) VALUES
  ('students.view_medical', 'students', 'View student medical records'),
  ('students.import', 'students', 'Bulk import students'),
  ('staff.view_sensitive', 'staff', 'View staff sensitive fields (bank, salary, KRA)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.roles (name, description, is_system) VALUES
  ('nurse', 'School nurse — medical records', true),
  ('academic_dean', 'Academic dean', true)
ON CONFLICT DO NOTHING;

-- Grant medical/import perms to relevant roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('school_admin','registrar','nurse')
  AND p.key = 'students.view_medical'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('school_admin','registrar')
  AND p.key = 'students.import'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('school_admin','bursar')
  AND p.key = 'staff.view_sensitive'
ON CONFLICT DO NOTHING;

-- ============================================================
-- ADMISSION NUMBER GENERATOR
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_admission_number(_tenant uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_format text;
  v_code text;
  v_year text := to_char(now(), 'YYYY');
  v_seq_key text := 'admission_seq:' || v_year;
  v_seq int;
  v_settings_row jsonb;
BEGIN
  SELECT COALESCE(code, 'STU') INTO v_code FROM public.tenants WHERE id = _tenant;

  SELECT value->>'format' INTO v_format
  FROM public.tenant_settings
  WHERE tenant_id = _tenant AND key = 'admission_number_format' LIMIT 1;

  v_format := COALESCE(v_format, '{CODE}/{YYYY}/{####}');

  -- atomic increment
  INSERT INTO public.tenant_settings (tenant_id, key, value)
  VALUES (_tenant, v_seq_key, jsonb_build_object('n', 1))
  ON CONFLICT DO NOTHING;

  UPDATE public.tenant_settings
  SET value = jsonb_build_object('n', COALESCE((value->>'n')::int, 0) + 1),
      updated_at = now()
  WHERE tenant_id = _tenant AND key = v_seq_key
  RETURNING (value->>'n')::int INTO v_seq;

  IF v_seq IS NULL THEN
    -- race: try once more
    SELECT (value->>'n')::int INTO v_seq FROM public.tenant_settings
    WHERE tenant_id = _tenant AND key = v_seq_key;
    v_seq := COALESCE(v_seq, 1);
  END IF;

  RETURN replace(replace(replace(v_format,
    '{CODE}', v_code),
    '{YYYY}', v_year),
    '{####}', lpad(v_seq::text, 4, '0'));
END;
$$;

-- Ensure tenant_settings has unique key per tenant
CREATE UNIQUE INDEX IF NOT EXISTS tenant_settings_tenant_key_uniq
  ON public.tenant_settings(tenant_id, key);

-- ============================================================
-- STORAGE BUCKET for documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: {tenant_id}/{owner_type}/{owner_id}/{filename}
DROP POLICY IF EXISTS "Tenant members read documents" ON storage.objects;
CREATE POLICY "Tenant members read documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND is_tenant_member((storage.foldername(name))[1]::uuid));

DROP POLICY IF EXISTS "Tenant members upload documents" ON storage.objects;
CREATE POLICY "Tenant members upload documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND is_tenant_member((storage.foldername(name))[1]::uuid));

DROP POLICY IF EXISTS "Tenant members update documents" ON storage.objects;
CREATE POLICY "Tenant members update documents" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND is_tenant_member((storage.foldername(name))[1]::uuid));

DROP POLICY IF EXISTS "Tenant members delete documents" ON storage.objects;
CREATE POLICY "Tenant members delete documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND is_tenant_member((storage.foldername(name))[1]::uuid));
