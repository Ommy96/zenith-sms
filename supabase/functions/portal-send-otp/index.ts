// portal-send-otp — issues a login code to a parent/student phone number.
//
// verify_jwt: false (pre-auth). Always returns 200 so the endpoint cannot be
// used to discover which numbers exist.
// Env: MESSAGING_DRY_RUN, ZENITH_INTERNAL_SECRET

import { adminClient, requestIp } from "../_shared/auth.ts";
import {
  callInternal, corsHeaders, jsonResponse, logQueuedMessage, normalizePhone, renderTemplate,
} from "../_shared/messaging.ts";

const WINDOW_MINUTES = 15;
const MAX_HITS = 5;

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function rateLimited(key: string, endpoint: string): Promise<boolean> {
  const admin = adminClient();
  const bucket = new Date(Math.floor(Date.now() / (WINDOW_MINUTES * 60000)) * WINDOW_MINUTES * 60000).toISOString();
  const { data } = await admin.from("portal_auth_ratelimit")
    .select("id, hit_count").eq("key", key).eq("endpoint", endpoint).eq("window_start", bucket).maybeSingle();
  if (!data) {
    await admin.from("portal_auth_ratelimit").insert({ key, endpoint, window_start: bucket, hit_count: 1 });
    return false;
  }
  await admin.from("portal_auth_ratelimit").update({ hit_count: data.hit_count + 1 }).eq("id", data.id);
  return data.hit_count + 1 > MAX_HITS;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const generic = (phone: string) => jsonResponse({
    ok: true,
    masked: phone ? phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4) : null,
  });

  try {
    const { phone } = await req.json().catch(() => ({ phone: "" }));
    const normalized = normalizePhone(String(phone ?? ""));
    if (!normalized || normalized.length < 10) return generic("");

    const ip = requestIp(req) ?? "unknown";
    if (await rateLimited(normalized, "portal-send-otp") || await rateLimited(ip, "portal-send-otp-ip")) {
      console.warn("[portal-send-otp] rate limited", normalized);
      return generic(normalized);
    }

    const admin = adminClient();
    const tail = normalized.replace(/\D/g, "").slice(-9);

    const [{ data: guardians }, { data: students }] = await Promise.all([
      admin.from("guardians").select("id, tenant_id, full_name, phone_primary, whatsapp_number")
        .or(`phone_primary.ilike.%${tail},whatsapp_number.ilike.%${tail}`).limit(1),
      admin.from("students").select("id, tenant_id, first_name, last_name, phone")
        .ilike("phone", `%${tail}`).limit(1),
    ]);
    const guardian = guardians?.[0];
    const student = students?.[0];
    if (!guardian && !student) {
      console.log("[portal-send-otp] no match for", normalized);
      return generic(normalized);
    }

    const tenantId = guardian?.tenant_id ?? student!.tenant_id;
    const name = guardian?.full_name ?? `${student?.first_name ?? ""} ${student?.last_name ?? ""}`.trim();

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await admin.from("portal_otps").insert({
      phone: normalized,
      code_hash: await sha256(code),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      tenant_id: tenantId,
      guardian_id: guardian?.id ?? null,
      student_id: student?.id ?? null,
      purpose: "portal_login",
    });

    const { data: tpl } = await admin.from("message_templates")
      .select("body_template").eq("key", "portal_otp").eq("language", "en")
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`).order("tenant_id", { nullsFirst: false })
      .limit(1).maybeSingle();
    const body = renderTemplate(
      tpl?.body_template ?? "Your Zenith code is {{code}}. It expires in 10 minutes.",
      { code, minutes: "10", name },
    );

    const messageId = await logQueuedMessage({
      tenantId, channel: "sms", body,
      recipientPhone: normalized, recipientName: name || null,
      recipientType: guardian ? "guardian" : "student",
      recipientId: guardian?.id ?? student?.id ?? null,
      studentId: student?.id ?? null,
      templateKey: "portal_otp",
    });
    callInternal("send-sms", { message_id: messageId, tenant_id: tenantId }).catch(() => {});

    return generic(normalized);
  } catch (e) {
    console.error("[portal-send-otp]", (e as Error).message);
    return jsonResponse({ ok: true, masked: null });
  }
});
