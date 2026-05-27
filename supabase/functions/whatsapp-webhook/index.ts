import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

async function sendWhatsAppReply(cfg: any, to: string, text: string) {
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${cfg.phone_number_id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
    });
    return await res.json();
  } catch (e) {
    console.warn("WA reply failed:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token) {
      const { data } = await admin.from("whatsapp_config").select("id").eq("webhook_verify_token", token).maybeSingle();
      if (data) return new Response(challenge || "", { status: 200, headers: corsHeaders });
    }
    return new Response("forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: corsHeaders });

  try {
    const body = await req.json();
    const entries = body?.entry || [];
    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const phone_number_id = value?.metadata?.phone_number_id;
        if (!phone_number_id) continue;
        const { data: cfg } = await admin.from("whatsapp_config").select("*").eq("phone_number_id", phone_number_id).maybeSingle();
        if (!cfg?.tenant_id) continue;
        const tenant_id = cfg.tenant_id;

        // Inbound messages
        for (const msg of value.messages || []) {
          const from = msg.from;
          const text = msg.text?.body || msg.button?.text || "[unsupported message]";
          // Match student by guardian phone (loose match on last 9 digits)
          let student_id: string | null = null;
          if (from) {
            const tail = from.slice(-9);
            const { data: s } = await admin.from("students").select("id").eq("tenant_id", tenant_id).ilike("guardian_phone", `%${tail}%`).limit(1).maybeSingle();
            student_id = s?.id || null;
          }
          await admin.from("whatsapp_messages").insert({
            tenant_id, direction: "in", wa_message_id: msg.id, from_phone: from,
            student_id, body: text, status: "received", raw_payload: msg,
          });

          // AI parent bot: only answer free-text from a known guardian.
          if (msg.type === "text" && student_id && from && text && text.trim().length > 1) {
            try {
              const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-parent-bot`;
              const aiRes = await fetch(fnUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-internal-key": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
                },
                body: JSON.stringify({ tenantId: tenant_id, studentId: student_id, question: text }),
              });
              const aiData = await aiRes.json().catch(() => ({}));
              const reply = (aiData?.text as string) || "Sorry, I couldn't process that. Please try again or contact the school office.";
              const sendRes = await sendWhatsAppReply(cfg, from, reply);
              await admin.from("whatsapp_messages").insert({
                tenant_id, direction: "out", wa_message_id: sendRes?.messages?.[0]?.id || null,
                to_phone: from, student_id, body: reply,
                status: sendRes?.messages ? "sent" : "failed", raw_payload: sendRes,
              });
            } catch (e) {
              console.warn("Parent bot reply failed:", e);
            }
          }
        }

        // Status updates
        for (const st of value.statuses || []) {
          await admin.from("whatsapp_messages").update({ status: st.status, raw_payload: st }).eq("wa_message_id", st.id);
        }
      }
    }
    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});