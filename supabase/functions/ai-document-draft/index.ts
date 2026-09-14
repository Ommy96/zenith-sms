// Drafts school documents (transfer letters, testimonials, recommendations).
import { adminClient, authedUser, requirePermission, authErrorResponse } from "../_shared/auth.ts";
import { callAnthropic, corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { document_type, context, tenant_id } = await req.json();
    if (!document_type) return jsonResponse({ error: "document_type required" }, 400);
    const tenantId = tenant_id ?? user.tenantIds[0];
    if (!user.isSuperAdmin) requirePermission(user, tenantId, "ai.use");

    const { data: tenant } = await adminClient().from("tenants").select("name").eq("id", tenantId).maybeSingle();

    const result = await callAnthropic({
      tenantId,
      userId: user.userId,
      functionName: "ai-document-draft",
      purpose: document_type,
      system:
        `You draft official documents for ${tenant?.name ?? "a school"}. Use a formal letter structure with ` +
        "placeholders in square brackets for anything you were not given. Do not invent names, dates or results.",
      prompt: `Draft a ${document_type}.\n\nDetails:\n${JSON.stringify(context ?? {})}`,
      maxTokens: 2000,
    });

    return jsonResponse({ ok: true, draft: result.text });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
