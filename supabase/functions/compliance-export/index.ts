// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Unified compliance / statutory CSV exporter.
 * POST { type, params } -> { csv, filename, row_count }
 *
 * Supported types (Kenya-focused, Phase H1):
 *  - nemis_learners        : Per-student NEMIS upload CSV
 *  - tsc_returns           : Annual TSC teacher returns CSV
 *  - tsc_subject_mismatch  : Teachers teaching subjects they aren't TSC-registered for
 *  - p10_paye              : Monthly PAYE return (iTax-style)
 *  - p9a                   : Annual P9A per employee (one CSV with all months)
 *  - shif_return           : SHIF monthly return
 *  - nssf_return           : NSSF Tier I + Tier II monthly return
 *  - ahl_return            : Affordable Housing Levy monthly return
 *  - helb_return           : HELB deduction return (if configured)
 *  - itax_csv              : iTax-ready PAYE CSV
 *  - nemis_enrolment       : NEMIS Enrolment by class & gender summary
 *  - nemis_sne             : Special needs enrolment
 *  - nemis_repeaters       : Repeat learners
 *  - nemis_dropouts        : Dropouts (exit_reason)
 *  - nemis_transfers       : Transfers in/out
 *  - nemis_capitation      : Capitation tracking (enrolled headcount per grade)
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCsv(rows: any[][]): string {
  // UTF-8 BOM for Excel compatibility
  return "\uFEFF" + rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}
function fmtUsDate(d?: string | null): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}
function fmtIsoMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function genderCode(g?: string | null): string {
  if (!g) return "";
  const s = g.toLowerCase();
  if (s.startsWith("m")) return "M";
  if (s.startsWith("f")) return "F";
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const svc = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const type: string = body.type;
    const tenantId: string = body.tenant_id;
    const params = body.params ?? {};
    if (!type || !tenantId) return json({ error: "type and tenant_id required" }, 400);

    // Tenant membership check
    const { data: member } = await svc
      .from("tenant_users")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!member) return json({ error: "Not a member of tenant" }, 403);

    let result: { rows: any[][]; filename: string; row_count: number };

    switch (type) {
      case "nemis_learners":
        result = await nemisLearners(svc, tenantId, params);
        break;
      case "nemis_enrolment":
        result = await nemisEnrolment(svc, tenantId, params);
        break;
      case "nemis_sne":
        result = await nemisSne(svc, tenantId, params);
        break;
      case "nemis_repeaters":
        result = await nemisRepeaters(svc, tenantId, params);
        break;
      case "nemis_dropouts":
        result = await nemisDropouts(svc, tenantId, params);
        break;
      case "nemis_transfers":
        result = await nemisTransfers(svc, tenantId, params);
        break;
      case "nemis_capitation":
        result = await nemisCapitation(svc, tenantId, params);
        break;
      case "tsc_returns":
        result = await tscReturns(svc, tenantId, params);
        break;
      case "tsc_subject_mismatch":
        result = await tscSubjectMismatch(svc, tenantId, params);
        break;
      case "p10_paye":
      case "itax_csv":
        result = await p10Paye(svc, tenantId, params);
        break;
      case "p9a":
        result = await p9aAnnual(svc, tenantId, params);
        break;
      case "shif_return":
        result = await shifReturn(svc, tenantId, params);
        break;
      case "nssf_return":
        result = await nssfReturn(svc, tenantId, params);
        break;
      case "ahl_return":
        result = await ahlReturn(svc, tenantId, params);
        break;
      case "helb_return":
        result = await helbReturn(svc, tenantId, params);
        break;
      default:
        return json({ error: `Unknown export type: ${type}` }, 400);
    }

    // Audit log
    await svc.from("compliance_exports_log").insert({
      tenant_id: tenantId,
      export_type: type,
      row_count: result.row_count,
      parameters: params,
      generated_by: user.id,
    });

    return json({
      csv: toCsv(result.rows),
      filename: result.filename,
      row_count: result.row_count,
    });
  } catch (e: any) {
    console.error("compliance-export error", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------- NEMIS ----------

async function nemisLearners(svc: any, tenantId: string, p: any) {
  const { data: students } = await svc
    .from("students")
    .select(`
      first_name, middle_name, last_name, gender, date_of_birth,
      nemis_upi, birth_certificate_number, birth_certificate_serial,
      admission_number, admission_date, nationality,
      sne_category, is_repeater, address,
      classes:current_class_id ( name, grade_level:grade_level_id ( code, name ) )
    `)
    .eq("tenant_id", tenantId)
    .eq("status", p.status ?? "active")
    .order("last_name");

  const header = [
    "UPI", "Birth Certificate No", "Birth Cert Serial",
    "First Name", "Middle Name", "Surname",
    "Sex", "Date of Birth (M/D/YYYY)", "Nationality",
    "Grade", "Class", "Admission No", "Admission Date (M/D/YYYY)",
    "SNE Category", "Is Repeater (Y/N)", "Residence",
  ];
  const rows: any[][] = [header];
  for (const s of students ?? []) {
    rows.push([
      s.nemis_upi ?? "",
      s.birth_certificate_number ?? "",
      s.birth_certificate_serial ?? "",
      s.first_name ?? "",
      s.middle_name ?? "",
      s.last_name ?? "",
      genderCode(s.gender),
      fmtUsDate(s.date_of_birth),
      s.nationality ?? "Kenyan",
      s.classes?.grade_level?.code ?? "",
      s.classes?.name ?? "",
      s.admission_number ?? "",
      fmtUsDate(s.admission_date),
      s.sne_category ?? "",
      s.is_repeater ? "Y" : "N",
      s.address ?? "",
    ]);
  }
  return { rows, row_count: rows.length - 1, filename: `nemis_learners_${todayStamp()}.csv` };
}

async function nemisEnrolment(svc: any, tenantId: string, _p: any) {
  const { data } = await svc
    .from("students")
    .select("gender, current_class_id, classes:current_class_id(name, grade_level:grade_level_id(code,name,sort_order))")
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  const buckets = new Map<string, { code: string; name: string; sort: number; m: number; f: number; o: number }>();
  for (const s of data ?? []) {
    const code = s.classes?.grade_level?.code ?? "Unassigned";
    const name = s.classes?.grade_level?.name ?? "Unassigned";
    const sort = s.classes?.grade_level?.sort_order ?? 9999;
    const key = code;
    if (!buckets.has(key)) buckets.set(key, { code, name, sort, m: 0, f: 0, o: 0 });
    const b = buckets.get(key)!;
    const g = genderCode(s.gender);
    if (g === "M") b.m++; else if (g === "F") b.f++; else b.o++;
  }
  const rows: any[][] = [["Grade Code", "Grade Name", "Boys", "Girls", "Unspecified", "Total"]];
  Array.from(buckets.values()).sort((a, b) => a.sort - b.sort).forEach((b) => {
    rows.push([b.code, b.name, b.m, b.f, b.o, b.m + b.f + b.o]);
  });
  return { rows, row_count: rows.length - 1, filename: `nemis_enrolment_${todayStamp()}.csv` };
}

async function nemisSne(svc: any, tenantId: string, _p: any) {
  const { data } = await svc
    .from("students")
    .select("first_name,last_name,admission_number,gender,sne_category,classes:current_class_id(name)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .not("sne_category", "is", null);
  const rows: any[][] = [["Adm No", "Name", "Sex", "Class", "SNE Category"]];
  for (const s of data ?? []) {
    rows.push([
      s.admission_number ?? "",
      `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
      genderCode(s.gender),
      s.classes?.name ?? "",
      s.sne_category ?? "",
    ]);
  }
  return { rows, row_count: rows.length - 1, filename: `nemis_sne_${todayStamp()}.csv` };
}

async function nemisRepeaters(svc: any, tenantId: string, _p: any) {
  const { data } = await svc
    .from("students")
    .select("first_name,last_name,admission_number,gender,classes:current_class_id(name,grade_level:grade_level_id(code))")
    .eq("tenant_id", tenantId)
    .eq("is_repeater", true);
  const rows: any[][] = [["Adm No", "Name", "Sex", "Grade", "Class"]];
  for (const s of data ?? []) {
    rows.push([
      s.admission_number ?? "",
      `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
      genderCode(s.gender),
      s.classes?.grade_level?.code ?? "",
      s.classes?.name ?? "",
    ]);
  }
  return { rows, row_count: rows.length - 1, filename: `nemis_repeaters_${todayStamp()}.csv` };
}

async function nemisDropouts(svc: any, tenantId: string, p: any) {
  const from = p.from ?? "1900-01-01";
  const to = p.to ?? "2999-12-31";
  const { data } = await svc
    .from("students")
    .select("first_name,last_name,admission_number,gender,exit_reason,exit_date,classes:current_class_id(name)")
    .eq("tenant_id", tenantId)
    .not("exit_date", "is", null)
    .gte("exit_date", from).lte("exit_date", to);
  const rows: any[][] = [["Adm No", "Name", "Sex", "Class", "Exit Reason", "Exit Date (M/D/YYYY)"]];
  for (const s of data ?? []) {
    rows.push([
      s.admission_number ?? "",
      `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
      genderCode(s.gender),
      s.classes?.name ?? "",
      s.exit_reason ?? "",
      fmtUsDate(s.exit_date),
    ]);
  }
  return { rows, row_count: rows.length - 1, filename: `nemis_dropouts_${todayStamp()}.csv` };
}

async function nemisTransfers(svc: any, tenantId: string, p: any) {
  const from = p.from ?? "1900-01-01";
  const to = p.to ?? "2999-12-31";
  const { data } = await svc
    .from("students")
    .select("first_name,last_name,admission_number,gender,transfer_in_date,transfer_out_date,classes:current_class_id(name)")
    .eq("tenant_id", tenantId)
    .or(`transfer_in_date.gte.${from},transfer_out_date.gte.${from}`);
  const rows: any[][] = [["Adm No", "Name", "Sex", "Class", "Direction", "Date (M/D/YYYY)"]];
  for (const s of data ?? []) {
    if (s.transfer_in_date && s.transfer_in_date >= from && s.transfer_in_date <= to) {
      rows.push([s.admission_number ?? "", `${s.first_name} ${s.last_name}`, genderCode(s.gender), s.classes?.name ?? "", "IN", fmtUsDate(s.transfer_in_date)]);
    }
    if (s.transfer_out_date && s.transfer_out_date >= from && s.transfer_out_date <= to) {
      rows.push([s.admission_number ?? "", `${s.first_name} ${s.last_name}`, genderCode(s.gender), s.classes?.name ?? "", "OUT", fmtUsDate(s.transfer_out_date)]);
    }
  }
  return { rows, row_count: rows.length - 1, filename: `nemis_transfers_${todayStamp()}.csv` };
}

async function nemisCapitation(svc: any, tenantId: string, _p: any) {
  // Capitation = per-learner-grant. We surface counts per grade with assumed per-capita amount
  // from tenant_settings key "capitation.per_learner_kes" (defaults: PP 1170, Pri 1420, JSS 4000).
  const { data: settings } = await svc.from("tenant_settings").select("value").eq("tenant_id", tenantId).eq("key", "capitation.per_learner_kes").maybeSingle();
  const rates: Record<string, number> = settings?.value ?? { pre_primary: 1170, lower_primary: 1420, upper_primary: 1420, junior_secondary: 4000, senior_secondary: 22244 };
  const { data } = await svc.from("students").select("classes:current_class_id(grade_level:grade_level_id(stage,code,name,sort_order))").eq("tenant_id", tenantId).eq("status", "active");
  const buckets = new Map<string, { stage: string; count: number; rate: number }>();
  for (const s of data ?? []) {
    const stage = s.classes?.grade_level?.stage ?? "unknown";
    const rate = rates[stage] ?? 0;
    if (!buckets.has(stage)) buckets.set(stage, { stage, count: 0, rate });
    buckets.get(stage)!.count++;
  }
  const rows: any[][] = [["Stage", "Learners", "Rate per learner (KES)", "Total Capitation (KES)"]];
  let grand = 0;
  for (const b of buckets.values()) {
    const total = b.count * b.rate;
    grand += total;
    rows.push([b.stage, b.count, b.rate, total]);
  }
  rows.push(["TOTAL", "", "", grand]);
  return { rows, row_count: rows.length - 1, filename: `nemis_capitation_${todayStamp()}.csv` };
}

// ---------- TSC ----------

async function tscReturns(svc: any, tenantId: string, _p: any) {
  const { data } = await svc
    .from("staff")
    .select("tsc_number, first_name, middle_name, last_name, gender, date_of_birth, national_id_number, tsc_job_group, tsc_registered_subjects, tsc_registration_date, date_employed, employment_type, kra_pin, phone, email")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .not("tsc_number", "is", null);
  const rows: any[][] = [[
    "TSC No", "Surname", "First Name", "Other Name", "Sex", "DOB (M/D/YYYY)",
    "National ID", "Job Group", "Registered Subjects",
    "TSC Reg Date (M/D/YYYY)", "Employment Date (M/D/YYYY)", "Employment Type",
    "KRA PIN", "Phone", "Email"
  ]];
  for (const s of data ?? []) {
    rows.push([
      s.tsc_number, s.last_name, s.first_name, s.middle_name ?? "",
      genderCode(s.gender), fmtUsDate(s.date_of_birth),
      s.national_id_number ?? "", s.tsc_job_group ?? "",
      (s.tsc_registered_subjects ?? []).join("; "),
      fmtUsDate(s.tsc_registration_date), fmtUsDate(s.date_employed),
      s.employment_type ?? "", s.kra_pin ?? "", s.phone ?? "", s.email ?? "",
    ]);
  }
  return { rows, row_count: rows.length - 1, filename: `tsc_returns_${todayStamp()}.csv` };
}

async function tscSubjectMismatch(svc: any, tenantId: string, _p: any) {
  const { data } = await svc
    .from("staff")
    .select("first_name, last_name, tsc_number, tsc_registered_subjects, subjects_taught")
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  const rows: any[][] = [["TSC No", "Teacher", "Registered Subjects", "Currently Teaching", "Mismatched Subjects"]];
  let count = 0;
  for (const s of data ?? []) {
    const reg: string[] = (s.tsc_registered_subjects ?? []).map((x: string) => x.toLowerCase());
    const teaching: string[] = Array.isArray(s.subjects_taught) ? s.subjects_taught.map((x: any) => String(x).toLowerCase()) : [];
    const mismatch = teaching.filter((t) => !reg.includes(t));
    if (mismatch.length > 0) {
      count++;
      rows.push([
        s.tsc_number ?? "—",
        `${s.first_name} ${s.last_name}`,
        (s.tsc_registered_subjects ?? []).join("; "),
        (s.subjects_taught ?? []).join("; "),
        mismatch.join("; "),
      ]);
    }
  }
  return { rows, row_count: count, filename: `tsc_subject_mismatch_${todayStamp()}.csv` };
}

// ---------- Payroll statutory ----------

async function getPayslipsForPeriod(svc: any, tenantId: string, periodId?: string, monthIso?: string) {
  let q = svc.from("payslips").select(`
      id, basic_salary, house_allowance, transport_allowance, other_allowances,
      gross_pay, taxable_pay, paye, shif, nssf, housing_levy, other_deductions, net_pay, detail,
      period:period_id ( id, name, period_start, period_end ),
      staff:staff_id ( id, first_name, middle_name, last_name, tsc_number, kra_pin, nssf_number, nhif_or_shif_number, national_id_number, date_of_birth, gender, phone )
    `).eq("tenant_id", tenantId);
  if (periodId) q = q.eq("period_id", periodId);
  const { data } = await q;
  let rows = data ?? [];
  if (monthIso && !periodId) {
    rows = rows.filter((r: any) => r.period?.period_start?.startsWith(monthIso));
  }
  return rows;
}

async function p10Paye(svc: any, tenantId: string, p: any) {
  const rowsData = await getPayslipsForPeriod(svc, tenantId, p.period_id, p.month);
  const rows: any[][] = [[
    "PIN of Employee", "Name of Employee", "Type of Employee",
    "Resident", "Type of Housing", "Basic Salary",
    "Allowances Cash & Non-Cash", "Total Gross Pay",
    "30% of Cash Pay", "Owner Occupied Interest", "Retirement Contribution",
    "Amount of Benefits", "Value of Quarters", "Taxable Pay",
    "Tax Charged", "Personal Relief", "Insurance Relief",
    "PAYE Tax (Ksh)",
  ]];
  for (const ps of rowsData) {
    rows.push([
      ps.staff?.kra_pin ?? "",
      `${ps.staff?.last_name ?? ""} ${ps.staff?.first_name ?? ""}`.trim(),
      "Primary",
      "Resident", "Benefit not given",
      n(ps.basic_salary), n(ps.house_allowance + ps.transport_allowance + (ps.other_allowances ?? 0)),
      n(ps.gross_pay),
      "", "", n(ps.nssf), "", "",
      n(ps.taxable_pay),
      n(ps.detail?.calc?.paye_gross ?? ps.paye),
      n(2400), "0", n(ps.paye),
    ]);
  }
  return { rows, row_count: rows.length - 1, filename: `p10_paye_${(p.month ?? todayStamp())}.csv` };
}

async function p9aAnnual(svc: any, tenantId: string, p: any) {
  const year = p.year ?? new Date().getFullYear();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const { data } = await svc.from("payslips")
    .select(`basic_salary, gross_pay, taxable_pay, paye, shif, nssf, housing_levy, other_deductions, net_pay,
             period:period_id ( period_start, period_end ),
             staff:staff_id ( id, first_name, last_name, kra_pin )`)
    .eq("tenant_id", tenantId)
    .gte("period.period_start", start)
    .lte("period.period_end", end);
  const rows: any[][] = [[
    "KRA PIN", "Employee", "Month", "Basic", "Gross", "NSSF", "SHIF", "AHL",
    "Taxable Pay", "PAYE", "Net Pay",
  ]];
  let count = 0;
  for (const ps of data ?? []) {
    if (!ps.period) continue;
    rows.push([
      ps.staff?.kra_pin ?? "",
      `${ps.staff?.last_name ?? ""} ${ps.staff?.first_name ?? ""}`.trim(),
      (ps.period.period_start ?? "").slice(0, 7),
      n(ps.basic_salary), n(ps.gross_pay), n(ps.nssf), n(ps.shif),
      n(ps.housing_levy), n(ps.taxable_pay), n(ps.paye), n(ps.net_pay),
    ]);
    count++;
  }
  return { rows, row_count: count, filename: `p9a_${year}.csv` };
}

async function statutoryByColumn(svc: any, tenantId: string, p: any, col: string, headerLabel: string, fileBase: string) {
  const rowsData = await getPayslipsForPeriod(svc, tenantId, p.period_id, p.month);
  const rows: any[][] = [["Employee No / ID", "Member No", "Name", "Gross Pay", headerLabel]];
  let total = 0;
  for (const ps of rowsData) {
    const memberNo = col === "shif" ? ps.staff?.nhif_or_shif_number :
                     col === "nssf" ? ps.staff?.nssf_number : ps.staff?.national_id_number;
    const amount = Number(ps[col] ?? 0);
    total += amount;
    rows.push([
      ps.staff?.national_id_number ?? "",
      memberNo ?? "",
      `${ps.staff?.last_name ?? ""} ${ps.staff?.first_name ?? ""}`.trim(),
      n(ps.gross_pay), n(amount),
    ]);
  }
  rows.push(["", "", "TOTAL", "", n(total)]);
  return { rows, row_count: rowsData.length, filename: `${fileBase}_${(p.month ?? todayStamp())}.csv` };
}

async function shifReturn(svc: any, tenantId: string, p: any) {
  return statutoryByColumn(svc, tenantId, p, "shif", "SHIF Contribution (KES)", "shif_return");
}
async function nssfReturn(svc: any, tenantId: string, p: any) {
  return statutoryByColumn(svc, tenantId, p, "nssf", "NSSF Contribution (KES)", "nssf_return");
}
async function ahlReturn(svc: any, tenantId: string, p: any) {
  return statutoryByColumn(svc, tenantId, p, "housing_levy", "Housing Levy (KES)", "ahl_return");
}
async function helbReturn(svc: any, tenantId: string, p: any) {
  // HELB is itemised under detail.allowances or recurring_deductions; surface what we have.
  const rowsData = await getPayslipsForPeriod(svc, tenantId, p.period_id, p.month);
  const rows: any[][] = [["National ID", "Name", "HELB Amount (KES)"]];
  let count = 0;
  for (const ps of rowsData) {
    const ded = Array.isArray(ps.detail?.deductions) ? ps.detail.deductions : [];
    const helb = ded.find((d: any) => /helb/i.test(d.name ?? ""));
    if (helb) {
      count++;
      rows.push([ps.staff?.national_id_number ?? "", `${ps.staff?.last_name} ${ps.staff?.first_name}`, n(helb.amount)]);
    }
  }
  return { rows, row_count: count, filename: `helb_${(p.month ?? todayStamp())}.csv` };
}

function n(v: any) { return Number(v ?? 0).toFixed(2); }
function todayStamp() { return new Date().toISOString().slice(0, 10); }