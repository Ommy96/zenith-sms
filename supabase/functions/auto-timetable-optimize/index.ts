// Advanced timetable optimizer.
// Builds an initial greedy schedule then improves it with simulated annealing,
// honouring hard constraints (no double-booking of class/teacher/room, teacher
// unavailability, periods_per_week) and minimising soft penalties (subject
// spread, teacher gaps, room-type mismatch, missed double-period preference).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Period = { id: string; day_of_week: number; start_time: string; sort_order: number; is_break: boolean };
type Room = { id: string; type: string };
type Req = { subject_id: string; teacher_id: string | null; required_room_type: string | null; preferred_room_id: string | null; prefers_double: boolean };
type Assignment = { period_id: string; subject_id: string; teacher_id: string | null; room_id: string | null };

type Weights = {
  spread: number;     // penalty per extra same-subject lesson on the same day
  gaps: number;       // penalty per teacher gap
  roomType: number;   // penalty when required room type doesn't match
  doubleBlock: number;// reward (negative penalty) for back-to-back when preferred
  preferredRoom: number; // reward for using preferred room
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const t0 = Date.now();
  try {
    const body = await req.json();
    const { tenantId, classId, termId, iterations = 4000, replace = true, weights: wIn } = body;
    if (!tenantId || !classId || !termId) return json({ error: "tenantId, classId, termId required" }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);
    const { data: canEdit } = await userClient.rpc("has_perm", { _tenant: tenantId, _perm: "timetable.edit", _user: userData.user.id });
    if (!canEdit) return json({ error: "Forbidden" }, 403);

    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const weights: Weights = {
      spread: 5, gaps: 3, roomType: 4, doubleBlock: 2, preferredRoom: 1,
      ...(wIn || {}),
    };

    const [pRes, csRes, sRes, rRes, ttRes, tuRes] = await Promise.all([
      svc.from("periods").select("id,day_of_week,start_time,sort_order,is_break").eq("tenant_id", tenantId).order("day_of_week").order("start_time"),
      svc.from("class_subjects").select("subject_id,teacher_id,periods_per_week,preferred_room_id,prefers_double_period").eq("tenant_id", tenantId).eq("class_id", classId),
      svc.from("subjects").select("id,required_room_type").eq("tenant_id", tenantId),
      svc.from("rooms").select("id,type").eq("tenant_id", tenantId),
      svc.from("timetable_slots").select("period_id,teacher_id,room_id,class_id").eq("tenant_id", tenantId).eq("term_id", termId),
      svc.from("teacher_unavailability").select("teacher_id,day_of_week,period_id").eq("tenant_id", tenantId),
    ]);
    const periods: Period[] = (pRes.data || []).filter((p: any) => !p.is_break);
    const classSubs = csRes.data || [];
    const subjects = sRes.data || [];
    const rooms: Room[] = rRes.data || [];
    if (!periods.length) return json({ error: "No teaching periods defined" }, 400);
    if (!classSubs.length) return json({ error: "No subjects assigned to class" }, 400);

    const subjMap = new Map(subjects.map((s: any) => [s.id, s]));

    // Hard external busyness
    const teacherBusyOther = new Set<string>();
    const roomBusyOther = new Set<string>();
    for (const s of ttRes.data || []) {
      if (s.class_id === classId) continue;
      if (s.teacher_id) teacherBusyOther.add(`${s.period_id}:${s.teacher_id}`);
      if (s.room_id) roomBusyOther.add(`${s.period_id}:${s.room_id}`);
    }
    const teacherUnavail = new Set<string>();
    for (const u of tuRes.data || []) {
      if (u.period_id) teacherUnavail.add(`${u.period_id}:${u.teacher_id}`);
      else {
        // whole day unavailability — expand per period on that day
        for (const p of periods) if (p.day_of_week === u.day_of_week) teacherUnavail.add(`${p.id}:${u.teacher_id}`);
      }
    }

    // Period ordering per day (for gap detection & doubles)
    const dayPeriods = new Map<number, Period[]>();
    for (const p of periods) {
      const arr = dayPeriods.get(p.day_of_week) || [];
      arr.push(p); dayPeriods.set(p.day_of_week, arr);
    }
    for (const arr of dayPeriods.values()) arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
    const periodIndex = new Map<string, { day: number; idx: number }>();
    for (const [day, arr] of dayPeriods.entries()) arr.forEach((p, i) => periodIndex.set(p.id, { day, idx: i }));

    // Build requirements queue
    const requirements: Req[] = [];
    for (const cs of classSubs) {
      const subj = subjMap.get(cs.subject_id);
      for (let i = 0; i < (cs.periods_per_week || 0); i++) {
        requirements.push({
          subject_id: cs.subject_id,
          teacher_id: cs.teacher_id,
          required_room_type: subj?.required_room_type || null,
          preferred_room_id: cs.preferred_room_id || null,
          prefers_double: !!cs.prefers_double_period,
        });
      }
    }

    // ---------- Helpers ----------
    const canPlace = (req: Req, period: Period, current: Map<string, Assignment>) => {
      if (current.has(period.id)) return false;
      if (req.teacher_id && teacherBusyOther.has(`${period.id}:${req.teacher_id}`)) return false;
      if (req.teacher_id && teacherUnavail.has(`${period.id}:${req.teacher_id}`)) return false;
      return true;
    };

    const pickRoom = (req: Req, period: Period, current: Map<string, Assignment>): string | null => {
      const used = new Set<string>();
      for (const a of current.values()) if (a.period_id === period.id && a.room_id) used.add(a.room_id);
      for (const r of roomBusyOther) {
        if (r.startsWith(`${period.id}:`)) used.add(r.split(":")[1]);
      }
      const candidates = rooms.filter((r) => !used.has(r.id));
      if (req.preferred_room_id && candidates.find((r) => r.id === req.preferred_room_id)) return req.preferred_room_id;
      if (req.required_room_type) {
        const match = candidates.find((r) => r.type === req.required_room_type);
        if (match) return match.id;
      }
      return candidates[0]?.id || null;
    };

    // ---------- Initial greedy ----------
    const sortedReqs = [...requirements].sort((a, b) => {
      // tighter constraints first: has teacher (busy), required room type, prefers double
      const score = (r: Req) => (r.teacher_id ? 2 : 0) + (r.required_room_type ? 2 : 0) + (r.prefers_double ? 1 : 0);
      return score(b) - score(a);
    });

    const assignments = new Map<string, Assignment>(); // period_id -> assignment
    const dailySubject = new Map<string, number>();    // `${day}:${subject}` count

    // Flatten periods in a "round-robin by day" walk
    const maxLen = Math.max(...[...dayPeriods.values()].map((a) => a.length));
    const flat: Period[] = [];
    for (let i = 0; i < maxLen; i++) for (const arr of dayPeriods.values()) if (arr[i]) flat.push(arr[i]);

    let unplaced = 0;
    for (const req of sortedReqs) {
      let best: Period | null = null;
      let bestScore = Infinity;
      for (const p of flat) {
        if (!canPlace(req, p, assignments)) continue;
        const dk = `${p.day_of_week}:${req.subject_id}`;
        const sameDay = dailySubject.get(dk) || 0;
        if (sameDay >= 2) continue;
        // simple score: prefer spreading
        const s = sameDay * 100 + p.sort_order;
        if (s < bestScore) { bestScore = s; best = p; }
      }
      if (!best) { unplaced++; continue; }
      const room = pickRoom(req, best, assignments);
      assignments.set(best.id, { period_id: best.id, subject_id: req.subject_id, teacher_id: req.teacher_id, room_id: room });
      dailySubject.set(`${best.day_of_week}:${req.subject_id}`, (dailySubject.get(`${best.day_of_week}:${req.subject_id}`) || 0) + 1);
    }

    // ---------- Scoring ----------
    const reqByKey = new Map<string, Req>(); // period_id -> req (for room/double info)
    const evaluate = (asgn: Map<string, Assignment>) => {
      const violations: any[] = [];
      let soft = 0; let hard = 0;
      // Spread
      const dayCount = new Map<string, number>();
      for (const a of asgn.values()) {
        const p = periods.find((x) => x.id === a.period_id)!;
        const k = `${p.day_of_week}:${a.subject_id}`;
        dayCount.set(k, (dayCount.get(k) || 0) + 1);
      }
      for (const [k, n] of dayCount.entries()) {
        if (n > 1) {
          soft += (n - 1) * weights.spread;
          if (n > 2) { hard++; violations.push({ type: "spread_exceeded", key: k, count: n }); }
        }
      }
      // Teacher gaps (per teacher per day)
      const teacherDays = new Map<string, number[]>();
      for (const a of asgn.values()) {
        if (!a.teacher_id) continue;
        const pi = periodIndex.get(a.period_id)!;
        const key = `${a.teacher_id}:${pi.day}`;
        const arr = teacherDays.get(key) || [];
        arr.push(pi.idx);
        teacherDays.set(key, arr);
      }
      for (const arr of teacherDays.values()) {
        if (arr.length < 2) continue;
        arr.sort((a, b) => a - b);
        const gaps = arr[arr.length - 1] - arr[0] + 1 - arr.length;
        if (gaps > 0) soft += gaps * weights.gaps;
      }
      // Room type mismatch & preferred room reward
      for (const a of asgn.values()) {
        const req = reqByKey.get(a.period_id);
        if (!req || !a.room_id) continue;
        const room = rooms.find((r) => r.id === a.room_id);
        if (req.required_room_type && room && room.type !== req.required_room_type) {
          soft += weights.roomType;
          violations.push({ type: "room_type_mismatch", period_id: a.period_id, expected: req.required_room_type, got: room.type });
        }
        if (req.preferred_room_id && a.room_id === req.preferred_room_id) soft -= weights.preferredRoom;
      }
      // Double-period preference: reward consecutive same-subject placements where prefers_double
      const subjConsec = new Map<string, number>();
      for (const [day, arr] of dayPeriods.entries()) {
        let prev: string | null = null;
        for (const p of arr) {
          const a = asgn.get(p.id);
          const sid = a?.subject_id || null;
          if (sid && sid === prev) subjConsec.set(sid, (subjConsec.get(sid) || 0) + 1);
          prev = sid;
        }
      }
      for (const cs of classSubs) {
        if (cs.prefers_double_period && (subjConsec.get(cs.subject_id) || 0) > 0) {
          soft -= (subjConsec.get(cs.subject_id) || 0) * weights.doubleBlock;
        }
      }
      return { score: soft, hard, soft, violations };
    };

    const rebuildReqByKey = (asgn: Map<string, Assignment>) => {
      reqByKey.clear();
      // map each period to the req that placed there: by matching subject_id + teacher_id
      const reqByPair = new Map<string, Req>();
      for (const r of requirements) reqByPair.set(`${r.subject_id}:${r.teacher_id || ""}`, r);
      for (const a of asgn.values()) {
        const r = reqByPair.get(`${a.subject_id}:${a.teacher_id || ""}`);
        if (r) reqByKey.set(a.period_id, r);
      }
    };
    rebuildReqByKey(assignments);

    // ---------- Simulated annealing: swap & move ----------
    let current = new Map(assignments);
    let currentScore = evaluate(current).score;
    let best = new Map(current);
    let bestScore = currentScore;
    let temp = 5.0;
    const cool = Math.pow(0.001 / temp, 1 / Math.max(iterations, 1));

    const allPeriodIds = periods.map((p) => p.id);
    const filledPeriods = () => [...current.keys()];

    for (let it = 0; it < iterations; it++) {
      const filled = filledPeriods();
      if (filled.length < 2) break;
      const a = filled[Math.floor(Math.random() * filled.length)];
      let neighbour: Map<string, Assignment>;
      if (Math.random() < 0.5) {
        // swap with another filled period
        const b = filled[Math.floor(Math.random() * filled.length)];
        if (a === b) continue;
        const A = current.get(a)!, B = current.get(b)!;
        const pa = periods.find((p) => p.id === a)!;
        const pb = periods.find((p) => p.id === b)!;
        // hard check: teacher unavailability after swap
        if (A.teacher_id && (teacherBusyOther.has(`${b}:${A.teacher_id}`) || teacherUnavail.has(`${b}:${A.teacher_id}`))) continue;
        if (B.teacher_id && (teacherBusyOther.has(`${a}:${B.teacher_id}`) || teacherUnavail.has(`${a}:${B.teacher_id}`))) continue;
        neighbour = new Map(current);
        neighbour.set(a, { ...B, period_id: a });
        neighbour.set(b, { ...A, period_id: b });
      } else {
        // move to an empty period
        const empties = allPeriodIds.filter((p) => !current.has(p));
        if (!empties.length) continue;
        const target = empties[Math.floor(Math.random() * empties.length)];
        const A = current.get(a)!;
        if (A.teacher_id && (teacherBusyOther.has(`${target}:${A.teacher_id}`) || teacherUnavail.has(`${target}:${A.teacher_id}`))) continue;
        neighbour = new Map(current);
        neighbour.delete(a);
        neighbour.set(target, { ...A, period_id: target });
      }
      const prevRBK = new Map(reqByKey);
      rebuildReqByKey(neighbour);
      const ns = evaluate(neighbour).score;
      const delta = ns - currentScore;
      if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
        current = neighbour; currentScore = ns;
        if (ns < bestScore) { best = new Map(current); bestScore = ns; }
      } else {
        // restore
        reqByKey.clear(); for (const [k, v] of prevRBK) reqByKey.set(k, v);
      }
      temp *= cool;
    }

    rebuildReqByKey(best);
    const finalEval = evaluate(best);

    // ---------- Persist ----------
    if (replace) {
      await svc.from("timetable_slots").delete().eq("tenant_id", tenantId).eq("term_id", termId).eq("class_id", classId);
    }
    const inserts = [...best.values()].map((a) => ({
      tenant_id: tenantId, term_id: termId, class_id: classId,
      period_id: a.period_id, subject_id: a.subject_id,
      teacher_id: a.teacher_id, room_id: a.room_id,
    }));
    if (inserts.length) {
      const { error } = await svc.from("timetable_slots").insert(inserts);
      if (error) return json({ error: error.message }, 500);
    }

    const duration = Date.now() - t0;
    await svc.from("timetable_optimization_runs").insert({
      tenant_id: tenantId, term_id: termId, scope: "class", class_id: classId,
      score: finalEval.score, placed: inserts.length, unplaced,
      hard_violations: finalEval.hard, soft_violations: Math.round(finalEval.soft),
      violations: finalEval.violations, settings: { weights, iterations },
      duration_ms: duration, ran_by: userData.user.id,
    });

    return json({
      ok: true,
      placed: inserts.length,
      unplaced,
      score: finalEval.score,
      hard_violations: finalEval.hard,
      soft_violations: Math.round(finalEval.soft),
      violations: finalEval.violations.slice(0, 25),
      iterations,
      duration_ms: duration,
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