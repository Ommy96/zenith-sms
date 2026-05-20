-- Portal OTPs: short-lived SMS verification codes
CREATE TABLE IF NOT EXISTS public.portal_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portal_otps_phone ON public.portal_otps(phone, created_at DESC);
ALTER TABLE public.portal_otps ENABLE ROW LEVEL SECURITY;
-- No client policies: only service role / SECURITY DEFINER fns may touch this.

-- Link an auth.users id to all guardians sharing a normalized phone
CREATE OR REPLACE FUNCTION public.portal_link_guardian_user(_phone text, _user_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.guardians
     SET portal_user_id = _user_id, updated_at = now()
   WHERE regexp_replace(COALESCE(phone_primary,''), '[^0-9]', '', 'g') = regexp_replace(_phone, '[^0-9]', '', 'g')
      OR regexp_replace(COALESCE(whatsapp_number,''), '[^0-9]', '', 'g') = regexp_replace(_phone, '[^0-9]', '', 'g');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

-- Tenants this portal user has children at
CREATE OR REPLACE FUNCTION public.portal_my_guardian_tenants(_user uuid DEFAULT auth.uid())
RETURNS TABLE(tenant_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT DISTINCT g.tenant_id FROM public.guardians g WHERE g.portal_user_id = _user;
$$;

-- Student IDs this portal user is a guardian of
CREATE OR REPLACE FUNCTION public.portal_my_student_ids(_user uuid DEFAULT auth.uid())
RETURNS TABLE(student_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT DISTINCT sg.student_id
    FROM public.student_guardians sg
    JOIN public.guardians g ON g.id = sg.guardian_id
   WHERE g.portal_user_id = _user;
$$;

-- RLS additions for portal access
DROP POLICY IF EXISTS "Portal guardians read own row" ON public.guardians;
CREATE POLICY "Portal guardians read own row" ON public.guardians
  FOR SELECT TO authenticated
  USING (portal_user_id = auth.uid());

DROP POLICY IF EXISTS "Portal guardians update own row" ON public.guardians;
CREATE POLICY "Portal guardians update own row" ON public.guardians
  FOR UPDATE TO authenticated
  USING (portal_user_id = auth.uid())
  WITH CHECK (portal_user_id = auth.uid());

DROP POLICY IF EXISTS "Portal read own students" ON public.students;
CREATE POLICY "Portal read own students" ON public.students
  FOR SELECT TO authenticated
  USING (id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())));

DROP POLICY IF EXISTS "Portal read own student_guardians" ON public.student_guardians;
CREATE POLICY "Portal read own student_guardians" ON public.student_guardians
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())));

-- Invoices, payments, attendance, exam results: read-only for portal
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='student_invoices') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Portal read own invoices" ON public.student_invoices';
    EXECUTE 'CREATE POLICY "Portal read own invoices" ON public.student_invoices FOR SELECT TO authenticated USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='student_payments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Portal read own payments" ON public.student_payments';
    EXECUTE 'CREATE POLICY "Portal read own payments" ON public.student_payments FOR SELECT TO authenticated USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attendance_records') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Portal read own attendance" ON public.attendance_records';
    EXECUTE 'CREATE POLICY "Portal read own attendance" ON public.attendance_records FOR SELECT TO authenticated USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='student_exam_results') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Portal read own results" ON public.student_exam_results';
    EXECUTE 'CREATE POLICY "Portal read own results" ON public.student_exam_results FOR SELECT TO authenticated USING (student_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Portal read own messages" ON public.messages';
    EXECUTE 'CREATE POLICY "Portal read own messages" ON public.messages FOR SELECT TO authenticated USING (recipient_id IN (SELECT student_id FROM public.portal_my_student_ids(auth.uid())) OR sender_user_id = auth.uid())';
  END IF;
END $$;