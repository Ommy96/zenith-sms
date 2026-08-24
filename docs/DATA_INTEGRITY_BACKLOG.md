# Data Integrity Backlog — Missing Foreign Keys

Generated 2026-08-24 from a read-only audit of the `public` schema.

Scope of the audit: every base table with two or more `uuid` columns ending in
`_id` (excluding `id`), checked against `pg_constraint` for an actual foreign
key on each column.

**Nothing in this document has been fixed.** The only FK work applied so far is
on `student_guardians` (`student_id`, `guardian_id`, `tenant_id` — all now
constrained with `ON DELETE CASCADE`). Everything below is future-sprint work.

## Before adding any FK

For each column, run an orphan check first:

```sql
SELECT COUNT(*) FROM <table> t
LEFT JOIN <parent> p ON p.id = t.<column>
WHERE t.<column> IS NOT NULL AND p.id IS NULL;
```

Adding the constraint inside a transaction means a non-zero count rolls the
whole thing back. Decide delete vs. repair before forcing anything through.

## Priority 1 — 3+ missing FKs

| Table | Columns without FK |
| --- | --- |
| `hostel_allocations` | `hostel_id`, `room_id`, `student_id`, `tenant_id`, `term_id` |
| `hostel_out_passes` | `guardian_id`, `hostel_id`, `student_id`, `tenant_id` |
| `ocr_grading_jobs` | `exam_id`, `student_id`, `subject_id`, `tenant_id` |
| `whatsapp_messages` | `broadcast_id`, `student_id`, `template_id`, `tenant_id` |
| `mpesa_stk_requests` | `invoice_id`, `student_id`, `tenant_id` |
| `mpesa_transactions` | `matched_invoice_id`, `matched_student_id`, `tenant_id` |
| `student_activity` | `actor_user_id`, `student_id`, `tenant_id` |

## Priority 2 — 2 missing FKs

| Table | Columns without FK |
| --- | --- |
| `accident_reports` | `student_id`, `tenant_id` |
| `admission_screenings` | `application_id`, `tenant_id` |
| `ai_comment_usage` | `tenant_id`, `user_id` |
| `audit_logs` | `actor_user_id`, `entity_id` (polymorphic) |
| `calendar_events` | `class_id`, `tenant_id` |
| `cbc_assessment_scores` | `teacher_id`, `tenant_id` |
| `disciplinary_actions` | `student_id`, `tenant_id` |
| `discipline_incidents` | `student_id`, `tenant_id` |
| `documents` | `owner_id` (polymorphic), `tenant_id` |
| `face_attendance_sessions` | `class_id`, `tenant_id` |
| `face_enrollments` | `student_id`, `tenant_id` |
| `guardians` | `portal_user_id`, `tenant_id` |
| `health_visits` | `student_id`, `tenant_id` |
| `hostel_roll_call_entries` | `student_id`, `tenant_id` |
| `hostel_visitors` | `student_id`, `tenant_id` |
| `hostels` | `tenant_id`, `warden_staff_id` |
| `immunization_records` | `student_id`, `tenant_id` |
| `lesson_plans` | `hod_id`, `tenant_id` |
| `medication_administration` | `student_id`, `tenant_id` |
| `merit_points` | `student_id`, `tenant_id` |
| `messages` | `recipient_id` (polymorphic), `sender_user_id` |
| `students` | `current_class_id`, `portal_user_id` |

## Priority 3 — single missing FK

Almost always a bare `tenant_id`. Affected tables include `activity_logs`
(`entity_id`), `ai_usage_logs` (`user_id`), `assessments`, `class_subjects`,
`exam_subjects`, `fee_discounts`, `fee_items`, `fee_structure_assignments`,
`fee_structures`, and the remaining tables surfaced by the audit query.

## Deliberate exclusions — do NOT add FKs

These columns are polymorphic (the parent table varies by row) and must stay
unconstrained:

- `documents.owner_id` (student, staff, tenant, …)
- `messages.recipient_id` (student, guardian, staff)
- `audit_logs.entity_id` / `activity_logs.entity_id` (any audited table)

Columns pointing at `auth.users` (`user_id`, `actor_user_id`, `portal_user_id`,
`sender_user_id`) should reference `auth.users(id)` only with care — Supabase
manages that table, and the house rule is to avoid new FKs into the `auth`
schema. Prefer `profiles` where a join is genuinely needed.

## Highest-value single fix outside this list

`students.current_class_id -> classes(id)`. It is joined constantly across
academics, examinations, and reporting, and a dangling class id silently drops
students out of class rosters.

## Audit query (re-runnable)

```sql
WITH cand AS (
  SELECT c.table_name, c.column_name
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_name = c.table_name AND t.table_schema = 'public'
   AND t.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public' AND c.data_type = 'uuid'
    AND c.column_name LIKE '%\_id' AND c.column_name <> 'id'
), fks AS (
  SELECT cl.relname AS table_name, a.attname AS column_name, con.conname
  FROM pg_constraint con
  JOIN pg_class cl ON cl.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
  JOIN unnest(con.conkey) k(attnum) ON true
  JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = k.attnum
  WHERE con.contype = 'f'
)
SELECT cand.table_name,
       count(*) FILTER (WHERE fks.conname IS NULL) AS missing_fks,
       string_agg(cand.column_name, ', ')
         FILTER (WHERE fks.conname IS NULL) AS missing_cols
FROM cand
LEFT JOIN fks
  ON fks.table_name = cand.table_name AND fks.column_name = cand.column_name
GROUP BY cand.table_name
HAVING count(*) >= 2 AND count(*) FILTER (WHERE fks.conname IS NULL) > 0
ORDER BY missing_fks DESC, table_name;
```
