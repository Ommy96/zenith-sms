import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const baseUrl = (env: string) =>
  env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", claimsData.claims.sub).maybeSingle();
    const schoolId = profile?.school_id;
    if (!schoolId) return new Response(JSON.stringify({ error: "No school" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: cfg } = await supabase.from("mpesa_config").select("*").eq("school_id", schoolId).maybeSingle();
    if (!cfg?.consumer_key || !cfg?.consumer_secret) {
      return new Response(JSON.stringify({ ok: false, error: "Missing consumer key/secret" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const creds = btoa(`${cfg.consumer_key}:${cfg.consumer_secret}`);
    const res = await fetch(`${baseUrl(cfg.environment)}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${creds}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.access_token) {
      return new Response(JSON.stringify({ ok: false, status: res.status, error: body }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true, environment: cfg.environment }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});