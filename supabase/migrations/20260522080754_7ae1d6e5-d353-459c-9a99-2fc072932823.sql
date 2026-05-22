
-- 1. Extend existing attendance table
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS period_id uuid REFERENCES public.periods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS marked_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS arrival_time time,
  ADD COLUMN IF NOT EXISTS notify_status text NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date ON public.attendance(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_student_date_period
  ON public.attendance(student_id, date, COALESCE(period_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 2. Sessions table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  period_id uuid REFERENCES public.periods(id) ON DELETE SET NULL,
  marked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  marked_at timestamptz NOT NULL DEFAULT now(),
  locked boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_att_sessions
  ON public.attendance_sessions(tenant_id, class_id, date, COALESCE(period_id, '00000000-0000-0000-0000-000000000000'::uuid));

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_select_att_sessions ON public.attendance_sessions;
CREATE POLICY tenant_select_att_sessions ON public.attendance_sessions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
DROP POLICY IF EXISTS tenant_write_att_sessions ON public.attendance_sessions;
CREATE POLICY tenant_write_att_sessions ON public.attendance_sessions FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE TRIGGER trg_att_sessions_updated BEFORE UPDATE ON public.attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add new permission keys (idempotent)
INSERT INTO public.permissions(key, description)
VALUES ('attendance.mark','Mark daily attendance'),
       ('attendance.report','View attendance reports')
ON CONFLICT (key) DO NOTHING;

-- 4. Trigger: on absence, queue WhatsApp + SMS to all guardians
CREATE OR REPLACE FUNCTION public._tg_attendance_notify_absence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student record;
  v_school text;
  v_tpl record;
  v_g record;
  v_body text;
  v_vars jsonb;
BEGIN
  IF NEW.status <> 'absent' THEN RETURN NEW; END IF;
  IF NEW.notify_status = 'sent' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'absent' AND OLD.notify_status = 'sent' THEN RETURN NEW; END IF;

  SELECT s.id, s.first_name, s.last_name INTO v_student FROM public.students s WHERE s.id = NEW.student_id;
  IF v_student IS NULL THEN RETURN NEW; END IF;

  SELECT name INTO v_school FROM public.tenants WHERE id = NEW.tenant_id;
  v_vars := jsonb_build_object(
    'student_name', concat_ws(' ', v_student.first_name, v_student.last_name),
    'date', to_char(NEW.date, 'DD Mon YYYY'),
    'school_name', COALESCE(v_school, 'School')
  );

  FOR v_tpl IN
    SELECT id, channel, subject, body FROM public.message_templates
    WHERE tenant_id = NEW.tenant_id AND slug = 'attendance_absence'
      AND channel IN ('whatsapp','sms')
  LOOP
    FOR v_g IN
      SELECT g.id, g.full_name, g.phone_primary, g.whatsapp_number
      FROM public.student_guardians sg
      JOIN public.guardians g ON g.id = sg.guardian_id
      WHERE sg.student_id = NEW.student_id AND sg.receives_communications = true
    LOOP
      v_body := v_tpl.body;
      v_body := replace(v_body, '{{student_name}}', v_vars->>'student_name');
      v_body := replace(v_body, '{{date}}', v_vars->>'date');
      v_body := replace(v_body, '{{school_name}}', v_vars->>'school_name');
      v_body := replace(v_body, '{{guardian_name}}', COALESCE(v_g.full_name,'Parent'));

      INSERT INTO public.messages(
        tenant_id, recipient_type, recipient_id, recipient_address, recipient_name,
        student_id, channel, template_id, template_variables, body, status, direction
      ) VALUES (
        NEW.tenant_id, 'guardian'::message_recipient_type_enum, v_g.id,
        CASE v_tpl.channel::text
          WHEN 'whatsapp' THEN COALESCE(v_g.whatsapp_number, v_g.phone_primary)
          ELSE COALESCE(v_g.phone_primary, v_g.whatsapp_number)
        END,
        v_g.full_name, NEW.student_id, v_tpl.channel, v_tpl.id, v_vars, v_body,
        'queued'::message_status_enum, 'outbound'
      );
    END LOOP;
  END LOOP;

  NEW.notify_status := 'sent';
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_attendance_notify_absence ON public.attendance;
CREATE TRIGGER trg_attendance_notify_absence
  BEFORE INSERT OR UPDATE OF status ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public._tg_attendance_notify_absence();

-- 5. Chronic absentees RPC
CREATE OR REPLACE FUNCTION public.attendance_chronic_absentees(
  _tenant uuid, _from date, _to date, _min_absences int DEFAULT 3
) RETURNS TABLE(
  student_id uuid, full_name text, admission_number text,
  class_name text, absent_days int, late_days int, total_marked int, absence_pct numeric
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, concat_ws(' ', s.first_name, s.last_name) AS full_name,
         s.admission_number, c.name AS class_name,
         COUNT(*) FILTER (WHERE a.status = 'absent')::int AS absent_days,
         COUNT(*) FILTER (WHERE a.status = 'late')::int AS late_days,
         COUNT(*)::int AS total_marked,
         ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'absent') / NULLIF(COUNT(*),0), 1) AS absence_pct
  FROM public.attendance a
  JOIN public.students s ON s.id = a.student_id
  LEFT JOIN public.classes c ON c.id = s.current_class_id
  WHERE a.tenant_id = _tenant AND a.date BETWEEN _from AND _to
  GROUP BY s.id, s.first_name, s.last_name, s.admission_number, c.name
  HAVING COUNT(*) FILTER (WHERE a.status = 'absent') >= _min_absences
  ORDER BY absent_days DESC, full_name ASC;
$$;

-- 6. Term summary RPC
CREATE OR REPLACE FUNCTION public.attendance_student_summary(
  _tenant uuid, _student uuid, _from date, _to date
) RETURNS TABLE(
  total_days int, present_days int, absent_days int, late_days int,
  excused_days int, attendance_pct numeric
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COUNT(*)::int AS total_days,
    COUNT(*) FILTER (WHERE status = 'present')::int AS present_days,
    COUNT(*) FILTER (WHERE status = 'absent')::int AS absent_days,
    COUNT(*) FILTER (WHERE status = 'late')::int AS late_days,
    COUNT(*) FILTER (WHERE status IN ('excused','on_leave','sick'))::int AS excused_days,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status IN ('present','late')) / NULLIF(COUNT(*),0), 1) AS attendance_pct
  FROM public.attendance
  WHERE tenant_id = _tenant AND student_id = _student AND date BETWEEN _from AND _to;
$$;
