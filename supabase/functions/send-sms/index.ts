import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jr(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function normPhone(p: string, country = "KE"): string {
  let x = (p || "").replace(/[^\d+]/g, "");
  if (x.startsWith("+")) return x;
  if (country === "KE") {
    if (x.startsWith("0")) return "+254" + x.slice(1);
    if (x.startsWith("254")) return "+" + x;
    if (x.length === 9) return "+254" + x;
  }
  return x.startsWith("+") ? x : "+" + x;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { message_id } = await req.json();
    if (!message_id) return jr({ error: "message_id required" }, 400);

    const { data: msg } = await admin.from("messages").select("*").eq("id", message_id).maybeSingle();
    if (!msg) return jr({ error: "Message not found" }, 404);

    const { data: cfg } = await admin.from("tenant_messaging_config").select("*").eq("tenant_id", msg.tenant_id).maybeSingle();
    if (!cfg) {
      await admin.from("messages").update({ status: "failed", failed_at: new Date().toISOString(), error: "No messaging config" }).eq("id", message_id);
      return jr({ error: "No messaging config" }, 400);
    }

    // Daily reset
    const today = new Date().toISOString().slice(0, 10);
    if (cfg.last_reset_date !== today) {
      await admin.from("tenant_messaging_config").update({ sms_sent_today: 0, email_sent_today: 0, last_reset_date: today }).eq("id", cfg.id);
      cfg.sms_sent_today = 0;
    }
    if (cfg.sms_sent_today >= cfg.sms_daily_limit) {
      await admin.from("messages").update({ status: "failed", failed_at: new Date().toISOString(), error: "SMS daily limit reached" }).eq("id", message_id);
      return jr({ error: "Daily limit" }, 429);
    }

    // Opt-out check
    const phone = normPhone(msg.recipient_address || "", cfg.country_code);
    const { data: opt } = await admin.from("message_opt_outs").select("id").eq("tenant_id", msg.tenant_id).eq("address", phone).eq("channel", "sms").maybeSingle();
    if (opt) {
      await admin.from("messages").update({ status: "failed", failed_at: new Date().toISOString(), error: "Recipient opted out" }).eq("id", message_id);
      return jr({ error: "Opted out" }, 400);
    }

    let ok = false, providerId: string | null = null, errMsg: string | null = null, providerName = cfg.sms_provider;

    if (cfg.sms_provider === "africastalking") {
      if (!cfg.at_username || !cfg.at_api_key) {
        errMsg = "Africa's Talking not configured";
      } else {
        const params = new URLSearchParams({
          username: cfg.at_username,
          to: phone,
          message: msg.body,
        });
        if (cfg.at_sender_id) params.set("from", cfg.at_sender_id);
        const res = await fetch("https://api.africastalking.com/version1/messaging", {
          method: "POST",
          headers: {
            apiKey: cfg.at_api_key,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: params.toString(),
        });
        const data = await res.json();
        const r = data?.SMSMessageData?.Recipients?.[0];
        if (r && (r.status === "Success" || r.statusCode === 101 || r.statusCode === 102)) {
          ok = true;
          providerId = r.messageId;
        } else {
          errMsg = r?.status || data?.SMSMessageData?.Message || "Send failed";
        }
      }
    } else if (cfg.sms_provider === "twilio") {
      if (!cfg.twilio_account_sid || !cfg.twilio_auth_token || !cfg.twilio_from_number) {
        errMsg = "Twilio not configured";
      } else {
        const auth = btoa(`${cfg.twilio_account_sid}:${cfg.twilio_auth_token}`);
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.twilio_account_sid}/Messages.json`, {
          method: "POST",
          headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ To: phone, From: cfg.twilio_from_number, Body: msg.body }).toString(),
        });
        const data = await res.json();
        if (res.ok) { ok = true; providerId = data.sid; } else { errMsg = data?.message || "Twilio failed"; }
      }
    } else {
      errMsg = "Unknown SMS provider";
    }

    await admin.from("messages").update({
      status: ok ? "sent" : "failed",
      sent_at: ok ? new Date().toISOString() : null,
      failed_at: ok ? null : new Date().toISOString(),
      provider: providerName,
      provider_message_id: providerId,
      error: errMsg,
    }).eq("id", message_id);

    if (ok) {
      await admin.from("tenant_messaging_config").update({ sms_sent_today: (cfg.sms_sent_today || 0) + 1 }).eq("id", cfg.id);
    }

    return jr({ ok, provider_id: providerId, error: errMsg });
  } catch (e) {
    return jr({ error: (e as Error).message }, 500);
  }
});