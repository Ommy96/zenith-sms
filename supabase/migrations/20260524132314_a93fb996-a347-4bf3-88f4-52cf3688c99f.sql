
-- ============== ENUMS ==============
DO $$ BEGIN
  CREATE TYPE library_item_status_enum AS ENUM ('available','checked_out','reserved','lost','damaged','retired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE library_loan_status_enum AS ENUM ('active','returned','overdue','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE stock_movement_type_enum AS ENUM ('in','out','adjustment','transfer','write_off');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE requisition_status_enum AS ENUM ('draft','submitted','approved','rejected','ordered','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE po_status_enum AS ENUM ('draft','approved','sent','partially_received','received','closed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE asset_status_enum AS ENUM ('active','in_repair','disposed','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============== LIBRARY ==============
CREATE TABLE IF NOT EXISTS public.library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text,
  isbn text,
  barcode text,
  category text,
  publisher text,
  edition text,
  publish_year int,
  language text,
  location text,
  total_copies int NOT NULL DEFAULT 1,
  available_copies int NOT NULL DEFAULT 1,
  status library_item_status_enum NOT NULL DEFAULT 'available',
  cover_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, barcode)
);
CREATE INDEX IF NOT EXISTS idx_library_items_tenant ON public.library_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_library_items_barcode ON public.library_items(tenant_id, barcode);
CREATE INDEX IF NOT EXISTS idx_library_items_title ON public.library_items(tenant_id, title);

CREATE TABLE IF NOT EXISTS public.library_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  borrower_type text NOT NULL CHECK (borrower_type IN ('student','staff')),
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  checked_out_at timestamptz NOT NULL DEFAULT now(),
  due_date date NOT NULL,
  returned_at timestamptz,
  fine_amount numeric(10,2) NOT NULL DEFAULT 0,
  fine_paid boolean NOT NULL DEFAULT false,
  status library_loan_status_enum NOT NULL DEFAULT 'active',
  issued_by uuid REFERENCES auth.users(id),
  returned_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_library_loans_tenant ON public.library_loans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_library_loans_item ON public.library_loans(item_id);
CREATE INDEX IF NOT EXISTS idx_library_loans_student ON public.library_loans(student_id);
CREATE INDEX IF NOT EXISTS idx_library_loans_status ON public.library_loans(tenant_id, status);

-- ============== INVENTORY / PROCUREMENT ==============
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  manager_staff_id uuid REFERENCES public.staff(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stores_tenant ON public.stores(tenant_id);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  tax_pin text,
  payment_terms text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON public.suppliers(tenant_id);

CREATE TABLE IF NOT EXISTS public.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  sku text,
  name text NOT NULL,
  category text,
  unit text NOT NULL DEFAULT 'unit',
  quantity_on_hand numeric(12,2) NOT NULL DEFAULT 0,
  reorder_level numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  preferred_supplier_id uuid REFERENCES public.suppliers(id),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, sku)
);
CREATE INDEX IF NOT EXISTS idx_stock_items_tenant ON public.stock_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_store ON public.stock_items(store_id);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stock_item_id uuid NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  movement_type stock_movement_type_enum NOT NULL,
  quantity numeric(12,2) NOT NULL,
  unit_cost numeric(12,2),
  reference text,
  reason text,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant ON public.stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON public.stock_movements(stock_item_id);

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  asset_tag text NOT NULL,
  name text NOT NULL,
  category text,
  serial_number text,
  location text,
  assigned_to_staff_id uuid REFERENCES public.staff(id),
  purchase_date date,
  purchase_cost numeric(12,2),
  supplier_id uuid REFERENCES public.suppliers(id),
  warranty_expiry date,
  status asset_status_enum NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, asset_tag)
);
CREATE INDEX IF NOT EXISTS idx_assets_tenant ON public.assets(tenant_id);

CREATE TABLE IF NOT EXISTS public.requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requisition_number text,
  requested_by uuid REFERENCES auth.users(id),
  department text,
  justification text,
  status requisition_status_enum NOT NULL DEFAULT 'draft',
  total_estimated numeric(12,2) NOT NULL DEFAULT 0,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  needed_by date,
  is_auto_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_requisitions_tenant ON public.requisitions(tenant_id);

CREATE TABLE IF NOT EXISTS public.requisition_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requisition_id uuid NOT NULL REFERENCES public.requisitions(id) ON DELETE CASCADE,
  stock_item_id uuid REFERENCES public.stock_items(id),
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL,
  unit text NOT NULL DEFAULT 'unit',
  estimated_unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  estimated_total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_requisition_lines_req ON public.requisition_lines(requisition_id);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  po_number text,
  supplier_id uuid REFERENCES public.suppliers(id),
  requisition_id uuid REFERENCES public.requisitions(id),
  status po_status_enum NOT NULL DEFAULT 'draft',
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_date date,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_total numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_po_tenant ON public.purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);

CREATE TABLE IF NOT EXISTS public.po_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  stock_item_id uuid REFERENCES public.stock_items(id),
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL,
  unit text NOT NULL DEFAULT 'unit',
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  line_total numeric(12,2) NOT NULL DEFAULT 0,
  received_qty numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_po_lines_po ON public.po_lines(po_id);

CREATE TABLE IF NOT EXISTS public.goods_received_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  grn_number text,
  po_id uuid REFERENCES public.purchase_orders(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  received_by uuid REFERENCES auth.users(id),
  delivery_note text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grn_tenant ON public.goods_received_notes(tenant_id);

CREATE TABLE IF NOT EXISTS public.grn_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  grn_id uuid NOT NULL REFERENCES public.goods_received_notes(id) ON DELETE CASCADE,
  po_line_id uuid REFERENCES public.po_lines(id),
  stock_item_id uuid REFERENCES public.stock_items(id),
  description text NOT NULL,
  quantity_received numeric(12,2) NOT NULL,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grn_lines_grn ON public.grn_lines(grn_id);

-- ============== TRIGGERS ==============
-- updated_at on all new tables
CREATE TRIGGER tg_library_items_uat BEFORE UPDATE ON public.library_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_library_loans_uat BEFORE UPDATE ON public.library_loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_stores_uat BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_suppliers_uat BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_stock_items_uat BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_assets_uat BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_requisitions_uat BEFORE UPDATE ON public.requisitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_po_uat BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_grn_uat BEFORE UPDATE ON public.goods_received_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update library item available_copies when loan status changes
CREATE OR REPLACE FUNCTION public._tg_library_loan_update_copies()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.library_items SET available_copies = GREATEST(available_copies - 1, 0),
      status = CASE WHEN available_copies - 1 <= 0 THEN 'checked_out' ELSE status END,
      updated_at = now()
    WHERE id = NEW.item_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status IN ('returned','lost') THEN
    UPDATE public.library_items SET available_copies = LEAST(available_copies + 1, total_copies),
      status = CASE WHEN available_copies + 1 > 0 THEN 'available' ELSE status END,
      updated_at = now()
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tg_library_loan_copies AFTER INSERT OR UPDATE ON public.library_loans
  FOR EACH ROW EXECUTE FUNCTION public._tg_library_loan_update_copies();

-- Update stock_items.quantity_on_hand from stock_movements
CREATE OR REPLACE FUNCTION public._tg_stock_movement_apply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_delta numeric;
BEGIN
  v_delta := CASE NEW.movement_type
    WHEN 'in' THEN NEW.quantity
    WHEN 'out' THEN -NEW.quantity
    WHEN 'write_off' THEN -NEW.quantity
    WHEN 'adjustment' THEN NEW.quantity
    WHEN 'transfer' THEN 0
    ELSE 0 END;
  UPDATE public.stock_items
    SET quantity_on_hand = quantity_on_hand + v_delta, updated_at = now()
    WHERE id = NEW.stock_item_id;
  RETURN NEW;
END $$;
CREATE TRIGGER tg_stock_movement_apply AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public._tg_stock_movement_apply();

-- Auto-create draft requisition when stock falls below reorder_level
CREATE OR REPLACE FUNCTION public._tg_stock_reorder_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_req uuid; v_exists int;
BEGIN
  IF NEW.reorder_level <= 0 THEN RETURN NEW; END IF;
  IF NEW.quantity_on_hand >= NEW.reorder_level THEN RETURN NEW; END IF;
  IF OLD.quantity_on_hand < NEW.reorder_level THEN RETURN NEW; END IF; -- already below before

  -- Check if pending auto requisition exists for this item
  SELECT COUNT(*) INTO v_exists
  FROM public.requisitions r
  JOIN public.requisition_lines rl ON rl.requisition_id = r.id
  WHERE r.tenant_id = NEW.tenant_id AND r.status IN ('draft','submitted','approved')
    AND r.is_auto_generated = true AND rl.stock_item_id = NEW.id;
  IF v_exists > 0 THEN RETURN NEW; END IF;

  INSERT INTO public.requisitions(tenant_id, status, is_auto_generated, justification, total_estimated)
  VALUES (NEW.tenant_id, 'draft', true,
          format('Auto-generated: %s below reorder level (%s on hand, reorder at %s)', NEW.name, NEW.quantity_on_hand, NEW.reorder_level),
          NEW.unit_cost * GREATEST(NEW.reorder_level * 2 - NEW.quantity_on_hand, 1))
  RETURNING id INTO v_req;

  INSERT INTO public.requisition_lines(tenant_id, requisition_id, stock_item_id, description, quantity, unit, estimated_unit_cost, estimated_total)
  VALUES (NEW.tenant_id, v_req, NEW.id, NEW.name,
          GREATEST(NEW.reorder_level * 2 - NEW.quantity_on_hand, 1),
          NEW.unit, NEW.unit_cost,
          NEW.unit_cost * GREATEST(NEW.reorder_level * 2 - NEW.quantity_on_hand, 1));
  RETURN NEW;
END $$;
CREATE TRIGGER tg_stock_reorder_check AFTER UPDATE OF quantity_on_hand ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public._tg_stock_reorder_check();

-- Auto-number requisitions, POs, GRNs
CREATE OR REPLACE FUNCTION public.generate_doc_number(_tenant uuid, _prefix text, _key text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_year text := to_char(now(),'YYYY'); v_seq_key text; v_seq int; v_code text;
BEGIN
  v_seq_key := _key || '_seq:' || v_year;
  SELECT COALESCE(code,_prefix) INTO v_code FROM public.tenants WHERE id = _tenant;
  INSERT INTO public.tenant_settings(tenant_id,key,value) VALUES(_tenant,v_seq_key,jsonb_build_object('n',1))
  ON CONFLICT DO NOTHING;
  UPDATE public.tenant_settings SET value = jsonb_build_object('n', COALESCE((value->>'n')::int,0)+1), updated_at=now()
  WHERE tenant_id=_tenant AND key=v_seq_key RETURNING (value->>'n')::int INTO v_seq;
  RETURN format('%s-%s/%s/%s', v_code, _prefix, v_year, lpad(v_seq::text,5,'0'));
END $$;

CREATE OR REPLACE FUNCTION public._tg_requisition_number() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN IF NEW.requisition_number IS NULL OR NEW.requisition_number='' THEN
  NEW.requisition_number := public.generate_doc_number(NEW.tenant_id,'REQ','requisition'); END IF;
RETURN NEW; END $$;
CREATE TRIGGER tg_requisition_number BEFORE INSERT ON public.requisitions
  FOR EACH ROW EXECUTE FUNCTION public._tg_requisition_number();

CREATE OR REPLACE FUNCTION public._tg_po_number() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN IF NEW.po_number IS NULL OR NEW.po_number='' THEN
  NEW.po_number := public.generate_doc_number(NEW.tenant_id,'PO','po'); END IF;
RETURN NEW; END $$;
CREATE TRIGGER tg_po_number BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public._tg_po_number();

CREATE OR REPLACE FUNCTION public._tg_grn_number() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN IF NEW.grn_number IS NULL OR NEW.grn_number='' THEN
  NEW.grn_number := public.generate_doc_number(NEW.tenant_id,'GRN','grn'); END IF;
RETURN NEW; END $$;
CREATE TRIGGER tg_grn_number BEFORE INSERT ON public.goods_received_notes
  FOR EACH ROW EXECUTE FUNCTION public._tg_grn_number();

-- ============== RLS ==============
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_received_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn_lines ENABLE ROW LEVEL SECURITY;

-- Generic policies: tenant members can view, perm-holders can mutate
DO $$
DECLARE
  t text; view_perm text; manage_perm text;
BEGIN
  FOR t, view_perm, manage_perm IN VALUES
    ('library_items','library.view','library.manage'),
    ('library_loans','library.view','library.manage'),
    ('stores','inventory.view','inventory.manage'),
    ('suppliers','inventory.view','inventory.manage'),
    ('stock_items','inventory.view','inventory.manage'),
    ('stock_movements','inventory.view','inventory.manage'),
    ('assets','inventory.view','inventory.manage'),
    ('requisitions','inventory.view','procurement.request'),
    ('requisition_lines','inventory.view','procurement.request'),
    ('purchase_orders','inventory.view','procurement.approve'),
    ('po_lines','inventory.view','procurement.approve'),
    ('goods_received_notes','inventory.view','inventory.manage'),
    ('grn_lines','inventory.view','inventory.manage')
  LOOP
    EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (public.is_tenant_member(tenant_id))', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id) AND (public.has_perm(tenant_id, %L) OR public.has_perm(tenant_id, %L)))', t, t, manage_perm, view_perm);
    EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE USING (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id, %L))', t, t, manage_perm);
    EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE USING (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id, %L))', t, t, manage_perm);
  END LOOP;
END $$;

-- ============== PERMISSIONS REGISTRATION ==============
INSERT INTO public.permissions(key, description) VALUES
  ('library.view','View library catalog and loans'),
  ('library.manage','Manage library items, checkouts, returns'),
  ('inventory.view','View stores, stock, assets'),
  ('inventory.manage','Manage stores, stock items, movements, assets, GRNs'),
  ('procurement.request','Create and submit requisitions'),
  ('procurement.approve','Approve requisitions and purchase orders')
ON CONFLICT (key) DO NOTHING;

-- Grant to school_admin
INSERT INTO public.role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'school_admin' AND p.key IN
  ('library.view','library.manage','inventory.view','inventory.manage','procurement.request','procurement.approve')
ON CONFLICT DO NOTHING;
