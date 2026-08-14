import { useEffect, useState } from "react";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  CommentTarget, LANGUAGES, LENGTHS, TONES, fetchDefaultTone, generateComment,
  localeLanguage, saveComment,
} from "./CommentGeneratorDrawer";
import { useCommentQuota } from "./useCommentQuota";

type Row = {
  target: CommentTarget;
  goingWell: string;
  needsWork: string;
  comment: string;
  state: "idle" | "running" | "ready" | "saved" | "error";
  error?: string;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string;
  examId: string;
  locale?: string | null;
  /** All student × subject targets available on the exam. */
  targets: CommentTarget[];
  subjects: { id: string; name: string }[];
  onSaved?: () => void;
}

export function BulkCommentDialog({ open, onOpenChange, tenantId, examId, locale, targets, subjects, onSaved }: Props) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [tone, setTone] = useState("Encouraging");
  const [length, setLength] = useState("Medium");
  const [language, setLanguage] = useState(localeLanguage(locale));
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const quota = useCommentQuota(tenantId);

  useEffect(() => {
    if (!open) return;
    setSubjectId(subjects[0]?.id ?? "");
    setRows([]); setProgress(0);
    setLanguage(localeLanguage(locale));
    fetchDefaultTone(tenantId).then(setTone);
    quota.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !subjectId) return;
    setRows(targets.filter((t) => t.subjectId === subjectId).map((t) => ({
      target: t, goingWell: "", needsWork: "", comment: "", state: "idle" as const,
    })));
  }, [open, subjectId, targets]);

  const patch = (i: number, p: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...p } : row)));

  const runAll = async () => {
    if (quota.blocked) {
      toast({ title: "AI quota reached", description: "Upgrade your plan to generate more comments.", variant: "destructive" });
      return;
    }
    setRunning(true); setProgress(0);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.state === "saved") { setProgress(Math.round(((i + 1) / rows.length) * 100)); continue; }
      patch(i, { state: "running", error: undefined });
      const res = await generateComment({
        target: row.target, goingWell: row.goingWell, needsWork: row.needsWork, tone, length, language,
      });
      if (res.error) patch(i, { state: "error", error: res.error });
      else patch(i, { state: "ready", comment: res.comment ?? "" });
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }
    setRunning(false);
    quota.refresh();
  };

  const approve = async (i: number) => {
    const row = rows[i];
    if (!row.comment.trim()) return;
    const { error } = await saveComment(examId, tenantId, row.target, row.comment.trim());
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    patch(i, { state: "saved" });
    onSaved?.();
  };

  const approveAll = async () => {
    for (let i = 0; i < rows.length; i++) if (rows[i].state === "ready") await approve(i);
    toast({ title: "Comments saved" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Generate all comments</DialogTitle>
          <DialogDescription>
            Comments are drafted in the background — you approve each one before it is saved to the report card.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Length</Label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{LENGTHS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={runAll} disabled={running || rows.length === 0 || quota.blocked}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Draft {rows.length} comments
          </Button>
          <Button variant="outline" onClick={approveAll} disabled={running || !rows.some((r) => r.state === "ready")}>
            <Check className="h-4 w-4 mr-2" /> Approve all drafted
          </Button>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {quota.used} / {quota.limit ?? "∞"} AI comments used this month
          </span>
        </div>
        {running && <Progress value={progress} className="h-1" />}

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
            <Sparkles className="h-5 w-5 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No students for this subject yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={row.target.studentId} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{row.target.studentName}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.target.grade ?? (row.target.score != null ? row.target.score : "not marked")}
                  </span>
                  {row.state === "saved" && <Check className="h-4 w-4 text-primary ml-auto" />}
                  {row.state === "running" && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
                  {row.state === "error" && <X className="h-4 w-4 text-destructive ml-auto" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input className="h-8 text-xs" placeholder="Going well (optional)" value={row.goingWell}
                    onChange={(e) => patch(i, { goingWell: e.target.value })} disabled={running} />
                  <Input className="h-8 text-xs" placeholder="Needs work (optional)" value={row.needsWork}
                    onChange={(e) => patch(i, { needsWork: e.target.value })} disabled={running} />
                </div>
                {row.error && <p className="text-xs text-destructive">{row.error}</p>}
                {row.comment && (
                  <div className="space-y-2">
                    <Textarea rows={3} value={row.comment} onChange={(e) => patch(i, { comment: e.target.value, state: "ready" })} />
                    <Button size="sm" variant={row.state === "saved" ? "outline" : "default"} onClick={() => approve(i)}>
                      <Check className="h-3.5 w-3.5 mr-1" /> {row.state === "saved" ? "Saved" : "Approve & save"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}