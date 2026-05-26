
-- Permissions
INSERT INTO public.permissions(key, description, category) VALUES
  ('hostel.view','View hostel/boarding records','hostel'),
  ('hostel.manage','Manage hostels, allocations, roll-calls and out-passes','hostel')
ON CONFLICT (key) DO NOTHING;

-- Grant to school_admin
INSERT INTO public.role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('school_admin','super_admin') AND p.key IN ('hostel.view','hostel.manage')
ON CONFLICT DO NOTHING;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.hostel_gender_enum AS ENUM ('boys','girls','mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bed_status_enum AS ENUM ('available','occupied','reserved','maintenance','out_of_service');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.allocation_status_enum AS ENUM ('active','ended','transferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.roll_call_type_enum AS ENUM ('morning','evening','lights_out','weekend','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.roll_call_status_enum AS ENUM ('present','absent','sick','out_pass','unaccounted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.out_pass_status_enum AS ENUM ('requested','guardian_approved','guardian_denied','approved','denied','checked_out','returned','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Hostels
CREATE TABLE IF NOT EXISTS public.hostels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  gender hostel_gender_enum NOT NULL DEFAULT 'mixed',
  capacity int NOT NULL DEFAULT 0,
  warden_staff_id uuid,
  matron_name text,
  matron_phone text,
  location text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hostel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  floor text,
  capacity int NOT NULL DEFAULT 1,
  room_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hostel_id, room_number)
);

CREATE TABLE IF NOT EXISTS public.hostel_beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.hostel_rooms(id) ON DELETE CASCADE,
  bed_label text NOT NULL,
  status bed_status_enum NOT NULL DEFAULT 'available',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, bed_label)
);

CREATE TABLE IF NOT EXISTS public.hostel_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  bed_id uuid NOT NULL REFERENCES public.hostel_beds(id) ON DELETE RESTRICT,
  hostel_id uuid NOT NULL,
  room_id uuid NOT NULL,
  term_id uuid,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status allocation_status_enum NOT NULL DEFAULT 'active',
  allocated_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alloc_student ON public.hostel_allocations(tenant_id, student_id, status);
CREATE INDEX IF NOT EXISTS idx_alloc_bed ON public.hostel_allocations(bed_id, status);

CREATE TABLE IF NOT EXISTS public.hostel_roll_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  session_type roll_call_type_enum NOT NULL DEFAULT 'morning',
  conducted_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hostel_roll_call_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  roll_call_id uuid NOT NULL REFERENCES public.hostel_roll_calls(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  status roll_call_status_enum NOT NULL DEFAULT 'present',
  notes text,
  marked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (roll_call_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.hostel_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  hostel_id uuid REFERENCES public.hostels(id) ON DELETE SET NULL,
  student_id uuid,
  visitor_name text NOT NULL,
  visitor_phone text,
  visitor_id_number text,
  relationship text,
  purpose text,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_out_at timestamptz,
  recorded_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hostel_out_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  hostel_id uuid,
  reason text NOT NULL,
  destination text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  requested_by uuid,
  leave_at timestamptz NOT NULL,
  expected_return_at timestamptz NOT NULL,
  guardian_id uuid,
  guardian_response_at timestamptz,
  guardian_response_note text,
  approved_by uuid,
  approved_at timestamptz,
  checked_out_at timestamptz,
  checked_out_by uuid,
  returned_at timestamptz,
  returned_by uuid,
  status out_pass_status_enum NOT NULL DEFAULT 'requested',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hostel_bedding_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.hostel_rooms(id) ON DELETE SET NULL,
  bed_id uuid REFERENCES public.hostel_beds(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  condition text,
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at triggers
DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['hostels','hostel_rooms','hostel_beds','hostel_allocations','hostel_roll_calls','hostel_out_passes','hostel_bedding_inventory']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- Bed status sync from allocations
CREATE OR REPLACE FUNCTION public._tg_hostel_alloc_bed_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.hostel_beds SET status = 'occupied', updated_at = now() WHERE id = NEW.bed_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status <> 'active' AND OLD.status = 'active' THEN
      UPDATE public.hostel_beds SET status = 'available', updated_at = now() WHERE id = OLD.bed_id;
    ELSIF NEW.status = 'active' AND OLD.status <> 'active' THEN
      UPDATE public.hostel_beds SET status = 'occupied', updated_at = now() WHERE id = NEW.bed_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE public.hostel_beds SET status = 'available', updated_at = now() WHERE id = OLD.bed_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_alloc_bed_status ON public.hostel_allocations;
CREATE TRIGGER trg_alloc_bed_status
AFTER INSERT OR UPDATE OR DELETE ON public.hostel_allocations
FOR EACH ROW EXECUTE FUNCTION public._tg_hostel_alloc_bed_status();

-- Enable RLS
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_roll_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_roll_call_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_out_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_bedding_inventory ENABLE ROW LEVEL SECURITY;

-- Standard tenant policies (view + manage)
DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['hostels','hostel_rooms','hostel_beds','hostel_allocations','hostel_roll_calls','hostel_roll_call_entries','hostel_visitors','hostel_bedding_inventory']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "view_%I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "view_%I" ON public.%I FOR SELECT USING (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id, ''hostel.view''))', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "manage_%I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "manage_%I" ON public.%I FOR ALL USING (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id, ''hostel.manage'')) WITH CHECK (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id, ''hostel.manage''))', t, t);
  END LOOP;
END $$;

-- Out-passes: staff view+manage, guardians can view & update their child's
DROP POLICY IF EXISTS view_out_passes ON public.hostel_out_passes;
CREATE POLICY view_out_passes ON public.hostel_out_passes FOR SELECT
USING (
  (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id,'hostel.view'))
  OR student_id IN (SELECT student_id FROM public.portal_my_student_ids())
);

DROP POLICY IF EXISTS manage_out_passes ON public.hostel_out_passes;
CREATE POLICY manage_out_passes ON public.hostel_out_passes FOR ALL
USING (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id,'hostel.manage'))
WITH CHECK (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id,'hostel.manage'));

-- Guardian portal update (approve/deny)
DROP POLICY IF EXISTS guardian_update_out_passes ON public.hostel_out_passes;
CREATE POLICY guardian_update_out_passes ON public.hostel_out_passes FOR UPDATE
USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids()))
WITH CHECK (student_id IN (SELECT student_id FROM public.portal_my_student_ids()));
