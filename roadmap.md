# Stage 2 roadmap
## Finalized Zenith identity
- [x] Create supplied Stepped Summit SVG lockups, favicons, home-screen icons and social preview
- [x] Rebuild landing, replace sidebar product mark, preserve school logos and add portal attribution
- [x] Add email headers and PDF footer monograms without altering delivery or layouts
- [x] Verify desktop/mobile landing, asset dimensions and loading, rendered sample PDF footer and email header; preview build OK
- [ ] Verify signed-in sidebar, parent attribution, regenerated receipt and delivered email (blocked: external unmanaged sign-in and live delivery access)
- [ ] Replace placeholder legal email links with approved Privacy/Terms pages (blocked: approved legal content not supplied)

## School logo access
- [x] Diagnose bucket privacy, logo policies, and Karama logo path
- [ ] Make only tenant-logos publicly readable (blocked: workspace public_buckets_blocked; owner/admin must allow public buckets in Settings → Privacy & Security)
- [x] Implement private fallback: own-school parent read policy, 24-hour cached logo links, initials on image failure; admin helper unchanged
- [x] Verify all four buckets remain private; anonymous URLs return HTTP 400; seven portal tests pass and build OK
- [ ] Verify signed-in admin/parent display and upload permissions (blocked: external unmanaged sign-in)

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
- [x] Rebuild fee reminder job for current schema, WhatsApp-first and daily deduplication
- [x] Verify isolated full dry-run flow, tier boundaries, duplicate skip and tenant opt-out; 15 tests pass
- [x] Invoke deployed worker twice safely; HTTP 200, zero errors, unauthorized request HTTP 401
- [ ] Live reminder/message read-back (blocked: no overdue invoices; Brian due 22 October, live invoice unchanged)
- [ ] Custom school send-time execution (blocked: retained single daily 08:00 EAT schedule; requires separate scheduling decision)
- [ ] Real WhatsApp delivery (blocked: user must submit three Meta Utility templates and configure provider credentials; dry-run flag untouched)
- [ ] Test parent account (blocked: needs Brian's WhatsApp number)
- [ ] Phone/email change with verification (deferred — parents told to contact school)
- [ ] Parent signed-in walkthrough + 375px dashboard screenshot (blocked: needs test parent)
