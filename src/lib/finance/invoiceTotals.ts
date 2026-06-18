/**
 * TypeScript reference port of Postgres `recompute_invoice_totals`.
 * Used for unit tests AND can power optimistic UI previews of an invoice
 * before round-tripping to the database.
 */

export type DiscountType = "percent" | "flat";
export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partial"
  | "paid"
  | "overdue"
  | "void";

export interface InvoiceLine {
  unitAmount: number;
  quantity?: number;
}
export interface InvoiceDiscount {
  type: DiscountType;
  value: number;
}
export interface InvoiceInput {
  lines: InvoiceLine[];
  discounts?: InvoiceDiscount[];
  payments?: number[]; // allocation amounts
  dueDate?: string | Date | null;
  status?: InvoiceStatus;
  today?: Date;
}
export interface InvoiceTotals {
  subtotal: number;
  discountTotal: number;
  total: number;
  paidTotal: number;
  balance: number;
  status: InvoiceStatus;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function computeInvoiceTotals(input: InvoiceInput): InvoiceTotals {
  const subtotal = input.lines.reduce(
    (s, l) => s + (l.unitAmount ?? 0) * (l.quantity ?? 1),
    0,
  );
  const discountTotal = (input.discounts ?? []).reduce((s, d) => {
    if (d.type === "percent") return s + (subtotal * d.value) / 100;
    return s + d.value;
  }, 0);
  const total = Math.max(subtotal - discountTotal, 0);
  const paidTotal = (input.payments ?? []).reduce((s, p) => s + p, 0);
  const balance = total - paidTotal;

  let status: InvoiceStatus;
  const prev = input.status;
  if (balance <= 0 && total > 0) status = "paid";
  else if (paidTotal > 0 && balance > 0) status = "partial";
  else if (
    input.dueDate &&
    new Date(input.dueDate) < (input.today ?? new Date()) &&
    balance > 0
  )
    status = "overdue";
  else if (prev === "void" || prev === "draft") status = prev;
  else status = "issued";

  return {
    subtotal: r2(subtotal),
    discountTotal: r2(discountTotal),
    total: r2(total),
    paidTotal: r2(paidTotal),
    balance: r2(balance),
    status,
  };
}