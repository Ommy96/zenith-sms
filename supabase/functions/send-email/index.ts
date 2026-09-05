import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jr = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function readBody(res: Response): Promise<any> {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { __raw: text }; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let messageId: string | null = null;
  let adminRef: any = null;
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    adminRef = admin;
    const { message_id, attachments } = await req.json();
    messageId = message_id ?? null;
    if (!message_id) return jr({ error: "message_id required" }, 400);


    const { data: msg } = await admin.from("messages").select("*").eq("id", message_id).maybeSingle();
    if (!msg) return jr({ error: "Not found" }, 404);

    const { data: cfg } = await admin.from("tenant_messaging_config").select("*").eq("tenant_id", msg.tenant_id).maybeSingle();
    if (!cfg?.resend_api_key || !cfg?.email_from_address) {
      await admin.from("messages").update({ status: "failed", failed_at: new Date().toISOString(), error: "Email not configured" }).eq("id", message_id);
      return jr({ error: "Email not configured" }, 400);
    }

    const { data: opt } = await admin.from("message_opt_outs").select("id").eq("tenant_id", msg.tenant_id).eq("address", msg.recipient_address).eq("channel", "email").maybeSingle();
    if (opt) {
      await admin.from("messages").update({ status: "failed", failed_at: new Date().toISOString(), error: "Recipient opted out" }).eq("id", message_id);
      return jr({ error: "Opted out" }, 400);
    }

    const from = cfg.email_from_name ? `${cfg.email_from_name} <${cfg.email_from_address}>` : cfg.email_from_address;
    const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111">${(msg.body || "").replace(/\n/g, "<br>")}</div>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.resend_api_key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [msg.recipient_address],
        subject: msg.subject || "Message from your school",
        html,
        text: msg.body,
        ...(Array.isArray(attachments) && attachments.length
          ? { attachments: attachments.map((a: any) => ({ filename: a.filename, content: a.content })) }
          : {}),
      }),
    });
    const data = await readBody(res);
    const ok = res.ok;
    await admin.from("messages").update({
      status: ok ? "sent" : "failed",
      sent_at: ok ? new Date().toISOString() : null,
      failed_at: ok ? null : new Date().toISOString(),
      provider: "resend",
      provider_message_id: data?.id || null,
      error: ok ? null : String(data?.message || data?.error || data?.__raw || `Send failed (HTTP ${res.status})`).slice(0, 300),
    }).eq("id", message_id);
    if (ok) await admin.from("tenant_messaging_config").update({ email_sent_today: (cfg.email_sent_today || 0) + 1 }).eq("id", cfg.id);
    return jr({ ok, id: data?.id, error: ok ? null : data });
  } catch (e) {
    const emsg = (e as Error).message;
    if (adminRef && messageId) {
      await adminRef.from("messages").update({ status: "failed", failed_at: new Date().toISOString(), error: emsg.slice(0, 300) }).eq("id", messageId);
    }
    return jr({ ok: false, error: emsg }, 500);
  }

});