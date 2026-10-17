# Stage 2 roadmap
- [x] Add staff management permission and secure invite acceptance linking
- [x] Build classes list/create/detail and class-subject assignment
- [x] Build subjects list/create and 16-subject CBC seed
- [x] Build staff list/create/edit/detail and invitation flow
- [x] Wire routes/sidebar and preserve legacy staff links
- [ ] Verify authenticated acceptance paths (blocked: external unmanaged sign-in)

## Stage 3 (students, guardians, enrollment)
- [x] Built; signed-in acceptance steps 1-16 pending user test (external sign-in)

## Stage 4 — Fees, Invoices, Payments
- [x] Fees (items, structures, assignments), invoices, payments, receipts, invoice PDF built
- [ ] Acceptance steps 1–25 — needs signed-in test by user (external sign-in)

## Parent portal (6 pages)
- [x] DB: parent read access for activity, attendance dates, school info, guardian messages; self-edit profile
- [x] Portal layout + Dashboard, Fees, Attendance, Report Cards, Messages, Profile
- [x] Report card downloads via download proxy
- [x] WhatsApp template sends + OTP WhatsApp-first with SMS fallback; login wording
- [ ] Rebuild fee reminder job for current schema, WhatsApp-first and daily deduplication
- [ ] Verify dry-run delivery, tier boundaries and tenant opt-out without changing live invoices
- [ ] Test parent account (blocked: needs Brian's WhatsApp number)
- [ ] Phone/email change with verification (deferred — parents told to contact school)
- [ ] Parent signed-in walkthrough + 375px dashboard screenshot (blocked: needs test parent)
