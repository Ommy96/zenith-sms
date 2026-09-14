// Generates a draft class timetable with a simple greedy allocator.
// Real optimisation lives in auto-timetable-optimize.
import { adminClient, authedUser, requirePermission, authErrorResponse } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { academic_year_id, term_id, constraints, tenant_id } = await req.json();
    const tenantId = tenant_id ?? user.tenantIds[0];
    if (!user.isSuperAdmin) requirePermission(user, tenantId, "timetable.manage");

    const admin = adminClient();
    const [{ data: classes }, { data: periods }, { data: classSubjects }] = await Promise.all([
      admin.from("classes").select("id, name").eq("tenant_id", tenantId),
      admin.from("periods").select("id, name, day_of_week, start_time, is_break")
        .eq("tenant_id", tenantId).order("day_of_week").order("start_time"),
      admin.from("class_subjects").select("class_id, subject_id, teacher_id, lessons_per_week")
        .eq("tenant_id", tenantId),
    ]);

    if (!classes?.length || !periods?.length || !classSubjects?.length) {
      return jsonResponse({
        ok: false,
        error: "missing_setup",
        message: "Add classes, a bell schedule and class subjects before generating a timetable.",
      }, 400);
    }

    const teachingPeriods = periods.filter((p: Record<string, unknown>) => !p.is_break);
    const teacherBusy = new Set<string>();
    const slots: Record<string, unknown>[] = [];
    const unplaced: Record<string, unknown>[] = [];

    for (const cls of classes) {
      const subjects = classSubjects.filter((cs: Record<string, unknown>) => cs.class_id === cls.id);
      let cursor = 0;
      for (const cs of subjects) {
        const lessons = Number(cs.lessons_per_week ?? 1);
        for (let i = 0; i < lessons; i++) {
          let placed = false;
          for (let attempt = 0; attempt < teachingPeriods.length; attempt++) {
            const period = teachingPeriods[(cursor + attempt) % teachingPeriods.length];
            const teacherKey = `${cs.teacher_id}:${period.id}`;
            const classKey = `class:${cls.id}:${period.id}`;
            if (teacherBusy.has(classKey)) continue;
            if (cs.teacher_id && teacherBusy.has(teacherKey)) continue;
            teacherBusy.add(classKey);
            if (cs.teacher_id) teacherBusy.add(teacherKey);
            slots.push({
              tenant_id: tenantId,
              class_id: cls.id,
              subject_id: cs.subject_id,
              teacher_id: cs.teacher_id ?? null,
              period_id: period.id,
              day_of_week: period.day_of_week,
              academic_year_id: academic_year_id ?? null,
              term_id: term_id ?? null,
            });
            cursor = (cursor + attempt + 1) % teachingPeriods.length;
            placed = true;
            break;
          }
          if (!placed) unplaced.push({ class_id: cls.id, subject_id: cs.subject_id });
        }
      }
    }

    return jsonResponse({
      ok: true,
      generated: slots.length,
      unplaced: unplaced.length,
      slots,
      note: "Draft only — nothing was saved. Review, then save the slots you want to keep.",
      constraints_received: constraints ?? null,
    });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
