import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", claims.claims.sub).maybeSingle();
    if (!profile?.school_id) return new Response(JSON.stringify({ error: "No school" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: cfg } = await supabase.from("whatsapp_config").select("phone_number_id, access_token").eq("school_id", profile.school_id).maybeSingle();
    if (!cfg?.phone_number_id || !cfg?.access_token) {
      return new Response(JSON.stringify({ ok: false, error: "Missing credentials" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const res = await fetch(`https://graph.facebook.com/v20.0/${cfg.phone_number_id}?fields=display_phone_number,verified_name`, {
      headers: { Authorization: `Bearer ${cfg.access_token}` },
    });
    const body = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: body?.error?.message || "Failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true, ...body }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});