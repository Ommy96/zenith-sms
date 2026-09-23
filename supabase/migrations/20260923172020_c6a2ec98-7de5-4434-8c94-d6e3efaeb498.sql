ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS pending_role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz;

INSERT INTO public.permissions (name, description)
VALUES ('staff.manage', 'Create and manage staff records and staff invitations')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT DISTINCT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE p.name = 'staff.manage'
  AND (
    r.name = 'school_admin'
    OR EXISTS (
      SELECT 1
      FROM public.role_permissions rp
      JOIN public.permissions existing_permission ON existing_permission.id = rp.permission_id
      WHERE rp.role_id = r.id AND existing_permission.name = 'staff.edit'
    )
  )
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant uuid;
  v_role uuid;
  v_staff uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT s.id, s.tenant_id, s.pending_role_id
    INTO v_staff, v_tenant, v_role
  FROM public.staff s
  LEFT JOIN public.roles r ON r.id = s.pending_role_id
  WHERE s.user_id IS NULL
    AND s.invited_at IS NOT NULL
    AND s.pending_role_id IS NOT NULL
    AND lower(s.email) = lower(NEW.email)
    AND (r.tenant_id = s.tenant_id OR (r.tenant_id IS NULL AND r.is_system = true))
  ORDER BY s.invited_at DESC
  LIMIT 1
  FOR UPDATE OF s;

  IF v_staff IS NOT NULL THEN
    UPDATE public.staff
       SET user_id = NEW.id,
           pending_role_id = NULL,
           updated_at = now()
     WHERE id = v_staff AND user_id IS NULL;

    INSERT INTO public.user_tenants (user_id, tenant_id, is_active)
    VALUES (NEW.id, v_tenant, true)
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET is_active = true;

    INSERT INTO public.user_roles (user_id, tenant_id, role_id)
    VALUES (NEW.id, v_tenant, v_role)
    ON CONFLICT (user_id, tenant_id, role_id) DO NOTHING;

    UPDATE public.profiles SET default_tenant_id = v_tenant WHERE id = NEW.id;
  ELSIF NOT EXISTS (SELECT 1 FROM public.user_tenants) THEN
    SELECT id INTO v_tenant FROM public.tenants ORDER BY created_at LIMIT 1;
    SELECT id INTO v_role FROM public.roles WHERE is_system AND name = 'school_admin' LIMIT 1;
    IF v_tenant IS NOT NULL AND v_role IS NOT NULL THEN
      INSERT INTO public.user_tenants (user_id, tenant_id, is_active)
      VALUES (NEW.id, v_tenant, true)
      ON CONFLICT DO NOTHING;
      INSERT INTO public.user_roles (user_id, tenant_id, role_id)
      VALUES (NEW.id, v_tenant, v_role)
      ON CONFLICT DO NOTHING;
      UPDATE public.profiles SET default_tenant_id = v_tenant WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END
$function$;