// AI OCR grader: accepts an image of a marked answer sheet, uses Gemini vision
// to extract per-question marks and total score, persists a grading job, and
// optionally posts the result to the gradebook.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { tenantId, imagePath, examId, subjectId, studentId, maxMarks, postToGradebook = false } = body || {};
    if (!tenantId || !imagePath) return json({ error: "tenantId and imagePath required" }, 400);

    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } }, auth: { persistSession: false } }
    );
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    const { data: member } = await svc.rpc("is_tenant_member", { _tenant: tenantId, _user: u.user.id });
    if (!member) return json({ error: "Forbidden" }, 403);

    // Create job record
    const { data: job, error: jobErr } = await svc.from("ocr_grading_jobs").insert({
      tenant_id: tenantId, exam_id: examId || null, subject_id: subjectId || null,
      student_id: studentId || null, image_path: imagePath,
      max_marks: maxMarks || null, status: "processing", created_by: u.user.id,
    }).select().single();
    if (jobErr) return json({ error: jobErr.message }, 500);

    // Signed URL so the model can fetch the image
    const { data: signed } = await svc.storage.from("answer-sheets")
      .createSignedUrl(imagePath, 600);
    if (!signed?.signedUrl) {
      await svc.from("ocr_grading_jobs").update({ status: "failed", error_message: "could not sign url" }).eq("id", job.id);
      return json({ error: "Could not generate signed URL" }, 500);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      await svc.from("ocr_grading_jobs").update({ status: "failed", error_message: "LOVABLE_API_KEY missing" }).eq("id", job.id);
      return json({ error: "AI not configured" }, 500);
    }

    const prompt = `You are an exam marker. Examine this scanned answer sheet image and extract per-question marks awarded.
Return STRICT JSON only, no prose, matching this schema:
{"per_question":[{"q":"1","awarded":4,"max":5,"note":""}],"total":number,"max":number,"notes":"brief overall notes"}
If the sheet shows a teacher-written total at the top, prefer that. ${maxMarks ? `The exam is out of ${maxMarks} marks.` : ""}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: signed.signedUrl } },
          ],
        }],
        temperature: 0.1,
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      await svc.from("ocr_grading_jobs").update({ status: "failed", error_message: t.slice(0, 500) }).eq("id", job.id);
      return json({ error: "AI call failed", detail: t }, 500);
    }
    const aiJson = await aiRes.json();
    const text: string = aiJson.choices?.[0]?.message?.content || "";
    const parsed = parseJson(text);
    if (!parsed) {
      await svc.from("ocr_grading_jobs").update({ status: "failed", error_message: "could not parse AI response", ai_notes: text.slice(0, 1000) }).eq("id", job.id);
      return json({ error: "Could not parse AI response", raw: text }, 500);
    }

    const updated = {
      status: "completed",
      total_marks: parsed.total ?? null,
      max_marks: parsed.max ?? maxMarks ?? null,
      per_question: parsed.per_question ?? [],
      ai_notes: parsed.notes ?? null,
    };
    await svc.from("ocr_grading_jobs").update(updated).eq("id", job.id);

    // Optional: post to gradebook (student_exam_results)
    if (postToGradebook && examId && subjectId && studentId && parsed.total != null) {
      await svc.from("student_exam_results").upsert({
        tenant_id: tenantId, exam_id: examId, subject_id: subjectId,
        student_id: studentId, raw_marks: parsed.total,
      }, { onConflict: "exam_id,subject_id,student_id" });
      await svc.from("ocr_grading_jobs").update({ posted_to_gradebook: true }).eq("id", job.id);
    }

    return json({ ok: true, job_id: job.id, result: { ...parsed, signed_url: signed.signedUrl } });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function parseJson(text: string): any | null {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
  try { return JSON.parse(trimmed); } catch {}
  const m = trimmed.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}