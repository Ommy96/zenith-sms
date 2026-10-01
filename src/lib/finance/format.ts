import { supabase } from "@/integrations/supabase/client";

export const kes = (n: number | null | undefined, currency = "KES") =>
  `${currency} ${Number(n ?? 0).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;

/** Keep only digits and one decimal point. */
export const numericInput = (v: string) => {
  const clean = v.replace(/[^\d.]/g, "");
  const [a, ...rest] = clean.split(".");
  return rest.length ? `${a}.${rest.join("").slice(0, 2)}` : a;
};

export const FEE_CATEGORIES = [
  "tuition", "boarding", "transport", "meals", "activities", "exams",
  "uniform", "books", "other", "penalty", "deposit",
] as const;

export const SCHOLAR_TYPES = [
  { value: "day", label: "Day scholar" },
  { value: "boarding", label: "Boarding" },
  { value: "weekly_boarding", label: "Weekly boarding" },
  { value: "international", label: "International" },
];

export const PAYMENT_METHODS = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];
export const methodLabel = (m?: string | null) =>
  PAYMENT_METHODS.find((x) => x.value === m)?.label ?? (m ?? "—");

export const INVOICE_STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  issued: { label: "Issued", className: "bg-info/15 text-info" },
  partial: { label: "Partial", className: "bg-warning/15 text-warning" },
  paid: { label: "Paid", className: "bg-success/15 text-success" },
  overdue: { label: "Overdue", className: "bg-destructive/15 text-destructive" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground line-through" },
  written_off: { label: "Voided", className: "bg-muted text-muted-foreground line-through" },
};

export const PAYMENT_STATUS: Record<string, string> = {
  confirmed: "bg-success/15 text-success",
  pending: "bg-warning/15 text-warning",
  reversed: "bg-muted text-muted-foreground line-through",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

export const studentName = (s: any) =>
  s ? [s.first_name, s.last_name].filter(Boolean).join(" ") : "—";

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, days: number) => {
  const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
};

export async function refreshSetup(tenantId: string) {
  await supabase.rpc("recompute_setup_progress", { p_tenant_id: tenantId });
}

/** Edge-function errors carry a JSON body; surface its message, never raw text. */
export async function fnError(error: any, data: any, fallback: string) {
  if (data?.error) return String(data.error);
  try { const b = await error?.context?.json?.(); if (b?.error) return String(b.error); } catch { /* ignore */ }
  return fallback;
}

export async function openSignedPdf(fn: string, body: Record<string, unknown>, filename: string) {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error || !(data as any)?.url) throw new Error(await fnError(error, data, "Could not create the PDF. Please try again."));
  const a = document.createElement("a");
  a.href = (data as any).url; a.target = "_blank"; a.rel = "noopener"; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}
