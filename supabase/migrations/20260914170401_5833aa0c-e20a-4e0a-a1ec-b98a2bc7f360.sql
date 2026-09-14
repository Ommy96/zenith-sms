-- ============ PHASE 5: COMMUNICATION ============

-- 1. messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('sms','whatsapp','email','in_app','voice','push')),
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  recipient_type text CHECK (recipient_type IN ('guardian','student','staff','parent_portal_user','phone','email','group')),
  recipient_id uuid,
  recipient_phone text,
  recipient_email text,
  recipient_name text,
  sender_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  subject text,
  body text NOT NULL,
  template_key text,
  template_id uuid,
  template_variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','delivered','read','failed','dry_run','cancelled')),
  provider text,
  provider_message_id text,
  cost numeric(10,4),
  cost_currency text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  error text,
  retry_count int NOT NULL DEFAULT 0,
  related_entity_type text,
  related_entity_id uuid,
  thread_id uuid,
  campaign_id uuid,
  receipt_id uuid REFERENCES public.student_receipts(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_recipient_channel_chk CHECK (
    (channel IN ('sms','whatsapp','voice') AND recipient_phone IS NOT NULL)
    OR (channel = 'email' AND recipient_email IS NOT NULL)
    OR channel IN ('in_app','push')
  )
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_messages_tenant_sent ON public.messages(tenant_id, sent_at DESC);
CREATE INDEX idx_messages_tenant_recipient ON public.messages(tenant_id, recipient_type, recipient_id);
CREATE INDEX idx_messages_tenant_student ON public.messages(tenant_id, student_id, created_at DESC);
CREATE INDEX idx_messages_pending ON public.messages(tenant_id, status) WHERE status IN ('queued','sending','failed');
CREATE INDEX idx_messages_channel_status ON public.messages(tenant_id, channel, status);
CREATE INDEX idx_messages_phone ON public.messages(recipient_phone) WHERE recipient_phone IS NOT NULL;
CREATE INDEX idx_messages_email ON public.messages(recipient_email) WHERE recipient_email IS NOT NULL;
CREATE INDEX idx_messages_dispatch ON public.messages(status, scheduled_for, created_at) WHERE status = 'queued';

-- 2. message_templates
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms','whatsapp','email','in_app','voice','push')),
  subject text,
  body_template text NOT NULL,
  variables text[] NOT NULL DEFAULT '{}',
  language text NOT NULL DEFAULT 'en',
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX uq_message_templates_tenant_key_lang
  ON public.message_templates(tenant_id, key, language) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX uq_message_templates_system_key_lang
  ON public.message_templates(key, language) WHERE tenant_id IS NULL;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_template_id_fkey FOREIGN KEY (template_id)
  REFERENCES public.message_templates(id) ON DELETE SET NULL;

-- 3. messaging_inbox_threads
CREATE TABLE public.messaging_inbox_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp','sms')),
  contact_phone text NOT NULL,
  contact_name text,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE SET NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending_reply','resolved','closed')),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_count int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, channel, contact_phone)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messaging_inbox_threads TO authenticated;
GRANT ALL ON public.messaging_inbox_threads TO service_role;
ALTER TABLE public.messaging_inbox_threads ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_thread_id_fkey FOREIGN KEY (thread_id)
  REFERENCES public.messaging_inbox_threads(id) ON DELETE SET NULL;

-- 4. broadcast_campaigns
CREATE TABLE public.broadcast_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms','whatsapp','email','in_app','voice','push')),
  subject text,
  body_template text NOT NULL,
  audience_query jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','partial','cancelled','failed')),
  total_recipients int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  delivered_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  estimated_cost numeric(10,2),
  actual_cost numeric(10,2),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broadcast_campaigns TO authenticated;
GRANT ALL ON public.broadcast_campaigns TO service_role;
ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_campaigns_tenant_status ON public.broadcast_campaigns(tenant_id, status, scheduled_for);

ALTER TABLE public.messages
  ADD CONSTRAINT messages_campaign_id_fkey FOREIGN KEY (campaign_id)
  REFERENCES public.broadcast_campaigns(id) ON DELETE SET NULL;

-- 5. portal_otps (additive on existing table)
ALTER TABLE public.portal_otps
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS guardian_id uuid REFERENCES public.guardians(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'login',
  ADD COLUMN IF NOT EXISTS max_attempts int NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_consumed boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_portal_otps_lookup ON public.portal_otps(phone, is_consumed, expires_at DESC);
ALTER TABLE public.portal_otps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.portal_otps FROM anon, authenticated;
GRANT ALL ON public.portal_otps TO service_role;

-- 6. portal_auth_ratelimit
CREATE TABLE public.portal_auth_ratelimit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  endpoint text NOT NULL,
  hit_count int NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT date_trunc('hour', now()),
  UNIQUE (key, endpoint, window_start)
);
GRANT ALL ON public.portal_auth_ratelimit TO service_role;
ALTER TABLE public.portal_auth_ratelimit ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ratelimit_lookup ON public.portal_auth_ratelimit(key, endpoint, window_start DESC);

-- ============ TRIGGERS ============
CREATE TRIGGER messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER message_templates_updated_at BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER inbox_threads_updated_at BEFORE UPDATE ON public.messaging_inbox_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.broadcast_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public._tg_message_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS NULL THEN NEW.status := 'queued'; END IF;
  IF NEW.direction IS NULL THEN NEW.direction := 'outbound'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_defaults BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public._tg_message_defaults();

CREATE OR REPLACE FUNCTION public._tg_thread_touch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE public.messaging_inbox_threads
       SET last_message_at = now(),
           unread_count = CASE WHEN NEW.direction = 'inbound' THEN unread_count + 1 ELSE unread_count END,
           updated_at = now()
     WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_thread_touch AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public._tg_thread_touch();

-- ============ PERMISSIONS ============
INSERT INTO public.permissions (name, description, category) VALUES
  ('messages.template_manage','Create and edit message templates','communication'),
  ('campaigns.create','Create broadcast campaigns','communication'),
  ('campaigns.send','Send broadcast campaigns','communication'),
  ('inbox.view','View the messaging inbox','communication'),
  ('inbox.reply','Reply to inbox conversations','communication')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name IN ('super_admin','school_admin','principal')
  AND p.name IN ('messages.view','messages.send','messages.template_manage','campaigns.create','campaigns.send','inbox.view','inbox.reply')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.is_system AND r.name IN ('deputy_principal','class_teacher','registrar')
  AND p.name IN ('messages.view','messages.send','inbox.view')
ON CONFLICT DO NOTHING;

-- ============ RLS POLICIES ============
-- messages
CREATE POLICY messages_staff_select ON public.messages FOR SELECT TO authenticated
USING (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'messages.view')));
CREATE POLICY messages_portal_select ON public.messages FOR SELECT TO authenticated
USING (
  (recipient_type = 'parent_portal_user' AND recipient_id = auth.uid())
  OR (student_id IN (SELECT public.portal_my_student_ids()))
);
CREATE POLICY messages_staff_insert ON public.messages FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'messages.send')));
CREATE POLICY messages_staff_update ON public.messages FOR UPDATE TO authenticated
USING (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'messages.send')))
WITH CHECK (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'messages.send')));
CREATE POLICY messages_staff_delete ON public.messages FOR DELETE TO authenticated
USING (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'messages.template_manage')));

-- message_templates
CREATE POLICY templates_select ON public.message_templates FOR SELECT TO authenticated
USING (tenant_id IS NULL OR public.is_super_admin() OR tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY templates_write ON public.message_templates FOR ALL TO authenticated
USING (public.is_super_admin() OR (tenant_id IS NOT NULL AND tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'messages.template_manage')))
WITH CHECK (public.is_super_admin() OR (tenant_id IS NOT NULL AND tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'messages.template_manage')));

-- inbox threads
CREATE POLICY inbox_select ON public.messaging_inbox_threads FOR SELECT TO authenticated
USING (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'inbox.view')));
CREATE POLICY inbox_write ON public.messaging_inbox_threads FOR ALL TO authenticated
USING (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'inbox.reply')))
WITH CHECK (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'inbox.reply')));

-- campaigns
CREATE POLICY campaigns_select ON public.broadcast_campaigns FOR SELECT TO authenticated
USING (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'campaigns.create')));
CREATE POLICY campaigns_write ON public.broadcast_campaigns FOR ALL TO authenticated
USING (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'campaigns.send')))
WITH CHECK (public.is_super_admin() OR (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_has_permission(tenant_id,'campaigns.send')));

-- portal_otps / ratelimit: service role only (no policies for authenticated/anon)

-- ============ SYSTEM TEMPLATES ============
INSERT INTO public.message_templates (tenant_id, key, name, channel, language, body_template, variables, is_system) VALUES
 (NULL,'portal_otp','Parent portal login code','sms','en','Your {{school_name}} portal code is {{code}}. Valid 10 minutes. Never share this code.', ARRAY['school_name','code'], true),
 (NULL,'portal_otp','Msimbo wa kuingia wa mzazi','sms','sw','Msimbo wako wa {{school_name}} ni {{code}}. Halali dakika 10. Usimshirikishe mtu yeyote.', ARRAY['school_name','code'], true),
 (NULL,'fee_reminder_gentle','Gentle fee reminder','sms','en','Hi {{parent_name}}, this is a friendly reminder that {{student_name}}''s Term {{term}} fee balance is KES {{balance}}. Pay via M-Pesa Paybill {{paybill}}, account {{admission_number}}. Thank you.', ARRAY['parent_name','student_name','term','balance','paybill','admission_number'], true),
 (NULL,'payment_received','Payment received','sms','en','Received KES {{amount}} for {{student_name}}. Receipt {{receipt_number}}. Balance: KES {{balance}}. Thank you.', ARRAY['amount','student_name','receipt_number','balance'], true),
 (NULL,'report_card_ready','Report card ready','sms','en','{{student_name}}''s Term {{term}} report is ready. View: {{portal_link}}', ARRAY['student_name','term','portal_link'], true)
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';