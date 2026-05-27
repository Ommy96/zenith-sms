
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code subscription_plan NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_monthly_usd numeric(10,2) NOT NULL DEFAULT 0,
  price_annual_usd numeric(10,2) NOT NULL DEFAULT 0,
  max_students integer,
  max_staff integer,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are public-readable" ON public.subscription_plans FOR SELECT USING (true);

CREATE TABLE public.tenant_billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  plan_code subscription_plan NOT NULL,
  amount_usd numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  hosted_invoice_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tenant_billing_invoices_tenant ON public.tenant_billing_invoices(tenant_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_billing_invoices TO authenticated;
GRANT ALL ON public.tenant_billing_invoices TO service_role;
ALTER TABLE public.tenant_billing_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members read own billing" ON public.tenant_billing_invoices
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT default_tenant_id FROM public.profiles WHERE id = auth.uid())
    OR public.is_super_admin(auth.uid())
  );
CREATE POLICY "Super admins manage billing" ON public.tenant_billing_invoices
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.super_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_super_admin_audit_actor ON public.super_admin_audit_log(actor_id, created_at DESC);
GRANT SELECT, INSERT ON public.super_admin_audit_log TO authenticated;
GRANT ALL ON public.super_admin_audit_log TO service_role;
ALTER TABLE public.super_admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins read audit" ON public.super_admin_audit_log
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins insert audit" ON public.super_admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) AND actor_id = auth.uid());

INSERT INTO public.subscription_plans (code, name, description, price_monthly_usd, price_annual_usd, max_students, max_staff, features, sort_order) VALUES
  ('free',       'Free',       'For pilots and very small schools', 0,    0,     50,   10,  '["Core SIS","Attendance","1 admin user"]'::jsonb, 1),
  ('starter',    'Starter',    'For growing primary schools',        29,   290,   250,  25,  '["Everything in Free","Fees & invoicing","M-Pesa integration","SMS messaging"]'::jsonb, 2),
  ('standard',   'Standard',   'For established schools',            79,   790,   750,  75,  '["Everything in Starter","Examinations & report cards","Parent portal","WhatsApp"]'::jsonb, 3),
  ('pro',        'Pro',        'For multi-campus schools',           199,  1990,  2000, 200, '["Everything in Standard","AI Copilot","Timetable optimizer","Compliance reports"]'::jsonb, 4),
  ('enterprise', 'Enterprise', 'Custom pricing, dedicated support',  0,    0,     NULL, NULL,'["Everything in Pro","SSO/SAML","Dedicated CSM","Custom SLA"]'::jsonb, 5)
ON CONFLICT (code) DO NOTHING;
