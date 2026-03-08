
-- Transport routes
CREATE TABLE public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  vehicle_number text,
  driver_name text,
  student_count integer DEFAULT 0,
  avg_trip_minutes integer,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage transport" ON public.transport_routes FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role));
CREATE POLICY "School members view transport" ON public.transport_routes FOR SELECT TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Library books
CREATE TABLE public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  isbn text,
  shelf_location text,
  status text NOT NULL DEFAULT 'available',
  issued_to text,
  due_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage library" ON public.library_books FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role));
CREATE POLICY "School members view library" ON public.library_books FOR SELECT TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Inventory assets
CREATE TABLE public.inventory_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  quantity integer DEFAULT 1,
  location text,
  condition text NOT NULL DEFAULT 'good',
  value numeric DEFAULT 0,
  last_audit_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.inventory_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage inventory" ON public.inventory_assets FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'::app_role));
CREATE POLICY "School members view inventory" ON public.inventory_assets FOR SELECT TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));
