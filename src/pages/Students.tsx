import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Eye, MoreHorizontal, Pencil, Plus, Search, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { EmptyState } from "@/components/EmptyState";
import { Money } from "@/components/Money";
import { StudentAvatar, StudentStatusChip } from "@/components/sis/StudentStatusChip";
import { STATUS_FILTERS, ageFrom } from "@/lib/sis/people";

function MultiFilter({ label, options, value, onChange }: { label: string; options: { id: string; name: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="outline" size="sm">{label}{value.length ? ` (${value.length})` : ""}<ChevronDown className="h-3.5 w-3.5 ml-1" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 overflow-y-auto">
        {options.map((o) => <DropdownMenuCheckboxItem key={o.id} checked={value.includes(o.id)} onSelect={(e) => e.preventDefault()}
          onCheckedChange={(c) => onChange(c ? [...value, o.id] : value.filter((x) => x !== o.id))}>{o.name}</DropdownMenuCheckboxItem>)}
        {!options.length && <p className="text-xs text-muted-foreground p-2">None</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Students() {
  const { tenant, can } = useTenant();
  const tid = tenant?.id;
  const navigate = useNavigate();
  const [grades, setGrades] = useState<string[]>([]);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [status, setStatus] = useState("active");
  const [q, setQ] = useState("");

  const lookups = useQuery({
    queryKey: [tid, "students", "lookups"], enabled: !!tid,
    queryFn: async () => {
      const [g, c] = await Promise.all([
        supabase.from("grade_levels").select("id,name").eq("tenant_id", tid).order("sort_order"),
        supabase.from("classes").select("id,name,grade_level_id").eq("tenant_id", tid).order("name"),
      ]);
      return { grades: g.data ?? [], classes: c.data ?? [] };
    },
  });
  const students = useQuery({
    queryKey: [tid, "students", "list", status], enabled: !!tid,
    queryFn: async () => {
      let query = supabase.from("students")
        .select("id,first_name,last_name,admission_number,date_of_birth,gender,photo_url,enrollment_status,current_class_id,student_enrollments(status,class_id),student_guardians(is_primary_contact,guardians!student_guardians_guardian_id_fkey(full_name,phone_primary))")
        .eq("tenant_id", tid).order("first_name").limit(1000);
      if (status !== "all") query = query.eq("enrollment_status", status);
      const [{ data, error }, inv] = await Promise.all([query, supabase.from("invoices").select("student_id,balance,status").eq("tenant_id", tid).not("status", "in", "(draft,cancelled,void,written_off)")]);
      if (error) throw error;
      const bal = new Map<string, number>();
      (inv.data ?? []).forEach((i: any) => bal.set(i.student_id, (bal.get(i.student_id) ?? 0) + Number(i.balance || 0)));
      return (data ?? []).map((s: any) => {
        const classId = s.student_enrollments?.find((e: any) => e.status === "active")?.class_id ?? s.current_class_id;
        const g = s.student_guardians?.find((x: any) => x.is_primary_contact) ?? s.student_guardians?.[0];
        return { ...s, classId, guardian: g?.guardians ?? null, balance: bal.get(s.id) ?? 0 };
      });
    },
  });

  const classById = useMemo(() => new Map((lookups.data?.classes ?? []).map((c: any) => [c.id, c])), [lookups.data]);
  const classOptions = (lookups.data?.classes ?? []).filter((c: any) => !grades.length || grades.includes(c.grade_level_id));
  const rows = (students.data ?? []).filter((s: any) => {
    const cls: any = classById.get(s.classId);
    if (grades.length && !grades.includes(cls?.grade_level_id)) return false;
    if (classIds.length && !classIds.includes(s.classId)) return false;
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return [`${s.first_name} ${s.last_name}`, s.admission_number, s.guardian?.full_name, s.guardian?.phone_primary].some((v) => (v ?? "").toLowerCase().includes(t));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div><h1 className="text-2xl font-bold">Students</h1><p className="text-sm text-muted-foreground mt-1">{rows.length} shown</p></div>
        <div className="flex gap-2">
          {can("students.create") && <Button variant="outline" size="sm" asChild><Link to="/students/import"><Upload className="h-4 w-4 mr-1" />Import</Link></Button>}
          {can("students.create") && <Button size="sm" asChild><Link to="/admissions/new"><Plus className="h-4 w-4 mr-1" />New admission</Link></Button>}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative w-72"><Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" /><Input className="pl-8 h-9" placeholder="Name, admission #, guardian" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <MultiFilter label="Grade" options={lookups.data?.grades ?? []} value={grades} onChange={(v) => { setGrades(v); setClassIds([]); }} />
        <MultiFilter label="Class" options={classOptions} value={classIds} onChange={setClassIds} />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger><SelectContent>{STATUS_FILTERS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select>
      </div>
      <Card>
        {students.isLoading ? <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          : !rows.length ? <EmptyState icon={<Users className="h-5 w-5" />} title="No students yet — start with a new admission" actionLabel={can("students.create") ? "New admission" : undefined} onAction={() => navigate("/admissions/new")} className="py-14" />
          : (
          <Table>
            <TableHeader><TableRow><TableHead /><TableHead>Name</TableHead><TableHead>Admission #</TableHead><TableHead>Class</TableHead><TableHead>Age</TableHead><TableHead>Gender</TableHead><TableHead>Primary guardian</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {rows.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell><StudentAvatar first={s.first_name} last={s.last_name} url={s.photo_url} /></TableCell>
                  <TableCell><Link to={`/academics/students/${s.id}`} className="font-medium hover:text-primary">{s.first_name} {s.last_name}</Link></TableCell>
                  <TableCell className="font-mono text-xs">{s.admission_number}</TableCell>
                  <TableCell>{(classById.get(s.classId) as any)?.name ?? "—"}</TableCell>
                  <TableCell>{ageFrom(s.date_of_birth) ?? "—"}</TableCell>
                  <TableCell><span className="text-xs rounded-full border px-2 py-0.5 capitalize">{s.gender ?? "—"}</span></TableCell>
                  <TableCell className="text-xs">{s.guardian ? <><p>{s.guardian.full_name}</p><p className="text-muted-foreground">{s.guardian.phone_primary}</p></> : "—"}</TableCell>
                  <TableCell className={`text-right ${s.balance > 0 ? "text-destructive font-medium" : ""}`}><Money amount={s.balance} /></TableCell>
                  <TableCell><StudentStatusChip status={s.enrollment_status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/academics/students/${s.id}`)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                        {can("students.edit") && <DropdownMenuItem onClick={() => navigate(`/students/${s.id}/edit`)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
