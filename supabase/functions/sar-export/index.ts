import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { sar_id } = await req.json();
    if (!sar_id) throw new Error("sar_id required");

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: sar } = await supa.from("subject_access_requests").select("*").eq("id", sar_id).single();
    if (!sar) throw new Error("SAR not found");

    const pkg: Record<string, unknown> = {
      meta: {
        generated_at: new Date().toISOString(),
        sar_id,
        subject: { name: sar.subject_name, type: sar.subject_type, email: sar.subject_email },
        tenant_id: sar.tenant_id,
      },
    };

    if (sar.related_student_id) {
      const sid = sar.related_student_id;
      const [student, guardians, attendance, invoices, payments, results, discipline, health, messages] = await Promise.all([
        supa.from("students").select("*").eq("id", sid).single(),
        supa.from("student_guardians").select("*, guardians(*)").eq("student_id", sid),
        supa.from("attendance").select("*").eq("student_id", sid),
        supa.from("student_invoices").select("*").eq("student_id", sid),
        supa.from("student_payments").select("*").eq("student_id", sid),
        supa.from("student_exam_results").select("*").eq("student_id", sid),
        supa.from("discipline_incidents").select("*").eq("student_id", sid),
        supa.from("health_records").select("*").eq("student_id", sid),
        supa.from("messages").select("*").eq("student_id", sid),
      ]);
      pkg.student = student.data;
      pkg.guardians = guardians.data;
      pkg.attendance = attendance.data;
      pkg.invoices = invoices.data;
      pkg.payments = payments.data;
      pkg.exam_results = results.data;
      pkg.discipline = discipline.data;
      pkg.health = health.data;
      pkg.messages = messages.data;
    }

    if (sar.related_staff_id) {
      const stf = sar.related_staff_id;
      const [staff, payslips, comp] = await Promise.all([
        supa.from("staff").select("*").eq("id", stf).single(),
        supa.from("payslips").select("*").eq("staff_id", stf),
        supa.from("staff_compensation").select("*").eq("staff_id", stf),
      ]);
      pkg.staff = staff.data;
      pkg.payslips = payslips.data;
      pkg.compensation = comp.data;
    }

    const json = JSON.stringify(pkg, null, 2);
    return new Response(json, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="sar-${sar_id}.json"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});