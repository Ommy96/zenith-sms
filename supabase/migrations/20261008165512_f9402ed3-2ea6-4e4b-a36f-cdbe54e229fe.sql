DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('invoices','created_by'),('payments','received_by'),('payment_allocations','allocated_by'),
    ('student_receipts','issued_by'),('credit_notes','approved_by'),('student_discounts','approved_by'),
    ('fee_reminders','sent_by'),('expenses','requested_by'),('expenses','approved_by'),('expenses','paid_by')
  ) v(t, c) LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.t, r.t||'_'||r.c||'_fkey');
    EXECUTE format('UPDATE public.%I SET %I = NULL WHERE %I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = %I.%I)', r.t, r.c, r.c, r.t, r.c);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL', r.t, r.t||'_'||r.c||'_fkey', r.c);
  END LOOP;
END $$;