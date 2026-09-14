DROP EXTENSION IF EXISTS pg_net;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION pg_net WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, service_role;