import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, Loader2, Mail, Phone, MapPin, Shield, FileText, Heart, GraduationCap, DollarSign, Smartphone, Download, MoreHorizontal, Printer, UserMinus, ArrowRightLeft, KeyRound, MessageSquare, AlertTriangle, Bell, BookOpen, CalendarDays, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "@/hooks/use-toast";
import { Money } from "@/components/Money";
import { DateTime } from "@/components/DateTime";
import { getStudentGovIdFields } from "@/lib/sis/countryFields";
import { InlineEditCard } from "@/components/sis/InlineEditCard";
import { ResponsiveContainer, LineChart, Line, Tooltip as RTooltip, XAxis, YAxis } from "recharts";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { tenant, can } = useTenant();
  const [student, setStudent] = useState<any>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [classRow, setClassRow] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<any[]>([]);
  const [examRows, setExamRows] = useState<any[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stkOpen, setStkOpen] = useState(false);
  const [stkForm, setStkForm] = useState({ amount: "", phone: "", invoice_id: "" });
  const [stkBusy, setStkBusy] = useState(false);
  const [stmtBusy, setStmtBusy] = useState(false);

  const canViewMedical = can("students.view_medical");
  const canEditStudent = can("students.edit");
  const canViewDiscipline = can("discipline.view");

  useEffect(() => {
    (async () => {
      if (!id || !profile?.tenant_id) return;
      setLoading(true);
      const { data: s, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
      if (error || !s) { toast({ title: "Student not found", variant: "destructive" }); navigate("/students"); return; }
      setStudent(s);

      const [{ data: sg }, { data: cls }, { data: inv }, { data: pay }, { data: act }, { data: dd }, { data: att }, { data: ex }] = await Promise.all([
        supabase.from("student_guardians").select("*, guardians(*)").eq("student_id", id),
        s.current_class_id ? supabase.from("classes").select("*").eq("id", s.current_class_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("student_invoices").select("*, terms:term_id(name), academic_years:academic_year_id(name)").eq("student_id", id).order("created_at", { ascending: false }).limit(50),
        supabase.from("student_payments").select("*").eq("student_id", id).order("paid_at", { ascending: false }).limit(50),
        supabase.from("student_activity").select("*").eq("student_id", id).order("occurred_at", { ascending: false }).limit(50),
        supabase.from("documents").select("*").eq("owner_type", "student").eq("owner_id", id).order("created_at", { ascending: false }),
        supabase.from("attendance").select("date,status").eq("student_id", id).order("date", { ascending: false }).limit(200),
        supabase.from("student_exam_results").select("raw_marks,max_marks,grade,position_in_class,entered_at,subjects:subject_id(name,code),exams:exam_id(name,term,academic_year)").eq("student_id", id).order("entered_at", { ascending: false }).limit(40),
      ]);
      setGuardians(sg ?? []);
      setClassRow(cls);
      setInvoices(inv ?? []);
      setPayments(pay ?? []);
      setActivity(act ?? []);
      setDocs(dd ?? []);
      setAttendanceRows(att ?? []);
      setExamRows(ex ?? []);
      if (s.current_class_id) {
        const { data: cs } = await supabase.from("class_subjects").select("periods_per_week, subjects:subject_id(name, code)").eq("class_id", s.current_class_id);
        setClassSubjects(cs ?? []);
      }
      setLoading(false);
    })();
  }, [id, profile?.tenant_id, navigate]);

  useEffect(() => {
    if (student && searchParams.get("edit") === "1") {
      // Legacy ?edit=1 query — redirect to the full edit route.
      navigate(`/students/${student.id}/edit`, { replace: true });
    }
  }, [student, searchParams, navigate]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!student) return null;

  const initials = `${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`.toUpperCase();
  const govFields = getStudentGovIdFields(tenant?.country_code);
  const age = student.date_of_birth ? Math.floor((Date.now() - new Date(student.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
  const balance = invoices
    .filter((i: any) => i.status !== "void")
    .reduce((acc, i) => acc + Number(i.balance || 0), 0);
  const totalBilled = invoices.filter((i: any) => i.status !== "void" && i.status !== "draft").reduce((a, i) => a + Number(i.total || 0), 0);
  const totalPaid = invoices.reduce((a, i) => a + Number(i.paid_total || 0), 0);
  const outstandingInvoices = invoices.filter((i: any) => Number(i.balance) > 0 && i.status !== "void");

  // Attendance summary (current term ≈ last 90 days)
  const ninetyDaysAgo = Date.now() - 90 * 86400_000;
  const termAtt = attendanceRows.filter(a => new Date(a.date).getTime() >= ninetyDaysAgo);
  const present = termAtt.filter(a => a.status === "present").length;
  const late = termAtt.filter(a => a.status === "late").length;
  const absent = termAtt.filter(a => a.status === "absent").length;
  const excused = termAtt.filter(a => a.status === "excused").length;
  const totalAtt = termAtt.length;
  const attRate = totalAtt > 0 ? Math.round(((present + late) / totalAtt) * 100) : null;
  const recentAbsences = attendanceRows.filter(a => a.status === "absent" || a.status === "late").slice(0, 10);

  // Exam sparkline — average % per exam, oldest→newest
  const examTrend = (() => {
    const byExam = new Map<string, { name: string; pct: number[] }>();
    for (const r of examRows) {
      const exName = r.exams?.name || "Exam";
      const max = Number(r.max_marks) || 0;
      const raw = Number(r.raw_marks) || 0;
      if (!max) continue;
      const entry = byExam.get(exName) ?? { name: exName, pct: [] as number[] };
      entry.pct.push((raw / max) * 100);
      byExam.set(exName, entry);
    }
    return Array.from(byExam.values()).slice(0, 8).reverse().map(e => ({
      name: e.name,
      avg: Math.round(e.pct.reduce((a, b) => a + b, 0) / e.pct.length),
    }));
  })();
  const avgScore = examTrend.length ? examTrend[examTrend.length - 1].avg : null;

  // YTD fees summary
  const ytdStart = new Date(new Date().getFullYear(), 0, 1).getTime();
  const ytdPaid = payments.filter(p => new Date(p.paid_at).getTime() >= ytdStart).reduce((a, p) => a + Number(p.amount || 0), 0);
  const ytdBilled = invoices.filter(i => new Date(i.created_at).getTime() >= ytdStart && i.status !== "void").reduce((a, i) => a + Number(i.total || 0), 0);

  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
  const statusKey = (student.enrollment_status || student.status || "").toLowerCase();
  const statusTone: "success" | "warning" | "danger" | "muted" =
    statusKey === "active" ? "success" :
    statusKey === "suspended" || statusKey === "expelled" ? "danger" :
    statusKey === "graduated" || statusKey === "transferred" || statusKey === "withdrawn" ? "muted" :
    "warning";
  const lastUpdatedAt = student.updated_at || student.created_at;

  const onStudentSaved = (patch: Partial<typeof student>) => setStudent({ ...student, ...patch });

  const sendReminder = async () => {
    const { error } = await supabase.functions.invoke("send-fee-reminder", {
      body: { student_id: student.id },
    });
    if (error) return toast({ title: "Could not send reminder", description: error.message, variant: "destructive" });
    toast({ title: "Reminder queued", description: "Guardians will receive an SMS/WhatsApp shortly." });
  };

  const isCBC = (tenant?.curriculum || "").toLowerCase() === "cbc";

  const openPay = (invoiceId?: string, amount?: number) => {
    const primaryGuardianPhone = guardians.find((g: any) => g.is_primary_contact)?.guardians?.phone_primary
      || guardians[0]?.guardians?.phone_primary || "";
    setStkForm({
      invoice_id: invoiceId || "",
      amount: amount ? String(amount) : String(balance || ""),
      phone: primaryGuardianPhone,
    });
    setStkOpen(true);
  };

  const requestStk = async () => {
    const amt = Number(stkForm.amount);
    if (!amt || amt <= 0) return toast({ title: "Enter a valid amount", variant: "destructive" });
    if (!stkForm.phone) return toast({ title: "Phone required", variant: "destructive" });
    setStkBusy(true);
    const { error } = await supabase.functions.invoke("mpesa-stk-push", {
      body: {
        student_id: student.id,
        amount: amt,
        phone: stkForm.phone,
        invoice_id: stkForm.invoice_id || null,
        account_reference: student.admission_number,
      },
    });
    setStkBusy(false);
    if (error) return toast({ title: "STK failed", description: error.message, variant: "destructive" });
    toast({ title: "STK push sent", description: "Ask the parent to enter their M-Pesa PIN." });
    setStkOpen(false);
  };

  const downloadStatement = async () => {
    setStmtBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-statement-pdf", {
        body: { student_id: student.id },
      });
      if (error) throw error;
      // edge function returns { url }
      const url = (data as any)?.url;
      if (url) window.open(url, "_blank");
      else toast({ title: "Statement generated", description: "Saved to documents." });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setStmtBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/students")}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Students
        <span className="text-muted-foreground/60 mx-1">›</span>
        <span className="text-foreground font-medium">{fullName}</span>
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar className="h-24 w-24 rounded-2xl shrink-0">
              {student.photo_url && <AvatarImage src={student.photo_url} alt={fullName} className="object-cover" />}
              <AvatarFallback className="rounded-2xl bg-accent-soft text-accent text-2xl font-semibold tracking-tight">
                {initials || "—"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight truncate">{fullName}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <StatusDot tone={statusTone} />
                <span className="capitalize text-foreground/80">{statusKey || "unknown"}</span>
                {student.admission_number && (<><Sep />#{student.admission_number}</>)}
                {classRow?.name && (<><Sep />{classRow.name}</>)}
                {student.stream && (<><Sep />Stream {student.stream}</>)}
                {age != null && (<><Sep />{age} yrs</>)}
                {student.gender && (<><Sep /><span className="capitalize">{student.gender}</span></>)}
                {student.learner_category && (<><Sep /><span className="capitalize">{student.learner_category.replace(/_/g, " ")}</span></>)}
                {balance > 0 && (
                  <>
                    <Sep />
                    <span className="inline-flex items-center gap-1 text-danger">
                      <StatusDot tone="danger" />
                      Balance <Money amount={balance} />
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canEditStudent && (
                <Button size="sm" className="gap-1.5" onClick={() => navigate(`/students/${student.id}/edit`)}>
                  <Edit className="h-3.5 w-3.5" /> Edit profile
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <MoreHorizontal className="h-3.5 w-3.5" /> More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem><MessageSquare className="h-3.5 w-3.5 mr-2" /> Message guardians</DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadStatement}><Printer className="h-3.5 w-3.5 mr-2" /> Print statement</DropdownMenuItem>
                  <DropdownMenuItem><KeyRound className="h-3.5 w-3.5 mr-2" /> Reset portal access</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><ArrowRightLeft className="h-3.5 w-3.5 mr-2" /> Transfer class</DropdownMenuItem>
                  <DropdownMenuItem className="text-danger focus:text-danger"><UserMinus className="h-3.5 w-3.5 mr-2" /> Withdraw student</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 6-stat strip */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px rounded-xl bg-border/60 overflow-hidden border">
            <HeaderStat label="Balance" value={<Money amount={balance} />} tone={balance > 0 ? "danger" : "success"} />
              <HeaderStat label="Attendance" value={attRate != null ? `${attRate}%` : "—"} hint="this term" />
              <HeaderStat label="Avg score" value={avgScore != null ? `${avgScore}%` : "—"} hint="last exam" />
            <HeaderStat label="Discipline" value="—" hint="merits / incidents" />
            <HeaderStat label="Guardians" value={String(guardians.length)} />
            <HeaderStat label="Documents" value={String(docs.length)} />
          </div>

          {lastUpdatedAt && (
            <p className="mt-4 text-[11px] text-muted-foreground">
              Last updated <DateTime value={lastUpdatedAt} mode="datetime" />
            </p>
          )}
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0 overflow-x-auto">
              {[
                { v: "overview", label: "Overview" },
                { v: "academics", label: "Academics" },
                { v: "attendance", label: "Attendance" },
                { v: "fees", label: "Fees" },
                ...(canViewMedical ? [{ v: "health", label: "Health" }] : []),
                ...(canViewDiscipline ? [{ v: "discipline", label: "Discipline" }] : []),
                { v: "documents", label: "Documents" },
                { v: "activity", label: "Activity" },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="relative h-10 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <InlineEditCard
                title="Identity" icon={<Shield className="h-4 w-4" />}
                rowId={student.id} table="students" values={student}
                cardKey="identity" editingKey={editingKey} setEditingKey={setEditingKey}
                canEdit={canEditStudent} onSaved={onStudentSaved}
                fields={[
                  { key: "preferred_name", label: "Preferred name" },
                  { key: "date_of_birth", label: "Date of birth", type: "date" },
                  { key: "nationality", label: "Nationality" },
                  { key: "religion", label: "Religion" },
                  { key: "house", label: "House" },
                ]}
              />
              <InlineEditCard
                title={`Government IDs${tenant?.country_code ? ` (${tenant.country_code})` : ""}`}
                icon={<FileText className="h-4 w-4" />}
                rowId={student.id} table="students" values={student}
                cardKey="govids" editingKey={editingKey} setEditingKey={setEditingKey}
                canEdit={canEditStudent} onSaved={onStudentSaved}
                fields={govFields.map(f => ({ key: f.key, label: f.label, placeholder: f.placeholder }))}
              />
              <Card className="p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><GraduationCap className="h-4 w-4" /> Academic snapshot</h3>
                <div className="space-y-2.5 text-sm">
                  <Row label="Class" value={classRow?.name} />
                  <Row label="Stream" value={student.stream} />
                  <Row label="Admission no." value={student.admission_number} />
                  <Row label="Admitted" value={student.admission_date} />
                  <Row label="Expected graduation" value={student.expected_graduation_year} />
                </div>
              </Card>
              <InlineEditCard
                title="Contact" icon={<MapPin className="h-4 w-4" />}
                rowId={student.id} table="students" values={student}
                cardKey="contact" editingKey={editingKey} setEditingKey={setEditingKey}
                canEdit={canEditStudent} onSaved={onStudentSaved}
                fields={[
                  { key: "residential_address", label: "Address", type: "textarea" },
                  { key: "city", label: "City" },
                  { key: "postal_code", label: "Postal code" },
                  { key: "emergency_contact_name", label: "Emergency contact" },
                  { key: "emergency_contact_phone", label: "Emergency phone" },
                  { key: "emergency_contact_relation", label: "Relation" },
                ]}
              />
            </TabsContent>

            <TabsContent value="academics" className="space-y-4 mt-4">
              <Card className="p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><GraduationCap className="h-4 w-4" /> Class history</h3>
                <div className="space-y-2 text-sm">
                  {classRow ? (
                    <div className="flex items-center justify-between border-l-2 border-accent pl-3">
                      <div>
                        <p className="font-medium">{classRow.name}{student.stream ? ` — ${student.stream}` : ""}</p>
                        <p className="text-xs text-muted-foreground">Current · since {student.admission_date || "—"}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Active</Badge>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">Not enrolled in a class.</p>}
                  {student.previous_school && (
                    <div className="text-xs text-muted-foreground border-l-2 border-border pl-3">
                      Previously at <span className="text-foreground">{student.previous_school}</span>
                      {student.admission_grade ? ` · admitted at ${student.admission_grade}` : ""}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4" /> Subjects</h3>
                {classSubjects.length === 0 ? <p className="text-sm text-muted-foreground">No subjects assigned to current class.</p> :
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {classSubjects.map((cs: any, i: number) => (
                      <div key={i} className="rounded-lg border bg-card px-3 py-2">
                        <p className="text-sm font-medium truncate">{cs.subjects?.name || cs.subjects?.code}</p>
                        <p className="text-[11px] text-muted-foreground">{cs.periods_per_week ?? 0} periods/wk</p>
                      </div>
                    ))}
                  </div>
                }
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Award className="h-4 w-4" /> Exam performance</h3>
                  {avgScore != null && <span className="text-xs text-muted-foreground">Latest avg <span className="text-foreground font-semibold tabular-nums">{avgScore}%</span></span>}
                </div>
                {examTrend.length > 1 && (
                  <div className="h-32 -mx-2 mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={examTrend}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 100]} />
                        <RTooltip cursor={{ stroke: "hsl(var(--border))" }} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }} />
                        <Line type="monotone" dataKey="avg" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {examRows.length === 0 ? <p className="text-sm text-muted-foreground">No exam results recorded yet.</p> :
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-xs text-muted-foreground border-b">
                        <th className="py-2">Exam</th><th>Subject</th><th className="text-right">Marks</th><th className="text-right">Grade</th><th className="text-right">Pos</th>
                      </tr></thead>
                      <tbody>
                        {examRows.slice(0, 12).map((r: any, i: number) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 truncate">{r.exams?.name}</td>
                            <td className="text-muted-foreground">{r.subjects?.name || r.subjects?.code}</td>
                            <td className="text-right tabular-nums">{r.raw_marks}/{r.max_marks}</td>
                            <td className="text-right font-medium">{r.grade || "—"}</td>
                            <td className="text-right text-muted-foreground">{r.position_in_class || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                }
              </Card>

              {isCBC && (
                <Card className="p-5">
                  <h3 className="text-sm font-semibold mb-2">CBC competencies & values</h3>
                  <p className="text-sm text-muted-foreground">Competency assessments will appear here as teachers record them.</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="attendance" className="mt-4 space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4" /> This term</h3>
                  <span className="text-xs text-muted-foreground">{totalAtt} sessions</span>
                </div>
                {totalAtt === 0 ? <p className="text-sm text-muted-foreground">No attendance records yet.</p> : (
                  <>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-3xl font-semibold tabular-nums">{attRate}%</span>
                      <span className="text-xs text-muted-foreground">attendance rate</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                      <div className="bg-success" style={{ width: `${(present / totalAtt) * 100}%` }} />
                      <div className="bg-warning" style={{ width: `${(late / totalAtt) * 100}%` }} />
                      <div className="bg-info" style={{ width: `${(excused / totalAtt) * 100}%` }} />
                      <div className="bg-danger" style={{ width: `${(absent / totalAtt) * 100}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-3 text-xs">
                      <Stat label="Present" value={present} dot="bg-success" />
                      <Stat label="Late" value={late} dot="bg-warning" />
                      <Stat label="Excused" value={excused} dot="bg-info" />
                      <Stat label="Absent" value={absent} dot="bg-danger" />
                    </div>
                  </>
                )}
              </Card>
              <Card className="p-5">
                <h4 className="text-sm font-semibold mb-3">Recent absences & late marks</h4>
                {recentAbsences.length === 0 ? <p className="text-sm text-muted-foreground">Clean record — no recent absences.</p> :
                  <div className="space-y-2">
                    {recentAbsences.map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                        <span>{new Date(a.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                        <Badge variant={a.status === "absent" ? "destructive" : "outline"} className="text-[10px] capitalize">{a.status}</Badge>
                      </div>
                    ))}
                  </div>
                }
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="mt-4 space-y-3">
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Fee account</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Billed <Money amount={totalBilled} /> · Paid <Money amount={totalPaid} />
                      <span className="mx-1">·</span>
                      YTD <Money amount={ytdPaid} /> / <Money amount={ytdBilled} />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Outstanding balance</p>
                    <p className={`text-2xl font-semibold tabular-nums ${balance > 0 ? "text-danger" : balance < 0 ? "text-info" : "text-success"}`}><Money amount={balance} /></p>
                    {balance < 0 && <p className="text-[10px] text-info">Credit on account</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => openPay()} disabled={balance <= 0} className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Smartphone className="h-3.5 w-3.5" /> Pay via M-Pesa
                  </Button>
                  <Button size="sm" variant="outline" onClick={sendReminder} disabled={balance <= 0} className="gap-1.5">
                    <Bell className="h-3.5 w-3.5" /> Send reminder
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadStatement} disabled={stmtBusy} className="gap-1.5">
                    {stmtBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Statement
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <h4 className="text-sm font-semibold mb-3">Invoices</h4>
                {invoices.length === 0 ? <p className="text-sm text-muted-foreground">No invoices yet.</p> : (
                  <div className="space-y-2">
                    {invoices.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between gap-3 text-sm py-2 border-b last:border-0">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{inv.invoice_number || "Invoice"}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.terms?.name || ""} {inv.academic_years?.name || ""}
                            {inv.due_date && ` · due ${inv.due_date}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-medium"><Money amount={Number(inv.total)} /></p>
                          <p className="text-xs">Bal <Money amount={Number(inv.balance)} /></p>
                          <Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "outline"} className="text-[10px] capitalize mt-0.5">{inv.status}</Badge>
                        </div>
                        {Number(inv.balance) > 0 && inv.status !== "void" && (
                          <Button size="sm" variant="ghost" className="shrink-0" onClick={() => openPay(inv.id, Number(inv.balance))}>Pay</Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h4 className="text-sm font-semibold mb-3">Recent payments</h4>
                {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments recorded.</p> : (
                  <div className="space-y-2">
                    {payments.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium capitalize">{p.method?.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleString()} {p.reference ? `· ${p.reference}` : ""}</p>
                        </div>
                        <p className="font-semibold text-emerald-600"><Money amount={Number(p.amount)} /></p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Dialog open={stkOpen} onOpenChange={setStkOpen}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Request M-Pesa payment</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Phone (2547XXXXXXXX)</label>
                      <Input value={stkForm.phone} onChange={(e) => setStkForm({ ...stkForm, phone: e.target.value })} placeholder="2547XXXXXXXX" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Amount</label>
                      <Input type="number" value={stkForm.amount} onChange={(e) => setStkForm({ ...stkForm, amount: e.target.value })} />
                    </div>
                    {outstandingInvoices.length > 0 && (
                      <div>
                        <label className="text-xs text-muted-foreground">Apply to invoice (optional)</label>
                        <select className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                          value={stkForm.invoice_id}
                          onChange={(e) => setStkForm({ ...stkForm, invoice_id: e.target.value })}>
                          <option value="">Auto-allocate to oldest</option>
                          {outstandingInvoices.map((i: any) => (
                            <option key={i.id} value={i.id}>{i.invoice_number} — bal {Number(i.balance).toFixed(2)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setStkOpen(false)}>Cancel</Button>
                    <Button onClick={requestStk} disabled={stkBusy} className="gap-1.5">
                      {stkBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Send STK push
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {canViewMedical && (
              <TabsContent value="health" className="mt-4 space-y-3">
                <Card className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Heart className="h-4 w-4" /> Medical</h3>
                  <Row label="Blood group" value={student.blood_group !== "unknown" ? student.blood_group : null} />
                  <Row label="Allergies" value={student.allergies} />
                  <Row label="Chronic conditions" value={student.chronic_conditions} />
                  <Row label="Medications" value={student.medications} />
                  <Row label="Doctor" value={student.doctor_name && `${student.doctor_name} — ${student.doctor_phone || ""}`} />
                  <Row label="Insurance" value={student.insurance_provider} />
                  <Row label="NHIF/SHIF" value={student.nhif_or_shif_number} />
                </Card>
                {student.has_special_needs && (
                  <Card className="p-5 space-y-3 border-warning/30">
                    <h3 className="text-sm font-semibold">Special needs</h3>
                    <p className="text-sm">{student.special_needs_details}</p>
                    <Row label="IEP on file" value={student.iep_on_file ? "Yes" : "No"} />
                    <Row label="Accommodations" value={student.accommodations} />
                  </Card>
                )}
              </TabsContent>
            )}

            {canViewDiscipline && (
              <TabsContent value="discipline" className="mt-4">
                <Card className="p-5">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Discipline</h3>
                  <p className="mt-2 text-sm text-muted-foreground">No incidents or merits recorded yet.</p>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="documents" className="mt-4">
              <Card className="p-5">
                {docs.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded.</p> :
                  <div className="space-y-2">
                    {docs.map(d => (
                      <div key={d.id} className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{d.file_name}</span>
                        <Badge variant="outline" className="text-[10px]">{d.doc_type}</Badge>
                      </div>
                    ))}
                  </div>
                }
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card className="p-5">
                {activity.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> :
                  <div className="space-y-3">
                    {activity.map(a => (
                      <div key={a.id} className="flex gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{a.title}</p>
                          {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                          <p className="text-[10px] text-muted-foreground mt-0.5"><DateTime value={a.occurred_at} mode="datetime" /></p>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3">Guardians</h3>
            {guardians.length === 0 ? <p className="text-xs text-muted-foreground">No guardians linked.</p> :
              <div className="space-y-3">
                {guardians.map((sg: any) => (
                  <div key={sg.id} className="text-sm border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{sg.guardians?.full_name}</p>
                      {sg.is_primary_contact && <Badge className="text-[10px]">Primary</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{sg.relationship}</p>
                    {sg.guardians?.phone_primary && <p className="text-xs flex items-center gap-1 mt-1"><Phone className="h-3 w-3" /> {sg.guardians.phone_primary}</p>}
                    {sg.guardians?.email && <p className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> {sg.guardians.email}</p>}
                  </div>
                ))}
              </div>
            }
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3">Key dates</h3>
            <div className="space-y-2 text-sm">
              <Row label="Admitted" value={student.admission_date} />
              <Row label="DOB" value={student.date_of_birth} />
              <Row label="Last checkup" value={student.last_medical_checkup} />
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right truncate">{value}</span>
    </div>
  );
}

function Sep() {
  return <span className="text-muted-foreground/40">·</span>;
}

function StatusDot({ tone }: { tone: "success" | "warning" | "danger" | "muted" }) {
  const cls =
    tone === "success" ? "bg-success" :
    tone === "danger" ? "bg-danger" :
    tone === "warning" ? "bg-warning" :
    "bg-muted-foreground/50";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />;
}

function HeaderStat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "success" | "danger" }) {
  const valueCls =
    tone === "danger" ? "text-danger" :
    tone === "success" ? "text-foreground" :
    "text-foreground";
  return (
    <div className="bg-card px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${valueCls}`}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function Stat({ label, value, dot }: { label: string; value: React.ReactNode; dot?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {dot && <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <p className="mt-0.5 font-semibold tabular-nums text-sm">{value}</p>
    </div>
  );
}