// create-tenant — provisions a school (tenant) for a freshly signed-up user.
// Idempotent: if the caller already belongs to a tenant, that tenant is returned.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "school";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Missing bearer token" }, 401);
    }
    const token = authHeader.slice(7).trim();

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Invalid token" }, 401);
    const userId = userData.user.id;

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Idempotency — already a member of a tenant?
    // If this check itself fails we must NOT go on to create a second school.
    const { data: existing, error: exErr } = await admin
      .from("user_tenants")
      .select("tenant_id, tenants!inner(id, slug, name)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (exErr) {
      console.error("[create-tenant] membership check failed:", exErr.message);
      return json({ error: "We couldn't check your school right now. Please try again in a minute.", retry: true });
    }
    if (existing) {
      const t = (existing as any).tenants;
      return json({ tenant_id: t.id, tenant_slug: t.slug, tenant_name: t.name, created: false });
    }

    const body = await req.json().catch(() => ({}));
    const fromBody = typeof body?.school_name === "string" ? body.school_name.trim() : "";
    const meta = userData.user.user_metadata?.requested_school_name;
    const fromMeta = typeof meta === "string" ? meta.trim() : "";
    const rawName = (fromBody.length >= 2 ? fromBody : fromMeta).slice(0, 120);
    if (rawName.length < 2) {
      return json({ error: "Please enter your school's name (at least 2 characters).", needs_name: true });
    }

    // Unique slug: base, base-2, base-3 ...
    const base = slugify(rawName);
    let slug = base;
    for (let i = 2; i < 100; i++) {
      const { data: clash } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
      if (!clash) break;
      slug = `${base}-${i}`;
    }

    const { data: tenant, error: tErr } = await admin
      .from("tenants")
      .insert({
        name: rawName,
        slug,
        country_code: "KE",
        currency_code: "KES",
        timezone: "Africa/Nairobi",
        locale: "en",
        curriculum: "cbc",
        school_type: "primary",
        subscription_plan: "free",
        subscription_status: "trialing",
      })
      .select("id, slug, name")
      .single();
    if (tErr) return json({ error: tErr.message }, 400);

    const { error: mErr } = await admin
      .from("user_tenants")
      .insert({ user_id: userId, tenant_id: tenant.id, is_active: true });
    if (mErr) return json({ error: mErr.message }, 400);

    const { data: role } = await admin
      .from("roles")
      .select("id")
      .eq("name", "school_admin")
      .is("tenant_id", null)
      .maybeSingle();
    if (role) {
      await admin.from("user_roles").insert({ user_id: userId, tenant_id: tenant.id, role_id: role.id });
    }

    await admin.from("profiles").update({ default_tenant_id: tenant.id, tenant_id: tenant.id }).eq("id", userId);
    await admin.rpc("recompute_setup_progress", { p_tenant_id: tenant.id }).catch?.(() => {});

    return json({ tenant_id: tenant.id, tenant_slug: tenant.slug, tenant_name: tenant.name, created: true });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unexpected error" }, 500);
  }
});
