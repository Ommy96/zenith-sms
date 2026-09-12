-- ============================================================
-- PHASE 3 — Staff / HR + auth bootstrap
-- ============================================================

DO $$ BEGIN CREATE TYPE public.employment_type_enum AS ENUM ('permanent','contract','part_time','intern','volunteer','bom','tsc'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.staff_status_enum AS ENUM ('active','on_leave','suspended','inactive','terminated','retired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;

-- ---------- DEPARTMENTS ----------
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  head_staff_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_department_name ON public.departments(tenant_id, name);
CREATE POLICY departments_select ON public.departments FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY departments_write ON public.departments FOR ALL TO authenticated
  USING (public.has_perm(tenant_id, 'staff.edit')) WITH CHECK (public.has_perm(tenant_id, 'staff.edit'));

-- ---------- STAFF ----------
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_number text,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  gender public.gender_enum,
  date_of_birth date,
  photo_url text,
  email text,
  phone text,
  alt_phone text,
  residential_address text,
  -- employment
  job_title text,
  role text NOT NULL DEFAULT 'teacher',
  department text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  employment_type public.employment_type_enum DEFAULT 'permanent',
  hire_date date,
  contract_end_date date,
  exit_date date,
  exit_reason text,
  status public.staff_status_enum NOT NULL DEFAULT 'active',
  -- professional
  qualification text,
  specialization text,
  years_experience int,
  tsc_number text,
  licence_number text,
  -- identity / statutory (sensitive)
  national_id_number text,
  kra_pin text,
  nssf_number text,
  nhif_or_shif_number text,
  bank_name text,
  bank_account_number text,
  basic_salary numeric(12,2),
  -- emergency
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS staff_tenant_number_uniq ON public.staff(tenant_id, staff_number) WHERE staff_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS staff_tenant_idx ON public.staff(tenant_id, status);
CREATE INDEX IF NOT EXISTS staff_user_idx ON public.staff(user_id) WHERE user_id IS NOT NULL;
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY staff_select ON public.staff FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR user_id = auth.uid());
CREATE POLICY staff_insert ON public.staff FOR INSERT TO authenticated
  WITH CHECK (public.has_perm(tenant_id, 'staff.edit'));
CREATE POLICY staff_update ON public.staff FOR UPDATE TO authenticated
  USING (public.has_perm(tenant_id, 'staff.edit')) WITH CHECK (public.has_perm(tenant_id, 'staff.edit'));
CREATE POLICY staff_delete ON public.staff FOR DELETE TO authenticated
  USING (public.has_perm(tenant_id, 'staff.delete'));

ALTER TABLE public.departments
  ADD CONSTRAINT departments_head_staff_fkey FOREIGN KEY (head_staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE public.classes
  ADD CONSTRAINT classes_teacher_fkey FOREIGN KEY (teacher_id) REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD CONSTRAINT classes_class_teacher_fkey FOREIGN KEY (class_teacher_id) REFERENCES public.staff(id) ON DELETE SET NULL;

-- ---------- AUTH BOOTSTRAP ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant uuid;
  v_role uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- First ever account becomes school admin of the school on file.
  IF NOT EXISTS (SELECT 1 FROM public.user_tenants) THEN
    SELECT id INTO v_tenant FROM public.tenants ORDER BY created_at LIMIT 1;
    SELECT id INTO v_role FROM public.roles WHERE is_system AND name = 'school_admin' LIMIT 1;
    IF v_tenant IS NOT NULL AND v_role IS NOT NULL THEN
      INSERT INTO public.user_tenants (user_id, tenant_id, is_active) VALUES (NEW.id, v_tenant, true)
        ON CONFLICT DO NOTHING;
      INSERT INTO public.user_roles (user_id, tenant_id, role_id) VALUES (NEW.id, v_tenant, v_role)
        ON CONFLICT DO NOTHING;
      UPDATE public.profiles SET default_tenant_id = v_tenant WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep profile.default_tenant_id in step with membership
CREATE OR REPLACE FUNCTION public.sync_default_tenant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles p
     SET default_tenant_id = NEW.tenant_id
   WHERE p.id = NEW.user_id AND p.default_tenant_id IS NULL;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_default_tenant() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER user_tenants_sync_default
AFTER INSERT ON public.user_tenants FOR EACH ROW EXECUTE FUNCTION public.sync_default_tenant();

-- ---------- PERMISSIONS ----------
INSERT INTO public.permissions (name, category, description) VALUES
  ('staff.view', 'staff', 'View staff records'),
  ('staff.edit', 'staff', 'Create and edit staff records'),
  ('staff.delete', 'staff', 'Delete staff records'),
  ('staff.view_sensitive', 'staff', 'View staff pay, bank and statutory details')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name IN ('super_admin','school_admin','principal','deputy_principal')
  AND p.name IN ('staff.view','staff.edit','staff.delete')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name IN ('super_admin','school_admin','principal')
  AND p.name = 'staff.view_sensitive'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name IN ('principal','deputy_principal','class_teacher','registrar')
  AND p.name IN ('students.view','academics.manage')
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';