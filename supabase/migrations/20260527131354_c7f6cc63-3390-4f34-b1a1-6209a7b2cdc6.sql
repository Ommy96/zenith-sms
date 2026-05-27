
-- Students: country-specific learner IDs
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS uganda_lin text,
  ADD COLUMN IF NOT EXISTS uneb_index_number text,
  ADD COLUMN IF NOT EXISTS tanzania_prems_id text,
  ADD COLUMN IF NOT EXISTS necta_index_number text,
  ADD COLUMN IF NOT EXISTS rwanda_reb_id text,
  ADD COLUMN IF NOT EXISTS rwanda_national_id text,
  ADD COLUMN IF NOT EXISTS ethiopia_moe_id text,
  ADD COLUMN IF NOT EXISTS ethiopian_birth_date text;

CREATE INDEX IF NOT EXISTS idx_students_uganda_lin ON public.students(tenant_id, uganda_lin) WHERE uganda_lin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_tanzania_prems_id ON public.students(tenant_id, tanzania_prems_id) WHERE tanzania_prems_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_rwanda_reb_id ON public.students(tenant_id, rwanda_reb_id) WHERE rwanda_reb_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_ethiopia_moe_id ON public.students(tenant_id, ethiopia_moe_id) WHERE ethiopia_moe_id IS NOT NULL;

-- Staff: country-specific payroll / registration numbers
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS uganda_payroll_number text,
  ADD COLUMN IF NOT EXISTS tanzania_payroll_number text,
  ADD COLUMN IF NOT EXISTS rwanda_rssb_number text,
  ADD COLUMN IF NOT EXISTS ethiopia_employee_id text;
