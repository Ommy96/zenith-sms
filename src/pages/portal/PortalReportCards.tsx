import { useState } from "react";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadDocument } from "@/lib/downloadDocument";
import { usePortalData, must } from "@/lib/portal/usePortalData";
import { ListSkeleton, PageTitle, PortalEmpty, PortalError, StaleNote } from "@/components/portal/PortalStates";

export default function PortalReportCards() {
  const { activeChild } = usePortal();
  const [open, setOpen] = useState<any | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, loading, error, cachedAt, retry } = usePortalData(
    activeChild ? `rc:${activeChild.id}` : null,
    async () => must<any[]>(await supabase.from("report_cards")
      .select("id, exam_id, overall_mean, overall_grade, overall_position, class_size, class_teacher_comment, head_teacher_comment, published_at, exams:exam_id(name, terms:term_id(name))")
      .eq("student_id", activeChild!.id).not("published_at", "is", null).order("published_at", { ascending: false })),
  );

  const { data: subjects, loading: subLoading } = usePortalData(
    open ? `rcs:${open.id}` : null,
    async () => must<any[]>(await supabase.from("student_exam_results")
      .select("id, raw_marks, max_marks, grade_letter, performance_level, teacher_comment, exam_subjects:exam_subject_id(subjects:subject_id(name))")
      .eq("student_id", activeChild!.id).eq("exam_id", open.exam_id)),
  );

  const dl = async (id: string) => {
    setBusy(id);
    try { await downloadDocument("report_card", id, "Report-card.pdf"); }
    catch (e) { toast.error((e as Error).message || "Download failed. Please try again."); }
    setBusy(null);
  };

  if (!activeChild) return null;
  return (
    <div className="space-y-4">
      <PageTitle sub={activeChild.full_name}>Report cards</PageTitle>
      <StaleNote at={cachedAt} onRetry={retry} />
      {loading && !data ? <ListSkeleton /> : error && !data ? <PortalError onRetry={retry} /> : !data?.length ? (
        <PortalEmpty icon={FileText} title="No report cards published yet"
          text="You'll see your child's report here after each term's results are released." />
      ) : data.map((rc) => (
        <Card key={rc.id} className="hover:border-primary transition"><CardContent className="flex items-center gap-3 p-4">
          <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(rc)}>
            <p className="text-base font-semibold">{rc.exams?.terms?.name || rc.exams?.name || "Report card"}</p>
            <p className="text-sm text-muted-foreground">
              Mean {rc.overall_mean ?? "—"} · Grade {rc.overall_grade ?? "—"}
              {rc.overall_position ? ` · Position ${rc.overall_position}${rc.class_size ? `/${rc.class_size}` : ""}` : ""}
            </p>
          </button>
          <Button variant="outline" className="min-h-11" disabled={busy === rc.id} onClick={() => dl(rc.id)} aria-label="Download report card">
            {busy === rc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>
        </CardContent></Card>
      ))}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          {open && (<>
            <SheetHeader><SheetTitle>{open.exams?.name || "Report card"}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-3 text-base">
              {subLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
                <div className="divide-y rounded-lg border">
                  {(subjects ?? []).map((s) => (
                    <div key={s.id} className="p-3">
                      <div className="flex justify-between"><span className="font-medium">{s.exam_subjects?.subjects?.name ?? "Subject"}</span>
                        <span>{s.raw_marks ?? "—"}/{s.max_marks ?? "—"} {s.grade_letter || s.performance_level || ""}</span></div>
                      {s.teacher_comment && <p className="text-sm text-muted-foreground">{s.teacher_comment}</p>}
                    </div>
                  ))}
                </div>
              )}
              {open.class_teacher_comment && <p><b>Class teacher:</b> {open.class_teacher_comment}</p>}
              {open.head_teacher_comment && <p><b>Head teacher:</b> {open.head_teacher_comment}</p>}
              <Button className="min-h-12 w-full text-base" disabled={busy === open.id} onClick={() => dl(open.id)}>
                <Download className="mr-2 h-4 w-4" /> Download full PDF
              </Button>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
