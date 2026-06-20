# SomaSphere — Production Readiness Re-audit

Date: 2026-06-20  
Sprint: Hardening Sprint, Sections 8–10  
Rubric: 184 points (architecture / security / observability / compliance / DX / UX / docs / marketing)

## Score: **151 / 184** (≥ 145 target met)

| Pillar                         | Pre-sprint | Post-sprint | Notes |
|--------------------------------|-----------:|------------:|-------|
| Architecture & scaffolding     | 14/24      | 20/24       | Section 8 — `EntityListSection`/`EntityFormDialog`/`useEntityList` adopted in 3 modules; remaining tabs tracked in `scaffolding-migration-debt.md`. |
| Exam integrations              | 6/16       | 14/16       | Section 9 — NECTA / UNEB importers, deliver-report-cards. |
| Timetable / Transport          | 8/16       | 14/16       | 9.2 conflict detection, 9.3 GPS streaming + Leaflet live map. |
| Security & RLS                 | 18/30      | 26/30       | All `*_credentials` / `*_otps` carry deny-by-default RLS; sensitive tenant tables scoped through `has_perm()`; 2FA gate enforced for `super_admin`, `school_admin`, `principal`, `bursar`. |
| Observability                  | 8/16       | 13/16       | Sentry SPA+edge wired, PostHog identifies post-login, `/health` returns 200. Forced-error capture verified manually. |
| Compliance / DPA               | 12/20      | 17/20       | SAR + erasure flows, privacy policies, statutory filings ledger. |
| DX / Docs                      | 6/16       | 13/16       | README rewritten, `.env.example` canonical, `supabase/functions/README.md` edge-auth matrix, `scaffolding-migration-debt.md`, `ts-strict-debt.md`, triggers inventory. |
| Marketing / Landing            | 0/16       | 14/16       | Section 10.1 — `/` is the public landing; `/app` is the dashboard; live-demo CTA wired to sandbox tenant + `seedDemoData`. |
| UX polish                      | 14/30      | 20/30       | Command palette, sidebar collapse, dark mode, install-and-notify card, conflict tooltips. |

## Audit checklist outcomes

- [x] **Sentry captures a forced error end-to-end** — `ErrorBoundary` + `Sentry.captureException` in `src/lib/observability/sentry.ts`; edge functions share `_shared/sentry.ts`.
- [x] **PostHog identifies users post-login** — `useIdentify` hook fires in `AuthContext` once a session is established.
- [x] **Health endpoint returns 200** — `supabase/functions/health/index.ts`.
- [x] **Every edge function either verifies auth or is documented as a public callback** — see `supabase/functions/README.md` matrix.
- [x] **2FA enforced for admin / principal / bursar** — `src/components/auth/TwoFactorGate.tsx`; sensitive roles redirected to `/settings/security/2fa?required=1` when no verified TOTP factor exists.
- [x] **Zero orphan trigger handler functions** — confirmed in `supabase/triggers-inventory.md`.
- [x] **All `*_credentials`, `*_otps`, `*_secrets` tables have explicit RLS** — `nemis_credentials` and `portal_otps` carry deny-by-default policies (server-only via service role); `mpesa_config` / `whatsapp_config` scoped through `has_perm()`.
- [x] **README is real** — see `README.md`.
- [x] **Public landing page is live at `/`** — `src/pages/Landing.tsx` with hero, three pillars, live-demo CTA, KES pricing, comparison table.
- [~] **3 dead pages deleted** — sweep deferred: every page in `src/pages/` is referenced from `App.tsx` and `AppSidebar.tsx`; no orphan routes detected. If the original audit pointed at specific files, list them in a follow-up so we can prune.

## Outstanding / next sprint

1. Finish scaffolding migration (see `scaffolding-migration-debt.md`) for ~900 LOC reduction.
2. Retrofit the ⚠️ edge functions in `supabase/functions/README.md` to use `_shared/auth.ts`.
3. Wire deeper Playwright coverage for the live-demo signup path.
4. Marketing site polish: testimonials, SEO blog, more localized landing copy.