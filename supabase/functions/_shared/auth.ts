// Shared auth helpers for Zenith edge functions.
//
// Env vars used:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//   ZENITH_INTERNAL_SECRET   — shared secret for service-to-service calls

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

export interface AuthedUser {
  userId: string;
  tenantIds: string[];
  permissions: string[];
  email?: string;
  isPortalUser: boolean;
  isSuperAdmin: boolean;
}

export class EdgeAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "EdgeAuthError";
  }
}

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function requestIp(req?: Request): string | null {
  if (!req) return null;
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || null;
}

/** Validate the bearer JWT and load tenants + permissions. */
export async function authedUser(req: Request): Promise<AuthedUser> {
  const header = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    throw new EdgeAuthError(401, "Missing bearer token");
  }
  const token = header.slice(7).trim();

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data?.user) throw new EdgeAuthError(401, "Invalid token");

  const userId = data.user.id;
  const email = data.user.email ?? undefined;
  const admin = adminClient();

  const [{ data: memberships }, { data: roleRows }] = await Promise.all([
    admin.from("user_tenants").select("tenant_id, is_active").eq("user_id", userId),
    admin
      .from("user_roles")
      .select("tenant_id, roles!inner(name, role_permissions(permissions!inner(name)))")
      .eq("user_id", userId),
  ]);

  const tenantIds = (memberships ?? [])
    .filter((r: any) => r.is_active !== false)
    .map((r: any) => r.tenant_id);

  const permissions = new Set<string>();
  let isSuperAdmin = false;
  for (const row of (roleRows ?? []) as any[]) {
    if (row.roles?.name === "super_admin") isSuperAdmin = true;
    for (const rp of row.roles?.role_permissions ?? []) {
      const n = rp.permissions?.name;
      if (n) permissions.add(n);
    }
  }

  return {
    userId,
    email,
    tenantIds,
    permissions: [...permissions],
    isSuperAdmin,
    isPortalUser: tenantIds.length === 0 && !isSuperAdmin,
  };
}

/** Require a permission within a tenant the caller belongs to. */
export function requirePermission(user: AuthedUser, tenantId: string, permission: string): void {
  if (user.isSuperAdmin) return;
  if (!user.tenantIds.includes(tenantId)) {
    throw new EdgeAuthError(403, "Forbidden: not a member of this school");
  }
  if (!user.permissions.includes(permission)) {
    throw new EdgeAuthError(403, `Forbidden: missing permission ${permission}`);
  }
}

/** Require the x-zenith-internal-key shared secret (service-to-service calls). */
export function requireInternalSecret(req: Request): void {
  const expected = Deno.env.get("ZENITH_INTERNAL_SECRET");
  const provided = req.headers.get("x-zenith-internal-key");
  const svc = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (svc && svc === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return;
  if (!expected || provided !== expected) {
    throw new EdgeAuthError(401, "Invalid internal key");
  }
}

export function authErrorResponse(e: unknown, corsHeaders: Record<string, string> = {}): Response {
  const status = e instanceof EdgeAuthError ? e.status : 500;
  const message = e instanceof Error ? e.message : "Unexpected error";
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
