
-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('answer-sheets', 'answer-sheets', false),
  ('face-enrollments', 'face-enrollments', false),
  ('classroom-photos', 'classroom-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (tenant members can read/write under tenant_id/* prefix)
CREATE POLICY "answer_sheets read tenant"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'answer-sheets' AND public.is_tenant_member((storage.foldername(name))[1]::uuid));
CREATE POLICY "answer_sheets write tenant"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'answer-sheets' AND public.is_tenant_member((storage.foldername(name))[1]::uuid));
CREATE POLICY "answer_sheets delete tenant"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'answer-sheets' AND public.is_tenant_member((storage.foldername(name))[1]::uuid));

CREATE POLICY "face_enroll read tenant"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'face-enrollments' AND public.is_tenant_member((storage.foldername(name))[1]::uuid));
CREATE POLICY "face_enroll write tenant"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'face-enrollments' AND public.is_tenant_member((storage.foldername(name))[1]::uuid));
CREATE POLICY "face_enroll delete tenant"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'face-enrollments' AND public.is_tenant_member((storage.foldername(name))[1]::uuid));

CREATE POLICY "classroom_photos read tenant"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'classroom-photos' AND public.is_tenant_member((storage.foldername(name))[1]::uuid));
CREATE POLICY "classroom_photos write tenant"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'classroom-photos' AND public.is_tenant_member((storage.foldername(name))[1]::uuid));
CREATE POLICY "classroom_photos delete tenant"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'classroom-photos' AND public.is_tenant_member((storage.foldername(name))[1]::uuid));

-- OCR grading jobs
CREATE TABLE public.ocr_grading_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  exam_id uuid,
  subject_id uuid,
  student_id uuid,
  image_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_marks numeric,
  max_marks numeric,
  per_question jsonb DEFAULT '[]'::jsonb,
  ai_notes text,
  error_message text,
  posted_to_gradebook boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ocr_grading_jobs TO authenticated;
GRANT ALL ON public.ocr_grading_jobs TO service_role;
ALTER TABLE public.ocr_grading_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ocr tenant access" ON public.ocr_grading_jobs FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));
CREATE TRIGGER trg_ocr_grading_jobs_updated BEFORE UPDATE ON public.ocr_grading_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admission screenings
CREATE TABLE public.admission_screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  application_id uuid,
  applicant_name text,
  grade_level text,
  score int,
  recommendation text,
  strengths jsonb DEFAULT '[]'::jsonb,
  red_flags jsonb DEFAULT '[]'::jsonb,
  interview_questions jsonb DEFAULT '[]'::jsonb,
  rationale text,
  input_data jsonb,
  criteria jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admission_screenings TO authenticated;
GRANT ALL ON public.admission_screenings TO service_role;
ALTER TABLE public.admission_screenings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "screenings tenant access" ON public.admission_screenings FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));
CREATE TRIGGER trg_admission_screenings_updated BEFORE UPDATE ON public.admission_screenings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Face enrollments
CREATE TABLE public.face_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  image_path text NOT NULL,
  is_primary boolean DEFAULT true,
  enrolled_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.face_enrollments TO authenticated;
GRANT ALL ON public.face_enrollments TO service_role;
ALTER TABLE public.face_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "face_enroll tenant access" ON public.face_enrollments FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));
CREATE INDEX idx_face_enroll_student ON public.face_enrollments(tenant_id, student_id);

-- Face attendance sessions
CREATE TABLE public.face_attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  class_id uuid,
  capture_date date NOT NULL DEFAULT CURRENT_DATE,
  photo_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  matched_students jsonb DEFAULT '[]'::jsonb,
  unmatched_faces int DEFAULT 0,
  ai_notes text,
  marked_attendance boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.face_attendance_sessions TO authenticated;
GRANT ALL ON public.face_attendance_sessions TO service_role;
ALTER TABLE public.face_attendance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "face_sessions tenant access" ON public.face_attendance_sessions FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));
CREATE TRIGGER trg_face_sessions_updated BEFORE UPDATE ON public.face_attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
