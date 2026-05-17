
# SomaSphere v2 Foundations — Destructive Overhaul

This is a foundations rebuild. Existing per-school logic (`schools`, `profiles.school_id`, `user_roles` with `app_role` enum, `get_user_school_id`, `has_role`) will be replaced by a proper multi-tenant + RBAC model. Existing feature pages (Finance, MobileMoney, WhatsApp, Examinations, etc.) keep working by pointing at the new `tenant_id` column instead of `school_id`.

Because this is destructive, demo/sample rows in current tables will be migrated where possible (1:1 `schools` → `tenants`) and otherwise wiped. **No production data exists yet**, so this is safe.

---

## 1. Database — new tenant + RBAC model

### New tables

- **`tenants`** — replaces `schools`. Adds: `slug` (unique, for `/t/<slug>/...`), `country_code`, `currency_code`, `timezone`, `locale`, `school_type` enum, `curriculum` enum, `subscription_plan` enum, `subscription_status` enum, `trial_ends_at`, `registration_number`, `nemis_code`. Keeps: `name`, `logo_url`, `primary_color`.
- **`tenant_settings`** — `(tenant_id, key, value jsonb)` for feature flags / per-tenant config.
- **`audit_logs`** — `tenant_id, actor_user_id, entity_type, entity_id, action, before jsonb, after jsonb, ip_address, user_agent, created_at`.
- **`roles`** — system + tenant-defined. `(id, tenant_id nullable, name, description, is_system)`. System roles seeded with `tenant_id = NULL`.
- **`permissions`** — `(id, key text unique, description, category)`. Seeded with granular keys: `students.view|create|edit|delete`, `fees.view|collect|configure`, `attendance.view|mark`, `exams.view|enter|publish`, `comms.send`, `whatsapp.manage`, `mpesa.manage`, `settings.manage`, `users.manage`, `audit.view`, etc.
- **`role_permissions`** — `(role_id, permission_id)` junction.
- **`tenant_users`** — replaces `profiles.school_id` membership. `(tenant_id, user_id, is_active, joined_at)`. A user can belong to multiple tenants.
- **`user_roles`** (rebuilt) — `(user_id, tenant_id, role_id)`. Drops the old `app_role` enum table. A user can have multiple roles within a tenant.

### Seeded system roles
`super_admin, school_admin, principal, deputy_principal, bursar, accounts_clerk, registrar, hod, class_teacher, subject_teacher, librarian, transport_officer, nurse, hostel_master, parent, student, alumni` — each with a sensible default permission set.

### Migration of existing tables
Every domain table (`students, staff, classes, attendance, exams, exam_results, invoices, applications, announcements, library_books, inventory_assets, transport_routes, mpesa_*, whatsapp_*, ai_comment_usage, import_mappings, activity_logs`) gets:

- New `tenant_id uuid` column, backfilled from current `school_id` (1:1 map after copying `schools` → `tenants`).
- Old `school_id` column dropped.
- All RLS policies rewritten to:
  - **SELECT**: `tenant_id = current_tenant_id()` (helper reads from JWT `app_metadata.tenant_id`)
  - **mutations**: `tenant_id = current_tenant_id() AND has_perm(auth.uid(), '<permission.key>')`
- Super admins bypass via `is_super_admin(auth.uid())`.

### Security definer helpers
- `current_tenant_id()` — reads active tenant from `request.jwt.claims -> app_metadata -> tenant_id`.
- `has_perm(_user uuid, _key text)` — joins `user_roles → role_permissions → permissions` scoped to current tenant.
- `is_super_admin(_user uuid)` — has the system `super_admin` role with `tenant_id IS NULL`.
- `has_role_in_tenant(_user uuid, _role_name text, _tenant uuid)`.

All `SECURITY DEFINER` with `SET search_path = public` to prevent recursion.

---

## 2. Auth & active tenant

- Keep Supabase email/password. **Enable** Google OAuth (`configure_social_auth`). Magic link works out-of-the-box.
- **Phone OTP**: enable via `configure_auth`. (SMS provider is the user's choice; we surface a banner if no SMS provider is configured — actual Twilio/AT credentials are a follow-up.)
- **2FA enforcement** for `school_admin / principal / bursar`: gate via a `MfaRequiredRoute` wrapper that checks `aal2` and redirects to an enrollment screen if missing.
- **Active tenant** stored in URL: `/t/:slug/*`. A `TenantProvider` resolves slug → tenant, validates membership, and calls a new edge function `set-active-tenant` that writes `tenant_id` into `auth.users.app_metadata` (then refreshes session so RLS sees it).
- **Tenant switcher** in top bar when user has >1 membership.
- Signup flow: create user → create tenant → insert `tenant_users` → assign `school_admin` role → trigger demo seed → redirect to `/t/<slug>/dashboard`.

---

## 3. Locale, currency, i18n

- Install `react-i18next i18next i18next-browser-languagedetector`.
- Locale files: `src/i18n/locales/{en,sw,fr,am}/common.json` — English strings only; sw/fr/am contain the same keys with English fallbacks for now.
- Hooks (in `src/hooks/`):
  - `useTenant()` — returns full tenant row + settings.
  - `useMoney(amount)` → `Intl.NumberFormat(tenant.locale, { style: 'currency', currency: tenant.currency_code })`. Supports KES, UGX, TZS, RWF, ETB, SSP, BIF, USD.
  - `useDate()` → `format(date, fmt, { locale, timeZone: tenant.timezone })` via `date-fns-tz`.
  - `usePermissions()` → `{ can(key): boolean }`, loaded once per session.
- Components `<Money amount />` and `<DateTime value format />` wrap the hooks.

---

## 4. Design system

- `src/index.css` + `tailwind.config.ts` extended with semantic HSL tokens: `--primary, --accent, --success, --warning, --danger, --info, --surface, --border, --muted` (light + dark). `--primary` is rewritten at runtime from `tenant.primary_color` (hex → HSL) by `TenantProvider`.
- Fonts: Inter (UI), JetBrains Mono (codes/IDs) loaded via `<link>` in `index.html`.
- Spacing tokens already 4-based via Tailwind defaults.
- New reusable components in `src/components/ui-kit/`:
  `PageHeader, StatCard, DataTable, EmptyState, FormField, Money, DateTime, UserAvatar, Badge (extended), ConfirmDialog, CommandPalette, RoleGuard`.
- `DataTable` built on TanStack Table + shadcn `Table`, supports columns, pagination, search, filters, bulk actions.
- `CommandPalette` uses shadcn `Command` + `cmdk`, opened with ⌘K / Ctrl+K, indexes navigation items + recent students/invoices.

---

## 5. Navigation shell

- Rebuilt `AppSidebar` with grouped, role-aware sections exactly as specified (Overview, Academics, People, Finance, Communication, Operations, Insights, System). **Duplicate "Reports" removed.**
- Each item wrapped in a permission check via `usePermissions().can()`.
- Sidebar: collapsible (existing `SidebarProvider`), independently scrollable (`overflow-y-auto` on `SidebarContent`), pinned items stored in `localStorage` keyed by user id.
- Top bar (`AppHeader`): tenant logo+name, ⌘K trigger, Quick Actions menu (New student / invoice / announcement), notifications bell (stub), dark mode toggle (existing), profile menu with tenant switcher.

---

## 6. Demo data seeding

- Edge function `seed-tenant-demo-data` invoked on tenant create. Idempotent (checks `tenant_settings.demo_seeded`).
- Seeds: 1 academic year + 3 terms, 4 classes, 25 students + parents, 6 teachers, 1 fee structure (4 items), 14 days attendance, 8 invoices (mixed statuses), 3 announcements, 2 events, sample timetable rows.
- `DemoDataBanner` already exists; rewired to read `tenants.is_demo` / `tenant_settings.demo_seeded`. CTA "Replace with my school's data" routes to existing `/students/import`.
- Settings → Data → "Clear demo data" button calls edge function `clear-tenant-demo-data` (admin permission `settings.manage` required).

---

## 7. File changes (high level)

**New:**
- `supabase/migrations/<ts>_tenancy_rbac_overhaul.sql` (single big migration: enums, tables, helpers, RLS rewrite, seed system roles + permissions, backfill from `schools`).
- `supabase/functions/{set-active-tenant,seed-tenant-demo-data,clear-tenant-demo-data}/index.ts`.
- `src/contexts/TenantContext.tsx`, `src/hooks/{useTenant,useMoney,useDate,usePermissions}.ts`.
- `src/i18n/{index.ts,locales/...}`.
- `src/components/ui-kit/*` (PageHeader, StatCard, DataTable, EmptyState, FormField, Money, DateTime, UserAvatar, ConfirmDialog, CommandPalette, RoleGuard).
- `src/components/MfaRequiredRoute.tsx`, `src/components/TenantSwitcher.tsx`.
- `src/pages/TenantSelect.tsx`.

**Rewritten:**
- `src/App.tsx` — routes nested under `/t/:slug/*`, wraps in `TenantProvider`.
- `src/contexts/AuthContext.tsx` — multi-tenant memberships, no `role` field (moved to permissions hook).
- `src/components/AppSidebar.tsx` — new grouped structure, perm-gated, deduped.
- `src/components/AppHeader.tsx` — ⌘K, quick actions, tenant switcher.
- `src/lib/demoSeed.ts` — thin client wrapper that calls the edge function.

**Touched (`school_id` → `tenant_id`, formatting via `<Money>`):**
- All pages in `src/pages/*` that query domain tables.

---

## 8. Out of scope (follow-ups)

- Actually wiring an SMS provider for phone OTP and WhatsApp/SMS broadcasts.
- Full translations for sw / fr / am (structure only in this pass).
- Notifications bell backend (UI stub now).
- Per-user pinned-item server persistence (localStorage now).
- Billing/Stripe subscription enforcement (`subscription_status` is stored but not enforced).

---

## 9. Acceptance check

After this lands:
- Signup → tenant created → demo data seeded → `/t/<slug>/dashboard` populated, under 90s.
- `<Money>` shows `KSh 1,200.00` for KE, `USh 1,200` for UG, etc.
- Switching `tenant_id` in JWT (or impersonating) cannot read another tenant's rows — verified by RLS-only access (no `school_id` left).
- Sidebar items appear/disappear based on `usePermissions().can(...)`.
- ⌘K opens `CommandPalette`.
- No duplicate "Reports" in sidebar; sidebar scrolls independently.
- Dark mode toggle persists (existing behavior retained).

Approve to proceed — this will run one large migration and rewrite a lot of files.
