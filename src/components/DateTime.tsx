import { useTenant } from "@/contexts/TenantContext";

type DateInput = string | number | Date | null | undefined;

function format(value: DateInput, locale: string, timezone: string, opts: Intl.DateTimeFormatOptions) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale, { ...opts, timeZone: timezone }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function DateTime({ value, mode = "date", className }: { value: DateInput; mode?: "date" | "datetime" | "time" | "long"; className?: string }) {
  const { tenant } = useTenant();
  const locale = tenant?.locale ?? "en-KE";
  const tz = tenant?.timezone ?? "Africa/Nairobi";
  const opts: Intl.DateTimeFormatOptions =
    mode === "datetime" ? { dateStyle: "medium", timeStyle: "short" } :
    mode === "time" ? { timeStyle: "short" } :
    mode === "long" ? { dateStyle: "long" } :
    { dateStyle: "medium" };
  return <span className={className}>{format(value, locale, tz, opts)}</span>;
}

export function useDate() {
  const { tenant } = useTenant();
  const locale = tenant?.locale ?? "en-KE";
  const tz = tenant?.timezone ?? "Africa/Nairobi";
  return (value: DateInput, opts?: Intl.DateTimeFormatOptions) =>
    format(value, locale, tz, opts ?? { dateStyle: "medium" });
}