import { useTenant } from "@/contexts/TenantContext";

export function formatMoney(amount: number | null | undefined, currency: string, locale: string) {
  const n = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

export function Money({ amount, className }: { amount: number | null | undefined; className?: string }) {
  const { tenant } = useTenant();
  const currency = tenant?.currency_code ?? "KES";
  const locale = tenant?.locale ?? "en-KE";
  return <span className={className}>{formatMoney(amount, currency, locale)}</span>;
}

export function useMoney() {
  const { tenant } = useTenant();
  const currency = tenant?.currency_code ?? "KES";
  const locale = tenant?.locale ?? "en-KE";
  return (amount: number | null | undefined) => formatMoney(amount, currency, locale);
}