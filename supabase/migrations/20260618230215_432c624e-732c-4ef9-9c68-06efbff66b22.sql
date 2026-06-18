
-- Section 9.1: Report card delivery tracking columns
ALTER TABLE public.report_card_runs
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_status text;

ALTER TABLE public.report_cards
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS delivery_error text,
  ADD COLUMN IF NOT EXISTS message_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
