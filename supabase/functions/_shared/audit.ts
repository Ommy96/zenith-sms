// Audit logging for access decisions made inside edge functions.
import { adminClient, requestIp } from "./auth.ts";

export async function logAccessDecision(params: {
  tenantId: string | null;
  actorUserId: string | null;
  actorType: "staff" | "portal_guardian" | "super_admin" | "system";
  action: "access.allowed" | "access.denied";
  resourceType: string;
  resourceId: string | null;
  functionName: string;
  reason?: string;
  req?: Request;
}): Promise<void> {
  try {
    await adminClient().from("audit_logs").insert({
      tenant_id: params.tenantId,
      actor_user_id: params.actorUserId,
      actor_type: params.actorType,
      action: params.action,
      entity_type: params.resourceType,
      entity_id: params.resourceId,
      after: {
        function_name: params.functionName,
        reason: params.reason ?? null,
      },
      ip_address: requestIp(params.req),
      user_agent: params.req?.headers.get("user-agent") ?? null,
    });
  } catch (e) {
    console.warn("[audit] failed to log access decision", (e as Error).message);
  }
}
