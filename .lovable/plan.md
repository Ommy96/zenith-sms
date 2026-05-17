# Academic Engine — Build Plan

Massive scope. I'll ship in 5 phases, each independently usable. Phase 1 is one big migration that everything else depends on; later phases mix small migrations + UI.

## Phase 1 — Schema foundation (one migration)

### Academic calendar
- `academic_years` (tenant_id, name, start_date, end_date, is_current). Unique partial index for one current per tenant.
- `terms` (tenant_id, academic_year_id, name, start_date, end_date, is_current). Same partial-unique trick.

### Structure
- `grade_levels` (tenant_id, code, name, sort_order, stage). Seeded via a `seed_grade_levels(tenant, curriculum)` SQL function (CBC, 8-4-4, UG, TZ, RW, IGCSE).
- `rooms` (tenant_id, name, type enum [classroom, lab, hall, sports], capacity).
- `classes` extended: add `grade_level_id`, `stream`, `class_teacher_id`, `room_id`, `current_enrollment` (kept fresh by trigger when `students.current_class_id` changes).
- `subjects` extended: `code`, `category` enum (core, elective, co_curricular, life_skills), `curriculum_tag`, `is_assessed`, `assessment_type` enum (continuous, exam, both).
- `class_subjects` junction (class_id, subject_id, teacher_id, periods_per_week).

### CBC vocabulary (only used when `tenants.curriculum = 'cbc'`)
- `learning_areas` (tenant_id, code, name, grade_level_id nullable, sort_order)
- `strands`, `sub_strands`, `learning_outcomes` — nested fk chain.
- `core_competencies`, `values_cbc` — tenant-level, pre-seeded with the 7 + 7.
- `cbc_assessment_scores` (tenant_id, student_id, learning_outcome_id, term_id, performance_level smallint 1–4, teacher_id, comment, recorded_at).

### Traditional grading
- `grading_scales` (tenant_id, name, is_default). Bands stored as `grade_bands` rows (min_pct, max_pct, grade, points, remark).

### Exams
- `exams` already exists — extend with `term_id`, `type` enum, `status` enum, `weight`.
- `exam_subjects` (exam_id, subject_id, max_marks, grading_scale_id nullable).
- Replace existing `exam_results` shape with `student_exam_results`: per-subject row with `raw_marks`, `max_marks`, `grade`, `points`, `position_in_class`, `position_in_stream`, `teacher_comment`, `entered_by`, `locked`. Keep old table compatible by re-using and adding cols.

### Continuous assessment
- `assessments` (tenant_id, class_id, subject_id, teacher_id, type, title, max_marks, weight, due_date).
- `student_assessment_scores` (assessment_id, student_id, score, comment).
- `assessment_outcomes` junction → `learning_outcomes` for CBC.

### Report cards
- `report_card_templates` (tenant_id, name, curriculum_kind, layout jsonb, is_default).
- `report_card_runs` (tenant_id, class_id, term_id, status enum [queued, running, ready, failed], requested_by, total, completed, zip_url).
- `report_cards` (run_id, student_id, pdf_url, status, error).
- Storage bucket `reports` (private, tenant-prefixed RLS).

### Timetable
- `periods` (tenant_id, name, start_time, end_time, day_of_week 0–6, is_break, sort_order).
- `timetable_slots` (tenant_id, term_id, class_id, period_id, subject_id, teacher_id, room_id). Unique partial indexes:
  - (term_id, teacher_id, period_id) WHERE teacher_id NOT NULL
  - (term_id, room_id, period_id) WHERE room_id NOT NULL
  - (term_id, class_id, period_id)

### Lesson plans / schemes of work
- `schemes_of_work` (tenant_id, subject_id, grade_level_id, term_id, file_url, rich_text, uploaded_by, approved_by, status enum).
- `lesson_plans` (tenant_id, teacher_id, subject_id, class_id, date, period_id, learning_outcome_ids uuid[], objectives, materials, intro, development, conclusion, assessment, homework, reflection, hod_status enum, hod_id).

### Permissions added
`academics.configure`, `exams.lock`, `exams.unlock`, `reports.generate`, `reports.publish`, `timetable.edit`, `lessons.approve`. Mapped to existing roles.

### Helpers (SQL functions)
- `current_academic_year(tenant)` / `current_term(tenant)` — used by UI.
- `seed_grade_levels(tenant, curriculum)` — invoked from setup.
- `recompute_exam_positions(exam_id)` — recompute class & stream positions in bulk.
- `compute_grade(scale_id, pct)` — returns (grade, points, remark).

## Phase 2 — Setup + Structure UI

`src/pages/Academics.tsx` (replace stub) becomes a hub with sub-tabs:
- **Calendar** — manage academic years & terms, set current.
- **Grade Levels** — seed by curriculum, manual add/edit.
- **Classes** — list/grid, assign class teacher + room + capacity.
- **Subjects** — list, CBC-aware (categories), assign to classes via class_subjects matrix.
- **Rooms** — simple CRUD.

`src/components/academics/CbcCurriculumEditor.tsx` — only renders for CBC tenants; tree view of learning_areas → strands → sub_strands → learning_outcomes with inline add.

## Phase 3 — Exams + grade entry

`src/pages/Examinations.tsx` (replace): list of exams with status, "New exam" wizard that picks term, exam_subjects + max marks.

`src/pages/ExamGradeEntry.tsx` (new, route `/examinations/:examId/entry`):
- Spreadsheet grid (custom, not heavy lib). Rows = students in class, cols = subjects.
- Per-cell debounced auto-save (250ms). Out-of-range red border. Tab/Enter navigation. Excel paste handler.
- Lock toggle requires `exams.lock`. Locked cells read-only.
- "Recompute positions" button calls SQL helper.
- Mobile fallback: subject-by-subject view with swipe (`framer-motion` drag).

`src/pages/CbcAssessmentEntry.tsx` (new, `/cbc/assess`):
- Pick learning_area → strand → sub_strand → outcomes.
- Student list with 4-button performance level selector per outcome + comment textarea.
- "Apply to selection" bulk action.

## Phase 4 — Report cards

`src/pages/ReportCards.tsx` — pick class + term + template → "Generate". Lists runs with progress.

Edge function `generate-report-cards` (background):
- Iterates students in class, builds PDF per student with `pdf-lib` (using stored layout jsonb or built-in template), uploads to `reports/{tenant}/{run}/{student}.pdf`, updates `report_cards`. When done, zips via deno (`compress` from `jsr:@std/archive` or manual) and stores zip_url.
- Picks template by `tenants.curriculum` if not specified: cbc / 8-4-4 / a-level / international.
- AI comment uses existing `generate-report-comment` edge fn.
- Each report_card row also stores per-student delivery URL.

Trigger from UI is `supabase.functions.invoke`; the function returns immediately (202) and works async (uses `EdgeRuntime.waitUntil`).

Template editor — minimal v1: select from 4 built-in layouts + tweak header/footer text + colour. Drag-drop block editor deferred (gated behind Pro plan later).

## Phase 5 — Timetable + lesson plans

`src/pages/Timetable.tsx` (new, `/timetable` route — currently aliased to Academics; we replace):
- Grid view (rows = periods, cols = days), one grid per class.
- Drag a "subject chip" from a side palette onto a cell; chip carries subject + teacher.
- Real-time conflict detection: on drop, query for conflicting teacher/room/class slot in the same period/term and refuse (toast). Use the unique indexes as final guardrail.
- Tabs: Class view / Teacher view / Room view / Student view.
- Periods config drawer.

AI auto-generator stub: button calls edge fn `auto-timetable` that returns a basic round-robin assignment respecting class_subjects.periods_per_week (heavy CP-SAT deferred).

`src/pages/Schemes.tsx` + `src/pages/LessonPlans.tsx`:
- Schemes: upload + simple list + HOD approval.
- Lesson plans: form per date + period with CBC outcome multi-select if curriculum=cbc. "AI draft" calls a new edge fn `draft-lesson-plan` (Lovable AI) seeded with selected outcomes/objectives.

## Phase 6 — Out of scope for this pass
- Drag-drop visual report card editor (Pro feature).
- True constraint-solver timetabling.
- Parent-portal report card delivery (delivered via existing comms once portals are built).
- Multi-version report card history & re-issuance.

## Files
Migrations: 1 large (phase 1) + small ones per phase as needed.
New pages: `ExamGradeEntry`, `CbcAssessmentEntry`, `ReportCards`, `Timetable`, `Schemes`, `LessonPlans`.
Replaced pages: `Academics`, `Examinations`.
New edge fns: `generate-report-cards`, `auto-timetable`, `draft-lesson-plan`.
New buckets: `reports` (private).

I'll start with Phase 1 (migration), then build phases 2–5 sequentially without pausing unless I hit a question I can't infer from existing conventions.