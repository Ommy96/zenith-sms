# Zenith — School Management Platform

Zenith is a modern, multi-tenant school management system for African schools.
It unifies academics, finance, communication, compliance, and parent
engagement into a single SaaS-grade product, with built-in support for
Kenyan curricula (CBC & 8-4-4), M-Pesa reconciliation, NEMIS/TSC filings,
and Kenyan PAYE/SHIF/NSSF/Housing Levy payroll.

## What is Zenith

- **Multi-tenant by design** — every school is a fully isolated tenant
  with its own data, branding, and configuration. Cross-tenant access is
  impossible at the database (RLS) and policy layers.
- **Action-oriented dashboard** with dynamic financial metrics, attendance
  trends, and AI assistants for fee-risk, admissions screening, and
  grading.
- **Parent Portal** — installable PWA with push notifications, in-app
  M-Pesa STK pay, report cards, attendance, and messaging.
- **Localised** — UI in English and Swahili out of the box; more
  languages on demand.

## Tech stack

| Layer       | Choice |
| ----------- | ------ |
| Frontend    | React 18, Vite 5, TypeScript 5 (strict), Tailwind v3, shadcn/ui |
| State / data| TanStack Query, react-hook-form + zod |
| Backend     | Lovable Cloud (Supabase): Postgres, Auth, Storage, Edge Functions |
| AI          | Lovable AI Gateway (chat, embeddings, OCR) |
| Observability | Sentry (errors), PostHog (analytics) |
| Tests       | Vitest, Playwright, pg-tap |

## Local development

```sh
git clone <repo-url>
cd zenith
bun install            # or: npm install
cp .env.example .env   # fill in the Supabase keys (auto in Lovable preview)
bun dev                # vite on http://localhost:8080
```

## Environment variables

See `.env.example` for the canonical list. Frontend keys are
publishable (`anon`) and safe to ship. Edge function secrets
(`VAPID_PRIVATE_KEY`, M-Pesa credentials, etc.) live in Lovable Cloud
secrets storage — never in `.env`.

## Deployment

- **Lovable Cloud (default)**: every commit deploys preview at
  `https://id-preview--<id>.lovable.app`. Publish via the Lovable UI
  to promote to the production domain (`https://zenith-sms.lovable.app`).
- **Self-host**: standard Vite SPA, deploy `dist/` to any static host.
  Configure the Supabase project URLs and run the migrations from
  `supabase/migrations/` in order.

## Architecture overview

```
src/
  pages/             # Route components (admin + parent portal)
  components/        # Reusable UI; forms/ holds the canonical zod scaffolding
  contexts/          # AuthContext, TenantContext, PortalContext
  lib/
    schemas/         # Zod schemas shared between UI & edge functions
    finance/         # Invoice totals, fee logic
    payroll/         # Kenya PAYE / SHIF / NSSF / Housing Levy
    mpesa/           # Account-ref normaliser + matchers
    push/            # Web push enrolment
    pwa/             # Install-prompt hook
    observability/   # Sentry + PostHog wiring
  integrations/
    supabase/        # Auto-generated client and types (DO NOT EDIT)
supabase/
  migrations/        # All schema changes
  functions/         # Edge functions (auth in _shared/, see README inside)
  tests/             # pg-tap SQL tests
tests/
  e2e/               # Playwright tenant-isolation regression
```

## Testing

| Command           | What it runs |
| ----------------- | ------------ |
| `bun test`        | Vitest unit + component tests |
| `bun run test:db` | pg-tap SQL tests against the Supabase project |
| `bun run test:edge` | Deno tests for edge function contracts |
| `bun run test:e2e`  | Playwright tenant-isolation suite |
| `bun run test:all`  | Vitest + pg-tap |
| `bun run typecheck` | `tsc --noEmit` with strict mode |

Pre-commit (`husky`) runs ESLint on staged files + `typecheck`.
Pre-push runs `vitest run`. Both block on failure.

## Uptime & observability

- **Health check**: `GET https://<project>.functions.supabase.co/health`
  returns 200 when DB + Auth are reachable. Wire it into Better Stack /
  Pingdom / UptimeRobot.
- **Errors**: Sentry (`VITE_SENTRY_DSN` for the SPA, `EDGE_SENTRY_DSN`
  for edge functions).
- **Product analytics**: PostHog (`VITE_POSTHOG_KEY`).

## Push notifications

The parent portal opts in to web push from the dashboard
("Stay in the loop" card). Server-side dispatch lives in the
`push-send` edge function and requires `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` secrets. Generate the pair
with `npx web-push generate-vapid-keys`, then store them via the
Lovable Cloud secrets UI.

## Contributing

1. Create a feature branch.
2. Make your change. Strict TS is enforced — no `any`, no
   `// @ts-ignore` (see `ts-strict-debt.md` for legacy cleanup).
3. Forms must use `useZodForm` + a schema in `src/lib/schemas/`.
4. Database changes go through `supabase/migrations/` with `GRANT`s
   and RLS in the same file (see `.lovable` agent rules).
5. Push — husky will block if `vitest` or `tsc` fails.

## License

Proprietary. © Zenith. All rights reserved.
