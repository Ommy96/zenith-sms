
CREATE TABLE public.vehicle_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.transport_trips(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  lat numeric(9,6) NOT NULL,
  lng numeric(9,6) NOT NULL,
  speed_kph numeric(6,2),
  heading numeric(5,2),
  accuracy_m numeric(8,2),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vehicle_locations_tenant_recorded_idx ON public.vehicle_locations (tenant_id, recorded_at DESC);
CREATE INDEX vehicle_locations_vehicle_idx ON public.vehicle_locations (vehicle_id, recorded_at DESC);
CREATE INDEX vehicle_locations_trip_idx ON public.vehicle_locations (trip_id, recorded_at DESC);

GRANT SELECT, INSERT ON public.vehicle_locations TO authenticated;
GRANT ALL ON public.vehicle_locations TO service_role;

ALTER TABLE public.vehicle_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can read vehicle locations"
  ON public.vehicle_locations FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Tenant members can insert vehicle locations"
  ON public.vehicle_locations FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_locations;
ALTER TABLE public.vehicle_locations REPLICA IDENTITY FULL;
