
-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_super_admin(_user uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user AND r.name = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant uuid, _user uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _tenant IS NOT NULL AND (
    public.is_super_admin(_user)
    OR EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = _tenant AND user_id = _user AND is_active = true
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role_in_tenant(_tenant uuid, _role text, _user uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user
      AND r.name = _role
      AND (ur.tenant_id = _tenant OR ur.tenant_id IS NULL)
  );
$$;

CREATE OR REPLACE FUNCTION public.has_perm(_tenant uuid, _perm text, _user uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin(_user) OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user
      AND p.key = _perm
      AND (ur.tenant_id = _tenant OR ur.tenant_id IS NULL)
  );
$$;

-- ============================================================
-- FIX handle_new_user
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TENANT CREATION TRIGGER (assign school_admin)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_tenant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_role_id uuid;
BEGIN
  IF v_user IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.tenant_users (tenant_id, user_id, is_active)
  VALUES (NEW.id, v_user, true)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_role_id FROM public.roles
    WHERE name = 'school_admin' AND is_system = true LIMIT 1;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id, tenant_id)
    VALUES (v_user, v_role_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.profiles SET default_tenant_id = NEW.id
    WHERE id = v_user AND default_tenant_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_tenant_created ON public.tenants;
CREATE TRIGGER on_tenant_created
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant();

-- ============================================================
-- SEED PERMISSIONS
-- ============================================================

INSERT INTO public.permissions (key, category, description) VALUES
  ('students.view','students','View students'),
  ('students.create','students','Create students'),
  ('students.edit','students','Edit students'),
  ('students.delete','students','Delete students'),
  ('staff.view','staff','View staff'),
  ('staff.manage','staff','Create/edit/delete staff'),
  ('classes.view','academics','View classes'),
  ('classes.manage','academics','Manage classes'),
  ('attendance.view','attendance','View attendance'),
  ('attendance.record','attendance','Record attendance'),
  ('exams.view','exams','View exams & results'),
  ('exams.manage','exams','Manage exams'),
  ('exams.enter_grades','exams','Enter grades'),
  ('fees.view','finance','View fees & invoices'),
  ('fees.collect','finance','Collect payments'),
  ('fees.configure','finance','Configure fee structures'),
  ('invoices.manage','finance','Create/edit invoices'),
  ('mpesa.view','finance','View M-Pesa transactions'),
  ('mpesa.configure','finance','Configure M-Pesa'),
  ('whatsapp.view','communication','View WhatsApp messages'),
  ('whatsapp.send','communication','Send WhatsApp messages'),
  ('whatsapp.configure','communication','Configure WhatsApp'),
  ('announcements.view','communication','View announcements'),
  ('announcements.manage','communication','Create/edit announcements'),
  ('library.view','operations','View library'),
  ('library.manage','operations','Manage library'),
  ('inventory.view','operations','View inventory'),
  ('inventory.manage','operations','Manage inventory'),
  ('transport.view','operations','View transport'),
  ('transport.manage','operations','Manage transport'),
  ('applications.view','admissions','View applications'),
  ('applications.manage','admissions','Manage admissions'),
  ('settings.view','system','View settings'),
  ('settings.edit','system','Edit settings'),
  ('users.manage','system','Invite/manage users'),
  ('roles.manage','system','Manage roles & permissions'),
  ('audit.view','system','View audit logs'),
  ('billing.manage','system','Manage subscription/billing'),
  ('reports.view','insights','View reports')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED SYSTEM ROLES
-- ============================================================

INSERT INTO public.roles (name, description, is_system) VALUES
  ('super_admin','Platform super admin (all tenants)',true),
  ('school_admin','Full access within their school',true),
  ('principal','School principal',true),
  ('deputy_principal','Deputy principal',true),
  ('bursar','Finance lead',true),
  ('accounts_clerk','Accounts clerk',true),
  ('registrar','Admissions & records',true),
  ('hod','Head of department',true),
  ('class_teacher','Class teacher',true),
  ('subject_teacher','Subject teacher',true),
  ('librarian','Librarian',true),
  ('transport_officer','Transport officer',true),
  ('nurse','School nurse',true),
  ('hostel_master','Hostel master',true),
  ('parent','Parent / guardian',true),
  ('student','Student',true),
  ('alumni','Alumnus',true)
ON CONFLICT DO NOTHING;

-- Grant all permissions to school_admin & principal
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('school_admin','principal') AND r.is_system = true
ON CONFLICT DO NOTHING;

-- Bursar / accounts_clerk: finance
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('bursar','accounts_clerk') AND r.is_system = true
  AND p.key IN ('students.view','fees.view','fees.collect','fees.configure',
                'invoices.manage','mpesa.view','mpesa.configure','reports.view')
ON CONFLICT DO NOTHING;

-- Registrar: admissions + students
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'registrar' AND r.is_system = true
  AND p.key IN ('students.view','students.create','students.edit',
                'applications.view','applications.manage','reports.view')
ON CONFLICT DO NOTHING;

-- Teachers (class + subject + hod): academics
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('class_teacher','subject_teacher','hod') AND r.is_system = true
  AND p.key IN ('students.view','classes.view','attendance.view','attendance.record',
                'exams.view','exams.enter_grades','announcements.view')
ON CONFLICT DO NOTHING;

-- HOD also manages exams
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'hod' AND r.is_system = true AND p.key = 'exams.manage'
ON CONFLICT DO NOTHING;

-- Librarian
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'librarian' AND r.is_system = true
  AND p.key IN ('library.view','library.manage','students.view')
ON CONFLICT DO NOTHING;

-- Transport officer
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'transport_officer' AND r.is_system = true
  AND p.key IN ('transport.view','transport.manage','students.view')
ON CONFLICT DO NOTHING;

-- Parent / student / alumni: minimal view
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('parent','student','alumni') AND r.is_system = true
  AND p.key IN ('announcements.view')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_comment_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- tenants: members can view their tenants, admins update
DROP POLICY IF EXISTS "Members view their tenants" ON public.tenants;
CREATE POLICY "Members view their tenants" ON public.tenants FOR SELECT TO authenticated
  USING (public.is_tenant_member(id));
DROP POLICY IF EXISTS "Admins update their tenant" ON public.tenants;
CREATE POLICY "Admins update their tenant" ON public.tenants FOR UPDATE TO authenticated
  USING (public.has_perm(id, 'settings.edit'));

-- tenant_users
DROP POLICY IF EXISTS "View own tenant memberships" ON public.tenant_users;
CREATE POLICY "View own tenant memberships" ON public.tenant_users FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_perm(tenant_id, 'users.manage'));
DROP POLICY IF EXISTS "Admins manage tenant users" ON public.tenant_users;
CREATE POLICY "Admins manage tenant users" ON public.tenant_users FOR ALL TO authenticated
  USING (public.has_perm(tenant_id, 'users.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'users.manage'));
DROP POLICY IF EXISTS "User can insert self into tenant" ON public.tenant_users;
CREATE POLICY "User can insert self into tenant" ON public.tenant_users FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- tenant_settings
DROP POLICY IF EXISTS "Members view settings" ON public.tenant_settings;
CREATE POLICY "Members view settings" ON public.tenant_settings FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
DROP POLICY IF EXISTS "Admins edit settings" ON public.tenant_settings;
CREATE POLICY "Admins edit settings" ON public.tenant_settings FOR ALL TO authenticated
  USING (public.has_perm(tenant_id, 'settings.edit'))
  WITH CHECK (public.has_perm(tenant_id, 'settings.edit'));

-- user_roles
DROP POLICY IF EXISTS "View own roles" ON public.user_roles;
CREATE POLICY "View own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (tenant_id IS NOT NULL AND public.has_perm(tenant_id,'roles.manage')));
DROP POLICY IF EXISTS "Admins manage user_roles" ON public.user_roles;
CREATE POLICY "Admins manage user_roles" ON public.user_roles FOR ALL TO authenticated
  USING (tenant_id IS NOT NULL AND public.has_perm(tenant_id,'roles.manage'))
  WITH CHECK (tenant_id IS NOT NULL AND public.has_perm(tenant_id,'roles.manage'));

-- roles, permissions, role_permissions: read-only to all authed; system roles untouched by clients
DROP POLICY IF EXISTS "Anyone authed views roles" ON public.roles;
CREATE POLICY "Anyone authed views roles" ON public.roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Anyone authed views permissions" ON public.permissions;
CREATE POLICY "Anyone authed views permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Anyone authed views role_permissions" ON public.role_permissions;
CREATE POLICY "Anyone authed views role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- audit_logs
DROP POLICY IF EXISTS "View audit logs" ON public.audit_logs;
CREATE POLICY "View audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_perm(tenant_id, 'audit.view'));
DROP POLICY IF EXISTS "Insert audit logs" ON public.audit_logs;
CREATE POLICY "Insert audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

-- activity_logs (legacy): allow members to view tenant's logs
DROP POLICY IF EXISTS "Members view activity logs" ON public.activity_logs;
CREATE POLICY "Members view activity logs" ON public.activity_logs FOR SELECT TO authenticated
  USING (tenant_id IS NULL AND user_id = auth.uid() OR public.is_tenant_member(tenant_id));

-- ai_comment_usage
DROP POLICY IF EXISTS "Users view own usage" ON public.ai_comment_usage;
CREATE POLICY "Users view own usage" ON public.ai_comment_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own usage" ON public.ai_comment_usage;
CREATE POLICY "Users insert own usage" ON public.ai_comment_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- DOMAIN TABLE POLICIES (read = membership, write = perm)
-- ============================================================

DO $$
DECLARE
  rec record;
  view_perm text;
  write_perm text;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('students','students.view','students.edit'),
      ('staff','staff.view','staff.manage'),
      ('classes','classes.view','classes.manage'),
      ('attendance','attendance.view','attendance.record'),
      ('exams','exams.view','exams.manage'),
      ('exam_results','exams.view','exams.enter_grades'),
      ('invoices','fees.view','invoices.manage'),
      ('announcements','announcements.view','announcements.manage'),
      ('applications','applications.view','applications.manage'),
      ('library_books','library.view','library.manage'),
      ('inventory_assets','inventory.view','inventory.manage'),
      ('transport_routes','transport.view','transport.manage'),
      ('mpesa_config','mpesa.view','mpesa.configure'),
      ('mpesa_transactions','mpesa.view','mpesa.configure'),
      ('mpesa_stk_requests','mpesa.view','mpesa.configure'),
      ('whatsapp_config','whatsapp.view','whatsapp.configure'),
      ('whatsapp_templates','whatsapp.view','whatsapp.send'),
      ('whatsapp_broadcasts','whatsapp.view','whatsapp.send'),
      ('whatsapp_messages','whatsapp.view','whatsapp.send'),
      ('import_mappings','students.view','students.create')
    ) AS t(tbl, vperm, wperm)
  LOOP
    -- staff.view is implied by students.view for many roles; use the read perm.
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.tbl);

    EXECUTE format('DROP POLICY IF EXISTS "tenant_select_%1$s" ON public.%1$I', rec.tbl);
    EXECUTE format($f$CREATE POLICY "tenant_select_%1$s" ON public.%1$I FOR SELECT TO authenticated
                     USING (public.is_tenant_member(tenant_id))$f$, rec.tbl);

    EXECUTE format('DROP POLICY IF EXISTS "tenant_insert_%1$s" ON public.%1$I', rec.tbl);
    EXECUTE format($f$CREATE POLICY "tenant_insert_%1$s" ON public.%1$I FOR INSERT TO authenticated
                     WITH CHECK (public.is_tenant_member(tenant_id))$f$, rec.tbl);

    EXECUTE format('DROP POLICY IF EXISTS "tenant_update_%1$s" ON public.%1$I', rec.tbl);
    EXECUTE format($f$CREATE POLICY "tenant_update_%1$s" ON public.%1$I FOR UPDATE TO authenticated
                     USING (public.has_perm(tenant_id, %2$L))
                     WITH CHECK (public.has_perm(tenant_id, %2$L))$f$, rec.tbl, rec.wperm);

    EXECUTE format('DROP POLICY IF EXISTS "tenant_delete_%1$s" ON public.%1$I', rec.tbl);
    EXECUTE format($f$CREATE POLICY "tenant_delete_%1$s" ON public.%1$I FOR DELETE TO authenticated
                     USING (public.has_perm(tenant_id, %2$L))$f$, rec.tbl, rec.wperm);
  END LOOP;
END $$;
