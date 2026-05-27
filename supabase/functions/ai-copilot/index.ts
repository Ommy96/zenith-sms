// AI Admin Copilot — tool-calling chat over school data.
// Defaults to Anthropic Claude (native tools). Falls back to Lovable AI (OpenAI tools).

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { authedUser, userIsTenantMember, checkQuota } from "../_shared/ai-service.ts";

const MAX_STEPS = 6;

// ------------------------------------------------------------------ Tools
// Each tool: input schema (json-schema-ish) + executor returning compact JSON.

type ToolDef = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  run: (svc: SupabaseClient, tenantId: string, args: any) => Promise<any>;
};

const TOOLS: ToolDef[] = [
  {
    name: "find_class",
    description: "Look up class(es) by name/code (e.g. 'Form 3', 'Grade 7', '4B'). Returns class id, name, stream, level.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Partial class name or code" } },
      required: ["query"],
    },
    run: async (svc, tenantId, { query }) => {
      const q = String(query ?? "").trim();
      const { data } = await svc
        .from("classes")
        .select("id, name, stream, grade_level_id, grade_levels(name, code)")
        .eq("tenant_id", tenantId)
        .or(`name.ilike.%${q}%`)
        .limit(20);
      return { matches: (data ?? []).map((c: any) => ({
        id: c.id, name: c.name, stream: c.stream,
        level: c.grade_levels?.name ?? null, code: c.grade_levels?.code ?? null,
      })) };
    },
  },
  {
    name: "list_students",
    description: "List students, optionally filtered by class_id, grade level name, or search by name/admission number. Returns up to 50 rows.",
    input_schema: {
      type: "object",
      properties: {
        class_id: { type: "string", description: "UUID from find_class" },
        level: { type: "string", description: "Grade level name like 'Grade 4' or 'Form 3'" },
        search: { type: "string", description: "Name or admission number fragment" },
        status: { type: "string", enum: ["active", "graduated", "transferred", "withdrawn"], default: "active" },
      },
    },
    run: async (svc, tenantId, { class_id, level, search, status = "active" }) => {
      let q = svc.from("students")
        .select("id, first_name, last_name, admission_number, gender, current_class_id, stream, classes(name)")
        .eq("tenant_id", tenantId).eq("status", status).limit(50);
      if (class_id) q = q.eq("current_class_id", class_id);
      if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%`);
      if (level && !class_id) {
        const { data: gl } = await svc.from("grade_levels").select("id").eq("tenant_id", tenantId).ilike("name", `%${level}%`).limit(1);
        if (gl?.[0]) {
          const { data: cl } = await svc.from("classes").select("id").eq("tenant_id", tenantId).eq("grade_level_id", gl[0].id);
          const ids = (cl ?? []).map((c: any) => c.id);
          if (ids.length) q = q.in("current_class_id", ids); else return { count: 0, students: [] };
        }
      }
      const { data, error } = await q;
      if (error) return { error: error.message };
      return {
        count: data?.length ?? 0,
        students: (data ?? []).map((s: any) => ({
          id: s.id, name: `${s.first_name} ${s.last_name}`,
          admission_number: s.admission_number, gender: s.gender,
          class: s.classes?.name ?? null, stream: s.stream,
        })),
      };
    },
  },
  {
    name: "students_with_outstanding_fees",
    description: "Find students with unpaid invoice balances. Optionally filter by class_id or minimum balance.",
    input_schema: {
      type: "object",
      properties: {
        class_id: { type: "string" },
        min_balance: { type: "number", default: 1 },
        limit: { type: "number", default: 50 },
      },
    },
    run: async (svc, tenantId, { class_id, min_balance = 1, limit = 50 }) => {
      let q = svc.from("student_invoices")
        .select("student_id, balance, total, due_date, status, students!inner(id, first_name, last_name, admission_number, current_class_id, classes(name))")
        .eq("tenant_id", tenantId)
        .gte("balance", min_balance)
        .neq("status", "void")
        .order("balance", { ascending: false })
        .limit(limit);
      if (class_id) q = q.eq("students.current_class_id", class_id);
      const { data, error } = await q;
      if (error) return { error: error.message };
      // Aggregate per student
      const byStudent = new Map<string, any>();
      for (const row of data ?? []) {
        const s: any = (row as any).students;
        const id = s.id;
        const ex = byStudent.get(id) ?? { id, name: `${s.first_name} ${s.last_name}`, admission_number: s.admission_number, class: s.classes?.name ?? null, balance: 0, invoices: 0 };
        ex.balance += Number((row as any).balance ?? 0);
        ex.invoices += 1;
        byStudent.set(id, ex);
      }
      const list = [...byStudent.values()].sort((a, b) => b.balance - a.balance);
      const total = list.reduce((s, r) => s + r.balance, 0);
      return { count: list.length, total_outstanding: +total.toFixed(2), students: list.slice(0, limit) };
    },
  },
  {
    name: "chronic_absentees",
    description: "Students who have been absent at least N times in the given date range.",
    input_schema: {
      type: "object",
      properties: {
        from_date: { type: "string", description: "YYYY-MM-DD" },
        to_date: { type: "string", description: "YYYY-MM-DD" },
        min_absences: { type: "number", default: 3 },
      },
      required: ["from_date", "to_date"],
    },
    run: async (svc, tenantId, { from_date, to_date, min_absences = 3 }) => {
      const { data, error } = await svc.rpc("attendance_chronic_absentees", {
        _tenant: tenantId, _from: from_date, _to: to_date, _min_absences: min_absences,
      });
      if (error) return { error: error.message };
      return { count: data?.length ?? 0, students: (data ?? []).slice(0, 50) };
    },
  },
  {
    name: "recent_payments",
    description: "List recent fee payments within a date range (default last 7 days).",
    input_schema: {
      type: "object",
      properties: {
        from_date: { type: "string", description: "YYYY-MM-DD" },
        to_date: { type: "string", description: "YYYY-MM-DD" },
        method: { type: "string", enum: ["mpesa", "cash", "bank", "cheque", "card", "other"] },
      },
    },
    run: async (svc, tenantId, { from_date, to_date, method }) => {
      const to = to_date ?? new Date().toISOString().slice(0, 10);
      const from = from_date ?? new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
      let q = svc.from("student_payments")
        .select("id, amount, method, reference, paid_at, students(first_name, last_name, admission_number)")
        .eq("tenant_id", tenantId)
        .gte("paid_at", from).lte("paid_at", `${to}T23:59:59`)
        .order("paid_at", { ascending: false }).limit(50);
      if (method) q = q.eq("method", method);
      const { data, error } = await q;
      if (error) return { error: error.message };
      const total = (data ?? []).reduce((s, p: any) => s + Number(p.amount ?? 0), 0);
      return {
        range: { from, to }, count: data?.length ?? 0, total: +total.toFixed(2),
        payments: (data ?? []).map((p: any) => ({
          amount: Number(p.amount), method: p.method, ref: p.reference, at: p.paid_at,
          student: p.students ? `${p.students.first_name} ${p.students.last_name} (${p.students.admission_number ?? ""})` : null,
        })),
      };
    },
  },
  {
    name: "low_stock_items",
    description: "Inventory items currently at or below their reorder level.",
    input_schema: { type: "object", properties: { limit: { type: "number", default: 30 } } },
    run: async (svc, tenantId, { limit = 30 }) => {
      const { data, error } = await svc.from("stock_items")
        .select("id, name, unit, quantity_on_hand, reorder_level, unit_cost")
        .eq("tenant_id", tenantId).gt("reorder_level", 0)
        .order("quantity_on_hand", { ascending: true }).limit(200);
      if (error) return { error: error.message };
      const low = (data ?? []).filter((i: any) => Number(i.quantity_on_hand) <= Number(i.reorder_level)).slice(0, limit);
      return { count: low.length, items: low };
    },
  },
  {
    name: "tenant_stats",
    description: "Snapshot of key counts: active students, staff, today's collections, outstanding fees.",
    input_schema: { type: "object", properties: {} },
    run: async (svc, tenantId) => {
      const today = new Date().toISOString().slice(0, 10);
      const [stu, staff, pay, inv] = await Promise.all([
        svc.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active"),
        svc.from("staff").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active"),
        svc.from("student_payments").select("amount").eq("tenant_id", tenantId).gte("paid_at", today),
        svc.from("student_invoices").select("balance").eq("tenant_id", tenantId).gt("balance", 0).neq("status", "void"),
      ]);
      const today_total = (pay.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
      const outstanding = (inv.data ?? []).reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);
      return {
        active_students: stu.count ?? 0,
        active_staff: staff.count ?? 0,
        collections_today: +today_total.toFixed(2),
        outstanding_balance: +outstanding.toFixed(2),
        as_of: new Date().toISOString(),
      };
    },
  },
];

const TOOL_INDEX = new Map(TOOLS.map((t) => [t.name, t]));

// ------------------------------------------------------------------ Provider tool-call loops

function svc(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

const SYSTEM_PROMPT = `You are Zenith Copilot — an assistant for school administrators.
You answer questions about students, attendance, fees, staff, and operations by calling the provided tools.
Rules:
- Always use tools to fetch real data; never invent names, numbers, or balances.
- When the user mentions a class like "Form 3" or "Grade 7", first call find_class to resolve the class_id, then use it in follow-up tools.
- Keep responses concise. When listing >10 items, summarise and show the top 10 with a note that more exist.
- Format money with the local currency (assume KES unless told otherwise).
- If a tool returns an error or empty result, say so plainly. Suggest next steps.
- Today's date is ${new Date().toISOString().slice(0, 10)}.`;

async function runAnthropic(tenantId: string, userId: string | null, history: any[], onLog: (e: any) => void) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_NOT_CONFIGURED");
  const tools = TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema }));
  let messages = [...history];
  let totalIn = 0, totalOut = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5", max_tokens: 1500,
        system: SYSTEM_PROMPT, tools, messages,
      }),
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
      return { text, totalIn, totalOut, provider: "anthropic" as const, model: "claude-sonnet-4-5" };
    }

    const results = [];
    for (const use of toolUses) {
      const def = TOOL_INDEX.get(use.name);
      let out: any;
      try {
        out = def ? await def.run(svc(), tenantId, use.input ?? {}) : { error: `unknown tool ${use.name}` };
      } catch (e) { out = { error: e instanceof Error ? e.message : String(e) }; }
      onLog({ tool: use.name, input: use.input, output: out });
      results.push({ type: "tool_result", tool_use_id: use.id, content: JSON.stringify(out).slice(0, 8000) });
    }
    messages.push({ role: "user", content: results });
  }
  return { text: "I couldn't complete that within the step limit. Please refine your question.", totalIn, totalOut, provider: "anthropic" as const, model: "claude-sonnet-4-5" };
}

async function runLovable(tenantId: string, userId: string | null, history: any[], onLog: (e: any) => void) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_NOT_CONFIGURED");
  const model = "google/gemini-2.5-flash";
  const tools = TOOLS.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }));
  // Convert history (Anthropic-shape) into OpenAI chat shape.
  const messages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
  for (const m of history) {
    if (typeof m.content === "string") messages.push({ role: m.role, content: m.content });
    else messages.push({ role: m.role, content: m.content.map((c: any) => c.text ?? "").join("\n") });
  }
  let totalIn = 0, totalOut = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, tools, tool_choice: "auto", max_tokens: 1500 }),
    });
    if (!res.ok) throw new Error(`Lovable AI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    totalIn += data.usage?.prompt_tokens ?? 0;
    totalOut += data.usage?.completion_tokens ?? 0;
    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error("No message from Lovable AI");
    messages.push(msg);
    const calls = msg.tool_calls ?? [];
    if (calls.length === 0) {
      return { text: msg.content ?? "", totalIn, totalOut, provider: "lovable" as const, model };
    }
    for (const call of calls) {
      const def = TOOL_INDEX.get(call.function?.name);
      let args: any = {};
      try { args = JSON.parse(call.function?.arguments || "{}"); } catch {}
      let out: any;
      try {
        out = def ? await def.run(svc(), tenantId, args) : { error: `unknown tool ${call.function?.name}` };
      } catch (e) { out = { error: e instanceof Error ? e.message : String(e) }; }
      onLog({ tool: call.function?.name, input: args, output: out });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(out).slice(0, 8000) });
    }
  }
  return { text: "I couldn't complete that within the step limit. Please refine your question.", totalIn, totalOut, provider: "lovable" as const, model };
}

// ------------------------------------------------------------------ Handler

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const { tenantId, messages } = body ?? {};
    if (!tenantId || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: "tenantId and messages required" }, 400);
    }
    const member = await userIsTenantMember(user.userId, tenantId);
    if (!member) return json({ error: "Forbidden" }, 403);

    const quota = await checkQuota(tenantId);
    if (quota.state === "hard_stop") return json({ error: "AI_QUOTA_EXCEEDED", quota: quota.info }, 429);

    // Build initial conversation (claude-shape: string content for user/assistant).
    const history = messages.map((m: any) => ({ role: m.role, content: m.content }));

    const toolLog: any[] = [];
    const onLog = (e: any) => toolLog.push(e);

    const start = Date.now();
    let result;
    let provider: "anthropic" | "lovable";
    try {
      if (Deno.env.get("ANTHROPIC_API_KEY")) {
        result = await runAnthropic(tenantId, user.userId, history, onLog);
      } else {
        result = await runLovable(tenantId, user.userId, history, onLog);
      }
      provider = result.provider;
    } catch (err) {
      console.warn("Primary provider failed, falling back:", err);
      if (Deno.env.get("LOVABLE_API_KEY")) {
        result = await runLovable(tenantId, user.userId, history, onLog);
        provider = "lovable";
      } else { throw err; }
    }

    // Log usage (rough: combined tokens across steps)
    const s = svc();
    await s.from("ai_usage_logs").insert({
      tenant_id: tenantId, user_id: user.userId, feature: "copilot",
      provider, model: result.model,
      prompt_tokens: result.totalIn, completion_tokens: result.totalOut,
      cost_usd: 0, // estimated by ai-service for other features; copilot multi-step — approximate via usage view
      latency_ms: Date.now() - start, status: "success",
      request_meta: { tool_calls: toolLog.length, steps: toolLog.length + 1 },
    });

    return json({
      text: result.text,
      tool_calls: toolLog,
      provider, model: result.model,
      tokens: { input: result.totalIn, output: result.totalOut },
      quota: quota.info,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, msg === "AI_QUOTA_EXCEEDED" ? 429 : 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}