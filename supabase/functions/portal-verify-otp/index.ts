// portal-verify-otp — exchanges a valid code for a Supabase session link.
//
// verify_jwt: false (pre-auth).

import { adminClient, requestIp } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse, normalizePhone } from "../_shared/messaging.ts";

const WINDOW_MINUTES = 15;
const MAX_HITS = 10;

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function rateLimited(key: string): Promise<boolean> {
  const admin = adminClient();
  const bucket = new Date(Math.floor(Date.now() / (WINDOW_MINUTES * 60000)) * WINDOW_MINUTES * 60000).toISOString();
  const { data } = await admin.from("portal_auth_ratelimit")
    .select("id, hit_count").eq("key", key).eq("endpoint", "portal-verify-otp").eq("window_start", bucket).maybeSingle();
  if (!data) {
    await admin.from("portal_auth_ratelimit").insert({ key, endpoint: "portal-verify-otp", window_start: bucket, hit_count: 1 });
    return false;
  }
  await admin.from("portal_auth_ratelimit").update({ hit_count: data.hit_count + 1 }).eq("id", data.id);
  return data.hit_count + 1 > MAX_HITS;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) return jsonResponse({ error: "phone and code required" }, 400);
    const normalized = normalizePhone(String(phone));

    if (await rateLimited(requestIp(req) ?? normalized)) {
      return jsonResponse({ error: "Too many attempts. Try again later." }, 429);
    }

    const admin = adminClient();
    const { data: otp } = await admin.from("portal_otps").select("*")
      .eq("phone", normalized).eq("is_consumed", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!otp) return jsonResponse({ error: "Code expired or not found" }, 401);
    if ((otp.attempts ?? 0) >= (otp.max_attempts ?? 5)) return jsonResponse({ error: "Too many attempts" }, 429);

    if (otp.code_hash !== await sha256(String(code).trim())) {
      await admin.from("portal_otps").update({ attempts: (otp.attempts ?? 0) + 1 }).eq("id", otp.id);
      return jsonResponse({ error: "Invalid code" }, 401);
    }
    await admin.from("portal_otps").update({
      is_consumed: true, consumed_at: new Date().toISOString(),
    }).eq("id", otp.id);

    const portalEmail = `portal+${normalized.replace(/\D/g, "")}@parent.zenith.local`;
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let userId = existing?.users.find((u) => u.email === portalEmail)?.id ?? null;
    if (!userId) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: portalEmail, email_confirm: true,
        user_metadata: { portal: true, phone: normalized },
      });
      if (error) return jsonResponse({ error: error.message }, 500);
      userId = created.user!.id;
    }

    await Promise.all([
      admin.rpc("portal_link_guardian_user", { _phone: normalized, _user_id: userId }),
      admin.rpc("portal_link_student_user", { _phone: normalized, _user_id: userId }),
    ]);

    const { data: link, error: lErr } = await admin.auth.admin.generateLink({
      type: "magiclink", email: portalEmail,
    });
    if (lErr) return jsonResponse({ error: lErr.message }, 500);
    const props: any = link?.properties ?? {};

    return jsonResponse({
      ok: true,
      user_id: userId,
      email: portalEmail,
      email_otp: props.email_otp,
      action_link: props.action_link,
    });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
