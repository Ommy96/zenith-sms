DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY['_tg_touch_setup_progress','_tg_tenant_logo_setup_progress',
    '_tg_inventory_stock','_tg_library_loan_issue','_tg_library_loan_return','_tg_merit_activity']
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I() FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END $$;