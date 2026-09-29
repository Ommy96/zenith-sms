import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; classId: string; className: string; academicYearId?: string | null; onDone: () => void }

/** Enroll a student who has no active enrollment. Students already enrolled elsewhere must be transferred from their profile. */
export function EnrollStudentDialog({ open, onOpenChange, classId, className, academicYearId, onDone }: Props) {
  const { tenant } = useTenant();
  const tid = tenant?.id;
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const list = useQuery({
    queryKey: [tid, "students", "enroll-search", q],
    enabled: open && !!tid,
    queryFn: async () => {
      let query = supabase.from("students").select("id,first_name,last_name,admission_number,student_enrollments(status,class_id,classes(name))")
        .eq("tenant_id", tid).eq("enrollment_status", "active").order("first_name").limit(30);
      const t = q.trim().replace(/[,()]/g, "");
      if (t) query = query.or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%,admission_number.ilike.%${t}%`);
      const { data, error } = await query; if (error) throw error; return data ?? [];
    },
  });
  const enroll = async (s: any, activeElsewhere: any) => {
    if (activeElsewhere) return toast.error(`${s.first_name} is already enrolled in ${activeElsewhere.classes?.name}. Use "Transfer class" on their profile.`);
    let yearId = academicYearId;
    if (!yearId) { const { data } = await supabase.rpc("current_academic_year", { p_tenant_id: tid }); yearId = data; }
    if (!yearId) return toast.error("This class has no academic year.");
    setBusy(s.id);
    const { error } = await supabase.rpc("enroll_student", { p_student_id: s.id, p_class_id: classId, p_year_id: yearId });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Enrolled ${s.first_name} ${s.last_name} in ${className}.`);
    if (tid) void supabase.rpc("recompute_setup_progress", { p_tenant_id: tid });
    onDone();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Enroll a student in {className}</DialogTitle></DialogHeader>
        <Input placeholder="Search name or admission number" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-80 overflow-y-auto divide-y">
          {(list.data ?? []).filter((s: any) => !s.student_enrollments?.some((e: any) => e.status === "active" && e.class_id === classId)).map((s: any) => {
            const other = s.student_enrollments?.find((e: any) => e.status === "active");
            return (
              <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                <div><p className="font-medium">{s.first_name} {s.last_name}</p><p className="text-xs text-muted-foreground font-mono">{s.admission_number}{other ? ` · in ${other.classes?.name}` : ""}</p></div>
                <Button size="sm" variant={other ? "ghost" : "outline"} disabled={busy === s.id} onClick={() => enroll(s, other)}>{other ? "Already enrolled" : "Enroll"}</Button>
              </div>
            );
          })}
          {!list.isLoading && !list.data?.length && <p className="text-sm text-muted-foreground py-6 text-center">No matching students.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
