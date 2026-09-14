// Resource ownership guard. A valid JWT proves who the caller is, never what
// they may read — every portal-reachable function must also prove ownership.
import { AuthedUser, EdgeAuthError, adminClient } from "./auth.ts";
import { logAccessDecision } from "./audit.ts";

export type OwnedResourceType = "student" | "invoice" | "receipt" | "payment";

export interface OwnershipResult {
  studentId: string;
  tenantId: string;
  actorType: "super_admin" | "staff" | "portal_guardian";
}

async function resolve(
  admin: ReturnType<typeof adminClient>,
  resourceType: OwnedResourceType,
  resourceId: string,
): Promise<{ studentId: string; tenantId: string } | null> {
  if (resourceType === "student") {
    const { data } = await admin.from("students").select("id, tenant_id").eq("id", resourceId).maybeSingle();
    return data ? { studentId: data.id, tenantId: data.tenant_id } : null;
  }
  if (resourceType === "invoice") {
    const { data } = await admin.from("invoices").select("student_id, tenant_id").eq("id", resourceId).maybeSingle();
    return data?.student_id ? { studentId: data.student_id, tenantId: data.tenant_id } : null;
  }
  if (resourceType === "payment") {
    const { data } = await admin.from("payments").select("student_id, tenant_id").eq("id", resourceId).maybeSingle();
    return data?.student_id ? { studentId: data.student_id, tenantId: data.tenant_id } : null;
  }
  const { data: rcp } = await admin
    .from("student_receipts").select("student_id, tenant_id").eq("id", resourceId).maybeSingle();
  return rcp?.student_id ? { studentId: rcp.student_id, tenantId: rcp.tenant_id } : null;
}

export async function requireOwnsResource(params: {
  user: AuthedUser;
  resourceType: OwnedResourceType;
  resourceId: string;
  functionName: string;
  req?: Request;
}): Promise<OwnershipResult> {
  const { user, resourceType, resourceId, functionName, req } = params;
  const admin = adminClient();

  const resolved = await resolve(admin, resourceType, resourceId);
  if (!resolved) {
    await logAccessDecision({
      tenantId: null, actorUserId: user.userId, actorType: "system", action: "access.denied",
      resourceType, resourceId, functionName, reason: "resource_not_found", req,
    });
    throw new EdgeAuthError(404, "Resource not found");
  }
  const { studentId, tenantId } = resolved;

  const allow = async (actorType: OwnershipResult["actorType"]) => {
    await logAccessDecision({
      tenantId, actorUserId: user.userId, actorType, action: "access.allowed",
      resourceType, resourceId, functionName, req,
    });
    return { studentId, tenantId, actorType };
  };

  if (user.isSuperAdmin) return await allow("super_admin");
  if (user.tenantIds.includes(tenantId)) return await allow("staff");

  // Portal path — links are resolved live, never from the token.
  const [{ data: links }, { data: self }] = await Promise.all([
    admin.from("student_guardians")
      .select("guardian_id, guardians:guardian_id(portal_user_id)")
      .eq("student_id", studentId),
    admin.from("students").select("user_id, portal_user_id").eq("id", studentId).maybeSingle(),
  ]);
  const isGuardian = (links ?? []).some((l: any) => l.guardians?.portal_user_id === user.userId);
  const isSelf = self?.portal_user_id === user.userId || self?.user_id === user.userId;
  if (isGuardian || isSelf) return await allow("portal_guardian");

  await logAccessDecision({
    tenantId, actorUserId: user.userId, actorType: "portal_guardian", action: "access.denied",
    resourceType, resourceId, functionName, reason: "not_linked", req,
  });
  throw new EdgeAuthError(403, "Forbidden: you do not have access to this record");
}
