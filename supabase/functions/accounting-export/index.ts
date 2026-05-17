import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const r of rows) lines.push(headers.map((h) => csvCell(r[h])).join(","));
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const tenantId: string = body.tenant_id;
    const from: string = body.from;
    const to: string = body.to;
    const format: string = body.format || "csv";
    if (!tenantId || !from || !to) {
      return new Response(JSON.stringify({ error: "tenant_id, from, to required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify membership / permission
    const { data: hasPerm } = await supabase.rpc("has_perm", { _tenant: tenantId, _perm: "expenses.view" });
    if (!hasPerm) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("*, expense_categories:category_id(name, gl_account_code), expense_vendors:vendor_id(name, tax_pin)")
      .eq("tenant_id", tenantId)
      .gte("expense_date", from)
      .lte("expense_date", to)
      .in("status", ["approved", "paid"])
      .order("expense_date");

    if (error) throw error;

    const rows = expenses || [];
    let csv = "";
    let filename = `expenses-${from}-to-${to}.csv`;

    if (format === "quickbooks") {
      // QuickBooks IIF-compatible bank transactions CSV (Date, Description, Amount, Account, Memo)
      const mapped = rows.map((r: any) => ({
        Date: r.expense_date,
        Description: r.expense_vendors?.name || r.description,
        Amount: -Number(r.total_amount),
        Account: r.expense_categories?.gl_account_code || r.expense_categories?.name || "Uncategorized",
        Memo: r.description,
        Reference: r.payment_reference || r.expense_number,
      }));
      csv = toCsv(mapped, ["Date", "Description", "Amount", "Account", "Memo", "Reference"]);
      filename = `quickbooks-${from}-to-${to}.csv`;
    } else if (format === "xero") {
      // Xero bank statement import format
      const mapped = rows.map((r: any) => ({
        Date: r.expense_date,
        Amount: -Number(r.total_amount),
        Payee: r.expense_vendors?.name || "",
        Description: r.description,
        Reference: r.payment_reference || r.expense_number,
      }));
      csv = toCsv(mapped, ["Date", "Amount", "Payee", "Description", "Reference"]);
      filename = `xero-${from}-to-${to}.csv`;
    } else {
      const mapped = rows.map((r: any) => ({
        expense_number: r.expense_number,
        date: r.expense_date,
        category: r.expense_categories?.name || "",
        gl_account: r.expense_categories?.gl_account_code || "",
        vendor: r.expense_vendors?.name || "",
        vendor_pin: r.expense_vendors?.tax_pin || "",
        description: r.description,
        amount: r.amount,
        tax: r.tax_amount,
        total: r.total_amount,
        method: r.payment_method,
        reference: r.payment_reference || "",
        status: r.status,
        paid_at: r.paid_at || "",
      }));
      csv = toCsv(mapped, [
        "expense_number", "date", "category", "gl_account", "vendor", "vendor_pin",
        "description", "amount", "tax", "total", "method", "reference", "status", "paid_at",
      ]);
    }

    return new Response(JSON.stringify({ csv, filename, row_count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});