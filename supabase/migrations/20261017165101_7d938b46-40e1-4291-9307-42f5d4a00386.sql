ALTER TABLE public.fee_reminders
 ADD COLUMN IF NOT EXISTS reminder_tier text,
 ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent',
 ADD COLUMN IF NOT EXISTS attempted_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN IF NOT EXISTS failed_at timestamptz,
 ADD COLUMN IF NOT EXISTS error text,
 ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.fee_reminders ALTER COLUMN sent_at DROP NOT NULL;
GRANT ALL ON public.fee_reminders TO service_role;
CREATE INDEX IF NOT EXISTS fee_reminders_student_attempt_idx ON public.fee_reminders(tenant_id,student_id,attempted_at);
CREATE OR REPLACE FUNCTION public.claim_fee_reminder(p_tenant_id uuid,p_student_id uuid,p_invoice_id uuid,p_tier text,p_phone text,p_amount numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_start timestamptz := date_trunc('day',now() AT TIME ZONE 'Africa/Nairobi') AT TIME ZONE 'Africa/Nairobi';
BEGIN
 IF p_tier NOT IN ('gentle','firm','final') OR p_phone IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid reminder reservation'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.students WHERE id=p_student_id AND tenant_id=p_tenant_id) THEN RAISE EXCEPTION 'Student does not belong to school'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || p_student_id::text,0));
 IF EXISTS(SELECT 1 FROM public.fee_reminders WHERE tenant_id=p_tenant_id AND student_id=p_student_id AND (sent_at>=v_start OR attempted_at>=v_start)) THEN RETURN NULL; END IF;
 INSERT INTO public.fee_reminders(tenant_id,student_id,invoice_id,reminder_type,reminder_tier,channel,status,sent_to,amount_owed_at_send,sent_at)
 VALUES(p_tenant_id,p_student_id,p_invoice_id,p_tier,p_tier,'whatsapp','sending',p_phone,p_amount,NULL) RETURNING id INTO v_id;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.claim_fee_reminder(uuid,uuid,uuid,text,text,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_fee_reminder(uuid,uuid,uuid,text,text,numeric) TO service_role;