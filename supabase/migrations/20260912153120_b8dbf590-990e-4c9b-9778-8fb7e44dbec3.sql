-- ============================================================
-- PHASE 2 — Students, guardians, portal
-- ============================================================

-- ---------- ENUMS ----------
DO $$ BEGIN CREATE TYPE public.gender_enum AS ENUM ('male','female','other','prefer_not_to_say'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.enrollment_status_enum AS ENUM ('active','alumni','transferred','dropped_out','suspended','deceased','on_leave','inactive','graduated','expelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.learner_category_enum AS ENUM ('day_scholar','boarder','weekly_boarder','special_needs'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.blood_group_enum AS ENUM ('A+','A-','B+','B-','O+','O-','AB+','AB-','unknown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.guardian_relationship_enum AS ENUM ('father','mother','guardian','grandparent','uncle','aunt','sibling','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.document_owner_type_enum AS ENUM ('student','staff','guardian'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.grade_stage_enum AS ENUM ('pre_primary','lower_primary','upper_primary','junior_secondary','senior_secondary','primary','secondary','o_level','a_level','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.room_type_enum AS ENUM ('classroom','lab','library','hall','office','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- HELPERS ----------
CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() AND ut.tenant_id = _tenant AND ut.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.has_perm(_tenant uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.user_has_permission(_tenant, _permission);
$$;

REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_perm(uuid, text) FROM anon;

-- ---------- PROFILES ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id)));
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- ACADEMIC CALENDAR ----------
CREATE TABLE IF NOT EXISTS public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO service_role;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_academic_year_name ON public.academic_years(tenant_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_current_academic_year ON public.academic_years(tenant_id) WHERE is_current;
CREATE POLICY academic_years_select ON public.academic_years FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY academic_years_write ON public.academic_years FOR ALL TO authenticated
  USING (public.has_perm(tenant_id, 'academics.manage')) WITH CHECK (public.has_perm(tenant_id, 'academics.manage'));
CREATE TRIGGER academic_years_updated_at BEFORE UPDATE ON public.academic_years FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.terms TO authenticated;
GRANT ALL ON public.terms TO service_role;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_term_name ON public.terms(academic_year_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_current_term ON public.terms(tenant_id) WHERE is_current;
CREATE POLICY terms_select ON public.terms FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY terms_write ON public.terms FOR ALL TO authenticated
  USING (public.has_perm(tenant_id, 'academics.manage')) WITH CHECK (public.has_perm(tenant_id, 'academics.manage'));
CREATE TRIGGER terms_updated_at BEFORE UPDATE ON public.terms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- STRUCTURE ----------
CREATE TABLE IF NOT EXISTS public.grade_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  stage public.grade_stage_enum,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grade_levels TO authenticated;
GRANT ALL ON public.grade_levels TO service_role;
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_grade_code ON public.grade_levels(tenant_id, code);
CREATE POLICY grade_levels_select ON public.grade_levels FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY grade_levels_write ON public.grade_levels FOR ALL TO authenticated
  USING (public.has_perm(tenant_id, 'academics.manage')) WITH CHECK (public.has_perm(tenant_id, 'academics.manage'));

CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.room_type_enum NOT NULL DEFAULT 'classroom',
  capacity int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_room_name ON public.rooms(tenant_id, name);
CREATE POLICY rooms_select ON public.rooms FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY rooms_write ON public.rooms FOR ALL TO authenticated
  USING (public.has_perm(tenant_id, 'academics.manage')) WITH CHECK (public.has_perm(tenant_id, 'academics.manage'));

CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  grade_level text,
  grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE SET NULL,
  stream text,
  academic_year text,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  teacher_id uuid,
  class_teacher_id uuid,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  capacity int NOT NULL DEFAULT 40,
  current_enrollment int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS classes_tenant_idx ON public.classes(tenant_id);
CREATE POLICY classes_select ON public.classes FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY classes_write ON public.classes FOR ALL TO authenticated
  USING (public.has_perm(tenant_id, 'academics.manage')) WITH CHECK (public.has_perm(tenant_id, 'academics.manage'));
CREATE TRIGGER classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- STUDENTS ----------
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  portal_user_id uuid,
  -- identity
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  preferred_name text,
  gender public.gender_enum,
  date_of_birth date,
  nationality text,
  photo_url text,
  -- academic
  admission_number text,
  admission_date date DEFAULT CURRENT_DATE,
  admission_grade text,
  grade text,
  current_class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  stream text,
  house text,
  previous_school text,
  is_repeater boolean NOT NULL DEFAULT false,
  expected_graduation_year int,
  learner_category public.learner_category_enum DEFAULT 'day_scholar',
  enrollment_status public.enrollment_status_enum NOT NULL DEFAULT 'active',
  status text NOT NULL DEFAULT 'active',
  exit_reason text,
  exit_date date,
  transfer_in_date date,
  transfer_out_date date,
  -- contact
  email text,
  phone text,
  address text,
  residential_address text,
  city text,
  county_or_region text,
  postal_code text,
  country text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  -- legacy denormalized guardian fields (still read by messaging)
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  guardian_relationship text,
  -- medical
  blood_group public.blood_group_enum DEFAULT 'unknown',
  allergies text,
  chronic_conditions text,
  medications text,
  doctor_name text,
  doctor_phone text,
  nhif_or_shif_number text,
  insurance_provider text,
  insurance_policy_number text,
  last_medical_checkup date,
  immunization_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  health_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- special needs
  has_special_needs boolean NOT NULL DEFAULT false,
  sne_category text,
  special_needs_details text,
  iep_on_file boolean NOT NULL DEFAULT false,
  accommodations text,
  -- government IDs
  nemis_upi text,
  birth_certificate_number text,
  birth_certificate_serial text,
  knec_assessment_number text,
  kcpe_index_number text,
  kcse_index_number text,
  huduma_number text,
  national_id_number text,
  lin text,
  uganda_lin text,
  une_index_number text,
  uneb_index_number text,
  prems_number text,
  tanzania_prems_id text,
  necta_index_number text,
  reb_student_id text,
  rwanda_reb_id text,
  rwanda_national_id text,
  moe_student_id text,
  ethiopia_moe_id text,
  ethiopian_birth_date text,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS students_tenant_admission_uniq ON public.students(tenant_id, admission_number) WHERE admission_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_portal_user_id ON public.students(portal_user_id) WHERE portal_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS students_tenant_class_idx ON public.students(tenant_id, current_class_id);
CREATE INDEX IF NOT EXISTS students_nemis_idx ON public.students(tenant_id, nemis_upi);
CREATE TRIGGER students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- GUARDIANS ----------
CREATE TABLE IF NOT EXISTS public.guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guardians TO authenticated;
GRANT ALL ON public.guardians TO service_role;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS guardians_tenant_idx ON public.guardians(tenant_id);
CREATE INDEX IF NOT EXISTS guardians_phone_idx ON public.guardians(tenant_id, phone_primary);
CREATE INDEX IF NOT EXISTS guardians_portal_user_idx ON public.guardians(portal_user_id) WHERE portal_user_id IS NOT NULL;
CREATE TRIGGER guardians_updated_at BEFORE UPDATE ON public.guardians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY guardians_select ON public.guardians FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR portal_user_id = auth.uid());
CREATE POLICY guardians_insert ON public.guardians FOR INSERT TO authenticated
  WITH CHECK (public.has_perm(tenant_id, 'students.edit'));
CREATE POLICY guardians_update ON public.guardians FOR UPDATE TO authenticated
  USING (public.has_perm(tenant_id, 'students.edit')) WITH CHECK (public.has_perm(tenant_id, 'students.edit'));
CREATE POLICY guardians_delete ON public.guardians FOR DELETE TO authenticated
  USING (public.has_perm(tenant_id, 'students.edit'));

-- ---------- STUDENT_GUARDIANS ----------
CREATE TABLE IF NOT EXISTS public.student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guardian_id uuid NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  relationship public.guardian_relationship_enum NOT NULL DEFAULT 'guardian',
  is_primary_contact boolean NOT NULL DEFAULT false,
  receives_communications boolean NOT NULL DEFAULT true,
  has_pickup_authorization boolean NOT NULL DEFAULT true,
  has_financial_responsibility boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, guardian_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_guardians TO authenticated;
GRANT ALL ON public.student_guardians TO service_role;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS student_guardians_one_primary ON public.student_guardians(student_id) WHERE is_primary_contact;
CREATE INDEX IF NOT EXISTS student_guardians_student_idx ON public.student_guardians(student_id);
CREATE INDEX IF NOT EXISTS student_guardians_guardian_idx ON public.student_guardians(guardian_id);

-- ---------- PORTAL HELPERS ----------
CREATE OR REPLACE FUNCTION public.portal_my_student_ids(_user uuid DEFAULT auth.uid())
RETURNS TABLE(student_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (
    SELECT CASE WHEN auth.uid() IS NULL THEN NULL::uuid
                WHEN _user = auth.uid() THEN _user
                ELSE auth.uid() END AS uid
  )
  SELECT DISTINCT sg.student_id FROM public.student_guardians sg
    JOIN public.guardians g ON g.id = sg.guardian_id
   WHERE g.portal_user_id = (SELECT uid FROM me)
  UNION
  SELECT s.id FROM public.students s WHERE s.portal_user_id = (SELECT uid FROM me);
$$;

CREATE OR REPLACE FUNCTION public.portal_my_tenants(_user uuid DEFAULT auth.uid())
RETURNS TABLE(tenant_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (
    SELECT CASE WHEN auth.uid() IS NULL THEN NULL::uuid
                WHEN _user = auth.uid() THEN _user
                ELSE auth.uid() END AS uid
  )
  SELECT DISTINCT g.tenant_id FROM public.guardians g WHERE g.portal_user_id = (SELECT uid FROM me)
  UNION
  SELECT DISTINCT s.tenant_id FROM public.students s WHERE s.portal_user_id = (SELECT uid FROM me);
$$;

REVOKE EXECUTE ON FUNCTION public.portal_my_student_ids(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.portal_my_tenants(uuid) FROM anon;

-- students + junction policies (need portal helpers)
CREATE POLICY students_select ON public.students FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR id IN (SELECT s.student_id FROM public.portal_my_student_ids() s));
CREATE POLICY students_insert ON public.students FOR INSERT TO authenticated
  WITH CHECK (public.has_perm(tenant_id, 'students.edit'));
CREATE POLICY students_update ON public.students FOR UPDATE TO authenticated
  USING (public.has_perm(tenant_id, 'students.edit')) WITH CHECK (public.has_perm(tenant_id, 'students.edit'));
CREATE POLICY students_delete ON public.students FOR DELETE TO authenticated
  USING (public.has_perm(tenant_id, 'students.delete'));

CREATE POLICY sg_select ON public.student_guardians FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR student_id IN (SELECT s.student_id FROM public.portal_my_student_ids() s));
CREATE POLICY sg_insert ON public.student_guardians FOR INSERT TO authenticated
  WITH CHECK (public.has_perm(tenant_id, 'students.edit'));
CREATE POLICY sg_update ON public.student_guardians FOR UPDATE TO authenticated
  USING (public.has_perm(tenant_id, 'students.edit')) WITH CHECK (public.has_perm(tenant_id, 'students.edit'));
CREATE POLICY sg_delete ON public.student_guardians FOR DELETE TO authenticated
  USING (public.has_perm(tenant_id, 'students.edit'));

-- ---------- STUDENT ACTIVITY ----------
CREATE TABLE IF NOT EXISTS public.student_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.student_activity TO authenticated;
GRANT ALL ON public.student_activity TO service_role;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS student_activity_student_idx ON public.student_activity(student_id, occurred_at DESC);
CREATE POLICY student_activity_select ON public.student_activity FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY student_activity_insert ON public.student_activity FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(tenant_id));

-- ---------- DOCUMENTS ----------
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS documents_owner_idx ON public.documents(tenant_id, owner_type, owner_id);
CREATE POLICY documents_select ON public.documents FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id)
     OR (owner_type = 'student' AND owner_id IN (SELECT s.student_id FROM public.portal_my_student_ids() s)));
CREATE POLICY documents_insert ON public.documents FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY documents_update ON public.documents FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY documents_delete ON public.documents FOR DELETE TO authenticated USING (public.is_tenant_member(tenant_id));

-- ---------- PORTAL OTP ----------
CREATE TABLE IF NOT EXISTS public.portal_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.portal_otps TO service_role;
ALTER TABLE public.portal_otps ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_portal_otps_phone ON public.portal_otps(phone, created_at DESC);
-- deliberately no policies: only service role may read/write

CREATE OR REPLACE FUNCTION public.portal_link_guardian_user(_phone text, _user_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.guardians
     SET portal_user_id = _user_id, updated_at = now()
   WHERE regexp_replace(COALESCE(phone_primary,''), '[^0-9]', '', 'g') = regexp_replace(_phone, '[^0-9]', '', 'g')
      OR regexp_replace(COALESCE(whatsapp_number,''), '[^0-9]', '', 'g') = regexp_replace(_phone, '[^0-9]', '', 'g');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION public.portal_link_student_user(_phone text, _user_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.students
     SET portal_user_id = _user_id, updated_at = now()
   WHERE regexp_replace(COALESCE(phone,''), '[^0-9]', '', 'g') = regexp_replace(_phone, '[^0-9]', '', 'g');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION public.portal_link_guardian_user(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.portal_link_student_user(text, uuid) FROM PUBLIC, anon, authenticated;

-- ---------- CLASS ENROLLMENT COUNTER ----------
CREATE OR REPLACE FUNCTION public.sync_class_enrollment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') AND OLD.current_class_id IS NOT NULL THEN
    UPDATE public.classes c SET current_enrollment = (
      SELECT count(*) FROM public.students s
       WHERE s.current_class_id = c.id AND s.enrollment_status = 'active'
    ) WHERE c.id = OLD.current_class_id;
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.current_class_id IS NOT NULL THEN
    UPDATE public.classes c SET current_enrollment = (
      SELECT count(*) FROM public.students s
       WHERE s.current_class_id = c.id AND s.enrollment_status = 'active'
    ) WHERE c.id = NEW.current_class_id;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER students_sync_class_enrollment
AFTER INSERT OR UPDATE OF current_class_id, enrollment_status OR DELETE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.sync_class_enrollment();

-- ---------- PERMISSION SEEDS ----------
INSERT INTO public.permissions (name, category, description) VALUES
  ('students.view', 'students', 'View student records'),
  ('students.edit', 'students', 'Create and edit student records'),
  ('students.delete', 'students', 'Delete student records'),
  ('students.import', 'students', 'Bulk import students'),
  ('students.view_medical', 'students', 'View student medical records'),
  ('guardians.manage', 'students', 'Manage guardians and links'),
  ('academics.manage', 'academics', 'Manage academic years, terms, grades and classes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system = true AND r.name IN ('super_admin','school_admin','registrar')
  AND p.name IN ('students.view','students.edit','students.delete','students.import','students.view_medical','guardians.manage','academics.manage')
ON CONFLICT DO NOTHING;