# Finance Engine — Phased Plan

The existing migration already gives us `fee_categories`, `fee_structures`, `fee_items`, `student_invoices` (with auto-numbering and live balance triggers), `student_payments` with `payment_allocations`, `student_receipts`, `mpesa_config`, `mpesa_transactions`, `mpesa_stk_requests` and four M-Pesa edge functions. I'll **extend** rather than rebuild.

Below is what each phase ships. Each phase is independently shippable.

## Phase A — Schema extensions & reconciliation glue
- Add to `fee_items`: `frequency` (per_term/per_year/one_off), `applies_to_terms jsonb`, `late_fee_amount`, `late_fee_after_days`, `learner_category` (day/boarder/all).
- Add to `fee_structures`: `grade_level_id`, `class_id`, `learner_category`.
- Add `scholarships` (tenant, name, type, amount, criteria) and `student_fee_adjustments` (link student→scholarship, custom amount, valid_until, approved_by). Wire into the existing invoice trigger so adjustments recompute totals.
- Add `mpesa_transactions.tenant_id`, `matched_invoice_id`, `matched_payment_id`, `status` (matched/unmatched/disputed/duplicate), `account_reference_raw` and a UNIQUE index on `mpesa_receipt_number` per tenant for idempotency.
- Add `payment_reminders_config` (per tenant: thresholds, channels) and `reminder_log`.
- New permissions: `payroll.*`, `expenses.*`, `mpesa.configure`.

## Phase B — M-Pesa "Mobile Money" overhaul
Rewrite `src/pages/MobileMoney.tsx` into 3 tabs:
1. **Configuration** — paybill/till, env, credentials (write-only via vault-style RPC), callback URL with copy button, "Test connection" wired to existing `mpesa-test-connection` fn.
2. **Transactions** — live feed of `mpesa_transactions` with filters, status badges, manual "Resolve" dialog (search student → match → triggers reconciliation RPC that creates `student_payment` + allocation + receipt).
3. **STK Push** — student picker → autoloads outstanding invoices → guardian phone → "Send" (existing `mpesa-stk-push`) → polls request status with timeout.

Backend:
- Rewrite `supabase/functions/mpesa-c2b-callback`: idempotent on `mpesa_receipt_number`, normalize `account_reference` (regex strip spaces/dashes/case), find student by admission_number, find oldest outstanding invoice, insert payment + allocation + receipt, queue notification, mark `matched`/`unmatched`.
- Add `manual_reconcile_mpesa(_txn, _student, _invoice)` SQL function used by the Resolve dialog.
- Realtime: enable on `mpesa_transactions` so the feed updates live.

## Phase C — Student fee ledger + bursar dashboard
- `StudentProfile.tsx` — add **Fees** tab: current balance, statement (charges + payments interleaved), outstanding invoices with **Pay now** (opens STK dialog prefilled), receipt download buttons, PDF export.
- Replace stats area of `Finance.tsx` with bursar dashboard cards: today's collections by method, term collected vs invoiced %, outstanding by class, aging buckets (0-30/31-60/61-90/90+), top defaulters, method mix donut, recent transactions feed.
- Edge function `generate-statement-pdf` (pdf-lib).

## Phase D — Reminders & scheduling
- `process-fee-reminders` edge function: scans invoices, sends SMS/WhatsApp per tenant config, logs to `reminder_log` (uses existing WhatsApp + SMS infra).
- pg_cron job to run hourly. (Tenant-specific cron written via `supabase--insert`.)

## Phase E — Payroll (Kenya-first)
- Tables: `payroll_runs`, `payroll_items` with `gross`, `allowances jsonb`, `paye`, `shif`, `nssf_tier1`, `nssf_tier2`, `housing_levy`, `other_deductions jsonb`, `net_pay`.
- Pure-SQL function `compute_kenya_payroll(_gross numeric)` with current 2026 PAYE bands, SHIF 2.75%, NSSF Tier I/II caps, Housing Levy 1.5%, personal relief KES 2,400.
- Pages: `Payroll.tsx` (runs list, "New run" → pulls active staff → previews computed slips → "Process" locks the run).
- Edge function `generate-payslips` (PDF per staff, optional WhatsApp/email).
- Country variants: stub functions `compute_uganda_payroll`, `compute_tanzania_payroll`, `compute_rwanda_payroll` with placeholder formulas; user can refine.

## Phase F — Expenses
- Tables: `expense_categories`, `expenses`, `expense_approvals`.
- Page `Expenses.tsx`: capture → submit → approve → export.
- Export endpoints for QuickBooks/Xero CSV.

## Technical notes (for the curious)
- Existing trigger `recompute_invoice_totals` already keeps invoice balance/status synced — adjustments will be folded into `fee_discounts` (already there).
- M-Pesa credentials remain in `mpesa_config` table (already RLS-protected); not moving to Vault unless explicitly requested — it would require breaking changes to existing functions.
- Airtel Money / MTN MoMo: schema-ready (`payment_method_enum` already includes them) but I'll **stub** the actual API integration in Phase B and surface it as "coming soon" rather than half-build it. Each takes its own multi-day sprint.
- Card payments (Pesapal/Flutterwave/Paystack): same — schema supports, integration is a follow-up phase.

## Out of scope for this loop
- True double-entry accounting (we keep operational view + export to QBO/Xero per spec).
- B2C disbursement flows.
- Loan management beyond a `loan_deductions` jsonb field on payroll items.

## Suggested execution order
Phase A → B → C are the highest leverage (matches "Priority: M-Pesa, fee collection, reconciliation"). I'll do them in this loop and stop before Phase D so you can review. Payroll (E) and Expenses (F) ship in a follow-up.

Reply **continue** to proceed with A→B→C, or tell me which phases to include/skip.