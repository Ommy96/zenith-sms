// AI face-attendance: sends a classroom photo + reference student photos to
// Gemini vision and asks it to identify which enrolled students are visible.
// Optionally marks the matched students present in the attendance table.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { tenantId, classId, photoPath, captureDate, markAttendance = false } = body || {};
    if (!tenantId || !photoPath) return json({ error: "tenantId and photoPath required" }, 400);

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

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    // Create session row
    const { data: session, error: sErr } = await svc.from("face_attendance_sessions").insert({
      tenant_id: tenantId, class_id: classId || null, photo_path: photoPath,
      capture_date: captureDate || new Date().toISOString().slice(0, 10),
      status: "processing", created_by: u.user.id,
    }).select().single();
    if (sErr) return json({ error: sErr.message }, 500);

    // Load enrolled students for the class
    const studentsQ = svc.from("students")
      .select("id, first_name, last_name, admission_number, current_class_id")
      .eq("tenant_id", tenantId).eq("status", "active");
    if (classId) studentsQ.eq("current_class_id", classId);
    const { data: students } = await studentsQ.limit(60);
    if (!students?.length) {
      await svc.from("face_attendance_sessions").update({ status: "failed", ai_notes: "No students found" }).eq("id", session.id);
      return json({ error: "No students for class" }, 400);
    }
    const studentIds = students.map((s) => s.id);

    const { data: enrolls } = await svc.from("face_enrollments")
      .select("student_id, image_path").eq("tenant_id", tenantId).in("student_id", studentIds);
    const enrollMap = new Map<string, string>();
    for (const e of enrolls || []) if (!enrollMap.has(e.student_id)) enrollMap.set(e.student_id, e.image_path);

    // Sign URLs
    const signedPhoto = await svc.storage.from("classroom-photos").createSignedUrl(photoPath, 600);
    if (!signedPhoto.data?.signedUrl) {
      await svc.from("face_attendance_sessions").update({ status: "failed", ai_notes: "Could not sign classroom photo" }).eq("id", session.id);
      return json({ error: "Could not sign classroom photo" }, 500);
    }

    const refs: { id: string; name: string; admission: string; url: string }[] = [];
    for (const s of students) {
      const path = enrollMap.get(s.id);
      if (!path) continue;
      const u2 = await svc.storage.from("face-enrollments").createSignedUrl(path, 600);
      if (u2.data?.signedUrl) {
        refs.push({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`.trim(),
          admission: s.admission_number,
          url: u2.data.signedUrl,
        });
      }
    }
    if (!refs.length) {
      await svc.from("face_attendance_sessions").update({ status: "failed", ai_notes: "No enrolled faces" }).eq("id", session.id);
      return json({ error: "No enrolled student faces. Enroll students first." }, 400);
    }

    // Build vision prompt with reference + classroom photos
    const labelList = refs.map((r, i) => `[${i + 1}] ${r.name} (Adm# ${r.admission})`).join("\n");
    const sysText = `You match faces in a classroom photo against numbered reference photos. Reply with STRICT JSON only.`;
    const taskText = `You will see ${refs.length} reference photos labeled [1]..[${refs.length}], then a classroom photo. Identify which labelled students appear in the classroom photo.

Reference legend:
${labelList}

Return JSON only:
{"matches":[{"index":1,"confidence":0.0-1.0,"note":""}], "unmatched_faces": <int estimate of faces in classroom photo with no match>, "notes": "brief"}`;

    const content: any[] = [{ type: "text", text: taskText }];
    refs.forEach((r, i) => {
      content.push({ type: "text", text: `Reference [${i + 1}]:` });
      content.push({ type: "image_url", image_url: { url: r.url } });
    });
    content.push({ type: "text", text: "Classroom photo:" });
    content.push({ type: "image_url", image_url: { url: signedPhoto.data.signedUrl } });

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sysText },
          { role: "user", content },
        ],
        temperature: 0.1,
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      await svc.from("face_attendance_sessions").update({ status: "failed", ai_notes: t.slice(0, 500) }).eq("id", session.id);
      return json({ error: "AI call failed", detail: t }, 500);
    }
    const aiJson = await aiRes.json();
    const text: string = aiJson.choices?.[0]?.message?.content || "";
    const parsed = parseJson(text);
    if (!parsed) {
      await svc.from("face_attendance_sessions").update({ status: "failed", ai_notes: text.slice(0, 1000) }).eq("id", session.id);
      return json({ error: "Could not parse AI response", raw: text }, 500);
    }

    const matchedStudents = (parsed.matches || [])
      .filter((m: any) => Number(m.confidence) >= 0.6 && refs[Number(m.index) - 1])
      .map((m: any) => {
        const r = refs[Number(m.index) - 1];
        return { student_id: r.id, name: r.name, admission_number: r.admission, confidence: m.confidence };
      });

    await svc.from("face_attendance_sessions").update({
      status: "completed",
      matched_students: matchedStudents,
      unmatched_faces: Number(parsed.unmatched_faces) || 0,
      ai_notes: parsed.notes || null,
    }).eq("id", session.id);

    if (markAttendance && matchedStudents.length) {
      const date = captureDate || new Date().toISOString().slice(0, 10);
      const rows = matchedStudents.map((m: any) => ({
        tenant_id: tenantId, student_id: m.student_id, date, status: "present",
        recorded_by: u.user.id,
      }));
      await svc.from("attendance").upsert(rows, { onConflict: "tenant_id,student_id,date" });
      await svc.from("face_attendance_sessions").update({ marked_attendance: true }).eq("id", session.id);
    }

    return json({ ok: true, session_id: session.id, matches: matchedStudents, unmatched_faces: parsed.unmatched_faces || 0, notes: parsed.notes });
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