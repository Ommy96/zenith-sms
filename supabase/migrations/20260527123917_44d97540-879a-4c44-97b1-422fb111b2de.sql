
ALTER TABLE public.class_subjects
  ADD COLUMN IF NOT EXISTS prefers_double_period boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL;

ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS required_room_type room_type_enum;

CREATE TABLE IF NOT EXISTS public.teacher_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  teacher_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  period_id uuid REFERENCES public.periods(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, teacher_id, day_of_week, period_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_unavailability TO authenticated;
GRANT ALL ON public.teacher_unavailability TO service_role;
ALTER TABLE public.teacher_unavailability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tu_select" ON public.teacher_unavailability FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tu_insert" ON public.teacher_unavailability FOR INSERT TO authenticated WITH CHECK (public.has_perm(tenant_id, 'timetable.edit'));
CREATE POLICY "tu_update" ON public.teacher_unavailability FOR UPDATE TO authenticated USING (public.has_perm(tenant_id, 'timetable.edit')) WITH CHECK (public.has_perm(tenant_id, 'timetable.edit'));
CREATE POLICY "tu_delete" ON public.teacher_unavailability FOR DELETE TO authenticated USING (public.has_perm(tenant_id, 'timetable.edit'));

CREATE TABLE IF NOT EXISTS public.timetable_optimization_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'class',
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  score numeric(10,2),
  placed int NOT NULL DEFAULT 0,
  unplaced int NOT NULL DEFAULT 0,
  hard_violations int NOT NULL DEFAULT 0,
  soft_violations int NOT NULL DEFAULT 0,
  violations jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms int,
  ran_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.timetable_optimization_runs TO authenticated;
GRANT ALL ON public.timetable_optimization_runs TO service_role;
ALTER TABLE public.timetable_optimization_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tor_select" ON public.timetable_optimization_runs FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tor_insert" ON public.timetable_optimization_runs FOR INSERT TO authenticated WITH CHECK (public.has_perm(tenant_id, 'timetable.edit'));

CREATE INDEX IF NOT EXISTS idx_tor_tenant_term ON public.timetable_optimization_runs(tenant_id, term_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tu_tenant_teacher ON public.teacher_unavailability(tenant_id, teacher_id);
