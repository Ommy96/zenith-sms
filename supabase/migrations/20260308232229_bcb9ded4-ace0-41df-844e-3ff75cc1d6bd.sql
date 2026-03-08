
-- Admissions / applications table
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  applied_grade text,
  date_of_birth date,
  gender text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  guardian_relationship text DEFAULT 'parent',
  previous_school text,
  status text NOT NULL DEFAULT 'under_review',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- School admins can manage applications
CREATE POLICY "School admins can manage applications"
ON public.applications FOR ALL TO authenticated
USING (
  school_id = get_user_school_id(auth.uid())
  AND has_role(auth.uid(), 'school_admin'::app_role)
);

-- School members can view applications
CREATE POLICY "School members can view applications"
ON public.applications FOR SELECT TO authenticated
USING (
  school_id = get_user_school_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
