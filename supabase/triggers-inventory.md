# Database Triggers Inventory

Snapshot 2026-06-18 from `information_schema.triggers WHERE trigger_schema = 'public'`.
89 trigger rows across 65 tables.

## Critical business-logic triggers (verified active)

| Trigger                         | Table                     | Function                                | Purpose                                          |
|---------------------------------|---------------------------|-----------------------------------------|--------------------------------------------------|
| `tg_mpesa_auto_match`           | `mpesa_transactions`      | `_tg_mpesa_auto_match`                  | Match incoming M-Pesa to student by admission_no |
| `trg_attendance_notify_absence` | `attendance` (INS/UPD)    | `_tg_attendance_notify_absence`         | Queue parent SMS/WhatsApp on absent mark         |
| `tg_discipline_notify`          | `discipline_incidents`    | `_tg_discipline_notify_guardian`        | Notify parent on severity ≥ 3                    |
| `tg_invoice_line_amount`        | `student_invoice_lines`   | `_tg_invoice_line_recompute`            | Recompute amount = unit_amount * quantity        |
| `tg_invoice_line_recompute`     | `student_invoice_lines`   | `_tg_invoice_line_after`                | Recompute invoice totals on line change          |
| `tg_alloc_recompute`            | `payment_allocations`     | `_tg_alloc_after`                       | Recompute invoice balance/status on payment      |
| `tg_discount_recompute`         | `fee_discounts`           | `_tg_discount_after`                    | Recompute invoice totals on discount change      |
| `tg_invoice_number`             | `student_invoices`        | `_tg_invoice_number`                    | Auto-generate INV-YYYY-NNNNN                     |
| `tg_receipt_number`             | `student_receipts`        | `_tg_receipt_number`                    | Auto-generate RCT number                         |
| `tg_po_number`                  | `purchase_orders`         | `_tg_po_number`                         | Auto-generate PO number                          |
| `tg_grn_number`                 | `goods_received_notes`    | `_tg_grn_number`                        | Auto-generate GRN number                         |
| `tg_requisition_number`         | `requisitions`            | `_tg_requisition_number`                | Auto-generate REQ number                         |
| `trg_expenses_number`           | `expenses`                | `_tg_expense_number`                    | Auto-generate EXP number                         |
| `tg_stock_movement_apply`       | `stock_movements`         | `_tg_stock_movement_apply`              | Apply qty delta to stock_items                   |
| `tg_stock_reorder_check`        | `stock_items`             | `_tg_stock_reorder_check`               | Auto draft requisition below reorder              |
| `tg_library_loan_copies`        | `library_loans`           | `_tg_library_loan_update_copies`        | Decrement/increment available copies             |
| `trg_alloc_bed_status`          | `hostel_allocations`      | `_tg_hostel_alloc_bed_status`           | Mark hostel bed occupied/available               |
| `on_tenant_created`             | `tenants`                 | `handle_new_tenant`                     | Seed defaults + first admin on new tenant        |

## `updated_at` housekeeping

All 62 of the `*_updated`, `*_uat`, `_t_*_u` triggers call
`update_updated_at_column()`. Full list:
`SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema='public' AND action_statement ILIKE '%update_updated_at_column%' ORDER BY 2;`

## Orphan check

No orphan `_tg_*` functions. Every `_tg_*` listed in `db-functions` has at
least one matching trigger entry. Specifically verified:

- `_tg_mpesa_auto_match` → `tg_mpesa_auto_match` on `mpesa_transactions` AFTER INSERT
- `_tg_attendance_notify_absence` → `trg_attendance_notify_absence` on `attendance` BEFORE INSERT/UPDATE
- `_tg_discipline_notify_guardian` → `tg_discipline_notify` on `discipline_incidents` BEFORE INSERT/UPDATE

## How to regenerate

```bash
psql -c "SELECT trigger_name, event_object_table, action_timing, event_manipulation
         FROM information_schema.triggers
         WHERE trigger_schema = 'public'
         ORDER BY event_object_table, trigger_name;" > supabase/triggers-inventory.txt
```