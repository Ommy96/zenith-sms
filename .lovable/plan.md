# Student Profile + Edit Flow Rebuild

The spec covers 16 parts touching ~15 files and adding ~2,500 lines. To keep each shipment reviewable (and the preview always working), I'll execute in **4 phases**, each one independently usable. Confirm the phasing — or tell me to collapse it into one push — and I'll start.

## Phase 1 — Foundation (the architecture, no visual regressions)
Goal: shared schema + full edit route live, modal deleted.

- **`src/lib/schemas/student.ts`** — expand from 5 fields to full sectioned zod schemas: `identitySchema`, `academicSchema`, `contactSchema`, `medicalSchema`, `specialNeedsSchema`, `governmentIdsSchema` (country-aware: KE/UG/TZ/RW/ET), `guardianLinkSchema`. Validation rules from Part 15 (NEMIS 6 chars, E.164 phones, DOB past, graduation > admission year, unique admission #).
- **`src/components/students/StudentFormSections/*`** — one component per section, RHF-driven, reused by both admission wizard and edit page.
- **New route `/students/:id/edit`** → **`src/pages/StudentEdit.tsx`** — tab nav (Identity · Government IDs · Academic · Contact · Medical · Special Needs · Guardians · Documents), sticky Save bar, pre-populated from current row.
- **Refactor `AdmissionWizard.tsx`** to consume the same section components.
- **Delete** the inline Edit Student modal from `StudentProfile.tsx`.
- Permission gating via `has_perm` for `students.edit`.

## Phase 2 — Profile header + tabs chrome (Parts 2, 3, 14)
- New header: 96px soft-accent avatar, name + inline metadata (· bullets), status dots (Active green dot, balance danger), right-rail "Edit profile" + "More actions" dropdown, 6-stat bottom strip.
- Replace giant "Back to students" with ghost breadcrumb link.
- Tabs → underline style; reorder Overview · Academics · Attendance · Fees · Health · Discipline · Documents · Activity.
- "Last updated by X" footer line. Card title icon convention.

## Phase 3 — Overview, Academics, Attendance, Fees polish (Parts 4–7)
- **Overview**: Identity / Academic snapshot / Government IDs (country-aware) / Contact main cards + Guardians / Key dates / At a glance side cards. Inline-edit pencil per card (single-edit-at-a-time guard, save/cancel, optimistic).
- **Academics**: class history timeline, subjects grid, exam table + sparkline, CBC competencies + values (CBC tenants only), co-curricular.
- **Attendance**: term summary + calendar heatmap, recent absences, optional AI pattern insight via existing `ai-copilot` infra.
- **Fees**: promote M-Pesa CTA to `--accent`, add Send reminder, color balance by sign, year-to-date summary line.

## Phase 4 — Health, Discipline (new), Docs, Activity, Right rail, Empty states (Parts 8–13)
- **Health** (gated by `health.view`): vitals, immunizations, clinic visits, accident reports — each with + CTA.
- **Discipline tab (new)** (gated by `discipline.view`): behavior summary + sparkline, incidents, merits, CTAs.
- **Docs**: drag-drop upload, categorised grid, count badge.
- **Activity**: timeline from `audit_logs` filtered to this student, event-type filter.
- **Right rail Quick links** card.
- Empty-state component used everywhere (48px icon in surface-sunken circle + title + muted desc + CTA).

## Technical notes
- All new components use existing shadcn primitives + tokens from `src/index.css` and `src/lib/design-tokens.ts`. No hardcoded colors.
- Country-aware fields read `tenant.country` from `TenantContext`; field config already exists in `src/lib/sis/countryFields.ts`.
- Inline edits write via Supabase client with optimistic update + `sonner` toast.
- Activity feed reads `audit_logs` filtered by `entity_type='students' AND entity_id=:id` plus a few related tables (student_payments, attendance, discipline_incidents) unioned client-side.
- No DB migrations needed — all 85 columns already exist.
- Estimated lines added/changed: ~2,500. Phase 1 ~800, Phase 2 ~400, Phase 3 ~700, Phase 4 ~600.

## Question before I start
Confirm: **proceed phase-by-phase (4 separate shipments)**, or **knock it out in one push** (longer single response, higher risk of one bad section blocking the rest)?
