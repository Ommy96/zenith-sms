import { z } from "zod";

/** Accepts +254XXXXXXXXX, 254XXXXXXXXX or 0XXXXXXXXX; returns E.164 or null. */
export function normalizeKenyaPhone(raw?: string | null): string | null {
  const v = (raw ?? "").replace(/[\s-]/g, "");
  if (!v) return null;
  if (/^\+254[17]\d{8}$/.test(v)) return v;
  if (/^254[17]\d{8}$/.test(v)) return `+${v}`;
  if (/^0[17]\d{8}$/.test(v)) return `+254${v.slice(1)}`;
  return null;
}

export const kenyaPhone = z.string().trim().refine((v) => !!normalizeKenyaPhone(v), "Use +2547XXXXXXXX or 07XXXXXXXX");
export const optionalKenyaPhone = z.string().trim().refine((v) => !v || !!normalizeKenyaPhone(v), "Use +2547XXXXXXXX or 07XXXXXXXX");

/** Student status: 'transferred' in the database is shown as "Withdrawn" (no 'withdrawn' enum value exists). */
export const STATUS_FILTERS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "transferred", label: "Withdrawn" },
  { value: "graduated", label: "Graduated" },
  { value: "all", label: "All" },
] as const;

export function studentStatusMeta(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "active": return { label: "Active", className: "bg-success/15 text-success border-success/30" };
    case "suspended": return { label: "Suspended", className: "bg-warning/15 text-warning border-warning/30" };
    case "transferred": case "dropped_out": case "expelled": return { label: "Withdrawn", className: "bg-destructive/15 text-destructive border-destructive/30" };
    case "graduated": case "alumni": return { label: "Graduated", className: "bg-muted text-muted-foreground border-border" };
    default: return { label: status || "—", className: "bg-muted text-muted-foreground border-border" };
  }
}

export function ageFrom(dob?: string | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400_000));
}

export const WITHDRAW_REASONS = [
  ["transferred_to_other_school", "Transferred to another school"],
  ["financial", "Financial"],
  ["family_relocation", "Family relocation"],
  ["health", "Health"],
  ["disciplinary", "Disciplinary"],
  ["other", "Other"],
] as const;
