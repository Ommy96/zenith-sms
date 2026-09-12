
-- =========================================================
-- PHASE 3: ACADEMICS (additive)
-- =========================================================

-- ---------- 1. Extend existing Phase 2 tables ----------
ALTER TABLE public.academic_years
  ADD CONSTRAINT academic_years_date_chk CHECK (end_date > start_date);

ALTER TABLE public.terms ADD COLUMN IF NOT EXISTS term_number int;
UPDATE public.terms t SET term_number = s.rn
  FROM (SELECT id, row_number() OVER (PARTITION BY academic_year_id ORDER BY start_date) rn FROM public.terms) s
 WHERE s.id = t.id AND t.term_number IS NULL;
ALTER TABLE public.terms ALTER COLUMN term_number SET NOT NULL;
ALTER TABLE public.terms ADD CONSTRAINT terms_date_chk CHECK (end_date > start_date);
CREATE UNIQUE INDEX IF NOT EXISTS terms_year_number_uniq ON public.terms(academic_year_id, term_number);

ALTER TABLE public.grade_levels
  ADD COLUMN IF NOT EXISTS min_age int,
  ADD COLUMN IF NOT EXISTS max_age int,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS building text,
  ADD COLUMN IF NOT EXISTS floor text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS rooms_tenant_name_uniq ON public.rooms(tenant_id, name);

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS assistant_teacher_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS classes_tenant_year_name_uniq ON public.classes(tenant_id, academic_year_id, name);

-- ---------- 2. New tables ----------
CREATE TABLE public.school_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL,
  description text,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, date)
);

CREATE TABLE public.learning_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  curriculum text NOT NULL DEFAULT 'cbc',
  category text,
  min_grade_level int,
  max_grade_level int,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code, curriculum)
);

CREATE TABLE public.strands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  learning_area_id uuid NOT NULL REFERENCES public.learning_areas(id) ON DELETE CASCADE,
  code text,
  name text NOT NULL,
  grade_level int,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (learning_area_id, code)
);

CREATE TABLE public.sub_strands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  strand_id uuid NOT NULL REFERENCES public.strands(id) ON DELETE CASCADE,
  code text,
  name text NOT NULL,
  suggested_lessons int,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (strand_id, code)
);

CREATE TABLE public.learning_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sub_strand_id uuid NOT NULL REFERENCES public.sub_strands(id) ON DELETE CASCADE,
  code text,
  description text NOT NULL,
  core_competencies text[] NOT NULL DEFAULT '{}',
  values text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sub_strand_id, code)
);

CREATE TABLE public.core_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.cbc_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  learning_area_id uuid REFERENCES public.learning_areas(id) ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  category text,
  assessment_type text NOT NULL DEFAULT 'both',
  grade_levels uuid[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  lessons_per_week int NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, subject_id)
);

CREATE TABLE public.student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  enrolled_date date NOT NULL DEFAULT current_date,
  unenrolled_date date,
  status text NOT NULL DEFAULT 'active',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX student_enrollments_active_uniq
  ON public.student_enrollments(student_id, academic_year_id) WHERE unenrolled_date IS NULL;

CREATE TABLE public.periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_break boolean NOT NULL DEFAULT false,
  days text[] NOT NULL DEFAULT ARRAY['mon','tue','wed','thu','fri'],
  sort_order int NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  UNIQUE (tenant_id, name)
);

CREATE TABLE public.timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  period_id uuid NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, day_of_week, period_id, academic_year_id)
);

CREATE TABLE public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date date NOT NULL,
  period_id uuid REFERENCES public.periods(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  session_type text NOT NULL DEFAULT 'daily',
  taken_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  taken_at timestamptz,
  is_finalized boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX attendance_sessions_uniq
  ON public.attendance_sessions(class_id, date, session_type, COALESCE(period_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status text NOT NULL,
  arrival_time time,
  departure_time time,
  reason text,
  recorded_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  name text NOT NULL,
  exam_type text NOT NULL DEFAULT 'internal',
  start_date date,
  end_date date,
  grade_levels uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'planned',
  created_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  published_at timestamptz,
  published_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, academic_year_id, term_id, name)
);

CREATE TABLE public.exam_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  paper_number int NOT NULL DEFAULT 1,
  max_marks numeric(5,2) NOT NULL DEFAULT 100,
  exam_date date,
  duration_minutes int,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, subject_id, paper_number)
);

CREATE TABLE public.student_exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_subject_id uuid NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  raw_marks numeric(5,2),
  max_marks numeric(5,2) NOT NULL DEFAULT 100,
  grade_letter text,
  performance_level text,
  teacher_comment text,
  entered_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  entered_at timestamptz,
  is_locked boolean NOT NULL DEFAULT false,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_subject_id, student_id)
);

CREATE TABLE public.grading_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  scale_type text NOT NULL DEFAULT 'letter',
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.grading_scale_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  grading_scale_id uuid NOT NULL REFERENCES public.grading_scales(id) ON DELETE CASCADE,
  min_score numeric(5,2),
  max_score numeric(5,2),
  label text NOT NULL,
  points numeric(4,2),
  description text,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.report_card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  curriculum text NOT NULL DEFAULT 'cbc',
  grade_levels uuid[] NOT NULL DEFAULT '{}',
  template_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.report_card_templates(id) ON DELETE SET NULL,
  overall_mean numeric(5,2),
  overall_grade text,
  overall_position int,
  class_size int,
  class_teacher_comment text,
  head_teacher_comment text,
  next_term_starts date,
  pdf_url text,
  generated_at timestamptz,
  generated_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  published_at timestamptz,
  delivered_to_parent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, exam_id)
);

-- ---------- 3. Helper functions ----------
CREATE OR REPLACE FUNCTION public.current_academic_year(p_tenant_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.academic_years WHERE tenant_id = p_tenant_id AND is_current LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_term(p_tenant_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.terms WHERE tenant_id = p_tenant_id AND is_current LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.cbc_performance_level(p_marks numeric, p_max numeric)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN p_marks IS NULL THEN NULL
    WHEN (p_marks / NULLIF(p_max,0)) * 100 >= 80 THEN 'EE'
    WHEN (p_marks / NULLIF(p_max,0)) * 100 >= 60 THEN 'ME'
    WHEN (p_marks / NULLIF(p_max,0)) * 100 >= 40 THEN 'AE'
    ELSE 'BE' END;
$$;

CREATE OR REPLACE FUNCTION public.enroll_student(p_student_id uuid, p_class_id uuid, p_year_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid; v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.students WHERE id = p_student_id;
  IF v_tenant IS NULL THEN RAISE EXCEPTION 'Unknown student'; END IF;
  IF NOT (public.is_super_admin() OR public.user_has_permission(v_tenant, 'students.edit')) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  INSERT INTO public.student_enrollments (tenant_id, student_id, class_id, academic_year_id)
  VALUES (v_tenant, p_student_id, p_class_id, p_year_id) RETURNING id INTO new_id;
  UPDATE public.students SET current_class_id = p_class_id WHERE id = p_student_id;
  RETURN new_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.current_academic_year(uuid), public.current_term(uuid),
  public.cbc_performance_level(numeric, numeric), public.enroll_student(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_academic_year(uuid), public.current_term(uuid),
  public.cbc_performance_level(numeric, numeric), public.enroll_student(uuid, uuid, uuid) TO authenticated, service_role;

-- ---------- 4. Triggers ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['grade_levels','rooms','learning_areas','subjects','class_subjects',
    'student_enrollments','periods','timetable_slots','attendance_sessions','exams',
    'student_exam_results','grading_scales','report_card_templates','report_cards'] LOOP
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public._tg_single_current_year()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_current THEN
    UPDATE public.academic_years SET is_current = false
     WHERE tenant_id = NEW.tenant_id AND id <> NEW.id AND is_current;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER academic_years_single_current AFTER INSERT OR UPDATE OF is_current ON public.academic_years
  FOR EACH ROW WHEN (NEW.is_current) EXECUTE FUNCTION public._tg_single_current_year();

CREATE OR REPLACE FUNCTION public._tg_single_current_term()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_current THEN
    UPDATE public.terms SET is_current = false
     WHERE tenant_id = NEW.tenant_id AND id <> NEW.id AND is_current;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER terms_single_current AFTER INSERT OR UPDATE OF is_current ON public.terms
  FOR EACH ROW WHEN (NEW.is_current) EXECUTE FUNCTION public._tg_single_current_term();

CREATE OR REPLACE FUNCTION public._tg_close_prev_enrollment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.student_enrollments
     SET unenrolled_date = current_date, status = 'transferred_out', updated_at = now()
   WHERE student_id = NEW.student_id AND academic_year_id = NEW.academic_year_id
     AND unenrolled_date IS NULL AND id <> NEW.id;
  RETURN NEW;
END $$;
CREATE TRIGGER student_enrollments_close_prev BEFORE INSERT ON public.student_enrollments
  FOR EACH ROW EXECUTE FUNCTION public._tg_close_prev_enrollment();

CREATE OR REPLACE FUNCTION public._tg_result_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_curr text;
BEGIN
  IF NEW.performance_level IS NULL AND NEW.raw_marks IS NOT NULL THEN
    SELECT curriculum INTO v_curr FROM public.tenants WHERE id = NEW.tenant_id;
    IF COALESCE(v_curr,'cbc') = 'cbc' THEN
      NEW.performance_level := public.cbc_performance_level(NEW.raw_marks, NEW.max_marks);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER student_exam_results_defaults BEFORE INSERT ON public.student_exam_results
  FOR EACH ROW EXECUTE FUNCTION public._tg_result_defaults();

CREATE OR REPLACE FUNCTION public._tg_result_lock_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.is_locked AND NEW.is_locked THEN
    RAISE EXCEPTION 'Cannot modify locked exam results';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER student_exam_results_lock_guard BEFORE UPDATE ON public.student_exam_results
  FOR EACH ROW EXECUTE FUNCTION public._tg_result_lock_guard();

-- ---------- 5. Permissions ----------
INSERT INTO public.permissions (name, description, category)
VALUES ('exams.view', 'View exams and results', 'academics')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r
  JOIN public.role_permissions rp ON rp.role_id = r.id
  JOIN public.permissions ap ON ap.id = rp.permission_id AND ap.name = 'attendance.view'
  CROSS JOIN public.permissions p
 WHERE p.name = 'exams.view'
ON CONFLICT DO NOTHING;

-- ---------- 6. Grants + RLS ----------
DO $$
DECLARE
  rec record;
  map jsonb := '{
    "school_days":["classes.view","classes.manage"],
    "learning_areas":["classes.view","curriculum.manage"],
    "strands":["classes.view","curriculum.manage"],
    "sub_strands":["classes.view","curriculum.manage"],
    "learning_outcomes":["classes.view","curriculum.manage"],
    "core_competencies":["classes.view","curriculum.manage"],
    "cbc_values":["classes.view","curriculum.manage"],
    "subjects":["classes.view","subjects.manage"],
    "class_subjects":["classes.view","subjects.manage"],
    "student_enrollments":["students.view","students.edit"],
    "periods":["timetable.view","timetable.edit"],
    "timetable_slots":["timetable.view","timetable.edit"],
    "attendance_sessions":["attendance.view","attendance.mark"],
    "attendance_records":["attendance.view","attendance.mark"],
    "exams":["attendance.view","exams.create"],
    "exam_subjects":["attendance.view","exams.create"],
    "student_exam_results":["exams.view","exams.grade"],
    "grading_scales":["classes.view","exams.create"],
    "grading_scale_bands":["classes.view","exams.create"],
    "report_card_templates":["classes.view","exams.create"],
    "report_cards":["exams.view","exams.grade"]
  }'::jsonb;
  tbl text; vperm text; wperm text; act text;
BEGIN
  FOR rec IN SELECT * FROM jsonb_each(map) LOOP
    tbl := rec.key; vperm := rec.value->>0; wperm := rec.value->>1;
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()) AND (public.user_has_permission(tenant_id, %L) OR public.is_super_admin()))', tbl||'_staff_select', tbl, vperm);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()) AND (public.user_has_permission(tenant_id, %L) OR public.is_super_admin()))', tbl||'_staff_insert', tbl, wperm);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()) AND (public.user_has_permission(tenant_id, %L) OR public.is_super_admin())) WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()))', tbl||'_staff_update', tbl, wperm);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()) AND (public.user_has_permission(tenant_id, %L) OR public.is_super_admin()))', tbl||'_staff_delete', tbl, wperm);
  END LOOP;
END $$;

-- ---------- 7. Portal (parent / student) read access ----------
CREATE POLICY student_enrollments_portal_select ON public.student_enrollments
  FOR SELECT TO authenticated USING (student_id IN (SELECT public.portal_my_student_ids()));

CREATE POLICY attendance_records_portal_select ON public.attendance_records
  FOR SELECT TO authenticated USING (student_id IN (SELECT public.portal_my_student_ids()));

CREATE POLICY student_exam_results_portal_select ON public.student_exam_results
  FOR SELECT TO authenticated USING (
    student_id IN (SELECT public.portal_my_student_ids())
    AND EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.published_at IS NOT NULL));

CREATE POLICY report_cards_portal_select ON public.report_cards
  FOR SELECT TO authenticated USING (
    student_id IN (SELECT public.portal_my_student_ids()) AND published_at IS NOT NULL);

CREATE POLICY exams_portal_select ON public.exams
  FOR SELECT TO authenticated USING (
    published_at IS NOT NULL AND tenant_id IN (SELECT public.portal_my_tenants()));

CREATE POLICY timetable_slots_portal_select ON public.timetable_slots
  FOR SELECT TO authenticated USING (
    class_id IN (SELECT s.current_class_id FROM public.students s
                 WHERE s.id IN (SELECT public.portal_my_student_ids()) AND s.current_class_id IS NOT NULL));

CREATE POLICY subjects_portal_select ON public.subjects
  FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.portal_my_tenants()));

CREATE POLICY periods_portal_select ON public.periods
  FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.portal_my_tenants()));

CREATE POLICY classes_portal_select ON public.classes
  FOR SELECT TO authenticated USING (
    id IN (SELECT s.current_class_id FROM public.students s
           WHERE s.id IN (SELECT public.portal_my_student_ids()) AND s.current_class_id IS NOT NULL));

CREATE POLICY academic_years_portal_select ON public.academic_years
  FOR SELECT TO authenticated USING (is_current AND tenant_id IN (SELECT public.portal_my_tenants()));

CREATE POLICY terms_portal_select ON public.terms
  FOR SELECT TO authenticated USING (is_current AND tenant_id IN (SELECT public.portal_my_tenants()));

CREATE POLICY grade_levels_portal_select ON public.grade_levels
  FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.portal_my_tenants()));

-- ---------- 8. Indexes ----------
CREATE INDEX idx_enrollments_class ON public.student_enrollments(class_id);
CREATE INDEX idx_enrollments_student ON public.student_enrollments(student_id);
CREATE INDEX idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX idx_attendance_sessions_date ON public.attendance_sessions(tenant_id, date);
CREATE INDEX idx_timetable_class ON public.timetable_slots(class_id, day_of_week);
CREATE INDEX idx_results_student ON public.student_exam_results(student_id);
CREATE INDEX idx_results_exam ON public.student_exam_results(exam_id);
CREATE INDEX idx_class_subjects_class ON public.class_subjects(class_id);

NOTIFY pgrst, 'reload schema';
