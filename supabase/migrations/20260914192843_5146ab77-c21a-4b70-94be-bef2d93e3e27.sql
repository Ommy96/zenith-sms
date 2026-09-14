
-- ===== PERMISSIONS =====
INSERT INTO public.permissions (name, description)
SELECT v.name, v.descr FROM (VALUES
  ('hostel.view','View boarding records'),
  ('hostel.manage','Manage boarding records'),
  ('transport.view','View transport records'),
  ('transport.manage','Manage transport records'),
  ('library.view','View library records'),
  ('library.manage','Manage library records'),
  ('health.view','View health records'),
  ('health.record','Record health information'),
  ('discipline.view','View discipline records'),
  ('discipline.log','Log discipline records'),
  ('inventory.view','View inventory'),
  ('inventory.manage','Manage inventory'),
  ('purchase.request','Raise purchase orders'),
  ('purchase.approve','Approve purchase orders'),
  ('ai.use','Use AI features'),
  ('ai.admin','Manage AI settings and quotas'),
  ('notifications.view','View own notifications')
) AS v(name, descr)
WHERE NOT EXISTS (SELECT 1 FROM public.permissions p WHERE p.name = v.name);

-- grant to roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.is_system AND (
  (r.name IN ('super_admin','school_admin','principal','deputy_principal') AND p.name IN (
    'hostel.view','hostel.manage','transport.view','transport.manage','library.view','library.manage',
    'health.view','health.record','discipline.view','discipline.log','inventory.view','inventory.manage',
    'purchase.request','purchase.approve','ai.use','ai.admin','notifications.view'))
  OR (r.name = 'hostel_master' AND p.name IN ('hostel.view','hostel.manage','discipline.view','discipline.log','ai.use','notifications.view'))
  OR (r.name = 'transport_officer' AND p.name IN ('transport.view','transport.manage','ai.use','notifications.view'))
  OR (r.name = 'librarian' AND p.name IN ('library.view','library.manage','ai.use','notifications.view'))
  OR (r.name = 'nurse' AND p.name IN ('health.view','health.record','ai.use','notifications.view'))
  OR (r.name IN ('class_teacher','subject_teacher','hod') AND p.name IN (
    'discipline.view','discipline.log','library.view','health.view','transport.view','hostel.view','ai.use','notifications.view'))
  OR (r.name IN ('bursar','accounts_clerk') AND p.name IN ('inventory.view','inventory.manage','purchase.request','ai.use','notifications.view'))
  OR (r.name = 'registrar' AND p.name IN ('hostel.view','transport.view','library.view','discipline.view','ai.use','notifications.view'))
  OR (r.name IN ('parent','student','alumni') AND p.name IN ('notifications.view'))
)
AND NOT EXISTS (SELECT 1 FROM public.role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);

-- ===== RLS: staff patterns =====
DO $$
DECLARE rec record;
BEGIN
  FOR rec IN SELECT * FROM (VALUES
    ('hostels','hostel.view','hostel.manage'),
    ('hostel_rooms','hostel.view','hostel.manage'),
    ('hostel_allocations','hostel.view','hostel.manage'),
    ('hostel_out_passes','hostel.view','hostel.manage'),
    ('hostel_roll_calls','hostel.view','hostel.manage'),
    ('hostel_roll_call_entries','hostel.view','hostel.manage'),
    ('hostel_visitors','hostel.view','hostel.manage'),
    ('vehicles','transport.view','transport.manage'),
    ('drivers','transport.view','transport.manage'),
    ('routes','transport.view','transport.manage'),
    ('route_stops','transport.view','transport.manage'),
    ('student_transport','transport.view','transport.manage'),
    ('vehicle_assignments','transport.view','transport.manage'),
    ('vehicle_locations','transport.view','transport.manage'),
    ('library_books','library.view','library.manage'),
    ('library_loans','library.view','library.manage'),
    ('health_records','health.view','health.record'),
    ('health_visits','health.view','health.record'),
    ('immunization_records','health.view','health.record'),
    ('medication_administration','health.view','health.record'),
    ('accident_reports','health.view','health.record'),
    ('discipline_incidents','discipline.view','discipline.log'),
    ('disciplinary_actions','discipline.view','discipline.log'),
    ('merit_points','discipline.view','discipline.log'),
    ('inventory_categories','inventory.view','inventory.manage'),
    ('inventory_items','inventory.view','inventory.manage'),
    ('inventory_transactions','inventory.view','inventory.manage'),
    ('purchase_orders','inventory.view','purchase.request'),
    ('purchase_order_items','inventory.view','purchase.request')
  ) AS v(tbl, vperm, mperm)
  LOOP
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
      USING (public.is_super_admin() OR (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id, %L)))
    $f$, rec.tbl || '_staff_select', rec.tbl, rec.vperm);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR ALL TO authenticated
      USING (public.is_super_admin() OR (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id, %L)))
      WITH CHECK (public.is_super_admin() OR (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id, %L)))
    $f$, rec.tbl || '_staff_manage', rec.tbl, rec.mperm, rec.mperm);
  END LOOP;
END $$;

-- ===== RLS: portal parent read access =====
CREATE POLICY health_visits_portal ON public.health_visits FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids()));
CREATE POLICY immunization_portal ON public.immunization_records FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids()));
CREATE POLICY accident_portal ON public.accident_reports FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids()));
CREATE POLICY incidents_portal ON public.discipline_incidents FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids()));
CREATE POLICY actions_portal ON public.disciplinary_actions FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids()));
CREATE POLICY merit_portal ON public.merit_points FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids()));
CREATE POLICY loans_portal ON public.library_loans FOR SELECT TO authenticated
  USING (borrower_student_id IN (SELECT student_id FROM public.portal_my_student_ids()));
CREATE POLICY transport_portal ON public.student_transport FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids()));
CREATE POLICY hostel_alloc_portal ON public.hostel_allocations FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids()));
CREATE POLICY out_pass_portal ON public.hostel_out_passes FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids()));

-- ===== notifications, setup_progress, ai_usage_logs =====
CREATE POLICY notifications_own ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY notifications_own_update ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_own_delete ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY setup_progress_select ON public.setup_progress FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_tenant_member(tenant_id));
CREATE POLICY setup_progress_manage ON public.setup_progress FOR ALL TO authenticated
  USING (public.is_super_admin() OR (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id,'tenant.settings.edit')))
  WITH CHECK (public.is_super_admin() OR (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id,'tenant.settings.edit')));

CREATE POLICY ai_usage_select ON public.ai_usage_logs FOR SELECT TO authenticated
  USING (public.is_super_admin() OR (public.is_tenant_member(tenant_id) AND public.has_perm(tenant_id,'ai.admin')));

-- cost is only readable through the guarded helper below
REVOKE SELECT ON public.ai_usage_logs FROM authenticated;
GRANT SELECT (id, tenant_id, user_id, function_name, model, input_tokens, output_tokens, purpose, metadata, created_at)
  ON public.ai_usage_logs TO authenticated;

-- ===== HELPER FUNCTIONS =====
CREATE OR REPLACE FUNCTION public.recompute_setup_progress(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v record; v_percent int;
BEGIN
  SELECT
    EXISTS(SELECT 1 FROM academic_years WHERE tenant_id = p_tenant_id) AS has_year,
    EXISTS(SELECT 1 FROM terms WHERE tenant_id = p_tenant_id AND is_current) AS has_term,
    EXISTS(SELECT 1 FROM grade_levels WHERE tenant_id = p_tenant_id) AS has_grades,
    EXISTS(SELECT 1 FROM classes WHERE tenant_id = p_tenant_id) AS has_classes,
    EXISTS(SELECT 1 FROM subjects WHERE tenant_id = p_tenant_id) AS has_subjects,
    EXISTS(SELECT 1 FROM students WHERE tenant_id = p_tenant_id) AS has_students,
    EXISTS(SELECT 1 FROM staff WHERE tenant_id = p_tenant_id) AS has_staff,
    EXISTS(SELECT 1 FROM fee_structures WHERE tenant_id = p_tenant_id) AS has_fees,
    EXISTS(SELECT 1 FROM mpesa_config WHERE tenant_id = p_tenant_id AND is_active) AS has_mpesa,
    EXISTS(SELECT 1 FROM message_templates WHERE tenant_id = p_tenant_id) AS has_msg,
    (SELECT logo_url IS NOT NULL FROM tenants WHERE id = p_tenant_id) AS has_logo,
    EXISTS(SELECT 1 FROM invoices WHERE tenant_id = p_tenant_id) AS has_inv,
    EXISTS(SELECT 1 FROM payments WHERE tenant_id = p_tenant_id) AS has_pay
  INTO v;

  v_percent :=
    (CASE WHEN v.has_year THEN 8 ELSE 0 END) + (CASE WHEN v.has_term THEN 8 ELSE 0 END) +
    (CASE WHEN v.has_grades THEN 10 ELSE 0 END) + (CASE WHEN v.has_classes THEN 10 ELSE 0 END) +
    (CASE WHEN v.has_subjects THEN 8 ELSE 0 END) + (CASE WHEN v.has_students THEN 15 ELSE 0 END) +
    (CASE WHEN v.has_staff THEN 10 ELSE 0 END) + (CASE WHEN v.has_fees THEN 10 ELSE 0 END) +
    (CASE WHEN v.has_mpesa THEN 8 ELSE 0 END) + (CASE WHEN COALESCE(v.has_logo,false) THEN 3 ELSE 0 END) +
    (CASE WHEN v.has_inv THEN 5 ELSE 0 END) + (CASE WHEN v.has_pay THEN 5 ELSE 0 END);

  INSERT INTO setup_progress (tenant_id, has_academic_year, has_current_term, has_grade_levels,
    has_classes, has_subjects, has_students, has_staff, has_fee_structure, has_mpesa_config,
    has_messaging_config, has_logo, has_at_least_one_invoice, has_at_least_one_payment,
    completion_percentage, updated_at)
  VALUES (p_tenant_id, v.has_year, v.has_term, v.has_grades, v.has_classes, v.has_subjects,
    v.has_students, v.has_staff, v.has_fees, v.has_mpesa, v.has_msg, COALESCE(v.has_logo,false),
    v.has_inv, v.has_pay, v_percent, now())
  ON CONFLICT (tenant_id) DO UPDATE SET
    has_academic_year = EXCLUDED.has_academic_year,
    has_current_term = EXCLUDED.has_current_term,
    has_grade_levels = EXCLUDED.has_grade_levels,
    has_classes = EXCLUDED.has_classes,
    has_subjects = EXCLUDED.has_subjects,
    has_students = EXCLUDED.has_students,
    has_staff = EXCLUDED.has_staff,
    has_fee_structure = EXCLUDED.has_fee_structure,
    has_mpesa_config = EXCLUDED.has_mpesa_config,
    has_messaging_config = EXCLUDED.has_messaging_config,
    has_logo = EXCLUDED.has_logo,
    has_at_least_one_invoice = EXCLUDED.has_at_least_one_invoice,
    has_at_least_one_payment = EXCLUDED.has_at_least_one_payment,
    completion_percentage = EXCLUDED.completion_percentage,
    updated_at = now();
END $$;
REVOKE EXECUTE ON FUNCTION public.recompute_setup_progress(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recompute_setup_progress(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ai_usage_this_month(p_tenant_id uuid)
RETURNS int
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::int FROM ai_usage_logs
  WHERE tenant_id = p_tenant_id AND created_at >= date_trunc('month', now());
$$;
REVOKE EXECUTE ON FUNCTION public.ai_usage_this_month(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_usage_this_month(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ai_cost_this_month(p_tenant_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.is_super_admin() OR public.has_perm(p_tenant_id,'ai.admin')) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN COALESCE((SELECT SUM(cost_usd) FROM ai_usage_logs
    WHERE tenant_id = p_tenant_id AND created_at >= date_trunc('month', now())), 0);
END $$;
REVOKE EXECUTE ON FUNCTION public.ai_cost_this_month(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_cost_this_month(uuid) TO authenticated, service_role;

-- ===== TRIGGERS =====
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['hostels','hostel_rooms','hostel_allocations','hostel_out_passes',
    'vehicles','drivers','routes','route_stops','student_transport','vehicle_assignments',
    'library_books','library_loans','health_records','health_visits','immunization_records',
    'medication_administration','accident_reports','discipline_incidents','disciplinary_actions',
    'inventory_categories','inventory_items','purchase_orders','purchase_order_items']
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t || '_updated_at', t);
  END LOOP;
END $$;

-- setup progress refresh
CREATE OR REPLACE FUNCTION public._tg_touch_setup_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.recompute_setup_progress(COALESCE(NEW.tenant_id, OLD.tenant_id));
  RETURN NULL;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['students','staff','invoices','payments','classes','subjects',
    'grade_levels','academic_years','terms','fee_structures','mpesa_config']
  LOOP
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public._tg_touch_setup_progress()', t || '_setup_progress', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public._tg_tenant_logo_setup_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.recompute_setup_progress(NEW.id);
  RETURN NULL;
END $$;
CREATE TRIGGER tenants_logo_setup_progress AFTER UPDATE OF logo_url ON public.tenants
  FOR EACH ROW WHEN (NEW.logo_url IS DISTINCT FROM OLD.logo_url)
  EXECUTE FUNCTION public._tg_tenant_logo_setup_progress();

-- inventory stock
CREATE OR REPLACE FUNCTION public._tg_inventory_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE delta numeric;
BEGIN
  delta := CASE NEW.transaction_type
    WHEN 'receipt' THEN NEW.quantity
    WHEN 'return' THEN NEW.quantity
    WHEN 'issue' THEN -NEW.quantity
    WHEN 'loss' THEN -NEW.quantity
    WHEN 'adjustment' THEN NEW.quantity
    ELSE 0 END;
  UPDATE inventory_items SET current_stock = current_stock + delta, updated_at = now()
   WHERE id = NEW.item_id;
  RETURN NULL;
END $$;
CREATE TRIGGER inventory_txn_stock AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION public._tg_inventory_stock();

-- library copies
CREATE OR REPLACE FUNCTION public._tg_library_loan_issue()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE avail int;
BEGIN
  SELECT copies_available INTO avail FROM library_books WHERE id = NEW.book_id FOR UPDATE;
  IF avail IS NULL OR avail <= 0 THEN
    RAISE EXCEPTION 'No copies available for this book';
  END IF;
  UPDATE library_books SET copies_available = copies_available - 1, updated_at = now() WHERE id = NEW.book_id;
  RETURN NEW;
END $$;
CREATE TRIGGER library_loans_issue BEFORE INSERT ON public.library_loans
  FOR EACH ROW WHEN (NEW.status = 'active') EXECUTE FUNCTION public._tg_library_loan_issue();

CREATE OR REPLACE FUNCTION public._tg_library_loan_return()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status <> 'returned' AND NEW.status = 'returned' THEN
    UPDATE library_books SET copies_available = LEAST(copies_available + 1, copies_total), updated_at = now()
     WHERE id = NEW.book_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER library_loans_return AFTER UPDATE ON public.library_loans
  FOR EACH ROW EXECUTE FUNCTION public._tg_library_loan_return();

-- merit -> activity feed
CREATE OR REPLACE FUNCTION public._tg_merit_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO student_activity (tenant_id, student_id, event_type, title, description,
    actor_user_id, related_entity_type, related_entity_id, occurred_at)
  VALUES (NEW.tenant_id, NEW.student_id,
    CASE WHEN NEW.points >= 0 THEN 'merit.awarded' ELSE 'demerit.recorded' END,
    CASE WHEN NEW.points >= 0 THEN 'Merit points awarded' ELSE 'Demerit recorded' END,
    NEW.points || ' points — ' || NEW.reason, auth.uid(), 'merit_points', NEW.id, now());
  RETURN NULL;
END $$;
CREATE TRIGGER merit_points_activity AFTER INSERT ON public.merit_points
  FOR EACH ROW EXECUTE FUNCTION public._tg_merit_activity();

NOTIFY pgrst, 'reload schema';
