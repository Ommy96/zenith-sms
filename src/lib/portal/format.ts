/** Parent portal formatting: "KES 15,000" and "15 Oct 2026". */
export function money(amount: number | string | null | undefined, currency = "KES"): string {
  const n = Math.round(Number(amount || 0));
  return `${currency} ${n.toLocaleString("en-US")}`;
}

export function shortDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T00:00:00") : new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(d: string | number | Date): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export interface LedgerRow { date: string; description: string; debit: number; credit: number; balance: number }

/** Running ledger: invoices are debits, payments credits, oldest first. */
export function buildLedger(
  invoices: { issue_date?: string | null; created_at?: string; invoice_number?: string | null; total: number | string }[],
  payments: { paid_at: string; reference?: string | null; method?: string | null; amount: number | string }[],
): LedgerRow[] {
  const rows = [
    ...invoices.map((i) => ({ date: i.issue_date || i.created_at || "", description: `Invoice ${i.invoice_number ?? ""}`.trim(), debit: Number(i.total || 0), credit: 0 })),
    ...payments.map((p) => ({ date: p.paid_at, description: `Payment${p.method ? ` (${p.method.toUpperCase()})` : ""}${p.reference ? ` · ${p.reference}` : ""}`, debit: 0, credit: Number(p.amount || 0) })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || b.debit - a.debit);
  let bal = 0;
  return rows.map((r) => { bal += r.debit - r.credit; return { ...r, balance: bal }; });
}
