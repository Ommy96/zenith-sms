import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const { tenantId, classId, termId, templateId } = await req.json();
  if (!tenantId || !classId || !termId) {
    return new Response(JSON.stringify({ error: "tenantId, classId, termId required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Resolve requester
  const auth = req.headers.get("Authorization") || "";
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await userClient.auth.getUser();
  const requestedBy = u?.user?.id || null;

  // Get students in this class
  const { data: students } = await supabase
    .from("students").select("id, first_name, last_name, admission_number, photo_url, nemis_upi")
    .eq("tenant_id", tenantId).eq("current_class_id", classId).eq("status", "active");

  const total = students?.length || 0;

  const { data: run, error: runErr } = await supabase.from("report_card_runs").insert({
    tenant_id: tenantId, class_id: classId, term_id: termId, template_id: templateId || null,
    status: "running", requested_by: requestedBy, total, completed: 0,
  }).select().single();

  if (runErr) {
    return new Response(JSON.stringify({ error: runErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const task = (async () => {
    try {
      const { data: tenant } = await supabase.from("tenants").select("name, motto, address, phone, email, primary_color, curriculum").eq("id", tenantId).maybeSingle();
      const { data: term } = await supabase.from("terms").select("name, start_date, end_date").eq("id", termId).maybeSingle();
      const { data: klass } = await supabase.from("classes").select("name").eq("id", classId).maybeSingle();

      let completed = 0;
      for (const s of students || []) {
        try {
          // pull all exam results for this student in this term
          const { data: results } = await supabase
            .from("student_exam_results")
            .select("raw_marks, max_marks, grade, points, position_in_class, teacher_comment, subjects:subject_id(name), exams!inner(name, term_id)")
            .eq("student_id", s.id).eq("exams.term_id", termId);

          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage([595, 842]);
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          let y = 800;
          const draw = (t: string, x: number, yy: number, opts: any = {}) => page.drawText(t, { x, y: yy, size: opts.size || 10, font: opts.bold ? bold : font, color: opts.color || rgb(0.1,0.1,0.1) });

          draw(tenant?.name || "School Report", 40, y, { size: 18, bold: true }); y -= 18;
          if (tenant?.motto) { draw(tenant.motto, 40, y, { size: 9, color: rgb(0.4,0.4,0.4) }); y -= 12; }
          if (tenant?.address) { draw(tenant.address, 40, y, { size: 8, color: rgb(0.4,0.4,0.4) }); y -= 10; }
          y -= 10;
          page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.8,0.8,0.8) }); y -= 16;

          draw("REPORT CARD", 40, y, { size: 14, bold: true }); y -= 18;
          draw(`Student: ${s.last_name}, ${s.first_name}`, 40, y); draw(`Adm No: ${s.admission_number || "-"}`, 350, y); y -= 14;
          draw(`Class: ${klass?.name || "-"}`, 40, y); draw(`Term: ${term?.name || "-"}`, 350, y); y -= 14;
          if (s.nemis_upi) { draw(`NEMIS UPI: ${s.nemis_upi}`, 40, y); y -= 14; }
          y -= 8;

          // Subject table
          draw("Subject", 40, y, { bold: true }); draw("Marks", 280, y, { bold: true });
          draw("Grade", 340, y, { bold: true }); draw("Pos", 400, y, { bold: true });
          draw("Comment", 440, y, { bold: true }); y -= 12;
          page.drawLine({ start: { x: 40, y: y + 4 }, end: { x: 555, y: y + 4 }, thickness: 0.5, color: rgb(0.7,0.7,0.7) });

          let total = 0, count = 0;
          for (const r of results || []) {
            if (y < 80) { y = 800; pdfDoc.addPage([595, 842]); }
            const subj = (r as any).subjects?.name || "—";
            const marks = r.raw_marks != null ? `${r.raw_marks}/${r.max_marks ?? "?"}` : "-";
            draw(subj.slice(0, 30), 40, y);
            draw(marks, 280, y);
            draw(r.grade || "-", 340, y);
            draw(r.position_in_class?.toString() || "-", 400, y);
            draw((r.teacher_comment || "").slice(0, 18), 440, y, { size: 8 });
            y -= 12;
            if (r.raw_marks != null && r.max_marks) { total += (r.raw_marks / r.max_marks) * 100; count++; }
          }

          y -= 10;
          if (count) {
            const avg = (total / count).toFixed(1);
            draw(`Average: ${avg}%`, 40, y, { bold: true }); y -= 14;
          }

          y -= 20;
          draw("Class Teacher's Comment:", 40, y, { bold: true }); y -= 12;
          page.drawRectangle({ x: 40, y: y - 30, width: 515, height: 36, borderColor: rgb(0.8,0.8,0.8), borderWidth: 0.5 });
          y -= 50;
          draw("Head Teacher's Comment:", 40, y, { bold: true }); y -= 12;
          page.drawRectangle({ x: 40, y: y - 30, width: 515, height: 36, borderColor: rgb(0.8,0.8,0.8), borderWidth: 0.5 });
          y -= 60;
          draw("Signed: ___________________   Parent/Guardian: ___________________", 40, y, { size: 9 });

          const bytes = await pdfDoc.save();
          const path = `${tenantId}/${run.id}/${s.id}.pdf`;
          const { error: upErr } = await supabase.storage.from("reports").upload(path, bytes, { contentType: "application/pdf", upsert: true });
          if (upErr) throw upErr;
          const { data: signed } = await supabase.storage.from("reports").createSignedUrl(path, 60 * 60 * 24 * 30);

          await supabase.from("report_cards").insert({
            tenant_id: tenantId, run_id: run.id, student_id: s.id, pdf_url: signed?.signedUrl, status: "ready",
          });
        } catch (err) {
          await supabase.from("report_cards").insert({
            tenant_id: tenantId, run_id: run.id, student_id: s.id, status: "failed", error: (err as Error).message,
          });
        }
        completed++;
        await supabase.from("report_card_runs").update({ completed }).eq("id", run.id);
      }

      await supabase.from("report_card_runs").update({ status: "ready" }).eq("id", run.id);
    } catch (err) {
      await supabase.from("report_card_runs").update({ status: "failed", error: (err as Error).message }).eq("id", run.id);
    }
  })();

  // @ts-ignore
  EdgeRuntime.waitUntil(task);

  return new Response(JSON.stringify({ runId: run.id, total }), {
    status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});