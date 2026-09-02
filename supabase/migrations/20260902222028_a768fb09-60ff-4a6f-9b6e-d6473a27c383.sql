ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS recipient_phone text,
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS related_entity_type text,
  ADD COLUMN IF NOT EXISTS related_entity_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'messages_direction_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_direction_check
      CHECK (direction IS NULL OR direction IN ('outbound', 'inbound'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_recipient
  ON public.messages(tenant_id, recipient_type, recipient_id);

NOTIFY pgrst, 'reload schema';