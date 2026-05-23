
-- ============ DISCIPLINE ============
CREATE TABLE public.discipline_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  incident_time time,
  location text,
  category text NOT NULL DEFAULT 'other',
  severity int NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  description text NOT NULL,
  witnesses text,
  reported_by uuid,
  status text NOT NULL DEFAULT 'open',
  notify_status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_discipline_incidents_tenant_student ON public.discipline_incidents(tenant_id, student_id);
CREATE INDEX idx_discipline_incidents_date ON public.discipline_incidents(tenant_id, incident_date DESC);

CREATE TABLE public.disciplinary_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  incident_id uuid NOT NULL REFERENCES public.discipline_incidents(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  action_type text NOT NULL,
  start_date date,
  end_date date,
  notes text,
  issued_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_disciplinary_actions_tenant_student ON public.disciplinary_actions(tenant_id, student_id);

CREATE TABLE public.merit_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  awarded_date date NOT NULL DEFAULT CURRENT_DATE,
  points int NOT NULL DEFAULT 1,
  category text NOT NULL DEFAULT 'general',
  reason text NOT NULL,
  awarded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_merit_points_tenant_student ON public.merit_points(tenant_id, student_id);

ALTER TABLE public.discipline_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merit_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_discipline_incidents" ON public.discipline_incidents
  FOR SELECT USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant_manage_discipline_incidents" ON public.discipline_incidents
  FOR ALL USING (public.has_perm(tenant_id, 'discipline.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'discipline.manage'));

CREATE POLICY "tenant_select_disciplinary_actions" ON public.disciplinary_actions
  FOR SELECT USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant_manage_disciplinary_actions" ON public.disciplinary_actions
  FOR ALL USING (public.has_perm(tenant_id, 'discipline.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'discipline.manage'));

CREATE POLICY "tenant_select_merit_points" ON public.merit_points
  FOR SELECT USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant_manage_merit_points" ON public.merit_points
  FOR ALL USING (public.has_perm(tenant_id, 'discipline.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'discipline.manage'));

-- Portal: parents/students see their own
CREATE POLICY "portal_select_discipline_incidents" ON public.discipline_incidents
  FOR SELECT USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())));
CREATE POLICY "portal_select_disciplinary_actions" ON public.disciplinary_actions
  FOR SELECT USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())));
CREATE POLICY "portal_select_merit_points" ON public.merit_points
  FOR SELECT USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())));

-- Severity 3+ auto-notify trigger
CREATE OR REPLACE FUNCTION public._tg_discipline_notify_guardian()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student record; v_school text; v_g record;
  v_body text; v_vars jsonb;
BEGIN
  IF NEW.severity < 3 OR NEW.notify_status = 'sent' THEN RETURN NEW; END IF;
  SELECT first_name, last_name INTO v_student FROM public.students WHERE id = NEW.student_id;
  IF v_student IS NULL THEN RETURN NEW; END IF;
  SELECT name INTO v_school FROM public.tenants WHERE id = NEW.tenant_id;

  v_vars := jsonb_build_object(
    'student_name', concat_ws(' ', v_student.first_name, v_student.last_name),
    'date', to_char(NEW.incident_date,'DD Mon YYYY'),
    'category', NEW.category,
    'severity', NEW.severity,
    'school_name', COALESCE(v_school,'School')
  );

  FOR v_g IN
    SELECT g.id, g.full_name, g.phone_primary, g.whatsapp_number
    FROM public.student_guardians sg
    JOIN public.guardians g ON g.id = sg.guardian_id
    WHERE sg.student_id = NEW.student_id AND sg.receives_communications = true
  LOOP
    v_body := format(
      'Dear %s, this is to inform you that an incident involving %s was recorded on %s (category: %s, severity %s/5). Kindly contact %s. — %s',
      COALESCE(v_g.full_name,'Parent'),
      v_vars->>'student_name',
      v_vars->>'date',
      NEW.category,
      NEW.severity,
      COALESCE(v_school,'the school'),
      COALESCE(v_school,'School')
    );
    INSERT INTO public.messages(
      tenant_id, recipient_type, recipient_id, recipient_address, recipient_name,
      student_id, channel, body, status, direction, template_variables
    ) VALUES (
      NEW.tenant_id, 'guardian'::message_recipient_type_enum, v_g.id,
      COALESCE(v_g.whatsapp_number, v_g.phone_primary), v_g.full_name,
      NEW.student_id, 'whatsapp', v_body,
      'queued'::message_status_enum, 'outbound', v_vars
    );
  END LOOP;

  NEW.notify_status := 'sent';
  RETURN NEW;
END $$;

CREATE TRIGGER tg_discipline_notify
  BEFORE INSERT OR UPDATE OF severity ON public.discipline_incidents
  FOR EACH ROW EXECUTE FUNCTION public._tg_discipline_notify_guardian();

CREATE TRIGGER tg_discipline_incidents_uat BEFORE UPDATE ON public.discipline_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_disciplinary_actions_uat BEFORE UPDATE ON public.disciplinary_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ HEALTH ============
CREATE TABLE public.health_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  visit_time time DEFAULT CURRENT_TIME,
  complaint text NOT NULL,
  diagnosis text,
  treatment text,
  temperature numeric(4,1),
  blood_pressure text,
  pulse int,
  sent_home boolean DEFAULT false,
  referred_to text,
  attended_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_health_visits_tenant_student ON public.health_visits(tenant_id, student_id);

CREATE TABLE public.medication_administration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  medication_name text NOT NULL,
  dose text,
  administered_at timestamptz NOT NULL DEFAULT now(),
  administered_by uuid,
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_med_admin_tenant_student ON public.medication_administration(tenant_id, student_id);

CREATE TABLE public.immunization_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  vaccine_name text NOT NULL,
  date_given date NOT NULL,
  dose_number int,
  batch_number text,
  administered_by text,
  next_due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_immunization_tenant_student ON public.immunization_records(tenant_id, student_id);

CREATE TABLE public.accident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  student_id uuid NOT NULL,
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  incident_time time,
  location text,
  description text NOT NULL,
  injury_type text,
  severity text DEFAULT 'minor',
  first_aid_given text,
  hospital_referred boolean DEFAULT false,
  hospital_name text,
  parent_notified boolean DEFAULT false,
  parent_notified_at timestamptz,
  reported_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_accident_tenant_student ON public.accident_reports(tenant_id, student_id);

ALTER TABLE public.health_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_administration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immunization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_health_visits" ON public.health_visits
  FOR SELECT USING (public.has_perm(tenant_id, 'health.view'));
CREATE POLICY "tenant_manage_health_visits" ON public.health_visits
  FOR ALL USING (public.has_perm(tenant_id, 'health.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'health.manage'));

CREATE POLICY "tenant_select_med_admin" ON public.medication_administration
  FOR SELECT USING (public.has_perm(tenant_id, 'health.view'));
CREATE POLICY "tenant_manage_med_admin" ON public.medication_administration
  FOR ALL USING (public.has_perm(tenant_id, 'health.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'health.manage'));

CREATE POLICY "tenant_select_immunization" ON public.immunization_records
  FOR SELECT USING (public.has_perm(tenant_id, 'health.view'));
CREATE POLICY "tenant_manage_immunization" ON public.immunization_records
  FOR ALL USING (public.has_perm(tenant_id, 'health.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'health.manage'));

CREATE POLICY "tenant_select_accident" ON public.accident_reports
  FOR SELECT USING (public.has_perm(tenant_id, 'health.view'));
CREATE POLICY "tenant_manage_accident" ON public.accident_reports
  FOR ALL USING (public.has_perm(tenant_id, 'health.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'health.manage'));

-- Portal access to a student's own health
CREATE POLICY "portal_select_health_visits" ON public.health_visits
  FOR SELECT USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())));
CREATE POLICY "portal_select_immunization" ON public.immunization_records
  FOR SELECT USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())));
CREATE POLICY "portal_select_accident" ON public.accident_reports
  FOR SELECT USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())));

CREATE TRIGGER tg_health_visits_uat BEFORE UPDATE ON public.health_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_accident_reports_uat BEFORE UPDATE ON public.accident_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EVENTS / CALENDAR ============
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  category text DEFAULT 'general',
  color text,
  audience text NOT NULL DEFAULT 'all',
  class_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_calendar_events_tenant_date ON public.calendar_events(tenant_id, starts_at);

CREATE TABLE public.resource_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  event_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_name text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  booked_by uuid,
  purpose text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_resource_bookings_tenant ON public.resource_bookings(tenant_id, starts_at);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_calendar_events" ON public.calendar_events
  FOR SELECT USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant_manage_calendar_events" ON public.calendar_events
  FOR ALL USING (public.has_perm(tenant_id, 'events.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'events.manage'));

CREATE POLICY "portal_select_calendar_events" ON public.calendar_events
  FOR SELECT USING (
    audience IN ('all','parents','students') AND
    tenant_id IN (SELECT tenant_id FROM public.portal_my_tenants(auth.uid()))
  );

CREATE POLICY "tenant_select_resource_bookings" ON public.resource_bookings
  FOR SELECT USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tenant_manage_resource_bookings" ON public.resource_bookings
  FOR ALL USING (public.has_perm(tenant_id, 'events.manage'))
  WITH CHECK (public.has_perm(tenant_id, 'events.manage'));

CREATE TRIGGER tg_calendar_events_uat BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PERMISSIONS ============
INSERT INTO public.permissions(key, description, category) VALUES
  ('discipline.view','View discipline incidents','discipline'),
  ('discipline.manage','Manage discipline incidents and actions','discipline'),
  ('health.view','View health records','health'),
  ('health.manage','Manage health records','health'),
  ('events.view','View calendar events','events'),
  ('events.manage','Create and manage calendar events','events')
ON CONFLICT (key) DO NOTHING;

-- Grant to school_admin
INSERT INTO public.role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'school_admin' AND p.key IN
  ('discipline.view','discipline.manage','health.view','health.manage','events.view','events.manage')
ON CONFLICT DO NOTHING;
