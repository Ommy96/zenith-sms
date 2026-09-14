// Grades a scanned answer sheet against a marking scheme using vision.
import { authedUser, requirePermission, authErrorResponse } from "../_shared/auth.ts";
import { callAnthropic, corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { image_url, marking_scheme, max_marks, tenant_id } = await req.json();
    if (!image_url || !marking_scheme) return jsonResponse({ error: "image_url and marking_scheme required" }, 400);
    const tenantId = tenant_id ?? user.tenantIds[0];
    if (!user.isSuperAdmin) requirePermission(user, tenantId, "exams.grade");

    const imgRes = await fetch(image_url);
    if (!imgRes.ok) return jsonResponse({ error: "Could not read the answer sheet image" }, 400);
    const bytes = new Uint8Array(await imgRes.arrayBuffer());
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    const base64 = btoa(binary);
    const mediaType = imgRes.headers.get("content-type") || "image/jpeg";

    const result = await callAnthropic({
      tenantId,
      userId: user.userId,
      functionName: "ai-ocr-grader",
      purpose: "grade_answer_sheet",
      system:
        "You mark scanned exam scripts. Compare the handwritten answers with the marking scheme and award marks. " +
        'Reply as JSON only: {"total_marks": number, "max_marks": number, "per_question": [{"question": string, ' +
        '"marks": number, "comment": string}], "overall_comment": string}.',
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: `Marking scheme:\n${marking_scheme}\n\nMaximum marks: ${max_marks ?? "unspecified"}` },
        ],
      }],
      maxTokens: 2000,
    });

    let parsed: unknown = null;
    try { parsed = JSON.parse(result.text.replace(/```json|```/g, "").trim()); } catch (_e) { /* keep raw */ }
    return jsonResponse({ ok: true, result: parsed, raw: parsed ? undefined : result.text });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
