## Mobile Money (M-Pesa Daraja) submodule

Add `/finance/mobile-money` with three tabs, plus Daraja integration via edge functions and webhook.

### Database (migration)

New tables (all RLS-scoped to `school_id`, admin-manageable, members can view):

- `mpesa_config` — one row per school. Fields: `school_id` (unique), `environment` (sandbox|production), `shortcode`, `shortcode_type` (paybill|till), `consumer_key`, `consumer_secret`, `passkey`, `initiator_name`, `is_active`, timestamps. Secrets stored encrypted using pgsodium-style approach — actual encryption done in edge function before insert; column kept as text but never exposed to client (RLS allows admin only; client UI masks).
- `mpesa_transactions` — incoming C2B. Fields: `school_id`, `mpesa_receipt` (unique), `transaction_type`, `transaction_time` (timestamptz), `amount`, `phone`, `account_reference`, `bill_ref_number`, `org_account_balance`, `first_name`, `middle_name`, `last_name`, `matched_student_id` (nullable), `matched_invoice_id` (nullable), `status` (matched|unmatched|reversed), `raw_payload` jsonb.
- `mpesa_stk_requests` — STK push log. Fields: `school_id`, `invoice_id`, `student_id`, `phone`, `amount`, `merchant_request_id`, `checkout_request_id`, `account_reference`, `status` (pending|success|failed|cancelled), `result_code`, `result_desc`, `mpesa_receipt`.

### Edge functions

- `mpesa-test-connection` (auth required, admin) — fetches Daraja OAuth token using stored credentials; returns ok/fail.
- `mpesa-stk-push` (auth required) — generates password (shortcode+passkey+timestamp), posts to `/mpesa/stkpush/v1/processrequest`, stores row in `mpesa_stk_requests`.
- `mpesa-c2b-callback` (`verify_jwt = false`, public webhook) — receives Safaricom C2B confirmation. Looks up school by shortcode. Inserts into `mpesa_transactions`. Auto-matches by `account_reference` against `students.admission_number`. If matched, finds latest unpaid invoice, increments `paid_amount`, updates status (`paid`/`partial`). Logs activity. (SMS optional — left as a TODO log line; we'll send via existing channel if present, otherwise no-op.)
- `mpesa-stk-callback` (`verify_jwt = false`, public webhook) — updates `mpesa_stk_requests` row by `checkout_request_id`.

Callback URL pattern shown in UI:
`${VITE_SUPABASE_URL}/functions/v1/mpesa-c2b-callback?school=<school_id>`

### Frontend

- `src/pages/MobileMoney.tsx` with shadcn `Tabs`: Configuration / Transactions / STK Push.
- Add route `/finance/mobile-money` in `App.tsx`, link from Finance page and sidebar (Finance section).
- **Configuration tab**: form bound to `mpesa_config`; secrets shown as password inputs with reveal toggle; auto-generated Callback URL with copy button; "Test connection" calls `mpesa-test-connection` and toasts result.
- **Transactions tab**: table from `mpesa_transactions` with realtime subscription (enable publication on table). Filters: date range, status select, amount min/max. Unmatched rows have a "Match student" combobox + Save button → updates `matched_student_id` and (optionally) applies to selected invoice via dialog.
- **STK Push tab**: form (select student → list unpaid invoices → phone prefilled from guardian → amount prefilled from invoice balance), submit → calls `mpesa-stk-push`. Below: history table from `mpesa_stk_requests` with realtime.

### Out of scope / notes

- Real SMS dispatch requires an SMS provider; I'll log intent and leave a hook. Mention to user.
- Encryption: Daraja secrets stored in `mpesa_config` rows; access locked down by RLS to school admins. For stronger at-rest encryption we'd add Vault — happy to follow up.
- Will use Daraja sandbox URLs by default; toggle for production.