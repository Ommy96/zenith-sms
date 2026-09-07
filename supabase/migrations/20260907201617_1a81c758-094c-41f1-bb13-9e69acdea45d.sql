-- ============ 1. TENANTS ============
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  country_code text NOT NULL DEFAULT 'KE',
  currency_code text NOT NULL DEFAULT 'KES',
  timezone text NOT NULL DEFAULT 'Africa/Nairobi',
  locale text NOT NULL DEFAULT 'en-KE',
  school_type text,
  curriculum text,
  logo_url text,
  primary_color text DEFAULT '#4F46E5',
  registration_number text,
  nemis_code text,
  address text,
  phone text,
  email text,
  subscription_plan text NOT NULL DEFAULT 'trial',
  subscription_status text NOT NULL DEFAULT 'active',
  trial_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ============ 2. TENANT SETTINGS ============
CREATE TABLE public.tenant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_settings TO authenticated;
GRANT ALL ON public.tenant_settings TO service_role;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- ============ 3. ROLES ============
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX roles_tenant_name_key ON public.roles (tenant_id, name) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX roles_system_name_key ON public.roles (name) WHERE tenant_id IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- ============ 4. PERMISSIONS ============
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  category text
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- ============ 5. ROLE PERMISSIONS ============
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- ============ 6. USER TENANTS ============
CREATE TABLE public.user_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_tenants TO authenticated;
GRANT ALL ON public.user_tenants TO service_role;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

-- ============ 7. USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  UNIQUE (user_id, tenant_id, role_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ 8. AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id),
  actor_type text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  before jsonb,
  after jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_tenant_created_idx ON public.audit_logs (tenant_id, created_at DESC);
CREATE INDEX audit_logs_tenant_entity_idx ON public.audit_logs (tenant_id, entity_type, entity_id);
CREATE INDEX audit_logs_tenant_actor_idx ON public.audit_logs (tenant_id, actor_user_id, created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.auth_user_id() RETURNS uuid
LANGUAGE sql STABLE SET search_path = public AS $$ SELECT auth.uid() $$;

CREATE OR REPLACE FUNCTION public.user_tenant_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.user_tenants
  WHERE user_id = auth.uid() AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(p_tenant_id uuid, p_permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND ur.tenant_id = p_tenant_id
      AND p.name = p_permission
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
      AND r.is_system = true
  )
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tenant_settings_updated_at BEFORE UPDATE ON public.tenant_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER roles_updated_at BEFORE UPDATE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RLS POLICIES ============
CREATE POLICY tenants_select ON public.tenants FOR SELECT TO authenticated
USING (id IN (SELECT public.user_tenant_ids()) OR public.is_super_admin());
CREATE POLICY tenants_update ON public.tenants FOR UPDATE TO authenticated
USING (public.user_has_permission(id, 'tenant.edit'))
WITH CHECK (public.user_has_permission(id, 'tenant.edit'));

CREATE POLICY tenant_settings_select ON public.tenant_settings FOR SELECT TO authenticated
USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY tenant_settings_write ON public.tenant_settings FOR ALL TO authenticated
USING (public.user_has_permission(tenant_id, 'tenant.settings.edit'))
WITH CHECK (public.user_has_permission(tenant_id, 'tenant.settings.edit'));

CREATE POLICY roles_select ON public.roles FOR SELECT TO authenticated
USING (tenant_id IS NULL OR tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY roles_insert ON public.roles FOR INSERT TO authenticated
WITH CHECK (tenant_id IS NOT NULL AND public.user_has_permission(tenant_id, 'roles.manage'));
CREATE POLICY roles_update ON public.roles FOR UPDATE TO authenticated
USING (tenant_id IS NOT NULL AND public.user_has_permission(tenant_id, 'roles.manage'))
WITH CHECK (tenant_id IS NOT NULL AND public.user_has_permission(tenant_id, 'roles.manage'));
CREATE POLICY roles_delete ON public.roles FOR DELETE TO authenticated
USING (tenant_id IS NOT NULL AND public.user_has_permission(tenant_id, 'roles.manage'));

CREATE POLICY permissions_select ON public.permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY role_permissions_select ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY role_permissions_write ON public.role_permissions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.tenant_id IS NOT NULL
               AND public.user_has_permission(r.tenant_id, 'roles.manage')))
WITH CHECK (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.tenant_id IS NOT NULL
               AND public.user_has_permission(r.tenant_id, 'roles.manage')));

CREATE POLICY user_tenants_select ON public.user_tenants FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.user_has_permission(tenant_id, 'users.manage'));
CREATE POLICY user_tenants_insert ON public.user_tenants FOR INSERT TO authenticated
WITH CHECK (public.user_has_permission(tenant_id, 'users.manage'));
CREATE POLICY user_tenants_delete ON public.user_tenants FOR DELETE TO authenticated
USING (public.user_has_permission(tenant_id, 'users.manage'));

CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.user_has_permission(tenant_id, 'users.manage'));
CREATE POLICY user_roles_insert ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.user_has_permission(tenant_id, 'users.manage'));
CREATE POLICY user_roles_delete ON public.user_roles FOR DELETE TO authenticated
USING (public.user_has_permission(tenant_id, 'users.manage'));

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated
USING (public.user_has_permission(tenant_id, 'audit.view'));

-- ============ SEED: SYSTEM ROLES ============
INSERT INTO public.roles (tenant_id, name, description, is_system) VALUES
 (NULL,'super_admin','Platform-wide administrator',true),
 (NULL,'school_admin','Full administrative access within a school',true),
 (NULL,'principal','School head',true),
 (NULL,'deputy_principal','Deputy school head',true),
 (NULL,'bursar','Finance lead',true),
 (NULL,'accounts_clerk','Finance assistant',true),
 (NULL,'registrar','Admissions and records',true),
 (NULL,'hod','Head of department',true),
 (NULL,'class_teacher','Teacher responsible for a class',true),
 (NULL,'subject_teacher','Subject teacher',true),
 (NULL,'librarian','Library manager',true),
 (NULL,'transport_officer','Transport manager',true),
 (NULL,'nurse','School health officer',true),
 (NULL,'hostel_master','Boarding manager',true),
 (NULL,'parent','Parent or guardian portal user',true),
 (NULL,'student','Student portal user',true),
 (NULL,'alumni','Former student',true);

-- ============ SEED: PERMISSIONS ============
INSERT INTO public.permissions (name, category, description) VALUES
 ('students.view','academics','View students'),
 ('students.create','academics','Create students'),
 ('students.edit','academics','Edit students'),
 ('students.delete','academics','Delete students'),
 ('classes.view','academics','View classes'),
 ('classes.manage','academics','Manage classes'),
 ('subjects.manage','academics','Manage subjects'),
 ('curriculum.manage','academics','Manage curriculum'),
 ('attendance.mark','academics','Mark attendance'),
 ('attendance.view','academics','View attendance'),
 ('exams.create','academics','Create exams'),
 ('exams.grade','academics','Grade exams'),
 ('exams.publish','academics','Publish exam results'),
 ('timetable.view','academics','View timetable'),
 ('timetable.edit','academics','Edit timetable'),
 ('fees.view','finance','View fees'),
 ('fees.collect','finance','Collect fees'),
 ('fees.structure','finance','Manage fee structures'),
 ('invoices.create','finance','Create invoices'),
 ('invoices.view','finance','View invoices'),
 ('payments.record','finance','Record payments'),
 ('payments.view','finance','View payments'),
 ('payroll.run','finance','Run payroll'),
 ('payroll.view','finance','View payroll'),
 ('receipts.view','finance','View receipts'),
 ('receipts.regenerate','finance','Regenerate receipts'),
 ('messages.send','communication','Send messages'),
 ('messages.view','communication','View messages'),
 ('announcements.create','communication','Create announcements'),
 ('whatsapp.manage','communication','Manage WhatsApp integration'),
 ('transport.manage','operations','Manage transport'),
 ('hostel.manage','operations','Manage hostels'),
 ('library.manage','operations','Manage library'),
 ('inventory.manage','operations','Manage inventory'),
 ('health.view','operations','View health records'),
 ('discipline.log','operations','Log discipline incidents'),
 ('users.manage','system','Manage users and their roles'),
 ('roles.manage','system','Manage roles'),
 ('tenant.edit','system','Edit school details'),
 ('tenant.settings.edit','system','Edit school settings'),
 ('audit.view','system','View audit logs'),
 ('billing.manage','system','Manage subscription and billing');

-- ============ SEED: ROLE PERMISSIONS ============
-- super_admin: everything
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'super_admin';

-- school_admin: everything except billing.manage
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'school_admin' AND p.name <> 'billing.manage';

-- principal: everything except billing.manage
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'principal' AND p.name <> 'billing.manage';

-- deputy_principal: academics + operations + comms + view-level finance
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'deputy_principal'
  AND (p.category IN ('academics','operations','communication')
       OR p.name IN ('fees.view','invoices.view','payments.view','audit.view'));

-- bursar: all finance + read academics
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'bursar'
  AND (p.category = 'finance'
       OR p.name IN ('students.view','classes.view','messages.send','messages.view'));

-- accounts_clerk: day-to-day finance
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'accounts_clerk'
  AND p.name IN ('fees.view','fees.collect','invoices.create','invoices.view',
                 'payments.record','payments.view','receipts.view','students.view');

-- registrar: student records and admissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'registrar'
  AND p.name IN ('students.view','students.create','students.edit','classes.view',
                 'classes.manage','attendance.view','messages.send','messages.view');

-- hod: academics management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'hod'
  AND (p.category = 'academics' OR p.name IN ('messages.send','messages.view'));

-- class_teacher
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'class_teacher'
  AND p.name IN ('students.view','classes.view','attendance.mark','attendance.view',
                 'exams.grade','timetable.view','messages.send','messages.view','discipline.log');

-- subject_teacher
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'subject_teacher'
  AND p.name IN ('students.view','classes.view','attendance.mark','exams.grade',
                 'timetable.view','messages.view');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'librarian'
  AND p.name IN ('library.manage','students.view','messages.view');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'transport_officer'
  AND p.name IN ('transport.manage','students.view','messages.send','messages.view');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'nurse'
  AND p.name IN ('health.view','students.view','messages.send','messages.view');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name = 'hostel_master'
  AND p.name IN ('hostel.manage','students.view','discipline.log','messages.send','messages.view');

-- parent / student / alumni: portal-scoped permissions defined in a later phase

-- ============ SEED: FIRST TENANT ============
INSERT INTO public.tenants (name, slug, country_code, curriculum, school_type, subscription_plan)
VALUES ('Karama Academy','karama-academy','KE','cbc','combined','trial');

NOTIFY pgrst, 'reload schema';