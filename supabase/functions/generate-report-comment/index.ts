// Generates a teacher comment for a report card.
import { adminClient, authedUser, requirePermission, authErrorResponse } from "../_shared/auth.ts";
import { callAnthropic, corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { student_id, subject_id, going_well, needs_work, tone, length, language } = await req.json();
    if (!student_id) return jsonResponse({ error: "student_id required" }, 400);

    const admin = adminClient();
    const { data: student } = await admin.from("students")
      .select("tenant_id, first_name, gender").eq("id", student_id).maybeSingle();
    if (!student) return jsonResponse({ error: "Student not found" }, 404);
    if (!user.isSuperAdmin) requirePermission(user, student.tenant_id, "exams.grade");

    const { data: subject } = subject_id
      ? await admin.from("subjects").select("name").eq("id", subject_id).maybeSingle()
      : { data: null };

    const result = await callAnthropic({
      tenantId: student.tenant_id,
      userId: user.userId,
      functionName: "generate-report-comment",
      purpose: "report_comment",
      system:
        `You write report card comments for teachers. Tone: ${tone ?? "encouraging but honest"}. ` +
        `Length: ${length ?? "2-3 sentences"}. Language: ${language ?? "English"}. ` +
        "Address the learner by first name, name one strength and one clear next step. No bullet points.",
      prompt:
        `Learner: ${student.first_name}\nSubject: ${subject?.name ?? "general"}\n` +
        `Going well: ${going_well ?? "not stated"}\nNeeds work: ${needs_work ?? "not stated"}`,
      maxTokens: 500,
    });

    return jsonResponse({ ok: true, comment: result.text.trim() });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
