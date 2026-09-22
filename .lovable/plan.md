# Stage 2: Classes, Subjects, and Staff

## Scope and compatibility
- Build only Actions 4–6: class management, subject management/CBC seed, and staff management/invitations.
- Preserve Stage 1, students/guardians/enrollment, finance, timetable, attendance, exams, design tokens, and statement PDF.
- Keep `/academics` for the existing calendar/grade-level/room setup, while adding dedicated `/academics/classes`, `/academics/subjects`, and `/academics/staff` pages plus detail routes. Keep `/staff` links working as redirects.

## Shared foundation
- Use the active tenant from `TenantContext`, React Query keys beginning with the tenant ID, React Hook Form + Zod, existing shadcn controls, skeleton tables, inline retry states, semantic tokens, and hidden permission-gated actions.
- Add focused shared Stage 2 schemas/query helpers only where they prevent duplication.
- Add the missing `staff.manage` permission and grant it to the same tenant roles that already hold staff editing access, including Karama’s school administrator. Continue using `classes.manage`, `subjects.manage`, and `payroll.view` as defined.

## Classes
- Replace the embedded class manager with a dedicated filtered table showing grade, stream, class teacher, active enrollment count for the selected academic year, capacity state, and edit/deactivate actions.
- Add validated create/edit dialogs for name, grade, year, capacity, class/assistant teachers, and room. Enforce tenant/year-scoped uniqueness before insert and rely on the live schema for the write.
- Add `/academics/classes/:id` with summary information and Students, Subjects, and Timetable tabs. Students remain read-only; timetable remains an explicit placeholder.
- Implement class-subject assignment with tenant subject, active teacher, and lessons-per-week validation; use the existing unique class/subject constraint to prevent duplicates.

## Subjects
- Add a dedicated filtered table with category, grade-level badges, assessment type, active state, and edit actions.
- Add validated create/edit dialogs using the live `grade_levels uuid[]` and optional `learning_area_id` columns.
- Add a confirmation-gated CBC seed available only when no subjects exist. Per the approved choice, seed all 16 entries, including CRE, IRE, and HRE alternatives, with the requested grade ranges and categories.

## Staff
- Rework the existing staff list for `/academics/staff`: tenant-scoped React Query data, requested filters/columns, class-teacher assignments, skeleton/error/empty states, and hidden create/edit controls without `staff.manage`.
- Add validated create/edit forms. Split full name into the existing first/middle/last fields, use the database-supported employment values (`permanent`, `part_time`, `contract`, `volunteer`, `intern`, `bom`, `tsc`), and leave `staff_number` null when blank so the existing trigger generates `EMP-####`.
- Store Grace-style class teachers as role `teacher`; class-teacher status comes from class assignment, not a separate role value. Do not create class-subject rows from an unscoped “subjects taught” selection because no default class exists.
- Rework staff detail into Overview, Subjects, Qualifications, Compensation, and Documents. Hide Compensation unless `payroll.view`; keep documents read-only; support qualification add/edit only.

## Secure staff invitations
- Add `invite-staff` with authenticated JWT validation, Zod request validation, tenant ownership checks, `staff.manage` enforcement, staff/email/role consistency checks, and Supabase Admin `inviteUserByEmail`.
- Extend the existing trusted signup hook to recognize service-generated invite metadata, link `staff.user_id`, and upsert `user_tenants`/`user_roles` idempotently. The selected role ID must belong to the invite’s tenant (or be an allowed system role), preventing cross-tenant role assignment.
- Do not add a new invite table or touch other edge functions. Return only `{ success, email_sent_to }` and keep private details out of logs.

## Verification
- Run the focused build/type checks and inspect current observability logs.
- Verify signed-out invitation calls are denied and database permissions/function changes are present.
- Use the available authenticated preview session if possible to exercise the 15 acceptance steps; otherwise report authenticated steps as unverified rather than claiming success.
- Confirm Stage 3/4 tables were not written and list any acceptance mismatch caused by the live data (notably the approved 16-subject seed means the core filter count differs from the original 14-subject expectation).
