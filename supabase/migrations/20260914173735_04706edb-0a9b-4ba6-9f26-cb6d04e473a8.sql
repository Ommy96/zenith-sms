DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'zenith_cron_key') THEN
    PERFORM vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'zenith_cron_key', 'Internal key used by pg_cron to call Zenith edge functions');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.verify_cron_key(_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets
    WHERE name = 'zenith_cron_key' AND decrypted_secret = _key
  );
$$;

REVOKE ALL ON FUNCTION public.verify_cron_key(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_key(text) TO service_role;