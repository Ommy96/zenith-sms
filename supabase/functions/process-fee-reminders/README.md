# Fee reminders

Daily worker retains cron job 8 at 05:00 UTC / 08:00 EAT. Auth accepts the vault-backed x-zenith-cron-key or existing internal credential. No admin or portal files are changed.

The service-only claim_fee_reminder RPC locks per tenant/student and checks both sent_at and attempted_at since EAT midnight. Failed and dry-run attempts also reserve the day to prevent repeated sends. Existing fields and history are retained; reminder_type and reminder_tier are both populated.

Tenant settings use keys fee_reminders_enabled (default true) and fee_reminder_time (default 08:00). Custom-time execution is not implemented: the retained single daily cron only wakes at 08:00. Do not advertise arbitrary timing until a scheduling solution is approved.

Meta submission: fee_reminder_gentle, fee_reminder_firm, fee_reminder_final, category Utility, language en. Convert named body placeholders to positional Meta parameters in this exact order:
1. parent_first_name
2. student_name
3. balance_amount
4. paybill_number
5. account_number
6. school_name
7. due_date

Use the WhatsApp bodies stored in message_templates; they include the due date to match parameter 7. SMS template sources are under 160 characters, but long interpolated names can exceed one SMS segment. Provider credential setup and Meta approval are external prerequisites; do not change dry-run during verification.

Validation: deno test --allow-env --allow-net supabase/functions/process-fee-reminders/rules_test.ts supabase/functions/process-fee-reminders/flow_test.ts

15 tests passed, including the actual handler against isolated database HTTP fixtures. Two live dry-run calls returned HTTP 200, tenants=1, candidates=0, sent=0, dry_run=0, errors=0. An unauthorized call returned 401. Brian's live partial invoice has balance 500 and due date 2026-10-22: it is not overdue on 2026-10-17, so no live reminder/message rows were created. No live invoices or opt-outs were edited for tests. Live populated-record read-back and database-level concurrent claim verification remain unverified.

24 pre-existing database security findings remain unrelated to this repair.