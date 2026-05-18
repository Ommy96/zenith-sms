import { supabase } from "@/integrations/supabase/client";

export interface PricingRow {
  channel: string;
  provider: string;
  country_code: string;
  unit_price: number;
  currency: string;
}

export async function loadPricing(tenantId: string, countryCode = "KE"): Promise<PricingRow[]> {
  const { data } = await supabase
    .from("provider_pricing")
    .select("channel, provider, country_code, unit_price, currency")
    .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
    .eq("country_code", countryCode)
    .eq("is_active", true);
  return (data as any) || [];
}

export function estimateCost(
  pricing: PricingRow[],
  channel: string,
  recipientCount: number,
  provider?: string
): { unit: number; total: number; currency: string; provider: string } {
  const candidates = pricing.filter((p) => p.channel === channel);
  const row =
    (provider && candidates.find((p) => p.provider === provider)) ||
    candidates[0] || { unit_price: 0, currency: "KES", provider: "internal" };
  const unit = Number(row.unit_price);
  return {
    unit,
    total: unit * recipientCount,
    currency: row.currency,
    provider: row.provider,
  };
}