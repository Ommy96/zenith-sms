// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Stores/retrieves a tenant's NEMIS portal login.
// Password is stored base64-encoded (DB at-rest encryption + RLS isolation guard it from clients;
// nemis_credentials table has RLS enabled with NO policies for non-service roles).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return j({ error: "Unauthorized" }, 401);

    const svc = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const tenant_id = body.tenant_id;
    if (!tenant_id) return j({ error: "tenant_id required" }, 400);

    // Must be school_admin or hold settings.manage
    const { data: canManage } = await svc.rpc("has_perm", { _tenant: tenant_id, _perm: "settings.manage", _user: user.id });
    if (!canManage) return j({ error: "Forbidden" }, 403);

    const action = body.action ?? "get";
    if (action === "get") {
      const { data } = await svc.from("nemis_credentials").select("username, last_synced_at, updated_at").eq("tenant_id", tenant_id).maybeSingle();
      return j({ username: data?.username ?? null, last_synced_at: data?.last_synced_at ?? null, updated_at: data?.updated_at ?? null });
    }
    if (action === "save") {
      const username = String(body.username ?? "").trim();
      const password = String(body.password ?? "");
      if (!username || !password) return j({ error: "username and password required" }, 400);
      const cipher = btoa(unescape(encodeURIComponent(password)));
      const { error } = await svc.from("nemis_credentials").upsert({
        tenant_id, username, password_ciphertext: cipher, updated_by: user.id,
      });
      if (error) throw error;
      return j({ ok: true });
    }
    if (action === "delete") {
      await svc.from("nemis_credentials").delete().eq("tenant_id", tenant_id);
      return j({ ok: true });
    }
    return j({ error: "Unknown action" }, 400);
  } catch (e: any) {
    return j({ error: e?.message ?? "Internal error" }, 500);
  }
});
function j(d: unknown, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }