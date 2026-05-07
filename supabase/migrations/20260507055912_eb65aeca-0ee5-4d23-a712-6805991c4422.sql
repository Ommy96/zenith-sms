CREATE TABLE public.import_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  header_signature text NOT NULL,
  source_type text NOT NULL DEFAULT 'students',
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  use_count integer NOT NULL DEFAULT 1,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, source_type, header_signature)
);

CREATE INDEX idx_import_mappings_school ON public.import_mappings(school_id, source_type);

ALTER TABLE public.import_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School members can view import mappings"
ON public.import_mappings FOR SELECT TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "School admins can manage import mappings"
ON public.import_mappings FOR ALL TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'teacher')))
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'teacher')));