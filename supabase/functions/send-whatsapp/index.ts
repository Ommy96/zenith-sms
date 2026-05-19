import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jr = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function normPhone(p: string) {
  let x = (p || "").replace(/[^\d+]/g, "");
  if (x.startsWith("+")) x = x.slice(1);
  if (x.startsWith("0")) x = "254" + x.slice(1);
  if (x.length === 9) x = "254" + x;
  return x;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { message_id } = await req.json();
    if (!message_id) return jr({ error: "message_id required" }, 400);

    const { data: msg } = await admin.from("messages").select("*").eq("id", message_id).maybeSingle();
    if (!msg) return jr({ error: "Not found" }, 404);

    const { data: cfg } = await admin.from("whatsapp_config").select("*").eq("tenant_id", msg.tenant_id).maybeSingle();
    if (!cfg?.phone_number_id || !cfg?.access_token) {
      await admin.from("messages").update({ status: "failed", failed_at: new Date().toISOString(), error: "WhatsApp not configured" }).eq("id", message_id);
      return jr({ error: "WhatsApp not configured" }, 400);
    }

    const phone = normPhone(msg.recipient_address || "");
    const { data: opt } = await admin.from("message_opt_outs").select("id").eq("tenant_id", msg.tenant_id).eq("address", phone).eq("channel", "whatsapp").maybeSingle();
    if (opt) {
      await admin.from("messages").update({ status: "failed", failed_at: new Date().toISOString(), error: "Opted out" }).eq("id", message_id);
      return jr({ error: "Opted out" }, 400);
    }

    const payload = { messaging_product: "whatsapp", to: phone, type: "text", text: { body: msg.body } };
    const res = await fetch(`https://graph.facebook.com/v20.0/${cfg.phone_number_id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const ok = res.ok;
    const wa_id = data?.messages?.[0]?.id || null;
    await admin.from("messages").update({
      status: ok ? "sent" : "failed",
      sent_at: ok ? new Date().toISOString() : null,
      failed_at: ok ? null : new Date().toISOString(),
      provider: "whatsapp",
      provider_message_id: wa_id,
      error: ok ? null : (data?.error?.message || "Send failed"),
    }).eq("id", message_id);
    return jr({ ok, wa_id, error: ok ? null : data });
  } catch (e) {
    return jr({ error: (e as Error).message }, 500);
  }
});