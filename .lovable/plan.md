# SomaSphere Operations — Build Plan

This is a very large scope (8 modules, ~30 tables, multiple capture flows). To ship something usable instead of a half-broken everything, I'll deliver it in **5 phases**, each independently shippable. Confirm scope and I'll start with Phase 1.

## Phase 1 — Attendance (core operations workhorse)
- Tables: `attendance_records`, `attendance_sessions`, tenant setting for mode (daily / per-period / boarding)
- Class register grid (rows=students, cols=status radios), "All present" one-tap, bulk select, late time entry
- Mobile-first layout, offline cache via IndexedDB queue, auto-sync
- Auto-notify guardians on absence (reuses messaging dispatcher + `attendance_absence` template, already seeded)
- Pattern detection trigger: 3 consecutive absences flags class teacher
- Reports: daily register, term summary per student, class trends, chronic absentees
- Capture: manual (Phase 1), QR scan (Phase 1b stub), biometric/face (out of scope now)

## Phase 2 — Discipline + Health + Events
- Discipline: `discipline_incidents`, `disciplinary_actions`, `merit_points`, severity 3+ auto-notify guardian
- Health: `health_visits`, `medication_administration`, `immunization_records`, `accident_reports` — RLS gated to `health.view`
- Events: `calendar_events` (month/week/agenda views), iCal subscription URL per user, resource booking on rooms

## Phase 3 — Library + Inventory/Procurement
- Library: `library_items`, `library_loans`, barcode scan checkout/return, fines, overdue reminders, student catalog in portal
- Inventory: `stores`, `stock_items`, `stock_movements`, suppliers, asset register with QR tags
- Requisition → PO → GRN workflow with amount-band approval matrix
- Auto-draft requisition when stock < reorder_level (trigger)

## Phase 4 — Transport
- Tables: `vehicles`, `drivers`, `routes`, `route_stops`, `student_transport_subscriptions`, `vehicle_location_pings`, `boarding_scans`, `maintenance_logs`, `fuel_logs`
- Route designer with stop sequence, ETA calc from last ping
- Boarding/alighting QR scanner page, daily roster
- Parent app: live bus tracking + geofenced arrival SMS
- Reports: utilization, maintenance cost, driver mileage, transport-fee outstanding

## Phase 5 — Hostel / Boarding
- Tables: `hostels`, `rooms`, `beds`, `hostel_allocations`, `roll_calls`, `visitor_log`, `out_passes`, `bedding_inventory`
- Drag-drop bed allocation grid
- Roll-call sessions (morning, lights-out, weekend)
- Out-pass: student request → guardian approves in portal → matron logs out/in

## Technical notes
- Each phase = 1 migration + page(s) under `src/pages/operations/*` + tab components, registered in `App.tsx` and `AppSidebar.tsx`
- All tables tenant-scoped with RLS using existing `is_tenant_member` / `has_perm`
- All guardian notifications go through `messages` table → existing `dispatch-messages` edge function (no new providers)
- New permissions added: `attendance.mark`, `attendance.view`, `discipline.manage`, `health.view`, `health.manage`, `library.manage`, `inventory.manage`, `procurement.approve`, `transport.manage`, `hostel.manage`, `events.manage`
- Auto-notify and reorder-draft logic implemented as Postgres triggers + edge function calls
- Offline attendance uses a small IndexedDB wrapper (`src/lib/offline/queue.ts`) flushed on `online` event

## What's intentionally out of Phase 1–5 (call out before building)
- Biometric/fingerprint hardware integration (needs vendor SDK)
- Face-recognition attendance (Phase 6 per spec — needs vision model)
- Real GPS hardware integration for buses (Phase 4 will use driver-phone web geolocation as v1)
- Google/Outlook OAuth calendar sync (Phase 2 ships read-only iCal feed; full 2-way sync later)

## Proposed order
Start with **Phase 1 (Attendance)** since it's the daily-use workhorse, gives immediate parent-comms value, and exercises the messaging pipeline you just built.

Reply with: **"go phase 1"** (or pick a different starting phase, or adjust scope) and I'll ship it.
