
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.mpesa_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE,
  environment text NOT NULL DEFAULT 'sandbox',
  shortcode text,
  shortcode_type text NOT NULL DEFAULT 'paybill',
  consumer_key text,
  consumer_secret text,
  passkey text,
  initiator_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mpesa_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage mpesa config" ON public.mpesa_config FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'));

CREATE TABLE public.mpesa_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  mpesa_receipt text NOT NULL,
  transaction_type text,
  transaction_time timestamptz NOT NULL DEFAULT now(),
  amount numeric NOT NULL DEFAULT 0,
  phone text,
  account_reference text,
  bill_ref_number text,
  org_account_balance numeric,
  first_name text, middle_name text, last_name text,
  matched_student_id uuid,
  matched_invoice_id uuid,
  status text NOT NULL DEFAULT 'unmatched',
  raw_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, mpesa_receipt)
);
CREATE INDEX idx_mpesa_tx_school_time ON public.mpesa_transactions (school_id, transaction_time DESC);
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School members view mpesa transactions" ON public.mpesa_transactions FOR SELECT TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins manage mpesa transactions" ON public.mpesa_transactions FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'));

CREATE TABLE public.mpesa_stk_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  invoice_id uuid,
  student_id uuid,
  phone text NOT NULL,
  amount numeric NOT NULL,
  account_reference text,
  merchant_request_id text,
  checkout_request_id text,
  status text NOT NULL DEFAULT 'pending',
  result_code text,
  result_desc text,
  mpesa_receipt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stk_school_time ON public.mpesa_stk_requests (school_id, created_at DESC);
CREATE INDEX idx_stk_checkout_request ON public.mpesa_stk_requests (checkout_request_id);
ALTER TABLE public.mpesa_stk_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School members view stk requests" ON public.mpesa_stk_requests FOR SELECT TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins manage stk requests" ON public.mpesa_stk_requests FOR ALL TO authenticated
  USING (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'))
  WITH CHECK (school_id = get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'school_admin'));

CREATE TRIGGER trg_mpesa_config_updated BEFORE UPDATE ON public.mpesa_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_stk_updated BEFORE UPDATE ON public.mpesa_stk_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.mpesa_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mpesa_stk_requests;
