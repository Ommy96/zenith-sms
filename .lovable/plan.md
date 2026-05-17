# Student Information System — Build Plan

This is the identity layer for SomaSphere. Scope is large; I'll ship it in 4 migration + UI phases so each phase is reviewable and the app stays usable between phases.

## Phase 1 — Data model (one migration)

Extend/replace existing thin `students` and `staff` tables. Add new tables. All tables tenant-scoped with RLS using existing `is_tenant_member` / `has_perm` helpers.

### `students` (extended)
Identity, government IDs (all countries' fields in one table — UI hides by country), academic, contact, medical, special needs.
- Adds: `middle_name, preferred_name, nationality, photo_url`
- Gov IDs: `nemis_upi, birth_certificate_number, birth_certificate_serial, knec_assessment_number, kcpe_index_number, kcse_index_number, huduma_number, national_id_number, lin, une_index_number, prems_number, necta_index_number, reb_student_id, moe_student_id`
- Academic: `current_class_id, stream, admission_grade, previous_school, house, enrollment_status, expected_graduation_year, learner_category`
- Contact: `residential_address, city, county_or_region, postal_code, country, emergency_contact_name/phone/relation`
- Medical (gated by `students.view_medical` perm): `blood_group, allergies, chronic_conditions, medications, doctor_name, doctor_phone, nhif_or_shif_number, insurance_provider, insurance_policy_number, last_medical_checkup, immunization_status jsonb`
- SEN: `has_special_needs, special_needs_details, iep_on_file, accommodations`
- Enums: `gender_enum, enrollment_status_enum, learner_category_enum, blood_group_enum, guardian_relationship_enum, employment_type_enum`

### `guardians` + `student_guardians`
Guardian profile + many-to-many junction with flags (`is_primary_contact, has_pickup_authorization, has_financial_responsibility, receives_communications`). Partial unique index enforces one primary per student.

### `documents` (polymorphic)
`tenant_id, owner_type ('student'|'staff'|'guardian'), owner_id, doc_type, file_url, file_name, mime_type, size_bytes, uploaded_by, notes`. Storage bucket `documents` (private) with per-tenant path prefix RLS.

### `staff` (extended)
Adds: `staff_number, tsc_number, kra_pin, nssf_number, nhif_or_shif_number, bank_*, employment_type, date_employed, date_of_confirmation, job_title, reports_to, subjects_taught jsonb, classes_taught jsonb, highest_qualification, institution, year_qualified, professional_certifications jsonb, salary_scale, gross_salary, next_of_kin_*`.

### `student_activity` (timeline)
`tenant_id, student_id, event_type, title, description, metadata jsonb, occurred_at`. Read-only feed populated by triggers + app code.

### Permissions added
`students.view_medical`, `students.import`, `staff.view_sensitive`. Mapped to `school_admin`, `registrar`, `nurse`, `bursar` (medical only for admin/nurse).

### Admission number generator
SQL function `generate_admission_number(tenant_id)` — reads `tenant_settings.admission_number_format` (default `{CODE}/{YYYY}/{####}`), atomically increments a counter row in `tenant_settings` key=`admission_number_seq:{year}`.

## Phase 2 — Student list + profile pages

**`src/pages/Students.tsx`** (replace existing):
- DataTable with column toggle, filters (class, stream, status, gender, balance, learner_category, admission_year, house), debounced search across name/admission#/NEMIS/guardian phone+name (via Postgres `or` filter joined to guardians).
- Bulk actions menu, saved views stored in `tenant_settings` key=`saved_views:students:{user_id}`.
- Export CSV/XLSX client-side (existing `xlsx` deps); PDF via `jspdf`.

**`src/pages/StudentProfile.tsx`** (new, route `/students/:id`):
- Header card (photo, name, admission#, class, status badge, quick actions).
- Tabs: Overview, Academics, Attendance, Fees, Discipline, Health (perm-gated), Documents, Activity.
- Right rail: guardians, emergency contacts, key dates.
- Inline edit fields → write through + audit_logs row.

**Country-aware fields**: small helper `useCountryFields()` returns which gov-ID inputs to render based on `tenant.country_code`.

## Phase 3 — Admission wizard + Quick Add

**`src/pages/AdmissionWizard.tsx`** (route `/admissions/new`):
8 steps in `<Tabs>` with form state in single `react-hook-form` + `zod` schema. Step 7 uploads documents to storage. On submit:
1. Insert student → returns id + admission_number
2. Insert guardians + junction rows
3. Insert documents
4. Insert initial invoice (look up class fee template if exists)
5. Insert activity_log "admitted"
6. Fire-and-forget edge function `send-welcome-sms` (skipped if no WhatsApp config — just logs)
7. Optionally render NEMIS CSV row downloadable button

**Quick Add**: drawer with 3 fields (name, class, guardian phone) on the Students page.

## Phase 4 — Bulk import with AI mapping + Staff

**`src/pages/StudentsImport.tsx`** (refactor existing):
- Step 1 upload, Step 2 AI mapping preview (uses existing `suggest-import-mapping` edge fn, extend canonical fields to include NEMIS UPI + guardian fields), Step 3 validation table with row errors, Step 4 import.
- Detect NEMIS progression CSV by header signature; ship a hardcoded mapping for it.
- Cache mapping in existing `import_mappings` table (already exists).

**`src/pages/Staff.tsx`** + **`src/pages/StaffProfile.tsx`**: mirror student structure with staff-specific fields.

## Notes / out-of-scope-for-now

- Portal user provisioning for guardians/students is stubbed (`portal_user_id` left null; no auth.users created).
- Discipline tab shows empty state until discipline module exists.
- PDF ID card / transfer letter use simple `jspdf` templates.

## Files I'll create/edit

Migrations: 1 large
New pages: `StudentProfile.tsx`, `AdmissionWizard.tsx`, `StaffProfile.tsx`
Replaced: `Students.tsx`, `Staff.tsx`, `StudentsImport.tsx`
New components: `StudentHeader`, `GuardianCard`, `DocumentsList`, `ActivityFeed`, `CountryAwareFields`, `QuickAddStudentDrawer`, `BulkActionsBar`, `SavedViewsMenu`
Edge fn edits: extend `suggest-import-mapping` canonical schema
Routes added in `App.tsx`

After Phase 1 migration approves, I'll implement Phases 2–4 sequentially in one continuous build, pausing only if I hit a question I can't answer from existing conventions.