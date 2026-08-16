ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receipt_id uuid REFERENCES public.student_receipts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS messages_receipt_id_idx ON public.messages(receipt_id) WHERE receipt_id IS NOT NULL;

INSERT INTO public.permissions(key, description, category) VALUES
  ('fees.bulk_export', 'Bulk download receipts as ZIP', 'fees'),
  ('fees.regenerate_receipt', 'Regenerate a receipt PDF', 'fees'),
  ('fees.email_receipt', 'Email receipts to guardians', 'fees')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.key IN ('fees.bulk_export', 'fees.regenerate_receipt', 'fees.email_receipt')
WHERE r.name IN ('school_admin', 'principal', 'bursar')
  AND NOT (r.name = 'principal' AND p.key = 'fees.regenerate_receipt')
ON CONFLICT DO NOTHING;