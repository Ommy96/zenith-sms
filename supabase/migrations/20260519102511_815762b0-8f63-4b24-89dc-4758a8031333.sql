
-- Provider config (one row per tenant)
CREATE TABLE IF NOT EXISTS public.tenant_messaging_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  country_code text NOT NULL DEFAULT 'KE',
  -- SMS: Africa's Talking
  sms_provider text NOT NULL DEFAULT 'africastalking',
  at_username text,
  at_api_key text,
  at_sender_id text,
  -- SMS: Twilio (fallback)
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_from_number text,
  -- Email: Resend
  email_provider text NOT NULL DEFAULT 'resend',
  resend_api_key text,
  email_from_address text,
  email_from_name text,
  -- Limits
  sms_daily_limit integer NOT NULL DEFAULT 5000,
  email_daily_limit integer NOT NULL DEFAULT 10000,
  sms_sent_today integer NOT NULL DEFAULT 0,
  email_sent_today integer NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_messaging_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tmc_select" ON public.tenant_messaging_config FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tmc_insert" ON public.tenant_messaging_config FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY "tmc_update" ON public.tenant_messaging_config FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY "tmc_delete" ON public.tenant_messaging_config FOR DELETE TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE TRIGGER tg_tmc_updated BEFORE UPDATE ON public.tenant_messaging_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inbox threads
CREATE TABLE IF NOT EXISTS public.messaging_inbox_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel public.message_channel_enum NOT NULL,
  contact_address text NOT NULL,
  contact_name text,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  assigned_to uuid,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  unread_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, channel, contact_address)
);
ALTER TABLE public.messaging_inbox_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inbox_read" ON public.messaging_inbox_threads FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "inbox_write" ON public.messaging_inbox_threads FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE TRIGGER tg_inbox_updated BEFORE UPDATE ON public.messaging_inbox_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Direction column on messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.messaging_inbox_threads(id) ON DELETE SET NULL;

-- Dispatcher claim function
CREATE OR REPLACE FUNCTION public.claim_due_messages(_limit int DEFAULT 50)
RETURNS SETOF public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.messages m
  SET status = 'sending', updated_at = now()
  WHERE m.id IN (
    SELECT id FROM public.messages
    WHERE status = 'queued'
      AND direction = 'outbound'
      AND (scheduled_for IS NULL OR scheduled_for <= now())
    ORDER BY created_at ASC
    LIMIT _limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING m.*;
END $$;
