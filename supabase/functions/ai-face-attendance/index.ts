// Face-recognition attendance. Not implemented: this needs a dedicated
// face-recognition pipeline (e.g. AWS Rekognition or a face-embedding model),
// not a general language model.
import { authedUser, authErrorResponse } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse, logAiUsage } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { class_id, tenant_id } = await req.json().catch(() => ({}));
    const tenantId = tenant_id ?? user.tenantIds[0];

    await logAiUsage({
      tenantId,
      userId: user.userId,
      functionName: "ai-face-attendance",
      purpose: "not_implemented",
      metadata: { class_id: class_id ?? null },
    });

    return jsonResponse({
      ok: false,
      error: "not_implemented",
      message:
        "Face-recognition attendance needs a dedicated face-matching service with enrolled student face " +
        "templates (for example AWS Rekognition collections). It cannot be done with a language model. " +
        "Connect that service and this endpoint will be wired to it.",
    }, 501);
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
