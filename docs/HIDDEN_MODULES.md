# Hidden Modules

These sidebar links are hidden because their pages still query tables or columns from the
pre-rebuild schema. Pages and routes are untouched — direct URLs still load for development.
Re-enable a link in `src/components/AppSidebar.tsx` once its page is rewired.

| Module | Route | Mismatch found | Correct target in rebuilt schema | Effort |
|---|---|---|---|---|
| Timetable | `/timetable` | Reads `periods.day_of_week` | `periods` holds times + a `days` array; the day lives on `timetable_slots.day_of_week` (with `period_id`, `class_id`, `subject_id`, `teacher_id`, `room_id`, `term_id`) | M |
| Examinations | `/examinations` | Reads `exams.academic_year` (text) | `exams.academic_year_id` + `term_id`, `exam_type`, `grade_levels`, `status`; marks in `exam_subjects` / `student_exam_results` | M |
| Announcements | `/announcements` | `public.announcements` doesn't exist | Broadcasts are `broadcast_campaigns` + `messages` (channel, recipient_type); in-app items are `notifications` | M |
| Admissions | `/admissions` | `public.applications` doesn't exist | `admissions` (application_number, applicant_*, guardian_*, stage, decision_*, enrolled_student_id) + `admission_documents`. The "New admission" wizard on Students is unaffected. | M |
| Transport | `/transport` | `public.transport_routes` doesn't exist | `routes`, `route_stops`, `vehicles`, `drivers`, `vehicle_assignments`, `student_transport`, `vehicle_locations` | L |
| Library | `/library` | `public.library_items` doesn't exist | `library_books` (accession_number, copies_total/available) + `library_loans` | S |
| Inventory | `/inventory` | `public.stock_items` doesn't exist | `inventory_items` (current_stock, reorder_level), `inventory_categories`, `inventory_transactions`, `purchase_orders` | M |

Effort: S ≈ under a day, M ≈ 1–3 days, L ≈ 3+ days.
