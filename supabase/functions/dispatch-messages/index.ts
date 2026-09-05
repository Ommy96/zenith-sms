import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jr = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const FN_BY_CHANNEL: Record<string, string> = {
  sms: "send-sms",
  email: "send-email",
  whatsapp: "send-whatsapp",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SR_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPA_URL, SR_KEY);
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body?.limit) || 50, 200);

    const { data: claimed, error } = await admin.rpc("claim_due_messages", { _limit: limit });
    if (error) return jr({ error: error.message }, 500);
    const rows: any[] = claimed || [];
    if (!rows.length) return jr({ processed: 0 });

    const results = await Promise.allSettled(
      rows.map(async (m) => {
        const fn = FN_BY_CHANNEL[m.channel];
        if (!fn) {
          await admin.from("messages").update({ status: "failed", failed_at: new Date().toISOString(), error: `Unsupported channel ${m.channel}` }).eq("id", m.id);
          return { id: m.id, ok: false };
        }
        let ok = false;
        let errText = "Dispatch failed";
        try {
          const res = await fetch(`${SUPA_URL}/functions/v1/${fn}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${SR_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message_id: m.id }),
          });
          const raw = await res.text();
          let data: any = {};
          try { data = JSON.parse(raw); } catch { data = { __raw: raw }; }
          ok = res.ok && data?.ok !== false;
          if (!ok) errText = String(data?.error?.message || data?.error || data?.__raw || `HTTP ${res.status}`);
        } catch (e) {
          errText = (e as Error).message;
        }
        if (!ok) {
          // Safety net: never leave a claimed row stuck in "sending"
          const { data: cur } = await admin.from("messages").select("status").eq("id", m.id).maybeSingle();
          if (cur && cur.status !== "failed" && cur.status !== "sent") {
            await admin.from("messages").update({
              status: "failed", failed_at: new Date().toISOString(), error: errText.slice(0, 300),
            }).eq("id", m.id);
          }
        }
        return { id: m.id, ok };
      })
    );


    const sent = results.filter((r) => r.status === "fulfilled" && (r.value as any).ok).length;
    return jr({ processed: rows.length, sent });
  } catch (e) {
    return jr({ error: (e as Error).message }, 500);
  }
});