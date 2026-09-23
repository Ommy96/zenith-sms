CREATE TABLE public.staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  email text NOT NULL,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  UNIQUE (staff_id)
);
GRANT ALL ON public.staff_invitations TO service_role;
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

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
  v_invitation uuid;
  v_token text;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  v_token := NEW.raw_user_meta_data->>'zenith_staff_invite_token';
  IF v_token IS NOT NULL AND v_token ~ '^[0-9a-f]{64}$' THEN
    SELECT i.id, i.staff_id, i.tenant_id, i.role_id
      INTO v_invitation, v_staff, v_tenant, v_role
    FROM public.staff_invitations i
    JOIN public.staff s ON s.id = i.staff_id AND s.tenant_id = i.tenant_id
    JOIN public.roles r ON r.id = i.role_id
    WHERE i.consumed_at IS NULL
      AND s.user_id IS NULL
      AND lower(i.email) = lower(NEW.email)
      AND lower(s.email) = lower(NEW.email)
      AND i.token_hash = encode(digest(v_token, 'sha256'), 'hex')
      AND r.name <> 'super_admin'
      AND (r.tenant_id = i.tenant_id OR (r.tenant_id IS NULL AND r.is_system = true))
    LIMIT 1
    FOR UPDATE OF i;
  END IF;

  IF v_invitation IS NOT NULL THEN
    UPDATE public.staff SET user_id = NEW.id, updated_at = now()
      WHERE id = v_staff AND user_id IS NULL;
    UPDATE public.staff_invitations SET consumed_at = now() WHERE id = v_invitation;
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
      VALUES (NEW.id, v_tenant, true) ON CONFLICT DO NOTHING;
      INSERT INTO public.user_roles (user_id, tenant_id, role_id)
      VALUES (NEW.id, v_tenant, v_role) ON CONFLICT DO NOTHING;
      UPDATE public.profiles SET default_tenant_id = v_tenant WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END
$function$;

ALTER TABLE public.staff DROP COLUMN pending_role_id;
ALTER TABLE public.staff DROP COLUMN invited_at;