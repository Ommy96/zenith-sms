
-- Permissions (transport.manage already exists)
INSERT INTO public.permissions(key, description, category) VALUES
  ('transport.view','View transport routes, vehicles, trips','transport'),
  ('transport.drive','Log trips and student boarding','transport')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name='school_admin' AND p.key IN ('transport.view','transport.drive')
ON CONFLICT DO NOTHING;

-- Enums
DO $$ BEGIN CREATE TYPE public.vehicle_status_enum AS ENUM ('active','maintenance','retired','reserved'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.trip_direction_enum AS ENUM ('am_pickup','pm_dropoff','excursion','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.trip_status_enum AS ENUM ('scheduled','in_progress','completed','cancelled','incident'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.boarding_status_enum AS ENUM ('boarded','missed','dropped','absent','no_show'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.transport_incident_type_enum AS ENUM ('breakdown','accident','complaint','traffic','medical','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend existing transport_routes
ALTER TABLE public.transport_routes
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS am_start_time time,
  ADD COLUMN IF NOT EXISTS pm_start_time time,
  ADD COLUMN IF NOT EXISTS capacity int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fare_per_term numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  CREATE UNIQUE INDEX transport_routes_tenant_code_uniq ON public.transport_routes(tenant_id, code) WHERE code IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER _t_transport_routes_u BEFORE UPDATE ON public.transport_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Stops
CREATE TABLE IF NOT EXISTS public.transport_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  am_pickup_time time,
  pm_dropoff_time time,
  latitude numeric(10,6),
  longitude numeric(10,6),
  landmark text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  registration_number text NOT NULL,
  nickname text,
  make text, model text, year int,
  capacity int NOT NULL DEFAULT 0,
  fuel_type text,
  status vehicle_status_enum NOT NULL DEFAULT 'active',
  insurance_expiry date,
  inspection_expiry date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, registration_number)
);

CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  license_number text,
  license_class text,
  license_expiry date,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.route_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  conductor_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_transport_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  pickup_stop_id uuid REFERENCES public.transport_stops(id) ON DELETE SET NULL,
  dropoff_stop_id uuid REFERENCES public.transport_stops(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  fare numeric(12,2) DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  trip_date date NOT NULL DEFAULT CURRENT_DATE,
  direction trip_direction_enum NOT NULL DEFAULT 'am_pickup',
  status trip_status_enum NOT NULL DEFAULT 'scheduled',
  started_at timestamptz,
  completed_at timestamptz,
  odometer_start int,
  odometer_end int,
  fuel_liters numeric(10,2),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trip_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES public.transport_trips(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  stop_id uuid REFERENCES public.transport_stops(id) ON DELETE SET NULL,
  status boarding_status_enum NOT NULL DEFAULT 'boarded',
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  UNIQUE(trip_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.transport_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.transport_trips(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  incident_type transport_incident_type_enum NOT NULL DEFAULT 'other',
  severity int NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  location text,
  description text NOT NULL,
  action_taken text,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transport_stops_route ON public.transport_stops(route_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON public.vehicles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_drivers_tenant ON public.drivers(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_route_assignments_route ON public.route_assignments(tenant_id, route_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_sub_student ON public.student_transport_subscriptions(student_id, is_active);
CREATE INDEX IF NOT EXISTS idx_student_transport_sub_route ON public.student_transport_subscriptions(route_id, is_active);
CREATE INDEX IF NOT EXISTS idx_transport_trips_tenant_date ON public.transport_trips(tenant_id, trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_trip_attendance_trip ON public.trip_attendance(trip_id);
CREATE INDEX IF NOT EXISTS idx_transport_incidents_tenant ON public.transport_incidents(tenant_id, occurred_at DESC);

-- Updated-at triggers
DO $$ BEGIN CREATE TRIGGER _t_transport_stops_u BEFORE UPDATE ON public.transport_stops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER _t_vehicles_u BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER _t_drivers_u BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER _t_route_assignments_u BEFORE UPDATE ON public.route_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER _t_student_transport_sub_u BEFORE UPDATE ON public.student_transport_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER _t_transport_trips_u BEFORE UPDATE ON public.transport_trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER _t_transport_incidents_u BEFORE UPDATE ON public.transport_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS
ALTER TABLE public.transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transport_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_incidents ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['transport_stops','vehicles','drivers','route_assignments','student_transport_subscriptions','transport_incidents']) LOOP
    EXECUTE format('CREATE POLICY "view %1$s" ON public.%1$s FOR SELECT USING (public.is_tenant_member(tenant_id) AND (public.has_perm(tenant_id, ''transport.view'') OR public.has_perm(tenant_id, ''transport.manage'')))', t);
    EXECUTE format('CREATE POLICY "manage %1$s" ON public.%1$s FOR ALL USING (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id, ''transport.manage'')) WITH CHECK (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id, ''transport.manage''))', t);
  END LOOP;
END $$;

CREATE POLICY "view transport_trips" ON public.transport_trips FOR SELECT
  USING (public.is_tenant_member(tenant_id) AND (public.has_perm(tenant_id,'transport.view') OR public.has_perm(tenant_id,'transport.manage') OR public.has_perm(tenant_id,'transport.drive')));
CREATE POLICY "write transport_trips" ON public.transport_trips FOR ALL
  USING (public.is_tenant_member(tenant_id) AND (public.has_perm(tenant_id,'transport.manage') OR public.has_perm(tenant_id,'transport.drive')))
  WITH CHECK (public.is_tenant_member(tenant_id) AND (public.has_perm(tenant_id,'transport.manage') OR public.has_perm(tenant_id,'transport.drive')));

CREATE POLICY "view trip_attendance" ON public.trip_attendance FOR SELECT
  USING (public.is_tenant_member(tenant_id) AND (public.has_perm(tenant_id,'transport.view') OR public.has_perm(tenant_id,'transport.manage') OR public.has_perm(tenant_id,'transport.drive')));
CREATE POLICY "write trip_attendance" ON public.trip_attendance FOR ALL
  USING (public.is_tenant_member(tenant_id) AND (public.has_perm(tenant_id,'transport.manage') OR public.has_perm(tenant_id,'transport.drive')))
  WITH CHECK (public.is_tenant_member(tenant_id) AND (public.has_perm(tenant_id,'transport.manage') OR public.has_perm(tenant_id,'transport.drive')));
