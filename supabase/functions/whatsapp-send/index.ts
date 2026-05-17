import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

function fillTemplate(body: string, params: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] ?? "");
}

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
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { to, template_name, params = [], student_id, broadcast_id, free_text } = await req.json();
    if (!to) return new Response(JSON.stringify({ error: "to required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", claims.claims.sub).maybeSingle();
    const tenant_id = profile?.tenant_id;
    if (!tenant_id) return new Response(JSON.stringify({ error: "No school" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: cfg } = await admin.from("whatsapp_config").select("*").eq("tenant_id", tenant_id).maybeSingle();
    if (!cfg?.phone_number_id || !cfg?.access_token) {
      return new Response(JSON.stringify({ error: "WhatsApp not configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Daily rate limit
    const today = new Date().toISOString().slice(0, 10);
    let sentToday = cfg.messages_sent_today;
    if (cfg.last_reset_date !== today) {
      sentToday = 0;
      await admin.from("whatsapp_config").update({ messages_sent_today: 0, last_reset_date: today }).eq("id", cfg.id);
    }
    if (sentToday >= cfg.daily_message_limit) {
      return new Response(JSON.stringify({ error: "Daily message limit reached" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let template: any = null;
    let body = free_text || "";
    let payload: any;
    if (template_name) {
      const { data: t } = await admin.from("whatsapp_templates").select("*").eq("tenant_id", tenant_id).eq("name", template_name).maybeSingle();
      if (!t) return new Response(JSON.stringify({ error: "Template not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      template = t;
      body = fillTemplate(t.body_template, params);
      payload = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: t.name,
          language: { code: t.language || "en" },
          components: params.length ? [{ type: "body", parameters: params.map((p: string) => ({ type: "text", text: String(p) })) }] : [],
        },
      };
    } else if (free_text) {
      payload = { messaging_product: "whatsapp", to, type: "text", text: { body: free_text } };
    } else {
      return new Response(JSON.stringify({ error: "template_name or free_text required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const res = await fetch(`https://graph.facebook.com/v20.0/${cfg.phone_number_id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const respBody = await res.json();
    const ok = res.ok;
    const wa_id = respBody?.messages?.[0]?.id || null;

    await admin.from("whatsapp_messages").insert({
      tenant_id, direction: "out", wa_message_id: wa_id, to_phone: to, student_id: student_id || null,
      template_id: template?.id || null, broadcast_id: broadcast_id || null, body,
      status: ok ? "sent" : "failed", error: ok ? null : (respBody?.error?.message || "Failed"),
      raw_payload: respBody,
    });

    if (ok) {
      await admin.from("whatsapp_config").update({ messages_sent_today: sentToday + 1 }).eq("id", cfg.id);
      if (template) {
        await admin.from("whatsapp_templates").update({ usage_count: (template.usage_count || 0) + 1, last_used_at: new Date().toISOString() }).eq("id", template.id);
      }
    }

    return new Response(JSON.stringify({ ok, wa_id, response: respBody }), { status: ok ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});