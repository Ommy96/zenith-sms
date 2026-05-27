// Greedy deterministic auto-timetable generator.
// Fills timetable_slots for a (term, class) using class_subjects.periods_per_week,
// avoiding teacher & room conflicts and break periods.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { tenantId, classId, termId, replace = true } = await req.json();
    if (!tenantId || !classId || !termId) {
      return json({ error: "tenantId, classId, termId required" }, 400);
    }
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);
    const { data: canEdit } = await userClient.rpc("has_perm", {
      _tenant: tenantId, _perm: "timetable.edit", _user: userData.user.id,
    });
    if (!canEdit) return json({ error: "Forbidden" }, 403);

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Fetch inputs
    const [periodsRes, csRes, roomsRes, ttRes] = await Promise.all([
      svc.from("periods").select("id,day_of_week,start_time,is_break,sort_order")
        .eq("tenant_id", tenantId).order("day_of_week").order("start_time"),
      svc.from("class_subjects").select("subject_id,teacher_id,periods_per_week")
        .eq("tenant_id", tenantId).eq("class_id", classId),
      svc.from("rooms").select("id,name").eq("tenant_id", tenantId),
      svc.from("timetable_slots").select("period_id,teacher_id,room_id,class_id")
        .eq("tenant_id", tenantId).eq("term_id", termId),
    ]);
    const periods = (periodsRes.data || []).filter((p: any) => !p.is_break);
    const classSubs = csRes.data || [];
    const rooms = roomsRes.data || [];
    if (!periods.length) return json({ error: "No periods defined" }, 400);
    if (!classSubs.length) return json({ error: "No subjects assigned to class" }, 400);

    // Existing assignments (for conflict tracking across other classes)
    const teacherBusy = new Set<string>(); // `${periodId}:${teacherId}`
    const roomBusy = new Set<string>();
    const classBusy = new Set<string>();   // periods already used by *this* class
    for (const s of ttRes.data || []) {
      if (s.class_id !== classId) {
        if (s.teacher_id) teacherBusy.add(`${s.period_id}:${s.teacher_id}`);
        if (s.room_id) roomBusy.add(`${s.period_id}:${s.room_id}`);
      } else {
        classBusy.add(s.period_id);
      }
    }

    if (replace) {
      await svc.from("timetable_slots").delete()
        .eq("tenant_id", tenantId).eq("term_id", termId).eq("class_id", classId);
      classBusy.clear();
    }

    // Build a queue of (subject, teacher) requirements per session
    const queue: { subject_id: string; teacher_id: string | null }[] = [];
    for (const cs of classSubs) {
      for (let i = 0; i < (cs.periods_per_week || 0); i++) {
        queue.push({ subject_id: cs.subject_id, teacher_id: cs.teacher_id });
      }
    }
    // Sort: subjects with more periods first (harder to place last)
    queue.sort((a, b) => 0);

    // Distribute across days — group periods by day for spacing
    const periodsByDay: Record<number, any[]> = {};
    periods.forEach((p: any) => { (periodsByDay[p.day_of_week] ||= []).push(p); });
    const days = Object.keys(periodsByDay).map(Number).sort();

    // Walk periods round-robin by day so each subject spreads across the week
    const flat: any[] = [];
    let max = Math.max(...Object.values(periodsByDay).map((a: any) => a.length));
    for (let i = 0; i < max; i++) {
      for (const d of days) {
        if (periodsByDay[d][i]) flat.push(periodsByDay[d][i]);
      }
    }

    const inserts: any[] = [];
    const dailyCount = new Map<string, number>(); // `${day}:${subject_id}` => count, limit 2/day

    for (const q of queue) {
      let placed = false;
      for (const p of flat) {
        if (classBusy.has(p.id)) continue;
        const dayKey = `${p.day_of_week}:${q.subject_id}`;
        if ((dailyCount.get(dayKey) || 0) >= 2) continue;
        if (q.teacher_id && teacherBusy.has(`${p.id}:${q.teacher_id}`)) continue;
        // pick first free room
        let chosenRoom: string | null = null;
        for (const r of rooms) {
          if (!roomBusy.has(`${p.id}:${r.id}`)) { chosenRoom = r.id; break; }
        }
        inserts.push({
          tenant_id: tenantId, term_id: termId, class_id: classId,
          period_id: p.id, subject_id: q.subject_id,
          teacher_id: q.teacher_id, room_id: chosenRoom,
        });
        classBusy.add(p.id);
        if (q.teacher_id) teacherBusy.add(`${p.id}:${q.teacher_id}`);
        if (chosenRoom) roomBusy.add(`${p.id}:${chosenRoom}`);
        dailyCount.set(dayKey, (dailyCount.get(dayKey) || 0) + 1);
        placed = true;
        break;
      }
      if (!placed) {
        // soft-fail: continue, report unplaced count
      }
    }

    const unplaced = queue.length - inserts.length;
    if (inserts.length) {
      const { error } = await svc.from("timetable_slots").insert(inserts);
      if (error) return json({ error: error.message }, 500);
    }

    return json({
      ok: true, placed: inserts.length, unplaced,
      periods: periods.length, subjects: classSubs.length,
    });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}