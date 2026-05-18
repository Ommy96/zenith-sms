-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE message_channel_enum AS ENUM ('in_app','sms','email','whatsapp','voice','push');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_status_enum AS ENUM ('queued','sending','sent','delivered','read','failed','opted_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_recipient_type_enum AS ENUM ('student','guardian','staff','user','group','phone','email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE template_category_enum AS ENUM ('fee_reminder','attendance_alert','exam_result','announcement','payment_receipt','meeting','emergency','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status_enum AS ENUM ('draft','scheduled','sending','sent','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_category_enum AS ENUM ('academic','financial','communication','attendance','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ MESSAGE TEMPLATES ============
CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  channel message_channel_enum NOT NULL,
  category template_category_enum NOT NULL DEFAULT 'custom',
  subject text,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- WhatsApp-specific: meta template name (must be pre-approved)
  whatsapp_template_name text,
  whatsapp_language text DEFAULT 'en',
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug, channel)
);
CREATE INDEX IF NOT EXISTS idx_msg_templates_tenant ON public.message_templates(tenant_id, channel);

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_id uuid,
  sender_user_id uuid,
  recipient_type message_recipient_type_enum NOT NULL,
  recipient_id uuid,                 -- student/staff/user id
  recipient_address text,            -- phone or email
  recipient_name text,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  channel message_channel_enum NOT NULL,
  template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  template_variables jsonb DEFAULT '{}'::jsonb,
  subject text,
  body text NOT NULL,
  status message_status_enum NOT NULL DEFAULT 'queued',
  provider text,                     -- 'africastalking' | 'twilio' | 'meta_whatsapp' | 'resend'
  provider_message_id text,
  cost numeric(12,4) DEFAULT 0,
  cost_currency text DEFAULT 'KES',
  scheduled_for timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  error text,
  retry_count int NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_sent ON public.messages(tenant_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id, channel);
CREATE INDEX IF NOT EXISTS idx_messages_campaign ON public.messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(tenant_id, status) WHERE status IN ('queued','sending','failed');
CREATE INDEX IF NOT EXISTS idx_messages_student ON public.messages(student_id, created_at DESC);

-- ============ BROADCAST CAMPAIGNS ============
CREATE TABLE IF NOT EXISTS public.broadcast_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- {class_ids: [], grade_levels: [], roles: [], defaulters_only: bool, custom_ids: []}
  template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  template_variables jsonb DEFAULT '{}'::jsonb,
  channels message_channel_enum[] NOT NULL DEFAULT ARRAY['sms']::message_channel_enum[],
  scheduled_for timestamptz,
  status campaign_status_enum NOT NULL DEFAULT 'draft',
  recipient_count int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  delivered_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  total_cost numeric(12,4) DEFAULT 0,
  cost_currency text DEFAULT 'KES',
  is_emergency boolean NOT NULL DEFAULT false,
  created_by uuid,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON public.broadcast_campaigns(tenant_id, created_at DESC);

ALTER TABLE public.messages
  ADD CONSTRAINT messages_campaign_fk
  FOREIGN KEY (campaign_id) REFERENCES public.broadcast_campaigns(id) ON DELETE SET NULL;

-- ============ IN-APP NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,                  -- target user (auth.users.id)
  category notification_category_enum NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  action_url text,
  icon text,
  metadata jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read_at, created_at DESC);

-- ============ NOTIFICATION PREFERENCES ============
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- per category -> per channel boolean
  preferences jsonb NOT NULL DEFAULT '{
    "academic":      {"in_app": true, "email": true,  "sms": false, "whatsapp": true,  "push": true},
    "financial":     {"in_app": true, "email": true,  "sms": true,  "whatsapp": true,  "push": true},
    "communication": {"in_app": true, "email": true,  "sms": false, "whatsapp": true,  "push": true},
    "attendance":    {"in_app": true, "email": false, "sms": true,  "whatsapp": true,  "push": true},
    "system":        {"in_app": true, "email": true,  "sms": false, "whatsapp": false, "push": false}
  }'::jsonb,
  quiet_hours_start time DEFAULT '21:00',
  quiet_hours_end time DEFAULT '07:00',
  quiet_hours_enabled boolean NOT NULL DEFAULT true,
  language text DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ OPT-OUTS ============
CREATE TABLE IF NOT EXISTS public.message_opt_outs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  address text NOT NULL,            -- phone or email (normalized)
  channel message_channel_enum NOT NULL,
  reason text,
  opted_out_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, address, channel)
);
CREATE INDEX IF NOT EXISTS idx_opt_outs_tenant ON public.message_opt_outs(tenant_id, address);

-- ============ PROVIDER PRICING ============
CREATE TABLE IF NOT EXISTS public.provider_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,   -- nullable => global default
  channel message_channel_enum NOT NULL,
  provider text NOT NULL,
  country_code text NOT NULL DEFAULT 'KE',
  unit_price numeric(12,4) NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pricing_lookup ON public.provider_pricing(channel, provider, country_code) WHERE is_active;

-- Seed global default pricing
INSERT INTO public.provider_pricing (tenant_id, channel, provider, country_code, unit_price, currency, notes)
VALUES
  (NULL,'sms','africastalking','KE',0.80,'KES','Per SMS, Safaricom/Airtel KE'),
  (NULL,'sms','africastalking','UG',32.00,'UGX','Per SMS Uganda'),
  (NULL,'sms','africastalking','TZ',25.00,'TZS','Per SMS Tanzania'),
  (NULL,'sms','twilio','KE',5.50,'KES','Per SMS via Twilio'),
  (NULL,'whatsapp','meta','KE',0.50,'KES','Per utility conversation Kenya'),
  (NULL,'whatsapp','meta','UG',20.00,'UGX','Per utility conversation Uganda'),
  (NULL,'whatsapp','meta','TZ',15.00,'TZS','Per utility conversation Tanzania'),
  (NULL,'email','resend','KE',0.30,'KES','Per email'),
  (NULL,'voice','africastalking','KE',6.00,'KES','Per minute Kenya'),
  (NULL,'in_app','internal','KE',0.00,'KES','Free'),
  (NULL,'push','internal','KE',0.00,'KES','Free')
ON CONFLICT DO NOTHING;

-- ============ TIMESTAMP TRIGGERS ============
CREATE TRIGGER tg_messages_updated BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_templates_updated BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_campaigns_updated BEFORE UPDATE ON public.broadcast_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_pref_updated BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS ============
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_pricing ENABLE ROW LEVEL SECURITY;

-- Templates: tenant members can read/write
CREATE POLICY "templates_read" ON public.message_templates FOR SELECT
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "templates_write" ON public.message_templates FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Messages
CREATE POLICY "messages_read" ON public.messages FOR SELECT
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "messages_write" ON public.messages FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Campaigns
CREATE POLICY "campaigns_read" ON public.broadcast_campaigns FOR SELECT
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "campaigns_write" ON public.broadcast_campaigns FOR ALL
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Notifications: only the owning user
CREATE POLICY "notif_own_read" ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "notif_own_update" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "notif_own_delete" ON public.notifications FOR DELETE
  USING (user_id = auth.uid());
CREATE POLICY "notif_tenant_insert" ON public.notifications FOR INSERT
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Preferences: only owner
CREATE POLICY "pref_own_all" ON public.notification_preferences FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Opt-outs: tenant members read; only members can insert
CREATE POLICY "optouts_read" ON public.message_opt_outs FOR SELECT
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY "optouts_insert" ON public.message_opt_outs FOR INSERT
  WITH CHECK (public.is_tenant_member(tenant_id));

-- Pricing: tenant members can read global (tenant_id IS NULL) + their tenant rows; only members can write tenant rows
CREATE POLICY "pricing_read" ON public.provider_pricing FOR SELECT
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));
CREATE POLICY "pricing_write_tenant" ON public.provider_pricing FOR ALL
  USING (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id))
  WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id));

-- ============ SEED DEFAULT TEMPLATES PER TENANT ============
CREATE OR REPLACE FUNCTION public.seed_default_message_templates(_tenant uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.message_templates (tenant_id, name, slug, channel, category, subject, body, variables, whatsapp_template_name, is_system) VALUES
    (_tenant,'Fee reminder (friendly)','fee_reminder_friendly','whatsapp','fee_reminder',NULL,
      'Hi {{guardian_name}}, this is a gentle reminder that {{student_name}}''s term fees of {{currency}} {{balance}} are due on {{due_date}}. Pay via Paybill {{paybill}}, account {{account}}. Asante.',
      '["guardian_name","student_name","currency","balance","due_date","paybill","account"]'::jsonb,
      'fee_reminder_friendly', true),
    (_tenant,'Fee reminder (firm)','fee_reminder_firm','whatsapp','fee_reminder',NULL,
      'Dear {{guardian_name}}, {{student_name}} has an outstanding balance of {{currency}} {{balance}} overdue since {{due_date}}. Kindly settle to avoid disruption to learning.',
      '["guardian_name","student_name","currency","balance","due_date"]'::jsonb,
      'fee_reminder_firm', true),
    (_tenant,'Absence alert','attendance_absence','whatsapp','attendance_alert',NULL,
      'Dear parent, this is to inform you that {{student_name}} was absent today, {{date}}. Please get in touch if this is unexpected.',
      '["student_name","date"]'::jsonb,
      'attendance_absence', true),
    (_tenant,'Exam result ready','exam_result_ready','whatsapp','exam_result',NULL,
      'Dear {{guardian_name}}, {{student_name}}''s {{exam_name}} report card is now available. View here: {{link}}',
      '["guardian_name","student_name","exam_name","link"]'::jsonb,
      'exam_result_ready', true),
    (_tenant,'Meeting invitation','meeting_invitation','whatsapp','meeting',NULL,
      'Dear {{guardian_name}}, you are invited to a meeting on {{date}} at {{time}} regarding {{topic}}. Venue: {{venue}}.',
      '["guardian_name","date","time","topic","venue"]'::jsonb,
      'meeting_invitation', true),
    (_tenant,'Event announcement','event_announcement','whatsapp','announcement',NULL,
      'Dear parent, please note: {{title}} on {{date}}. {{details}}',
      '["title","date","details"]'::jsonb,
      'event_announcement', true),
    (_tenant,'Payment received','payment_received_receipt','whatsapp','payment_receipt',NULL,
      'Hi {{guardian_name}}, we have received {{currency}} {{amount}} for {{student_name}}. Receipt: {{receipt}}. New balance: {{currency}} {{balance}}.',
      '["guardian_name","currency","amount","student_name","receipt","balance"]'::jsonb,
      'payment_received_receipt', true),
    (_tenant,'Emergency alert','emergency_alert','whatsapp','emergency',NULL,
      'URGENT: {{message}} — {{school_name}}',
      '["message","school_name"]'::jsonb,
      'emergency_alert', true),
    -- SMS variants (shorter)
    (_tenant,'Fee reminder SMS','fee_reminder_friendly','sms','fee_reminder',NULL,
      '{{student_name}} owes {{currency}} {{balance}} due {{due_date}}. Pay Paybill {{paybill}} A/C {{account}}. {{school_name}}',
      '["student_name","currency","balance","due_date","paybill","account","school_name"]'::jsonb,
      NULL, true),
    (_tenant,'Absence SMS','attendance_absence','sms','attendance_alert',NULL,
      '{{student_name}} was absent on {{date}}. Reply or call school if unexpected. {{school_name}}',
      '["student_name","date","school_name"]'::jsonb,
      NULL, true),
    (_tenant,'Payment SMS','payment_received_receipt','sms','payment_receipt',NULL,
      'Received KES {{amount}} for {{student_name}}. Rcpt {{receipt}}. Bal {{currency}} {{balance}}. {{school_name}}',
      '["amount","student_name","receipt","currency","balance","school_name"]'::jsonb,
      NULL, true),
    -- Email variants
    (_tenant,'Fee reminder email','fee_reminder_friendly','email','fee_reminder',
      'Fee reminder for {{student_name}}',
      'Dear {{guardian_name}},\n\nThis is a gentle reminder that {{student_name}}''s term fees of {{currency}} {{balance}} are due on {{due_date}}.\n\nPayment options:\n- M-Pesa Paybill: {{paybill}} | Account: {{account}}\n\nThank you,\n{{school_name}}',
      '["guardian_name","student_name","currency","balance","due_date","paybill","account","school_name"]'::jsonb,
      NULL, true),
    (_tenant,'Exam result email','exam_result_ready','email','exam_result',
      '{{student_name}}''s {{exam_name}} report is ready',
      'Dear {{guardian_name}},\n\n{{student_name}}''s {{exam_name}} report card is now available.\n\nView/download: {{link}}\n\n{{school_name}}',
      '["guardian_name","student_name","exam_name","link","school_name"]'::jsonb,
      NULL, true)
  ON CONFLICT (tenant_id, slug, channel) DO NOTHING;
END $$;

-- Extend handle_new_tenant to also seed templates
CREATE OR REPLACE FUNCTION public.handle_new_tenant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_role_id uuid;
BEGIN
  IF v_user IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.tenant_users (tenant_id, user_id, is_active)
  VALUES (NEW.id, v_user, true)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_role_id FROM public.roles
    WHERE name = 'school_admin' AND is_system = true LIMIT 1;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id, tenant_id)
    VALUES (v_user, v_role_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.profiles SET default_tenant_id = NEW.id
    WHERE id = v_user AND default_tenant_id IS NULL;

  -- Seed default messaging templates for the new tenant
  PERFORM public.seed_default_message_templates(NEW.id);

  RETURN NEW;
END;
$$;

-- Backfill templates for existing tenants
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.tenants LOOP
    PERFORM public.seed_default_message_templates(r.id);
  END LOOP;
END $$;