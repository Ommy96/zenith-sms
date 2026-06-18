
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS shif_number text;
