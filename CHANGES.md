# CHANGES

## Hardening Sprint — Section 1 (Correctness & Tests)

Closed the audit's top finding: payroll, invoice, and M-Pesa math now have
executable tests at both the application and database layers. Added
`src/lib/payroll/calcKenyaPayroll.ts` and `src/lib/finance/invoiceTotals.ts`
as TypeScript reference ports of the equivalent Postgres functions, each
covered by a Vitest suite that pins PAYE bands at 20k / 50k / 100k / 250k /
500k incomes, SHIF 2.75% with the 300-KES floor, NSSF Tier I + II, the 1.5%
Housing Levy, and the invoice subtotal/discount/balance/status state
machine. Added `src/lib/mpesa/accountRefMatcher.ts` plus a test that
collapses seven delimiter / case variants of an admission number to the
same canonical key. Authored matching pg-tap suites under `supabase/tests/`
for `calc_kenya_payroll` and `recompute_invoice_totals` so the same
invariants are checked inside Postgres. Added a Deno idempotency contract
test for `mpesa-c2b-callback` documenting that the existing
`UNIQUE (tenant_id, mpesa_receipt)` constraint plus the function's
SELECT-then-INSERT + 23505 catch already guarantee a single payment,
receipt, and notification per Safaricom retry — no migration required.
Scaffolded a Playwright tenant-isolation spec at
`tests/e2e/tenantIsolation.spec.ts` (skips until E2E creds are supplied)
that walks Students, Finance, Attendance, Messaging, and Audit pages as
each of two tenants and asserts the other tenant's identifiers never
appear. Wired `test`, `test:db`, `test:edge`, `test:e2e`, and `test:all`
scripts into `package.json`.