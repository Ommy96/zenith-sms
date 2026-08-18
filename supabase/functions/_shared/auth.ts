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

// ---------------------------------------------------------------------------
// Resource ownership guard (portal + staff)
//
// A valid JWT proves *who* the caller is, never *what* they may read. Every
// function reachable from the parent portal must additionally prove the caller
// owns (or administers) the specific student / invoice / receipt / payment.
//
// Guardian links are ALWAYS resolved live from the database — never cached in
// the JWT — so revoking a guardian relationship takes effect immediately.
// ---------------------------------------------------------------------------

export type OwnedResourceType = "student" | "invoice" | "receipt" | "payment";

export interface OwnershipResult {
  studentId: string;
  tenantId: string;
  actorType: "super_admin" | "staff" | "portal_guardian";
}

/** Minimal shape accepted by requireOwnsResource — an EdgeAuthContext or `{ userId }`. */
export type OwnershipUser = { userId: string } & Partial<EdgeAuthContext>;

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function requestIp(req?: Request): string | null {
  if (!req) return null;
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || null);
}

/** Fire-and-forget audit row for a portal/staff access decision. */
export async function logAccessDecision(params: {
  tenantId: string | null;
  userId: string;
  actorType: string;
  functionName: string;
  resourceType: string;
  resourceId: string;
  result: "allowed" | "denied";
  reason?: string;
  req?: Request;
}): Promise<void> {
  try {
    await adminClient().from("audit_logs").insert({
      tenant_id: params.tenantId,
      actor_user_id: params.userId,
      entity_type: params.resourceType,
      entity_id: params.resourceId,
      action: `access.${params.result}`,
      after: {
        actor_type: params.actorType,
        function_name: params.functionName,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        ownership_check_result: params.result,
        reason: params.reason ?? null,
      },
      ip_address: requestIp(params.req),
      user_agent: params.req?.headers.get("user-agent") ?? null,
    });
  } catch (e) {
    console.warn("[auth] audit log failed", (e as Error).message);
  }
}

/** Resolve any supported resource id to its owning student + tenant. */
async function resolveResource(
  admin: ReturnType<typeof adminClient>,
  resourceType: OwnedResourceType,
  resourceId: string,
): Promise<{ studentId: string; tenantId: string } | null> {
  if (resourceType === "student") {
    const { data } = await admin.from("students").select("id, tenant_id").eq("id", resourceId).maybeSingle();
    return data ? { studentId: data.id, tenantId: data.tenant_id } : null;
  }
  if (resourceType === "invoice") {
    const { data } = await admin.from("student_invoices").select("student_id, tenant_id").eq("id", resourceId).maybeSingle();
    return data?.student_id ? { studentId: data.student_id, tenantId: data.tenant_id } : null;
  }
  if (resourceType === "payment") {
    const { data } = await admin.from("student_payments").select("student_id, tenant_id").eq("id", resourceId).maybeSingle();
    return data?.student_id ? { studentId: data.student_id, tenantId: data.tenant_id } : null;
  }
  // receipt -> payment -> student
  const { data: rcp } = await admin
    .from("student_receipts").select("payment_id, tenant_id").eq("id", resourceId).maybeSingle();
  if (!rcp?.payment_id) return null;
  const { data: pay } = await admin
    .from("student_payments").select("student_id, tenant_id").eq("id", rcp.payment_id).maybeSingle();
  if (!pay?.student_id) return null;
  return { studentId: pay.student_id, tenantId: pay.tenant_id ?? rcp.tenant_id };
}

/**
 * Authorize a caller against a specific resource. Throws EdgeAuthError(403/404).
 *
 *  - super_admin: allowed, but the access is still audited.
 *  - staff: must be an active member of the resource's tenant.
 *  - portal user: must be linked live as a guardian of the owning student
 *    (student_guardians -> guardians.portal_user_id) or be the student
 *    themselves (students.portal_user_id / students.user_id).
 */
export async function requireOwnsResource(params: {
  user: OwnershipUser;
  resourceType: OwnedResourceType;
  resourceId: string;
  functionName: string;
  req?: Request;
}): Promise<OwnershipResult> {
  const { user, resourceType, resourceId, functionName, req } = params;
  const admin = adminClient();

  const resolved = await resolveResource(admin, resourceType, resourceId);
  if (!resolved) {
    await logAccessDecision({
      tenantId: null, userId: user.userId, actorType: "unknown", functionName,
      resourceType, resourceId, result: "denied", reason: "resource_not_found", req,
    });
    throw new EdgeAuthError("Resource not found", 404);
  }
  const { studentId, tenantId } = resolved;

  // Tenant memberships / super-admin flag may not be present on a bare
  // `{ userId }` — load them on demand.
  let isSuperAdmin = user.isSuperAdmin ?? false;
  let tenantIds = user.tenantIds;
  if (user.isSuperAdmin === undefined || !tenantIds) {
    const [{ data: tu }, { data: sa }] = await Promise.all([
      admin.from("tenant_users").select("tenant_id, is_active").eq("user_id", user.userId),
      admin.rpc("is_super_admin", { _user: user.userId }),
    ]);
    tenantIds = (tu ?? []).filter((r: any) => r.is_active !== false).map((r: any) => r.tenant_id);
    isSuperAdmin = !!sa;
  }

  const finish = async (actorType: OwnershipResult["actorType"]) => {
    await logAccessDecision({
      tenantId, userId: user.userId, actorType, functionName,
      resourceType, resourceId, result: "allowed", req,
    });
    return { studentId, tenantId, actorType };
  };

  if (isSuperAdmin) return await finish("super_admin");
  if ((tenantIds ?? []).includes(tenantId)) return await finish("staff");

  // Portal path — resolved live, never from the token.
  const [{ data: links }, { data: self }] = await Promise.all([
    admin
      .from("student_guardians")
      .select("guardian_id, guardians:guardian_id(portal_user_id)")
      .eq("student_id", studentId),
    admin
      .from("students")
      .select("id, user_id, portal_user_id")
      .eq("id", studentId)
      .maybeSingle(),
  ]);
  const isGuardian = (links ?? []).some((l: any) => l.guardians?.portal_user_id === user.userId);
  const isSelf = self?.portal_user_id === user.userId || self?.user_id === user.userId;

  if (isGuardian || isSelf) return await finish("portal_guardian");

  await logAccessDecision({
    tenantId, userId: user.userId, actorType: "portal_guardian", functionName,
    resourceType, resourceId, result: "denied", reason: "not_linked", req,
  });
  throw new EdgeAuthError("Forbidden: you do not have access to this record", 403);
}