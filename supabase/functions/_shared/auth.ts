// Shared auth helper for edge functions.
// Verifies the caller's JWT, loads their active tenant memberships, and returns
// a typed context. Throws 401 on failure — caller should convert to Response.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface EdgeAuthContext {
  userId: string;
  email: string | null;
  tenantIds: string[];          // active tenant memberships
  tenantId: string | null;       // first / default
  roles: string[];               // role names across all tenants
  permissions: string[];         // permission keys
  isSuperAdmin: boolean;
  raw: { sub: string; [k: string]: unknown };
}

export class EdgeAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Verify the Authorization: Bearer <jwt> header and return user context.
 * Throws EdgeAuthError on failure. Loads tenant + role + permission info via
 * the service-role client (RLS bypass) so callers can authorize without
 * additional round-trips.
 */
export async function requireAuth(req: Request): Promise<EdgeAuthContext> {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    throw new EdgeAuthError("Missing bearer token");
  }
  const token = authHeader.slice(7).trim();

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Prefer getClaims() (cheap, JWT-only verification) and fall back to getUser().
  let userId: string | null = null;
  let email: string | null = null;
  let claims: Record<string, unknown> = {};
  try {
    const { data, error } = await (userClient.auth as any).getClaims?.(token) ?? {};
    if (data?.claims) {
      claims = data.claims;
      userId = (data.claims.sub as string) ?? null;
      email = (data.claims.email as string) ?? null;
    } else if (error) {
      throw new EdgeAuthError("Invalid token");
    }
  } catch (_) { /* fall through */ }

  if (!userId) {
    const { data, error } = await userClient.auth.getUser(token);
    if (error || !data?.user) throw new EdgeAuthError("Invalid token");
    userId = data.user.id;
    email = data.user.email ?? null;
    claims = { sub: userId, email } as Record<string, unknown>;
  }

  const admin = createClient(url, service);

  // Tenants
  const { data: tu } = await admin
    .from("tenant_users")
    .select("tenant_id, is_active")
    .eq("user_id", userId);
  const tenantIds = (tu ?? []).filter((r: any) => r.is_active !== false).map((r: any) => r.tenant_id);

  // Roles + permissions in one trip
  const { data: roleRows } = await admin
    .from("user_roles")
    .select("role_id, tenant_id, roles!inner(name, role_permissions(permission_id, permissions!inner(key)))")
    .eq("user_id", userId);

  const roles = new Set<string>();
  const perms = new Set<string>();
  for (const r of (roleRows ?? []) as any[]) {
    const name = r.roles?.name;
    if (name) roles.add(name);
    for (const rp of r.roles?.role_permissions ?? []) {
      const k = rp.permissions?.key;
      if (k) perms.add(k);
    }
  }
  const isSuperAdmin = roles.has("super_admin");

  return {
    userId,
    email,
    tenantIds,
    tenantId: tenantIds[0] ?? null,
    roles: [...roles],
    permissions: [...perms],
    isSuperAdmin,
    raw: claims as { sub: string },
  };
}

/** Require that the authed user is a member of the supplied tenant. */
export function requireTenant(ctx: EdgeAuthContext, tenantId: string): void {
  if (ctx.isSuperAdmin) return;
  if (!ctx.tenantIds.includes(tenantId)) {
    throw new EdgeAuthError("Forbidden: not a member of this tenant", 403);
  }
}

/** Require a specific permission key (or super_admin). */
export function requirePerm(ctx: EdgeAuthContext, key: string): void {
  if (ctx.isSuperAdmin) return;
  if (!ctx.permissions.includes(key)) {
    throw new EdgeAuthError(`Forbidden: missing permission ${key}`, 403);
  }
}

/** Convert an EdgeAuthError into a Response. */
export function authErrorResponse(e: unknown, corsHeaders: Record<string, string> = {}): Response {
  const status = e instanceof EdgeAuthError ? e.status : 401;
  const message = e instanceof Error ? e.message : "Unauthorized";
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}