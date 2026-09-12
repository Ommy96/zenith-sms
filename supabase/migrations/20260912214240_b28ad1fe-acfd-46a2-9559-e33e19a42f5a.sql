
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname IN ('generate_invoice_number','generate_payment_number','generate_receipt_number',
        'generate_credit_note_number','generate_expense_number','recompute_invoice_totals',
        '_tg_invoice_number','_tg_payment_number','_tg_receipt_number','_tg_credit_note_number',
        '_tg_expense_number','_tg_recompute_invoice','_tg_payment_status_refresh','_tg_mpesa_match_student')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;
END $$;
