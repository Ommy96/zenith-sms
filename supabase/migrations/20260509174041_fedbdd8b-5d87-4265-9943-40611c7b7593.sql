
CREATE TABLE public.whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE,
  phone_number_id text,
  access_token text,
  business_account_id text,
  webhook_verify_token text,
  display_phone_number text,
  is_active boolean NOT NULL DEFAULT true,
  daily_message_limit integer NOT NULL DEFAULT 1000,
  messages_sent_today integer NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage whatsapp config" ON public.whatsapp_config
  FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'));

CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'utility',
  language text NOT NULL DEFAULT 'en',
  body_template text NOT NULL,
  placeholder_count integer NOT NULL DEFAULT 0,
  placeholder_labels jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'approved',
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage whatsapp templates" ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'));
CREATE POLICY "School members view whatsapp templates" ON public.whatsapp_templates
  FOR SELECT TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.whatsapp_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  template_id uuid REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  audience_type text NOT NULL,
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued',
  created_by uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage whatsapp broadcasts" ON public.whatsapp_broadcasts
  FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'));
CREATE POLICY "School members view whatsapp broadcasts" ON public.whatsapp_broadcasts
  FOR SELECT TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  direction text NOT NULL,
  wa_message_id text,
  from_phone text,
  to_phone text,
  student_id uuid,
  template_id uuid,
  broadcast_id uuid,
  body text,
  status text NOT NULL DEFAULT 'queued',
  error text,
  raw_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wa_messages_school_created ON public.whatsapp_messages (school_id, created_at DESC);
CREATE INDEX idx_wa_messages_student ON public.whatsapp_messages (student_id);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage whatsapp messages" ON public.whatsapp_messages
  FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'));
CREATE POLICY "School members view whatsapp messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_whatsapp_config_updated_at BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;

-- Seed default templates for every existing school
INSERT INTO public.whatsapp_templates (school_id, name, category, body_template, placeholder_count, placeholder_labels)
SELECT s.id, 'fee_reminder', 'utility',
  'Hi {{1}}, this is a reminder that {{2}} has an outstanding balance of KES {{3}}. Pay via Paybill {{4}}, account {{5}}.',
  5, '["guardian_name","student_name","amount","paybill","account"]'::jsonb
FROM public.schools s
ON CONFLICT (school_id, name) DO NOTHING;

INSERT INTO public.whatsapp_templates (school_id, name, category, body_template, placeholder_count, placeholder_labels)
SELECT s.id, 'attendance_alert', 'utility',
  'Dear parent, {{1}} was marked absent today {{2}}.',
  2, '["student_name","date"]'::jsonb
FROM public.schools s
ON CONFLICT (school_id, name) DO NOTHING;

INSERT INTO public.whatsapp_templates (school_id, name, category, body_template, placeholder_count, placeholder_labels)
SELECT s.id, 'report_card_ready', 'utility',
  'Dear parent, {{1}}''s report card is ready: {{2}}',
  2, '["student_name","link"]'::jsonb
FROM public.schools s
ON CONFLICT (school_id, name) DO NOTHING;
