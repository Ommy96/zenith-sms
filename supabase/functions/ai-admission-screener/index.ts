// Summarises an admission application and gives a recommendation.
import { adminClient, authedUser, requirePermission, authErrorResponse } from "../_shared/auth.ts";
import { callAnthropic, corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { admission_id } = await req.json();
    if (!admission_id) return jsonResponse({ error: "admission_id required" }, 400);

    const admin = adminClient();
    const { data: application } = await admin.from("admissions").select("*").eq("id", admission_id).maybeSingle();
    if (!application) return jsonResponse({ error: "Application not found" }, 404);
    const tenantId = application.tenant_id;
    if (!user.isSuperAdmin) requirePermission(user, tenantId, "admissions.view");

    const { data: documents } = await admin.from("admission_documents")
      .select("document_type, file_name, is_verified").eq("admission_id", admission_id);

    const result = await callAnthropic({
      tenantId,
      userId: user.userId,
      functionName: "ai-admission-screener",
      purpose: "screen_application",
      system:
        "You are an admissions officer. Summarise the application, flag missing documents or inconsistencies, " +
        "and end with a clear recommendation: accept, waitlist, interview or decline, with one line of reasoning.",
      prompt: `Application:\n${JSON.stringify(application)}\n\nDocuments:\n${JSON.stringify(documents ?? [])}`,
      maxTokens: 1500,
    });

    return jsonResponse({ ok: true, summary: result.text });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
