
-- ============ HOSTEL ============
CREATE TABLE public.hostels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  hostel_type text,
  warden_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  capacity int,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE public.hostel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  floor text,
  capacity int NOT NULL DEFAULT 2,
  room_type text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hostel_id, room_number)
);

CREATE TABLE public.hostel_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.hostel_rooms(id) ON DELETE SET NULL,
  bed_number text,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  allocated_from date NOT NULL DEFAULT current_date,
  allocated_to date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  allocated_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hostel_alloc_student ON public.hostel_allocations (tenant_id, student_id, status);
CREATE INDEX idx_hostel_alloc_room ON public.hostel_allocations (tenant_id, room_id, status);

CREATE TABLE public.hostel_out_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  hostel_id uuid REFERENCES public.hostels(id) ON DELETE SET NULL,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE SET NULL,
  departure_date date NOT NULL,
  return_date date NOT NULL,
  departure_time time,
  return_time time,
  actual_departure_at timestamptz,
  actual_return_at timestamptz,
  reason text NOT NULL,
  destination text,
  status text NOT NULL DEFAULT 'requested',
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_out_passes_student ON public.hostel_out_passes (tenant_id, student_id, status);

CREATE TABLE public.hostel_roll_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  roll_call_at timestamptz NOT NULL,
  roll_call_type text,
  taken_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hostel_roll_call_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  roll_call_id uuid NOT NULL REFERENCES public.hostel_roll_calls(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (roll_call_id, student_id)
);

CREATE TABLE public.hostel_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  visitor_name text NOT NULL,
  visitor_id_type text,
  visitor_id_number text,
  visitor_phone text,
  relationship_to_student text,
  purpose text,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  checked_in_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ TRANSPORT ============
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  registration_number text NOT NULL,
  vehicle_type text,
  make text, model text, year int,
  capacity int NOT NULL,
  color text,
  insurance_expiry date,
  inspection_expiry date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, registration_number)
);

CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  licence_number text,
  licence_expiry date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  fee_per_term numeric(14,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE public.route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index int NOT NULL,
  morning_pickup_time time,
  evening_dropoff_time time,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.student_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  pickup_stop_id uuid REFERENCES public.route_stops(id) ON DELETE SET NULL,
  dropoff_stop_id uuid REFERENCES public.route_stops(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  assigned_from date NOT NULL DEFAULT current_date,
  assigned_to date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_student_transport_term ON public.student_transport (student_id, term_id) WHERE term_id IS NOT NULL;

CREATE TABLE public.vehicle_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  assigned_from date NOT NULL DEFAULT current_date,
  assigned_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vehicle_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  speed_kmh numeric(5,2),
  heading numeric(5,2),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicle_locations ON public.vehicle_locations (vehicle_id, recorded_at DESC);

-- ============ LIBRARY ============
CREATE TABLE public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  accession_number text NOT NULL,
  isbn text, title text NOT NULL, author text, publisher text, edition text,
  category text, subject_area text, location text,
  copies_total int NOT NULL DEFAULT 1,
  copies_available int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, accession_number)
);

CREATE TABLE public.library_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  borrower_type text NOT NULL,
  borrower_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  borrower_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  loaned_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL,
  returned_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  fine_amount numeric(10,2) NOT NULL DEFAULT 0,
  fine_paid boolean NOT NULL DEFAULT false,
  loaned_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  received_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_loans_student ON public.library_loans (tenant_id, borrower_student_id, status);
CREATE INDEX idx_loans_due ON public.library_loans (tenant_id, status, due_at);

-- ============ HEALTH ============
CREATE TABLE public.health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  blood_group text,
  allergies text[] NOT NULL DEFAULT '{}',
  chronic_conditions text[] NOT NULL DEFAULT '{}',
  regular_medications text[] NOT NULL DEFAULT '{}',
  special_needs text, dietary_restrictions text,
  insurance_provider text, insurance_number text, insurance_expiry date,
  preferred_hospital text, emergency_doctor_name text, emergency_doctor_phone text,
  notes text,
  updated_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.health_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  visit_date timestamptz NOT NULL DEFAULT now(),
  complaint text NOT NULL,
  diagnosis text, treatment text, medication_dispensed text,
  referred_to_hospital boolean NOT NULL DEFAULT false,
  hospital_referred text,
  guardian_notified boolean NOT NULL DEFAULT false,
  guardian_notified_at timestamptz,
  attended_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_health_visits ON public.health_visits (tenant_id, student_id, visit_date DESC);

CREATE TABLE public.immunization_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  dose_number int,
  administered_date date NOT NULL,
  next_due_date date,
  administered_by text,
  batch_number text,
  certificate_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.medication_administration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  prescribed_by text,
  guardian_consent boolean NOT NULL DEFAULT false,
  consent_document_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.accident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  incident_date timestamptz NOT NULL,
  location text,
  description text NOT NULL,
  injury_description text,
  first_aid_given text,
  referred_to_hospital boolean NOT NULL DEFAULT false,
  hospital text,
  guardian_notified boolean NOT NULL DEFAULT false,
  guardian_notified_at timestamptz,
  reported_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  witnesses text,
  photos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'reported',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ DISCIPLINE ============
CREATE TABLE public.discipline_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  incident_date timestamptz NOT NULL,
  location text,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'minor',
  description text NOT NULL,
  witnesses text,
  reported_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  investigated_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'reported',
  guardian_notified boolean NOT NULL DEFAULT false,
  guardian_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incidents_student ON public.discipline_incidents (tenant_id, student_id, incident_date DESC);

CREATE TABLE public.disciplinary_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES public.discipline_incidents(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_date date NOT NULL DEFAULT current_date,
  duration_days int,
  description text,
  imposed_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.merit_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  points int NOT NULL,
  reason text NOT NULL,
  category text,
  awarded_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  awarded_date date NOT NULL DEFAULT current_date,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_merit_student ON public.merit_points (tenant_id, student_id, awarded_date DESC);

-- ============ INVENTORY ============
CREATE TABLE public.inventory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  category_id uuid REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  unit text NOT NULL DEFAULT 'piece',
  reorder_level numeric(10,2) NOT NULL DEFAULT 0,
  current_stock numeric(10,2) NOT NULL DEFAULT 0,
  unit_cost numeric(14,2),
  location text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit_cost numeric(14,2),
  reference text,
  purpose text,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  performed_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inv_txn ON public.inventory_transactions (tenant_id, item_id, transaction_date DESC);

CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  supplier_name text NOT NULL,
  supplier_contact text,
  status text NOT NULL DEFAULT 'draft',
  order_date date NOT NULL DEFAULT current_date,
  expected_delivery date,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  requested_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, po_number)
);

CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit_cost numeric(14,2) NOT NULL,
  line_total numeric(14,2) NOT NULL,
  received_quantity numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ SYSTEM GLUE ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  category text,
  severity text NOT NULL DEFAULT 'info',
  action_url text,
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications (user_id, is_read, created_at DESC);

CREATE TABLE public.setup_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  has_academic_year boolean NOT NULL DEFAULT false,
  has_current_term boolean NOT NULL DEFAULT false,
  has_grade_levels boolean NOT NULL DEFAULT false,
  has_classes boolean NOT NULL DEFAULT false,
  has_subjects boolean NOT NULL DEFAULT false,
  has_students boolean NOT NULL DEFAULT false,
  has_staff boolean NOT NULL DEFAULT false,
  has_fee_structure boolean NOT NULL DEFAULT false,
  has_mpesa_config boolean NOT NULL DEFAULT false,
  has_messaging_config boolean NOT NULL DEFAULT false,
  has_logo boolean NOT NULL DEFAULT false,
  has_at_least_one_invoice boolean NOT NULL DEFAULT false,
  has_at_least_one_payment boolean NOT NULL DEFAULT false,
  completion_percentage int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid,
  function_name text NOT NULL,
  model text,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10,6),
  purpose text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_usage_tenant ON public.ai_usage_logs (tenant_id, created_at DESC);
CREATE INDEX idx_ai_usage_fn ON public.ai_usage_logs (tenant_id, function_name, created_at DESC);

-- ============ ADDITIVE: existing documents + student_activity ============
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents (tenant_id, owner_type, owner_id);

ALTER TABLE public.student_activity
  ADD COLUMN IF NOT EXISTS related_entity_type text,
  ADD COLUMN IF NOT EXISTS related_entity_id uuid;
CREATE INDEX IF NOT EXISTS idx_student_activity_feed ON public.student_activity (tenant_id, student_id, occurred_at DESC);

-- ============ GRANTS ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'hostels','hostel_rooms','hostel_allocations','hostel_out_passes','hostel_roll_calls',
    'hostel_roll_call_entries','hostel_visitors','vehicles','drivers','routes','route_stops',
    'student_transport','vehicle_assignments','vehicle_locations','library_books','library_loans',
    'health_records','health_visits','immunization_records','medication_administration',
    'accident_reports','discipline_incidents','disciplinary_actions','merit_points',
    'inventory_categories','inventory_items','inventory_transactions','purchase_orders',
    'purchase_order_items','notifications','setup_progress','ai_usage_logs']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
