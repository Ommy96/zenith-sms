// AI Parent Bot — answers parent queries about their child (balance, attendance, grades).
// Callable two ways:
//  1. HTTP POST { tenantId, studentId, question } from internal callers (whatsapp-webhook).
//     Requires header `x-internal-key` matching SUPABASE_SERVICE_ROLE_KEY.
//  2. HTTP POST from authenticated portal users (Authorization: Bearer <jwt>) with
//     { tenantId, studentId, question } — verifies the user is a guardian/portal user
//     linked to that student via portal_my_student_ids RPC.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { authedUser, checkQuota } from "../_shared/ai-service.ts";

const MAX_STEPS = 4;

type ToolDef = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  run: (svc: SupabaseClient, tenantId: string, studentId: string, args: any) => Promise<any>;
};

const TOOLS: ToolDef[] = [
  {
    name: "child_balance",
    description: "Current outstanding fee balance and recent invoices for the child.",
    input_schema: { type: "object", properties: {} },
    run: async (svc, tenantId, studentId) => {
      const { data } = await svc.from("student_invoices")
        .select("invoice_number, total, balance, due_date, status, issued_at")
        .eq("tenant_id", tenantId).eq("student_id", studentId)
        .neq("status", "void")
        .order("issued_at", { ascending: false })
        .limit(10);
      const total = (data ?? []).reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);
      const { data: tenant } = await svc.from("tenants").select("currency_code").eq("id", tenantId).maybeSingle();
      return {
        currency: tenant?.currency_code ?? "KES",
        outstanding: +total.toFixed(2),
        invoices: data ?? [],
      };
    },
  },
  {
    name: "child_attendance_summary",
    description: "Attendance summary for the child over the last 30 days.",
    input_schema: { type: "object", properties: {} },
    run: async (svc, tenantId, studentId) => {
      const to = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
      const { data } = await svc.rpc("attendance_student_summary", {
        _tenant: tenantId, _student: studentId, _from: from, _to: to,
      });
      return { range: { from, to }, summary: data?.[0] ?? null };
    },
  },
  {
    name: "child_recent_grades",
    description: "Most recent exam results for the child.",
    input_schema: { type: "object", properties: { limit: { type: "number", default: 10 } } },
    run: async (svc, tenantId, studentId, { limit = 10 }) => {
      const { data } = await svc.from("student_exam_results")
        .select("raw_marks, max_marks, percentage, grade, subjects(name), exams(name, exam_date)")
        .eq("tenant_id", tenantId).eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return { count: data?.length ?? 0, results: (data ?? []).map((r: any) => ({
        subject: r.subjects?.name, exam: r.exams?.name, exam_date: r.exams?.exam_date,
        marks: r.raw_marks, out_of: r.max_marks, pct: r.percentage, grade: r.grade,
      })) };
    },
  },
  {
    name: "school_upcoming_events",
    description: "School events within the next 30 days.",
    input_schema: { type: "object", properties: {} },
    run: async (svc, tenantId) => {
      const to = new Date(Date.now() + 30 * 86400_000).toISOString();
      const { data } = await svc.from("events")
        .select("title, start_at, end_at, location")
        .eq("tenant_id", tenantId)
        .gte("start_at", new Date().toISOString())
        .lte("start_at", to)
        .order("start_at", { ascending: true })
        .limit(10);
      return { events: data ?? [] };
    },
  },
];

const TOOL_INDEX = new Map(TOOLS.map((t) => [t.name, t]));

function svc(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

function systemPromptFor(studentName: string, schoolName: string) {
  return `You are a polite WhatsApp assistant for ${schoolName}. You are speaking with the parent/guardian of ${studentName}.
Rules:
- Answer ONLY about this child. Never reveal info about other students or staff.
- Always call tools to fetch fees, attendance, and grades — never invent numbers.
- Keep replies under 4 sentences and friendly. Format currency clearly.
- If asked about something you don't have a tool for, politely ask them to contact the school office.
- Today's date is ${new Date().toISOString().slice(0, 10)}.`;
}

async function runAnthropic(system: string, tenantId: string, studentId: string, question: string) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_NOT_CONFIGURED");
  const tools = TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema }));
  const messages: any[] = [{ role: "user", content: question }];
  let totalIn = 0, totalOut = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 800, system, tools, messages }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    totalIn += data.usage?.input_tokens ?? 0;
    totalOut += data.usage?.output_tokens ?? 0;
    const content = data.content ?? [];
    messages.push({ role: "assistant", content });
    const toolUses = content.filter((b: any) => b.type === "tool_use");
    if (toolUses.length === 0) {
      const text = content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
      return { text, totalIn, totalOut, provider: "anthropic", model: "claude-sonnet-4-5" };
    }
    const results = [];
    for (const use of toolUses) {
      const def = TOOL_INDEX.get(use.name);
      let out: any;
      try { out = def ? await def.run(svc(), tenantId, studentId, use.input ?? {}) : { error: "unknown tool" }; }
      catch (e) { out = { error: e instanceof Error ? e.message : String(e) }; }
      results.push({ type: "tool_result", tool_use_id: use.id, content: JSON.stringify(out).slice(0, 4000) });
    }
    messages.push({ role: "user", content: results });
  }
  return { text: "Sorry, I couldn't fetch that right now. Please try again.", totalIn, totalOut, provider: "anthropic", model: "claude-sonnet-4-5" };
}

async function runLovable(system: string, tenantId: string, studentId: string, question: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_NOT_CONFIGURED");
  const model = "google/gemini-2.5-flash";
  const tools = TOOLS.map((t) => ({
    type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema },
  }));
  const messages: any[] = [
    { role: "system", content: system },
    { role: "user", content: question },
  ];
  let totalIn = 0, totalOut = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, tools, tool_choice: "auto", max_tokens: 800 }),
    });
    if (!res.ok) throw new Error(`Lovable AI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    totalIn += data.usage?.prompt_tokens ?? 0;
    totalOut += data.usage?.completion_tokens ?? 0;
    const msg = data.choices?.[0]?.message;
    if (!msg) break;
    messages.push(msg);
    const calls = msg.tool_calls ?? [];
    if (calls.length === 0) return { text: msg.content ?? "", totalIn, totalOut, provider: "lovable", model };
    for (const call of calls) {
      const def = TOOL_INDEX.get(call.function?.name);
      let args: any = {};
      try { args = JSON.parse(call.function?.arguments || "{}"); } catch {}
      let out: any;
      try { out = def ? await def.run(svc(), tenantId, studentId, args) : { error: "unknown tool" }; }
      catch (e) { out = { error: e instanceof Error ? e.message : String(e) }; }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(out).slice(0, 4000) });
    }
  }
  return { text: "Sorry, I couldn't fetch that right now.", totalIn, totalOut, provider: "lovable", model };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

export async function answerParentQuery(tenantId: string, studentId: string, question: string) {
  const s = svc();
  const quota = await checkQuota(tenantId);
  if (quota.state === "hard_stop") return { text: "Service temporarily unavailable. Please contact the school office.", blocked: true };

  const { data: stu } = await s.from("students")
    .select("first_name, last_name").eq("tenant_id", tenantId).eq("id", studentId).maybeSingle();
  if (!stu) return { text: "I couldn't find that student record.", blocked: true };
  const { data: tenant } = await s.from("tenants").select("name").eq("id", tenantId).maybeSingle();

  const system = systemPromptFor(`${stu.first_name} ${stu.last_name}`, tenant?.name ?? "the school");
  const start = Date.now();

  let result;
  try {
    if (Deno.env.get("ANTHROPIC_API_KEY")) {
      result = await runAnthropic(system, tenantId, studentId, question);
    } else {
      result = await runLovable(system, tenantId, studentId, question);
    }
  } catch (e) {
    console.warn("Parent bot primary failed:", e);
    if (Deno.env.get("LOVABLE_API_KEY")) {
      result = await runLovable(system, tenantId, studentId, question);
    } else { throw e; }
  }

  await s.from("ai_usage_logs").insert({
    tenant_id: tenantId, feature: "parent_bot",
    provider: result.provider, model: result.model,
    prompt_tokens: result.totalIn, completion_tokens: result.totalOut,
    cost_usd: 0, latency_ms: Date.now() - start, status: "success",
    request_meta: { student_id: studentId },
  });
  return { text: result.text, blocked: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { tenantId, studentId, question } = body ?? {};
    if (!tenantId || !studentId || !question) return json({ error: "tenantId, studentId, question required" }, 400);

    const internalKey = req.headers.get("x-internal-key");
    const isInternal = internalKey && internalKey === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!isInternal) {
      const user = await authedUser(req);
      if (!user) return json({ error: "Unauthorized" }, 401);
      const s = svc();
      const { data } = await s.rpc("portal_my_student_ids", { _user: user.userId });
      const allowed = (data ?? []).some((r: any) => r.student_id === studentId);
      if (!allowed) return json({ error: "Forbidden" }, 403);
    }

    const result = await answerParentQuery(tenantId, studentId, question);
    return json(result);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});