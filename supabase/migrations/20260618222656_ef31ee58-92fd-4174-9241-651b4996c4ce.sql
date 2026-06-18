-- 3.1: Lock down sensitive tables with explicit deny-all policies (defensive even though
-- RLS enabled + no policy already denies), and grant SELECT on subscription_plans to
-- anon/authenticated so the existing public policy is actually reachable via PostgREST.
-- 3.4: mpesa_transactions already has UNIQUE (tenant_id, mpesa_receipt) — re-asserted
-- via a no-op DO block + comment so the invariant is documented in migration history.

-- nemis_credentials: service-role only. No client (anon/authenticated) may read/write.
REVOKE ALL ON public.nemis_credentials FROM anon, authenticated;
GRANT ALL ON public.nemis_credentials TO service_role;

DROP POLICY IF EXISTS "nemis_credentials deny client access" ON public.nemis_credentials;
CREATE POLICY "nemis_credentials deny client access"
  ON public.nemis_credentials
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.nemis_credentials IS
  'Encrypted NEMIS portal credentials. Service-role only. Accessed exclusively by the nemis-credentials and nemis-import edge functions.';

-- portal_otps: service-role only (portal-send-otp / portal-verify-otp edge functions).
REVOKE ALL ON public.portal_otps FROM anon, authenticated;
GRANT ALL ON public.portal_otps TO service_role;

DROP POLICY IF EXISTS "portal_otps deny client access" ON public.portal_otps;
CREATE POLICY "portal_otps deny client access"
  ON public.portal_otps
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.portal_otps IS
  'One-time passwords for parent-portal phone login. Service-role only. Written by portal-send-otp, consumed by portal-verify-otp.';

-- subscription_plans: read-public so signup/billing pages can show plans without auth.
-- Existing policy "Plans are public-readable" already permits SELECT for everyone, but
-- PostgREST needs the table-level GRANT too — otherwise the policy is unreachable.
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

COMMENT ON TABLE public.subscription_plans IS
  'Public catalogue of SaaS billing plans. Readable by anon + authenticated so signup, marketing and billing pages can render the pricing table without authentication. Writes are restricted to service_role (no client INSERT/UPDATE/DELETE policy exists).';

-- 3.4: Re-assert M-Pesa idempotency invariant.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mpesa_transactions'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%(tenant_id, mpesa_receipt)%'
  ) THEN
    ALTER TABLE public.mpesa_transactions
      ADD CONSTRAINT mpesa_transactions_tenant_receipt_key
      UNIQUE (tenant_id, mpesa_receipt);
  END IF;
END $$;

COMMENT ON CONSTRAINT mpesa_transactions_school_id_mpesa_receipt_key ON public.mpesa_transactions IS
  'Idempotency anchor: Safaricom retries the same callback up to 5x. UNIQUE (tenant_id, mpesa_receipt) means the second insert raises 23505, which the mpesa-c2b-callback handler catches and returns ResultCode 0 (Accepted, duplicate). No double payment, double receipt, or double parent notification.';
