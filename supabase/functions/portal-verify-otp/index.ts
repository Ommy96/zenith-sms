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
    const { phone, code } = await req.json();
    if (!phone || !code) return jr({ error: "phone and code required" }, 400);
    const normalized = normPhone(phone);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const code_hash = await sha256(String(code).trim());
    const { data: otp } = await admin
      .from("portal_otps")
      .select("*")
      .eq("phone", normalized)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!otp) return jr({ error: "Code expired or not found" }, 401);
    if (otp.attempts >= 5) return jr({ error: "Too many attempts" }, 429);
    if (otp.code_hash !== code_hash) {
      await admin.from("portal_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      return jr({ error: "Invalid code" }, 401);
    }
    await admin.from("portal_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);

    // Create-or-find auth user with phone as email-like id
    const portalEmail = `portal+${normalized.replace(/[^0-9]/g, "")}@parent.zenith.local`;
    let userId: string | null = null;

    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing?.users.find((u) => u.email === portalEmail);
    if (found) {
      userId = found.id;
    } else {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: portalEmail,
        email_confirm: true,
        user_metadata: { portal: true, phone: normalized },
      });
      if (cErr) return jr({ error: cErr.message }, 500);
      userId = created.user!.id;
    }

    // Link guardian + student rows (single phone may be either or both)
    await Promise.all([
      admin.rpc("portal_link_guardian_user", { _phone: normalized, _user_id: userId }),
      admin.rpc("portal_link_student_user", { _phone: normalized, _user_id: userId }),
    ]);

    // Generate magic link to mint a session for the client
    const { data: link, error: lErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: portalEmail,
    });
    if (lErr) return jr({ error: lErr.message }, 500);

    const props: any = link?.properties || {};
    return jr({
      ok: true,
      user_id: userId,
      email: portalEmail,
      access_token: props.hashed_token ?? null,
      action_link: props.action_link,
      email_otp: props.email_otp,
    });
  } catch (e) {
    return jr({ error: (e as Error).message }, 500);
  }
});