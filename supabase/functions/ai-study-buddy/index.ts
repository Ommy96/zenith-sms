// Student learning assistant. Streams the answer back over SSE.
import { adminClient, authedUser, authErrorResponse } from "../_shared/auth.ts";
import { requireOwnsResource } from "../_shared/ownership.ts";
import { streamAnthropic, corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { student_id, question, subject_id } = await req.json();
    if (!student_id || !question) return jsonResponse({ error: "student_id and question required" }, 400);

    await requireOwnsResource({
      user,
      resourceType: "student",
      resourceId: student_id,
      functionName: "ai-study-buddy",
      req,
    });

    const admin = adminClient();
    const { data: student } = await admin.from("students")
      .select("tenant_id, first_name, current_class_id").eq("id", student_id).maybeSingle();
    const { data: subject } = subject_id
      ? await admin.from("subjects").select("name").eq("id", subject_id).maybeSingle()
      : { data: null };

    return await streamAnthropic({
      tenantId: student?.tenant_id ?? null,
      userId: user.userId,
      functionName: "ai-study-buddy",
      purpose: "study_help",
      system:
        "You are a patient study buddy for a school learner. Explain step by step in simple language, " +
        "use local examples where helpful, and never simply hand over homework answers — guide the learner to them." +
        (subject?.name ? ` The subject is ${subject.name}.` : ""),
      prompt: question,
      maxTokens: 1500,
      metadata: { student_id, subject_id: subject_id ?? null },
    });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
