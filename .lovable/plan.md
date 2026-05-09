# WhatsApp Submodule (Communication)

A new page at `/communication/whatsapp` with four tabs, plus backend integration with Meta WhatsApp Cloud API.

## Database (new tables, all RLS-scoped to `school_id`)

- **`whatsapp_config`** — one row per school
  - `phone_number_id`, `access_token`, `business_account_id`, `webhook_verify_token`, `display_phone_number`, `is_active`, `daily_message_limit` (default 1000), `messages_sent_today`, `last_reset_date`
- **`whatsapp_templates`** — approved templates synced from Meta
  - `name`, `category` (utility/marketing/auth), `language` (default `en`), `body_template`, `placeholder_count`, `placeholder_labels` (jsonb e.g. `["student_name","amount"]`), `status` (approved/pending/rejected), `usage_count`, `last_used_at`
  - Seeded with `fee_reminder`, `attendance_alert`, `report_card_ready`
- **`whatsapp_broadcasts`** — broadcast jobs
  - `template_id`, `audience_type` (class/defaulters/all_parents/custom), `audience_filter` (jsonb), `recipient_count`, `sent_count`, `failed_count`, `status`, `created_by`, `started_at`, `completed_at`
- **`whatsapp_messages`** — every outbound + inbound message
  - `direction` (in/out), `wa_message_id`, `from_phone`, `to_phone`, `student_id` (nullable, matched by phone), `template_id` (nullable), `broadcast_id` (nullable), `body`, `status` (queued/sent/delivered/read/failed/received), `error`, `raw_payload`, `created_at`

Realtime enabled on `whatsapp_messages` for live inbox.

## Edge Functions

- **`whatsapp-send`** — auth required. Body `{ to, template_name, params[], student_id? }`. Checks rate limit (`messages_sent_today < daily_message_limit`, resets daily). Calls Meta `/{phone_number_id}/messages`, logs to `whatsapp_messages`, increments `usage_count` and `messages_sent_today`.
- **`whatsapp-broadcast`** — auth required. Body `{ template_id, audience_type, audience_filter, params_per_recipient }`. Resolves recipients (students by class / defaulters via unpaid invoices / all parents), inserts `whatsapp_broadcasts` row, fans out to `whatsapp-send`, updates counts.
- **`whatsapp-webhook`** — public. `GET` returns hub.challenge if `verify_token` matches school's `webhook_verify_token` (token passed as query → looked up via `phone_number_id`). `POST` receives delivery statuses (updates message `status`) and inbound messages (insert with `direction='in'`, attempt match by `from_phone` → `students.guardian_phone`).
- **`whatsapp-test-connection`** — calls Meta `/{phone_number_id}` with token to validate.

`supabase/config.toml`: `whatsapp-webhook` with `verify_jwt = false`.

## Frontend — `src/pages/WhatsApp.tsx`

Tabs (shadcn `Tabs`):

1. **Connection** — form bound to `whatsapp_config`. Fields for Phone Number ID, Access Token (password), Business Account ID, Webhook Verify Token. Auto-generated webhook URL (`{SUPABASE_URL}/functions/v1/whatsapp-webhook`) with copy button. "Test connection" button → `whatsapp-test-connection`. Daily rate limit input.

2. **Templates** — table of `whatsapp_templates` with name, category, status badge, placeholder count, usage count, last used. "Add template" dialog with body editor showing `{{1}}`, `{{2}}` and label inputs. Per-template stats card (sent/delivered/read funnel from `whatsapp_messages` aggregated).

3. **Broadcast** — form: select template (dropdown), select audience (class dropdown / defaulters / all parents), dynamic placeholder inputs (with helpful tokens like `{{student_name}}` auto-filled per recipient), recipient count preview, "Send" → `whatsapp-broadcast`. History table of past broadcasts with status + counts.

4. **Inbox** — list of conversations grouped by student/phone (left rail), message thread view (right). Realtime subscription on `whatsapp_messages where direction='in'`. Reply box sends free-form session message via `whatsapp-send` (within 24h window).

## Messaging Inbox surfacing

`src/pages/Communication.tsx` main inbox already lists messages — extend its query to also pull recent inbound `whatsapp_messages` and show a WhatsApp icon badge on those threads. Clicking opens the WhatsApp inbox tab filtered to that student.

## Rate limiting & stats

- Per-tenant: `daily_message_limit` enforced in `whatsapp-send` (returns 429 when exceeded). Daily counter reset when `last_reset_date < today`.
- Per-template: `usage_count` incremented per send; aggregations on Templates tab show delivered/read rates from `whatsapp_messages.status`.

## Routes & nav

- Route `/communication/whatsapp` in `src/App.tsx`.
- Sidebar entry under Communication in `src/components/AppSidebar.tsx`.

## Secrets

No secrets required up front — credentials live per-tenant in `whatsapp_config`. The webhook is publicly reachable and validated by `verify_token` lookup.

## Out of scope

- Submitting templates to Meta for approval (admins do that in Meta Business Manager; we just record approved ones).
- Media messages (images/PDFs) — text only in v1.
- Two-way conversational flows beyond plain replies.
