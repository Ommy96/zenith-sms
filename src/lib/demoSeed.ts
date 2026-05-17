import { supabase } from "@/integrations/supabase/client";

const FIRST_NAMES = ["Amani","Brian","Cynthia","David","Esther","Faith","George","Halima","Ian","Joy","Kevin","Lilian","Moses","Nia","Otieno","Pauline","Quincy","Rose","Samuel","Tabitha"];
const LAST_NAMES = ["Achieng","Barasa","Chebet","Diallo","Eze","Farah","Gitau","Hussein","Iqbal","Jenga","Kamau","Lwanga","Mwangi","Njoroge","Onyango"];
const TEACHER_FIRST = ["Mary","John","Peter","Grace"];
const TEACHER_LAST = ["Wanjiku","Otieno","Mutua","Kiprono"];
const SUBJECTS = ["Mathematics","English","Science","Social Studies","Kiswahili"];

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const dateAddDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split("T")[0];

/**
 * Seeds a school with realistic demo data. Tags school as is_demo=true.
 */
export async function seedDemoData(schoolId: string) {
  // Mark as demo
  await supabase.from("tenants").update({ is_demo: true }).eq("id", schoolId);

  // Classes
  const classDefs = [
    { name: "Grade 4 - Blue", grade_level: "Grade 4" },
    { name: "Form 1 - North", grade_level: "Form 1" },
    { name: "Form 3 - East", grade_level: "Form 3" },
  ];
  const { data: classes } = await supabase.from("classes").insert(
    classDefs.map((c) => ({ ...c, tenant_id: schoolId, capacity: 40, academic_year: String(new Date().getFullYear()) }))
  ).select();

  // Teachers (4)
  const teacherRows = TEACHER_FIRST.map((fn, i) => ({
    tenant_id: schoolId,
    first_name: fn,
    last_name: TEACHER_LAST[i],
    email: `${fn.toLowerCase()}.${TEACHER_LAST[i].toLowerCase()}@demo.school`,
    phone: `+25470${1000000 + i * 11111}`,
    role: "teacher",
    department: rand(SUBJECTS),
    status: "active",
  }));
  await supabase.from("staff").insert(teacherRows);

  // Students (15) — 5 per class
  const studentRows: any[] = [];
  classes?.forEach((cls, ci) => {
    for (let i = 0; i < 5; i++) {
      const fn = FIRST_NAMES[ci * 5 + i];
      const ln = rand(LAST_NAMES);
      studentRows.push({
        tenant_id: schoolId,
        first_name: fn,
        last_name: ln,
        gender: i % 2 === 0 ? "male" : "female",
        grade: cls.grade_level,
        admission_number: `ADM-${1000 + ci * 5 + i}`,
        guardian_name: `Mr/Mrs ${ln}`,
        guardian_phone: `+25471${2000000 + ci * 100 + i}`,
        guardian_relationship: "parent",
        status: "active",
        admission_date: dateAddDays(-180 + i * 5),
      });
    }
  });
  const { data: students } = await supabase.from("students").insert(studentRows).select();

  // Fee structure -> represented as 3 invoice templates per student per term — but the brief asks for 1 fee structure with 3 fee items.
  // We'll model the "fee structure" as a school payment_config addon and the "items" as 3 sample invoice descriptions.
  await supabase.from("tenants").update({
    payment_config: {
      currency: "KES",
      currency_symbol: "KSh",
      fee_structure: {
        name: "Standard Termly Fees",
        items: [
          { name: "Tuition", amount: 25000 },
          { name: "Boarding", amount: 12000 },
          { name: "Activities & Lunch", amount: 5000 },
        ],
      },
    },
  }).eq("id", schoolId);

  // 30 days of attendance for first 10 students
  if (students?.length) {
    const attRows: any[] = [];
    const sample = students.slice(0, 10);
    for (let d = 0; d < 30; d++) {
      const date = dateAddDays(-d);
      const day = new Date(date).getDay();
      if (day === 0 || day === 6) continue; // skip weekends
      sample.forEach((s) => {
        const r = Math.random();
        const status = r < 0.88 ? "present" : r < 0.95 ? "absent" : "late";
        attRows.push({ tenant_id: schoolId, student_id: s.id, date, status });
      });
    }
    // chunked insert
    for (let i = 0; i < attRows.length; i += 200) {
      await supabase.from("attendance").insert(attRows.slice(i, i + 200));
    }
  }

  // 5 invoices: paid, paid, partial, unpaid, unpaid
  if (students?.length) {
    const invRows = [
      { amount: 42000, paid: 42000, status: "paid", studentIdx: 0, days: -25 },
      { amount: 42000, paid: 42000, status: "paid", studentIdx: 1, days: -20 },
      { amount: 42000, paid: 20000, status: "partial", studentIdx: 2, days: -10 },
      { amount: 42000, paid: 0, status: "pending", studentIdx: 3, days: -5 },
      { amount: 42000, paid: 0, status: "overdue", studentIdx: 4, days: -40 },
    ].map((r, i) => ({
      tenant_id: schoolId,
      student_id: students[r.studentIdx]?.id,
      invoice_number: `INV-${2000 + i}`,
      amount: r.amount,
      paid_amount: r.paid,
      status: r.status,
      currency: "KES",
      description: "Standard Termly Fees",
      due_date: dateAddDays(r.days + 30),
      created_at: new Date(Date.now() + r.days * 86400000).toISOString(),
    }));
    await supabase.from("invoices").insert(invRows);
  }

  // 3 announcements
  await supabase.from("announcements").insert([
    { tenant_id: schoolId, title: "Welcome back to Term 2", content: "Classes resume Monday. Please check the updated timetable.", priority: "high", audience: "all" },
    { tenant_id: schoolId, title: "Sports Day this Friday", content: "Inter-house competitions begin at 9 AM on the main field.", priority: "medium", audience: "all" },
    { tenant_id: schoolId, title: "Fee reminder", content: "Term 2 fees are due by the end of the month.", priority: "medium", audience: "parents" },
  ]);

  // 2 upcoming events as exams
  await supabase.from("exams").insert([
    { tenant_id: schoolId, name: "Mid-Term Exams", type: "mid-term", status: "upcoming", start_date: dateAddDays(14), end_date: dateAddDays(20), term: "Term 2", academic_year: String(new Date().getFullYear()) },
    { tenant_id: schoolId, name: "Parents' Day", type: "event", status: "upcoming", start_date: dateAddDays(28), end_date: dateAddDays(28), term: "Term 2", academic_year: String(new Date().getFullYear()) },
  ]);
}

/**
 * Deletes all demo-related data for a school. Optionally keeps school config.
 */
export async function clearDemoData(schoolId: string) {
  // Order matters loosely; no FKs but clear children first
  await supabase.from("attendance").delete().eq("tenant_id", schoolId);
  await supabase.from("exam_results").delete().eq("tenant_id", schoolId);
  await supabase.from("invoices").delete().eq("tenant_id", schoolId);
  await supabase.from("exams").delete().eq("tenant_id", schoolId);
  await supabase.from("announcements").delete().eq("tenant_id", schoolId);
  await supabase.from("applications").delete().eq("tenant_id", schoolId);
  await supabase.from("students").delete().eq("tenant_id", schoolId);
  await supabase.from("staff").delete().eq("tenant_id", schoolId);
  await supabase.from("classes").delete().eq("tenant_id", schoolId);
  await supabase.from("tenants").update({ is_demo: false }).eq("id", schoolId);
}