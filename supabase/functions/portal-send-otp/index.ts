import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jr = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

function normPhone(p: string): string {
  let x = (p || "").replace(/[^\d+]/g, "");
  if (x.startsWith("+")) return x;
  if (x.startsWith("0")) return "+254" + x.slice(1);
  if (x.startsWith("254")) return "+" + x;
  if (x.length === 9) return "+254" + x;
  return x.startsWith("+") ? x : "+" + x;
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { phone } = await req.json();
    if (!phone) return jr({ error: "phone required" }, 400);
    const normalized = normPhone(phone);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Find a guardian with this phone to determine tenant
    const digits = normalized.replace(/[^0-9]/g, "");
    const { data: guardians } = await admin
      .from("guardians")
      .select("id, tenant_id, phone_primary, whatsapp_number, full_name")
      .limit(5);
    const match = (guardians || []).find((g: any) => {
      const a = (g.phone_primary || "").replace(/[^0-9]/g, "");
      const b = (g.whatsapp_number || "").replace(/[^0-9]/g, "");
      return a === digits || b === digits;
    });
    if (!match) return jr({ error: "No parent account found for this phone number" }, 404);

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(code);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await admin.from("portal_otps").insert({ phone: normalized, code_hash, expires_at });

    // Queue an SMS via existing messaging pipeline
    const { data: msg, error: msgErr } = await admin
      .from("messages")
      .insert({
        tenant_id: match.tenant_id,
        channel: "sms",
        direction: "outbound",
        recipient_type: "guardian",
        recipient_id: match.id,
        recipient_phone: normalized,
        body: `Your SomaSphere parent portal code is ${code}. It expires in 10 minutes.`,
        status: "queued",
      })
      .select("id")
      .single();
    if (msgErr) return jr({ error: msgErr.message }, 500);

    // Fire and forget dispatch
    fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message_id: msg.id }),
    }).catch(() => {});

    return jr({ ok: true, phone: normalized, masked: normalized.slice(0, -4).replace(/\d/g, "*") + normalized.slice(-4) });
  } catch (e) {
    return jr({ error: (e as Error).message }, 500);
  }
});