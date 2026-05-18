# Communication Layer + Parent/Student Portals

This is ~6–8 hours of work if shipped in one batch. I'll split it into 4 phases so each lands working and reviewable. Confirm the phasing (or reorder), and I'll start.

## Phase A — Unified messaging core (DB + Admin UI)
The foundation everything else plugs into.

- **Schema**: `messages`, `message_templates`, `broadcast_campaigns`, `notification_preferences`, `notifications` (in-app bell), `opt_outs`. Tenant-scoped RLS, indexes on `(tenant_id, sent_at)` and `(recipient_id, channel)`.
- **Seed templates**: the 7 WhatsApp templates you listed + SMS/email variants, with `{{variable}}` merge syntax.
- **Admin UI** at `/communication`:
  - Templates tab (CRUD, preview with sample data)
  - Compose tab (audience filter → channel picker → template → cost preview → send/schedule)
  - Campaigns tab (history, delivery stats)
  - Inbox tab (placeholder — wired in Phase B)
- **Audience filter engine**: shared util that resolves `{class_id, role, defaulters_only, custom_ids}` → recipient list.
- **Cost estimator**: per-channel pricing table per tenant, returns total before send.

## Phase B — Channel providers + delivery
Wire actual sending. Each provider is one edge function reading per-tenant config.

- `tenant_messaging_config` table (Africa's Talking creds, Twilio creds, WhatsApp creds, Resend key, sender IDs, country code) — encrypted via Vault.
- **Edge functions**:
  - `send-sms` (Africa's Talking primary, Twilio fallback)
  - `send-whatsapp` (Meta Cloud API, template messages + free-form within 24h window)
  - `send-email` (Resend)
  - `whatsapp-webhook` (already exists — extend for inbox threading + auto-reconcile by guardian phone)
  - `africastalking-dlr` (delivery reports webhook)
  - `dispatch-message` (router: takes a `messages` row, fans out to the right provider, retries, writes status back)
- **Inbox UI**: WhatsApp-style threaded by `(guardian_phone, student_id)`, with class-teacher routing rule.
- **Opt-out**: inbound "STOP" → `opt_outs` row, blocks future non-emergency sends.

## Phase C — Parent Portal (PWA, mobile-first)
Separate shell at `/portal/*`, lazy-loaded route group.

- **Auth**: phone + OTP via Africa's Talking SMS, fallback email/password. New `guardian_users` link table (guardian_id ↔ auth.users.id) since guardians aren't tenant staff.
- **Layout**: bottom tab bar (Home / Academics / Fees / Chat / More), child switcher in header.
- **Pages**: Dashboard, Children, Academics (term performance + past report cards), Attendance (calendar), Fees (balance, statement, STK Push button → reuses existing mpesa-stk-push), Communication (announcements + thread to class teacher), Calendar, Documents, Settings.
- **PWA**: vite-plugin-pwa, manifest, service worker with cache-first for shell, network-first for data. Skeleton loaders everywhere.

## Phase D — Student Portal + Notifications Hub + Voice/IVR
- **Student portal**: reuses parent portal shell, different nav + role-gated pages (assignments upload, library, restricted-hours messaging).
- **Notifications bell**: header dropdown with grouping, categories, mark-read, preferences page (per-channel per-category toggles + quiet hours).
- **Voice/IVR** (optional, behind Pro flag): Africa's Talking Voice for fee-reminder pre-recorded calls + simple IVR menu.
- **Announcements**: rich composer with multi-channel fan-out.

## Technical notes (for me, skim if you want)
- All provider creds go in Supabase Vault, not the `tenant_messaging_config` row directly — row stores references.
- `dispatch-message` is the only function that touches providers; everything else just inserts into `messages` and lets the dispatcher pick it up via pg_cron every 30s (or trigger-invoked for urgent).
- Cost preview uses a static `provider_pricing` table seeded with current Africa's Talking + Meta + Resend rates per country.
- Parent portal uses the same Supabase project but a separate `guardian_users` mapping so RLS policies can scope to "guardian can see students they're linked to in `student_guardians`".

---

**My recommendation: start with Phase A** (1 message, cleanly reviewable, unlocks B). Then B, then C, then D.

**Questions before I start Phase A:**
1. Confirm provider priority: Africa's Talking primary for SMS, Resend for email — OK?
2. Parent portal route: keep at `/portal/*` on the same app (simpler, shared auth) or scaffold a separate Vite project (cleaner bundle, more setup)? I recommend `/portal/*` with code-splitting.
3. WhatsApp templates: I'll create them as DB rows with placeholder Meta `template_name` values — you'll need to actually submit them in Meta Business Manager and paste the approved names back. OK?
4. Should I ship Phase A now and pause for review, or queue all 4 phases back-to-back?
