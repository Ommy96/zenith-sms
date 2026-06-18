import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};
  let overallOk = true;

  const t0 = Date.now();
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await admin.from("tenants").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
    checks.db = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    overallOk = false;
    checks.db = { ok: false, ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
  }

  const t1 = Date.now();
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/auth/v1/health`;
    const res = await fetch(url, { headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" } });
    checks.auth = { ok: res.ok, ms: Date.now() - t1 };
    if (!res.ok) overallOk = false;
  } catch (e) {
    overallOk = false;
    checks.auth = { ok: false, ms: Date.now() - t1, error: e instanceof Error ? e.message : String(e) };
  }

  return new Response(
    JSON.stringify({ status: overallOk ? "ok" : "degraded", checks, ts: new Date().toISOString() }),
    { status: overallOk ? 200 : 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});