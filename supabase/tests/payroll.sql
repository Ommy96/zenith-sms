-- pg-tap tests for public.calc_kenya_payroll
-- Run via: supabase test db
--
-- Each plan() call below is a self-contained check. We use the JSONB result
-- and assert key fields against pre-computed reference values.

BEGIN;
SELECT plan(14);

-- Helper to extract a numeric field from the JSONB result.
CREATE OR REPLACE FUNCTION pg_temp.pf(_basic numeric)
RETURNS jsonb LANGUAGE sql AS $$
  SELECT public.calc_kenya_payroll(_basic, 0, 0, 0, 0, 0, true, true, true, true, 2400, 0);
$$;

-- SHIF
SELECT is( (pg_temp.pf(5000)   ->> 'shif')::numeric, 300::numeric,  'SHIF floor at KES 300');
SELECT is( (pg_temp.pf(50000)  ->> 'shif')::numeric, 1375::numeric, 'SHIF 2.75% of 50k');

-- NSSF
SELECT is( (pg_temp.pf(5000)   ->> 'nssf')::numeric, 300::numeric,  'NSSF 6% of 5k');
SELECT is( (pg_temp.pf(8000)   ->> 'nssf')::numeric, 480::numeric,  'NSSF Tier I cap');
SELECT is( (pg_temp.pf(20000)  ->> 'nssf')::numeric, 1200::numeric, 'NSSF Tier I + 6% of 12k');
SELECT is( (pg_temp.pf(100000) ->> 'nssf')::numeric, 4320::numeric, 'NSSF Tier I+II cap at 100k');

-- Housing Levy
SELECT is( (pg_temp.pf(50000)  ->> 'housing_levy')::numeric, 750::numeric,  'AHL 1.5% of 50k');
SELECT is( (pg_temp.pf(100000) ->> 'housing_levy')::numeric, 1500::numeric, 'AHL 1.5% of 100k');

-- PAYE at the income points required by the audit
SELECT cmp_ok( (pg_temp.pf(20000)  ->> 'paye')::numeric, '=', 0::numeric, 'PAYE = 0 at 20k after relief');
SELECT cmp_ok( (pg_temp.pf(50000)  ->> 'paye')::numeric, '>', 6000::numeric, 'PAYE > 6k at 50k');
SELECT cmp_ok( (pg_temp.pf(50000)  ->> 'paye')::numeric, '<', 9000::numeric, 'PAYE < 9k at 50k');
SELECT cmp_ok( (pg_temp.pf(100000) ->> 'paye')::numeric, '>', 19000::numeric, 'PAYE > 19k at 100k');
SELECT cmp_ok( (pg_temp.pf(250000) ->> 'paye')::numeric, '>', 60000::numeric, 'PAYE > 60k at 250k');
SELECT cmp_ok( (pg_temp.pf(500000) ->> 'paye')::numeric, '>', 135000::numeric, 'PAYE > 135k at 500k');

SELECT * FROM finish();
ROLLBACK;