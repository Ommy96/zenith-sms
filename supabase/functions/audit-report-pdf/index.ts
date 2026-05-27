import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";
import autoTable from "https://esm.sh/jspdf-autotable@3.8.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReportType = "qaso" | "internal_audit" | "bom" | "pta" | "enrolment_trend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { tenant_id, report_type, from_date, to_date } = await req.json() as {
      tenant_id: string; report_type: ReportType; from_date: string; to_date: string;
    };
    if (!tenant_id || !report_type) throw new Error("tenant_id and report_type required");

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tenant } = await supa.from("tenants").select("*").eq("id", tenant_id).single();
    if (!tenant) throw new Error("Tenant not found");

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();

    // Letterhead
    doc.setFontSize(18); doc.setFont("helvetica", "bold");
    doc.text(tenant.name || "School", W / 2, 50, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text([tenant.address || "", tenant.phone || "", tenant.email || ""].filter(Boolean).join(" • "),
      W / 2, 68, { align: "center" });
    doc.setLineWidth(0.5); doc.line(40, 80, W - 40, 80);

    const TITLES: Record<ReportType, string> = {
      qaso: "Quality Assurance & Standards Officer (QASO) Report",
      internal_audit: "Internal Audit Report",
      bom: "Board of Management (BoM) Report",
      pta: "Parents-Teachers Association (PTA) Report",
      enrolment_trend: "Enrolment Trend Report",
    };

    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(TITLES[report_type], W / 2, 110, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Period: ${from_date} to ${to_date}`, W / 2, 128, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleString()}`, W / 2, 142, { align: "center" });

    let y = 170;

    // Enrolment snapshot (all reports include this)
    const [{ count: total }, { count: male }, { count: female }, { count: active }] = await Promise.all([
      supa.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tenant_id),
      supa.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tenant_id).eq("gender", "male"),
      supa.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tenant_id).eq("gender", "female"),
      supa.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tenant_id).eq("status", "active"),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Total learners on roll", String(total ?? 0)],
        ["Active learners", String(active ?? 0)],
        ["Male", String(male ?? 0)],
        ["Female", String(female ?? 0)],
      ],
      theme: "striped", headStyles: { fillColor: [30, 41, 59] },
    });
    y = (doc as any).lastAutoTable.finalY + 20;

    // Report-specific sections
    if (report_type === "qaso" || report_type === "bom") {
      // Attendance summary
      const { data: att } = await supa.from("attendance").select("status")
        .eq("tenant_id", tenant_id).gte("date", from_date).lte("date", to_date);
      const present = (att || []).filter(a => a.status === "present" || a.status === "late").length;
      const absent = (att || []).filter(a => a.status === "absent").length;
      const totalMarked = (att || []).length || 1;
      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text("Attendance", 40, y); y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Metric", "Value"]],
        body: [
          ["Days marked", String(totalMarked)],
          ["Present / late", `${present} (${((present / totalMarked) * 100).toFixed(1)}%)`],
          ["Absent", `${absent} (${((absent / totalMarked) * 100).toFixed(1)}%)`],
        ],
        theme: "striped", headStyles: { fillColor: [30, 41, 59] },
      });
      y = (doc as any).lastAutoTable.finalY + 20;

      // Exam performance
      const { data: exams } = await supa.from("exams").select("id, name, exam_date")
        .eq("tenant_id", tenant_id).gte("exam_date", from_date).lte("exam_date", to_date).limit(20);
      if (exams && exams.length) {
        doc.setFontSize(12); doc.setFont("helvetica", "bold");
        doc.text("Examinations held", 40, y); y += 10;
        autoTable(doc, {
          startY: y,
          head: [["Exam", "Date"]],
          body: exams.map(e => [e.name, e.exam_date]),
          theme: "striped", headStyles: { fillColor: [30, 41, 59] },
        });
        y = (doc as any).lastAutoTable.finalY + 20;
      }
    }

    if (report_type === "internal_audit" || report_type === "bom") {
      // Finance
      const { data: invoices } = await supa.from("student_invoices").select("total, paid_total, balance")
        .eq("tenant_id", tenant_id).gte("created_at", from_date).lte("created_at", to_date + "T23:59:59");
      const billed = (invoices || []).reduce((s, i) => s + Number(i.total || 0), 0);
      const collected = (invoices || []).reduce((s, i) => s + Number(i.paid_total || 0), 0);
      const outstanding = (invoices || []).reduce((s, i) => s + Number(i.balance || 0), 0);

      const { data: expenses } = await supa.from("expenses").select("amount")
        .eq("tenant_id", tenant_id).gte("expense_date", from_date).lte("expense_date", to_date);
      const totalExp = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);

      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text("Financial Summary", 40, y); y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Item", `Amount (${tenant.currency_code || "KES"})`]],
        body: [
          ["Total billed", billed.toLocaleString()],
          ["Total collected", collected.toLocaleString()],
          ["Outstanding balance", outstanding.toLocaleString()],
          ["Total expenses", totalExp.toLocaleString()],
          ["Net cash flow", (collected - totalExp).toLocaleString()],
        ],
        theme: "striped", headStyles: { fillColor: [30, 41, 59] },
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    if (report_type === "pta") {
      const { data: events } = await supa.from("events").select("title, start_at, location")
        .eq("tenant_id", tenant_id).gte("start_at", from_date).lte("start_at", to_date + "T23:59:59").limit(30);
      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text("School Events", 40, y); y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Event", "Date", "Venue"]],
        body: (events || []).map(e => [e.title, new Date(e.start_at).toLocaleDateString(), e.location || ""]),
        theme: "striped", headStyles: { fillColor: [30, 41, 59] },
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    if (report_type === "enrolment_trend") {
      const { data: classes } = await supa.from("classes").select("id, name").eq("tenant_id", tenant_id);
      const rows: string[][] = [];
      for (const c of classes || []) {
        const { count } = await supa.from("students").select("id", { count: "exact", head: true })
          .eq("tenant_id", tenant_id).eq("current_class_id", c.id).eq("status", "active");
        rows.push([c.name, String(count ?? 0)]);
      }
      autoTable(doc, {
        startY: y,
        head: [["Class", "Active learners"]],
        body: rows,
        theme: "striped", headStyles: { fillColor: [30, 41, 59] },
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // Footer signature blocks
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const H = doc.internal.pageSize.getHeight();
      doc.setFontSize(8); doc.setFont("helvetica", "italic");
      doc.text(`${tenant.name} — ${TITLES[report_type]} — Page ${i}/${pageCount}`, W / 2, H - 20, { align: "center" });
    }

    // Log
    await supa.from("compliance_exports_log").insert({
      tenant_id, kind: `audit_pdf_${report_type}`,
      params: { from_date, to_date }, row_count: total ?? 0,
    }).select();

    const bytes = doc.output("arraybuffer");
    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report_type}-${from_date}-to-${to_date}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});