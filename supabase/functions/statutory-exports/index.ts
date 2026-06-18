// Generates Kenya statutory return CSVs for a given payroll period:
//   - paye_p10  : iTax-style PAYE return
//   - shif      : SHIF (Social Health Insurance Fund) return
//   - nssf      : NSSF Tier I + II return
//   - ahl       : Affordable Housing Levy return
//
// Reads from public.payslips + public.staff (PIN / NSSF / SHIF numbers)
// for a single payroll_period_id. The caller is the school admin/bursar
// (JWT verified in code) — the function refuses if the user is not a
// member of the tenant that owns the period.
//
// Returns: { filename, content_type: "text/csv", csv: "<contents>" }.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Kind = "paye_p10" | "shif" | "nssf" | "ahl";

const csvEsc = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cells: unknown[]) => cells.map(csvEsc).join(",");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { kind, period_id } = await req.json() as { kind: Kind; period_id: string };
    if (!kind || !period_id) throw new Error("kind and period_id required");

    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supaAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userRes } = await supaAuth.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Load the period and verify tenant membership.
    const { data: period, error: pErr } = await supa
      .from("payroll_periods")
      .select("id, tenant_id, period_label, period_end")
      .eq("id", period_id)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!period) throw new Error("period not found");

    const { data: membership } = await supa
      .from("tenant_users")
      .select("user_id")
      .eq("tenant_id", period.tenant_id)
      .eq("user_id", userRes.user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!membership) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull payslips + staff statutory IDs.
    const { data: slips, error: sErr } = await supa
      .from("payslips")
      .select(`
        id, gross_pay, taxable_pay, paye, shif, nssf, housing_levy, net_pay,
        staff:staff_id ( id, first_name, last_name, kra_pin, nssf_number, shif_number, national_id )
      `)
      .eq("period_id", period_id);
    if (sErr) throw sErr;

    const rows = (slips ?? []).map(s => ({
      ...s,
      staff: Array.isArray(s.staff) ? s.staff[0] : s.staff,
    }));

    const lines: string[] = [];
    let filename = "";

    if (kind === "paye_p10") {
      lines.push(row(["pin_of_employee", "name_of_employee", "national_id", "gross_pay", "taxable_pay", "paye_tax"]));
      for (const s of rows) {
        if ((s.paye ?? 0) <= 0) continue;
        lines.push(row([
          s.staff?.kra_pin ?? "",
          `${s.staff?.first_name ?? ""} ${s.staff?.last_name ?? ""}`.trim(),
          s.staff?.national_id ?? "",
          s.gross_pay, s.taxable_pay, s.paye,
        ]));
      }
      filename = `P10_PAYE_${period.period_label || period.period_end || period_id}.csv`;
    } else if (kind === "shif") {
      lines.push(row(["shif_number", "name_of_employee", "national_id", "gross_pay", "shif_contribution"]));
      for (const s of rows) {
        if ((s.shif ?? 0) <= 0) continue;
        lines.push(row([
          s.staff?.shif_number ?? "",
          `${s.staff?.first_name ?? ""} ${s.staff?.last_name ?? ""}`.trim(),
          s.staff?.national_id ?? "",
          s.gross_pay, s.shif,
        ]));
      }
      filename = `SHIF_${period.period_label || period.period_end || period_id}.csv`;
    } else if (kind === "nssf") {
      lines.push(row(["nssf_number", "name_of_employee", "national_id", "gross_pay", "nssf_employee", "nssf_employer", "nssf_total"]));
      for (const s of rows) {
        if ((s.nssf ?? 0) <= 0) continue;
        const employee = Number(s.nssf) || 0;
        const employer = employee; // matching contribution
        lines.push(row([
          s.staff?.nssf_number ?? "",
          `${s.staff?.first_name ?? ""} ${s.staff?.last_name ?? ""}`.trim(),
          s.staff?.national_id ?? "",
          s.gross_pay, employee, employer, employee + employer,
        ]));
      }
      filename = `NSSF_${period.period_label || period.period_end || period_id}.csv`;
    } else if (kind === "ahl") {
      lines.push(row(["pin_of_employee", "name_of_employee", "national_id", "gross_pay", "ahl_employee", "ahl_employer", "ahl_total"]));
      for (const s of rows) {
        if ((s.housing_levy ?? 0) <= 0) continue;
        const employee = Number(s.housing_levy) || 0;
        const employer = employee; // 1.5% + 1.5% match
        lines.push(row([
          s.staff?.kra_pin ?? "",
          `${s.staff?.first_name ?? ""} ${s.staff?.last_name ?? ""}`.trim(),
          s.staff?.national_id ?? "",
          s.gross_pay, employee, employer, employee + employer,
        ]));
      }
      filename = `AHL_${period.period_label || period.period_end || period_id}.csv`;
    } else {
      throw new Error(`unknown kind: ${kind}`);
    }

    const csv = lines.join("\n") + "\n";

    await supa.from("compliance_exports_log").insert({
      tenant_id: period.tenant_id,
      kind: `statutory_${kind}`,
      params: { period_id, period_label: period.period_label, row_count: lines.length - 1 },
      row_count: lines.length - 1,
    });

    return new Response(JSON.stringify({ filename, content_type: "text/csv", csv }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});