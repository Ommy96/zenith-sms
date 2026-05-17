
-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN CREATE TYPE room_type_enum AS ENUM ('classroom','lab','hall','sports','library','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subject_category_enum AS ENUM ('core','elective','co_curricular','life_skills'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subject_assessment_enum AS ENUM ('continuous','exam','both'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE exam_type_enum AS ENUM ('cat','midterm','end_term','mock','knec_mock','internal','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE exam_status_enum AS ENUM ('planned','in_progress','marking','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE assessment_type_enum AS ENUM ('assignment','quiz','project','practical','oral','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE report_run_status_enum AS ENUM ('queued','running','ready','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE scheme_status_enum AS ENUM ('draft','pending_review','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lesson_status_enum AS ENUM ('draft','pending_review','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE grade_stage_enum AS ENUM ('pre_primary','lower_primary','upper_primary','junior_secondary','senior_secondary','primary','secondary','o_level','a_level','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- ACADEMIC CALENDAR
-- ============================================================
CREATE TABLE IF NOT EXISTS public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_academic_year_name ON public.academic_years(tenant_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_current_academic_year ON public.academic_years(tenant_id) WHERE is_current;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_term_name ON public.terms(academic_year_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_current_term ON public.terms(tenant_id) WHERE is_current;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STRUCTURE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grade_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  stage grade_stage_enum,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_grade_code ON public.grade_levels(tenant_id, code);
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  type room_type_enum NOT NULL DEFAULT 'classroom',
  capacity int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_room_name ON public.rooms(tenant_id, name);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- extend existing classes table
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stream text,
  ADD COLUMN IF NOT EXISTS class_teacher_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_enrollment int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  category subject_category_enum NOT NULL DEFAULT 'core',
  curriculum_tag text,
  is_assessed boolean NOT NULL DEFAULT true,
  assessment_type subject_assessment_enum NOT NULL DEFAULT 'both',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_subject_code ON public.subjects(tenant_id, code);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  periods_per_week int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_class_subject ON public.class_subjects(class_id, subject_id);
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CBC VOCABULARY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.learning_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.learning_areas ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.strands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  learning_area_id uuid NOT NULL REFERENCES public.learning_areas(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.strands ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sub_strands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  strand_id uuid NOT NULL REFERENCES public.strands(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sub_strands ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.learning_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sub_strand_id uuid NOT NULL REFERENCES public.sub_strands(id) ON DELETE CASCADE,
  code text,
  description text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.learning_outcomes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.core_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.core_competencies ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cbc_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cbc_values ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cbc_assessment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  learning_outcome_id uuid NOT NULL REFERENCES public.learning_outcomes(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  performance_level smallint NOT NULL CHECK (performance_level BETWEEN 1 AND 4),
  teacher_id uuid,
  comment text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cbc_scores_student ON public.cbc_assessment_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_cbc_scores_outcome ON public.cbc_assessment_scores(learning_outcome_id);
ALTER TABLE public.cbc_assessment_scores ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TRADITIONAL GRADING
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grading_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_default_scale ON public.grading_scales(tenant_id) WHERE is_default;
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.grade_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  grading_scale_id uuid NOT NULL REFERENCES public.grading_scales(id) ON DELETE CASCADE,
  min_pct numeric NOT NULL,
  max_pct numeric NOT NULL,
  grade text NOT NULL,
  points numeric NOT NULL DEFAULT 0,
  remark text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.grade_bands ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- EXAMS — extend & add
-- ============================================================
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS weight numeric;
-- type/status columns already exist as text; we leave them text-compatible.

CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  max_marks numeric NOT NULL DEFAULT 100,
  grading_scale_id uuid REFERENCES public.grading_scales(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_exam_subject ON public.exam_subjects(exam_id, subject_id);
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.student_exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  raw_marks numeric,
  max_marks numeric,
  grade text,
  points numeric,
  position_in_class int,
  position_in_stream int,
  teacher_comment text,
  entered_by uuid,
  entered_at timestamptz,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ser ON public.student_exam_results(exam_id, student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_ser_student ON public.student_exam_results(student_id);
ALTER TABLE public.student_exam_results ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CONTINUOUS ASSESSMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  type assessment_type_enum NOT NULL DEFAULT 'assignment',
  title text NOT NULL,
  max_marks numeric NOT NULL DEFAULT 100,
  weight numeric NOT NULL DEFAULT 0,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.student_assessment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score numeric,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_sas ON public.student_assessment_scores(assessment_id, student_id);
ALTER TABLE public.student_assessment_scores ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.assessment_outcomes (
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  learning_outcome_id uuid NOT NULL REFERENCES public.learning_outcomes(id) ON DELETE CASCADE,
  PRIMARY KEY (assessment_id, learning_outcome_id)
);
ALTER TABLE public.assessment_outcomes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REPORT CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  curriculum_kind text NOT NULL DEFAULT 'traditional',
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.report_card_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.report_card_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.report_card_templates(id) ON DELETE SET NULL,
  status report_run_status_enum NOT NULL DEFAULT 'queued',
  requested_by uuid,
  total int NOT NULL DEFAULT 0,
  completed int NOT NULL DEFAULT 0,
  zip_url text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.report_card_runs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  run_id uuid NOT NULL REFERENCES public.report_card_runs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  pdf_url text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

-- private bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('reports','reports', false) ON CONFLICT DO NOTHING;

-- ============================================================
-- TIMETABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_break boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tt_class ON public.timetable_slots(term_id, class_id, period_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tt_teacher ON public.timetable_slots(term_id, teacher_id, period_id) WHERE teacher_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tt_room ON public.timetable_slots(term_id, room_id, period_id) WHERE room_id IS NOT NULL;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- LESSON PLANS & SCHEMES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schemes_of_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  file_url text,
  rich_text text,
  uploaded_by uuid,
  approved_by uuid,
  status scheme_status_enum NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.schemes_of_work ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  teacher_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  date date NOT NULL,
  period_id uuid REFERENCES public.periods(id) ON DELETE SET NULL,
  learning_outcome_ids uuid[] DEFAULT '{}',
  objectives text,
  materials text,
  introduction text,
  development text,
  conclusion text,
  assessment text,
  homework text,
  reflection text,
  hod_status lesson_status_enum NOT NULL DEFAULT 'draft',
  hod_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PERMISSIONS
-- ============================================================
INSERT INTO public.permissions (key, category, description) VALUES
  ('academics.configure','academics','Configure academic structure: years, terms, classes, subjects, scales'),
  ('exams.lock','academics','Lock and unlock exam results'),
  ('reports.generate','academics','Generate report card runs'),
  ('reports.publish','academics','Publish report cards to parents'),
  ('timetable.edit','academics','Edit the timetable'),
  ('lessons.approve','academics','Approve schemes of work and lesson plans')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'school_admin' AND p.key IN
  ('academics.configure','exams.lock','reports.generate','reports.publish','timetable.edit','lessons.approve')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('head_teacher','hod') AND p.key IN
  ('exams.lock','reports.generate','reports.publish','lessons.approve','timetable.edit')
ON CONFLICT DO NOTHING;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_academic_year(_tenant uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT id FROM public.academic_years WHERE tenant_id=_tenant AND is_current LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_term(_tenant uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT id FROM public.terms WHERE tenant_id=_tenant AND is_current LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.compute_grade(_scale uuid, _pct numeric)
RETURNS TABLE(grade text, points numeric, remark text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT grade, points, remark FROM public.grade_bands
   WHERE grading_scale_id=_scale AND _pct >= min_pct AND _pct <= max_pct
   ORDER BY min_pct DESC LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.seed_grade_levels(_tenant uuid, _curriculum text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  i int := 0;
  rec record;
BEGIN
  IF _curriculum = 'cbc' THEN
    FOR rec IN SELECT * FROM (VALUES
      ('PP1','PP1','pre_primary'),('PP2','PP2','pre_primary'),
      ('G1','Grade 1','lower_primary'),('G2','Grade 2','lower_primary'),('G3','Grade 3','lower_primary'),
      ('G4','Grade 4','upper_primary'),('G5','Grade 5','upper_primary'),('G6','Grade 6','upper_primary'),
      ('G7','Grade 7','junior_secondary'),('G8','Grade 8','junior_secondary'),('G9','Grade 9','junior_secondary'),
      ('G10','Grade 10','senior_secondary'),('G11','Grade 11','senior_secondary'),('G12','Grade 12','senior_secondary')
    ) AS t(code,name,stage) LOOP
      i := i+1;
      INSERT INTO public.grade_levels(tenant_id,code,name,stage,sort_order)
      VALUES (_tenant,rec.code,rec.name,rec.stage::grade_stage_enum,i)
      ON CONFLICT DO NOTHING;
    END LOOP;
  ELSIF _curriculum = '8-4-4' THEN
    FOR rec IN SELECT * FROM (VALUES
      ('S1','Std 1','primary'),('S2','Std 2','primary'),('S3','Std 3','primary'),('S4','Std 4','primary'),
      ('S5','Std 5','primary'),('S6','Std 6','primary'),('S7','Std 7','primary'),('S8','Std 8','primary'),
      ('F1','Form 1','secondary'),('F2','Form 2','secondary'),('F3','Form 3','secondary'),('F4','Form 4','secondary')
    ) AS t(code,name,stage) LOOP
      i := i+1;
      INSERT INTO public.grade_levels(tenant_id,code,name,stage,sort_order)
      VALUES (_tenant,rec.code,rec.name,rec.stage::grade_stage_enum,i) ON CONFLICT DO NOTHING;
    END LOOP;
  ELSIF _curriculum = 'ug' OR _curriculum = 'uganda' THEN
    FOR rec IN SELECT * FROM (VALUES
      ('P1','P1','primary'),('P2','P2','primary'),('P3','P3','primary'),('P4','P4','primary'),
      ('P5','P5','primary'),('P6','P6','primary'),('P7','P7','primary'),
      ('S1','S1','o_level'),('S2','S2','o_level'),('S3','S3','o_level'),('S4','S4','o_level'),
      ('S5','S5','a_level'),('S6','S6','a_level')
    ) AS t(code,name,stage) LOOP
      i := i+1;
      INSERT INTO public.grade_levels(tenant_id,code,name,stage,sort_order)
      VALUES (_tenant,rec.code,rec.name,rec.stage::grade_stage_enum,i) ON CONFLICT DO NOTHING;
    END LOOP;
  ELSIF _curriculum = 'tz' OR _curriculum = 'necta' THEN
    FOR rec IN SELECT * FROM (VALUES
      ('I','STD I','primary'),('II','STD II','primary'),('III','STD III','primary'),('IV','STD IV','primary'),
      ('V','STD V','primary'),('VI','STD VI','primary'),('VII','STD VII','primary'),
      ('F1','Form I','o_level'),('F2','Form II','o_level'),('F3','Form III','o_level'),('F4','Form IV','o_level'),
      ('F5','Form V','a_level'),('F6','Form VI','a_level')
    ) AS t(code,name,stage) LOOP
      i := i+1;
      INSERT INTO public.grade_levels(tenant_id,code,name,stage,sort_order)
      VALUES (_tenant,rec.code,rec.name,rec.stage::grade_stage_enum,i) ON CONFLICT DO NOTHING;
    END LOOP;
  ELSIF _curriculum = 'igcse' OR _curriculum = 'cambridge' OR _curriculum = 'ib' THEN
    FOR rec IN SELECT * FROM (VALUES
      ('Y1','Year 1','primary'),('Y2','Year 2','primary'),('Y3','Year 3','primary'),
      ('Y4','Year 4','primary'),('Y5','Year 5','primary'),('Y6','Year 6','primary'),
      ('Y7','Year 7','secondary'),('Y8','Year 8','secondary'),('Y9','Year 9','secondary'),
      ('Y10','Year 10','secondary'),('Y11','Year 11','secondary'),
      ('Y12','Year 12','a_level'),('Y13','Year 13','a_level')
    ) AS t(code,name,stage) LOOP
      i := i+1;
      INSERT INTO public.grade_levels(tenant_id,code,name,stage,sort_order)
      VALUES (_tenant,rec.code,rec.name,rec.stage::grade_stage_enum,i) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.recompute_exam_positions(_exam uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  WITH totals AS (
    SELECT r.student_id, COALESCE(SUM(r.raw_marks),0) AS total,
           s.current_class_id, s.stream
    FROM public.student_exam_results r
    JOIN public.students s ON s.id = r.student_id
    WHERE r.exam_id = _exam
    GROUP BY r.student_id, s.current_class_id, s.stream
  ),
  ranked AS (
    SELECT student_id, current_class_id, stream,
      RANK() OVER (PARTITION BY current_class_id ORDER BY total DESC) AS pos_class,
      RANK() OVER (PARTITION BY current_class_id, stream ORDER BY total DESC) AS pos_stream
    FROM totals
  )
  UPDATE public.student_exam_results r
     SET position_in_class = ranked.pos_class,
         position_in_stream = ranked.pos_stream
    FROM ranked
   WHERE r.exam_id = _exam AND r.student_id = ranked.student_id;
END $$;

CREATE OR REPLACE FUNCTION public.seed_cbc_competencies_and_values(_tenant uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.core_competencies(tenant_id, name) VALUES
    (_tenant,'Communication and Collaboration'),
    (_tenant,'Critical Thinking and Problem Solving'),
    (_tenant,'Imagination and Creativity'),
    (_tenant,'Citizenship'),
    (_tenant,'Digital Literacy'),
    (_tenant,'Learning to Learn'),
    (_tenant,'Self-Efficacy')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.cbc_values(tenant_id, name) VALUES
    (_tenant,'Love'),(_tenant,'Responsibility'),(_tenant,'Respect'),
    (_tenant,'Unity'),(_tenant,'Peace'),(_tenant,'Patriotism'),(_tenant,'Integrity')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- RLS POLICIES — bulk
-- ============================================================
DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'academic_years','terms','grade_levels','rooms','subjects','class_subjects',
  'learning_areas','strands','sub_strands','learning_outcomes','core_competencies','cbc_values','cbc_assessment_scores',
  'grading_scales','grade_bands','exam_subjects','student_exam_results',
  'assessments','student_assessment_scores','assessment_outcomes',
  'report_card_templates','report_card_runs','report_cards',
  'periods','timetable_slots','schemes_of_work','lesson_plans'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_select_%I ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_insert_%I ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_update_%I ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_delete_%I ON public.%I', t, t);
  END LOOP;
END $$;

-- Generic policies (member-read, configure-write) for most
DO $$
DECLARE t text;
DECLARE cfg_tables text[] := ARRAY[
  'academic_years','terms','grade_levels','rooms','subjects','class_subjects',
  'learning_areas','strands','sub_strands','learning_outcomes','core_competencies','cbc_values',
  'grading_scales','grade_bands','exam_subjects','periods','report_card_templates'
];
BEGIN
  FOREACH t IN ARRAY cfg_tables LOOP
    EXECUTE format('CREATE POLICY tenant_select_%I ON public.%I FOR SELECT TO authenticated USING (is_tenant_member(tenant_id))', t, t);
    EXECUTE format('CREATE POLICY tenant_insert_%I ON public.%I FOR INSERT TO authenticated WITH CHECK (is_tenant_member(tenant_id))', t, t);
    EXECUTE format('CREATE POLICY tenant_update_%I ON public.%I FOR UPDATE TO authenticated USING (has_perm(tenant_id, ''academics.configure'')) WITH CHECK (has_perm(tenant_id, ''academics.configure''))', t, t);
    EXECUTE format('CREATE POLICY tenant_delete_%I ON public.%I FOR DELETE TO authenticated USING (has_perm(tenant_id, ''academics.configure''))', t, t);
  END LOOP;
END $$;

-- Grade entry tables: any tenant member with exams.enter_grades can write
CREATE POLICY tenant_select_student_exam_results ON public.student_exam_results FOR SELECT TO authenticated USING (is_tenant_member(tenant_id));
CREATE POLICY tenant_insert_student_exam_results ON public.student_exam_results FOR INSERT TO authenticated WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_update_student_exam_results ON public.student_exam_results FOR UPDATE TO authenticated USING (is_tenant_member(tenant_id) AND (NOT locked OR has_perm(tenant_id,'exams.lock'))) WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_delete_student_exam_results ON public.student_exam_results FOR DELETE TO authenticated USING (has_perm(tenant_id,'exams.lock'));

CREATE POLICY tenant_select_cbc_assessment_scores ON public.cbc_assessment_scores FOR SELECT TO authenticated USING (is_tenant_member(tenant_id));
CREATE POLICY tenant_insert_cbc_assessment_scores ON public.cbc_assessment_scores FOR INSERT TO authenticated WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_update_cbc_assessment_scores ON public.cbc_assessment_scores FOR UPDATE TO authenticated USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_delete_cbc_assessment_scores ON public.cbc_assessment_scores FOR DELETE TO authenticated USING (is_tenant_member(tenant_id));

CREATE POLICY tenant_select_assessments ON public.assessments FOR SELECT TO authenticated USING (is_tenant_member(tenant_id));
CREATE POLICY tenant_insert_assessments ON public.assessments FOR INSERT TO authenticated WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_update_assessments ON public.assessments FOR UPDATE TO authenticated USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_delete_assessments ON public.assessments FOR DELETE TO authenticated USING (is_tenant_member(tenant_id));

CREATE POLICY tenant_select_student_assessment_scores ON public.student_assessment_scores FOR SELECT TO authenticated USING (is_tenant_member(tenant_id));
CREATE POLICY tenant_insert_student_assessment_scores ON public.student_assessment_scores FOR INSERT TO authenticated WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_update_student_assessment_scores ON public.student_assessment_scores FOR UPDATE TO authenticated USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_delete_student_assessment_scores ON public.student_assessment_scores FOR DELETE TO authenticated USING (is_tenant_member(tenant_id));

CREATE POLICY assessment_outcomes_select ON public.assessment_outcomes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.assessments a WHERE a.id=assessment_id AND is_tenant_member(a.tenant_id))
);
CREATE POLICY assessment_outcomes_all ON public.assessment_outcomes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.assessments a WHERE a.id=assessment_id AND is_tenant_member(a.tenant_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.assessments a WHERE a.id=assessment_id AND is_tenant_member(a.tenant_id))
);

-- Report cards
CREATE POLICY tenant_select_report_card_runs ON public.report_card_runs FOR SELECT TO authenticated USING (is_tenant_member(tenant_id));
CREATE POLICY tenant_insert_report_card_runs ON public.report_card_runs FOR INSERT TO authenticated WITH CHECK (has_perm(tenant_id,'reports.generate'));
CREATE POLICY tenant_update_report_card_runs ON public.report_card_runs FOR UPDATE TO authenticated USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_delete_report_card_runs ON public.report_card_runs FOR DELETE TO authenticated USING (has_perm(tenant_id,'reports.generate'));

CREATE POLICY tenant_select_report_cards ON public.report_cards FOR SELECT TO authenticated USING (is_tenant_member(tenant_id));
CREATE POLICY tenant_insert_report_cards ON public.report_cards FOR INSERT TO authenticated WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_update_report_cards ON public.report_cards FOR UPDATE TO authenticated USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_delete_report_cards ON public.report_cards FOR DELETE TO authenticated USING (has_perm(tenant_id,'reports.generate'));

-- Timetable
CREATE POLICY tenant_select_timetable_slots ON public.timetable_slots FOR SELECT TO authenticated USING (is_tenant_member(tenant_id));
CREATE POLICY tenant_insert_timetable_slots ON public.timetable_slots FOR INSERT TO authenticated WITH CHECK (has_perm(tenant_id,'timetable.edit'));
CREATE POLICY tenant_update_timetable_slots ON public.timetable_slots FOR UPDATE TO authenticated USING (has_perm(tenant_id,'timetable.edit')) WITH CHECK (has_perm(tenant_id,'timetable.edit'));
CREATE POLICY tenant_delete_timetable_slots ON public.timetable_slots FOR DELETE TO authenticated USING (has_perm(tenant_id,'timetable.edit'));

-- Schemes & lesson plans
CREATE POLICY tenant_select_schemes_of_work ON public.schemes_of_work FOR SELECT TO authenticated USING (is_tenant_member(tenant_id));
CREATE POLICY tenant_insert_schemes_of_work ON public.schemes_of_work FOR INSERT TO authenticated WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_update_schemes_of_work ON public.schemes_of_work FOR UPDATE TO authenticated USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_delete_schemes_of_work ON public.schemes_of_work FOR DELETE TO authenticated USING (has_perm(tenant_id,'lessons.approve'));

CREATE POLICY tenant_select_lesson_plans ON public.lesson_plans FOR SELECT TO authenticated USING (is_tenant_member(tenant_id));
CREATE POLICY tenant_insert_lesson_plans ON public.lesson_plans FOR INSERT TO authenticated WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_update_lesson_plans ON public.lesson_plans FOR UPDATE TO authenticated USING (is_tenant_member(tenant_id)) WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY tenant_delete_lesson_plans ON public.lesson_plans FOR DELETE TO authenticated USING (is_tenant_member(tenant_id));

-- ============================================================
-- Storage policies for `reports` bucket
-- ============================================================
DROP POLICY IF EXISTS reports_select ON storage.objects;
DROP POLICY IF EXISTS reports_insert ON storage.objects;
DROP POLICY IF EXISTS reports_update ON storage.objects;
DROP POLICY IF EXISTS reports_delete ON storage.objects;

CREATE POLICY reports_select ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='reports' AND is_tenant_member( (storage.foldername(name))[1]::uuid ));
CREATE POLICY reports_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='reports' AND is_tenant_member( (storage.foldername(name))[1]::uuid ));
CREATE POLICY reports_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='reports' AND is_tenant_member( (storage.foldername(name))[1]::uuid ));
CREATE POLICY reports_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='reports' AND has_perm( (storage.foldername(name))[1]::uuid ,'reports.generate'));

-- Seed CBC competencies and values for existing tenants
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.tenants LOOP
    PERFORM public.seed_cbc_competencies_and_values(r.id);
  END LOOP;
END $$;
