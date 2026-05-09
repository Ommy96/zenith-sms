import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

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
        const { data: cfg } = await admin.from("whatsapp_config").select("school_id").eq("phone_number_id", phone_number_id).maybeSingle();
        if (!cfg?.school_id) continue;
        const school_id = cfg.school_id;

        // Inbound messages
        for (const msg of value.messages || []) {
          const from = msg.from;
          const text = msg.text?.body || msg.button?.text || "[unsupported message]";
          // Match student by guardian phone (loose match on last 9 digits)
          let student_id: string | null = null;
          if (from) {
            const tail = from.slice(-9);
            const { data: s } = await admin.from("students").select("id").eq("school_id", school_id).ilike("guardian_phone", `%${tail}%`).limit(1).maybeSingle();
            student_id = s?.id || null;
          }
          await admin.from("whatsapp_messages").insert({
            school_id, direction: "in", wa_message_id: msg.id, from_phone: from,
            student_id, body: text, status: "received", raw_payload: msg,
          });
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