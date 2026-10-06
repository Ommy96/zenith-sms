import { z } from "zod";

export const PHONE_ERROR = "Please enter a valid phone number (format: 0712345678 or +254712345678)";

/** Kenya-first E.164 normalisation. Returns null when the input can't be normalised. */
export function normalizeKenyaPhone(input?: string | null): string | null {
  if (!input) return null;
  const digits = input.replace(/[\s()\-]/g, "");
  if (/^\+254[0-9]{9}$/.test(digits)) return digits;
  if (/^254[0-9]{9}$/.test(digits)) return "+" + digits;
  if (/^0[0-9]{9}$/.test(digits)) return "+254" + digits.slice(1);
  if (/^\+[0-9]{10,15}$/.test(digits)) return digits;
  return null;
}
export const isValidKenyaPhone = (input?: string | null) => normalizeKenyaPhone(input) !== null;

export const kenyaPhone = z.string().trim().refine((v) => !!normalizeKenyaPhone(v), PHONE_ERROR);
export const optionalKenyaPhone = z.string().trim().refine((v) => !v || !!normalizeKenyaPhone(v), PHONE_ERROR);

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
