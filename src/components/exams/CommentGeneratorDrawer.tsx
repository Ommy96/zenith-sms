import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, RotateCcw, Check } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCommentQuota } from "./useCommentQuota";

export const TONES = ["Encouraging", "Formal", "Direct", "Warm"] as const;
export const LENGTHS = ["Short", "Medium", "Long"] as const;
export const LANGUAGES: { value: string; label: string }[] = [
  { value: "English", label: "English" },
  { value: "Kiswahili", label: "Kiswahili" },
  { value: "French", label: "Français" },
  { value: "Amharic", label: "አማርኛ" },
];

const LOCALE_TO_LANGUAGE: Record<string, string> = {
  en: "English", sw: "Kiswahili", fr: "French", am: "Amharic",
};

export function localeLanguage(locale?: string | null) {
  return LOCALE_TO_LANGUAGE[(locale ?? "en").slice(0, 2)] ?? "English";
}

/** Reads the tenant's default comment tone from tenant_settings. */
export async function fetchDefaultTone(tenantId: string): Promise<string> {
  const { data } = await supabase
    .from("tenant_settings").select("value")
    .eq("tenant_id", tenantId).eq("key", "default_comment_tone").maybeSingle();
  const v: any = (data as any)?.value;
  const tone = typeof v === "string" ? v : v?.value;
  return TONES.includes(tone) ? tone : "Encouraging";
}

export interface CommentTarget {
  studentId: string;
  studentName: string;
  className?: string | null;
  gradeLevel?: string | null;
  subjectId: string;
  subjectName: string;
  grade?: string | null;
  score?: number | null;
}

export interface GenerateArgs {
  target: CommentTarget;
  goingWell: string;
  needsWork: string;
  tone: string;
  length: string;
  language: string;
}

/** Single call to the generate-report-comment edge function. */
export async function generateComment(a: GenerateArgs): Promise<{ comment?: string; error?: string; used?: number; limit?: number | null }> {
  const { data, error } = await supabase.functions.invoke("generate-report-comment", {
    body: {
      student_id: a.target.studentId,
      subject_id: a.target.subjectId,
      studentName: a.target.studentName,
      gradeLevel: a.target.gradeLevel ?? a.target.className ?? "",
      subject: a.target.subjectName,
      grade: a.target.grade ?? null,
      score: a.target.score ?? null,
      strengths: a.goingWell,
      improvements: a.needsWork,
      style: a.tone,
      length: a.length,
      language: a.language,
    },
  });
  const err = (data as any)?.error || error?.message;
  if (err) return { error: err };
  return { comment: (data as any)?.comment, used: (data as any)?.used, limit: (data as any)?.limit };
}

export async function saveComment(examId: string, tenantId: string, target: CommentTarget, comment: string) {
  return supabase.from("student_exam_results").upsert({
    tenant_id: tenantId, exam_id: examId,
    student_id: target.studentId, subject_id: target.subjectId,
    teacher_comment: comment,
  }, { onConflict: "exam_id,student_id,subject_id" });
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string;
  examId: string;
  locale?: string | null;
  targets: CommentTarget[];              // one per subject for the selected student
  initialSubjectId?: string;
  canEdit: boolean;
  onSaved?: () => void;
}

export function CommentGeneratorDrawer({
  open, onOpenChange, tenantId, examId, locale, targets, initialSubjectId, canEdit, onSaved,
}: Props) {
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? targets[0]?.subjectId ?? "");
  const [goingWell, setGoingWell] = useState("");
  const [needsWork, setNeedsWork] = useState("");
  const [tone, setTone] = useState("Encouraging");
  const [length, setLength] = useState("Medium");
  const [language, setLanguage] = useState(localeLanguage(locale));
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const quota = useCommentQuota(tenantId);

  const target = useMemo(() => targets.find((t) => t.subjectId === subjectId) ?? targets[0], [targets, subjectId]);

  useEffect(() => {
    if (!open) return;
    setSubjectId(initialSubjectId ?? targets[0]?.subjectId ?? "");
    setComment(""); setGoingWell(""); setNeedsWork("");
    setLanguage(localeLanguage(locale));
    fetchDefaultTone(tenantId).then(setTone);
    quota.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSubjectId]);

  const run = async () => {
    if (!target) return;
    if (quota.blocked) {
      toast({ title: "AI quota reached", description: "Upgrade your plan to generate more comments this month.", variant: "destructive" });
      return;
    }
    setBusy(true);
    const res = await generateComment({ target, goingWell, needsWork, tone, length, language });
    setBusy(false);
    if (res.error) return toast({ title: "Generation failed", description: res.error, variant: "destructive" });
    setComment(res.comment ?? "");
    quota.refresh();
  };

  const insert = async () => {
    if (!target || !comment.trim()) return;
    setSaving(true);
    const { error } = await saveComment(examId, tenantId, target, comment.trim());
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Comment saved to report card" });
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI report comment
          </SheetTitle>
          <SheetDescription>
            {target ? `${target.studentName} · ${target.className ?? target.gradeLevel ?? "—"}` : "Select a subject"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {targets.map((t) => <SelectItem key={t.subjectId} value={t.subjectId}>{t.subjectName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Current result</span>
              <Badge variant="secondary">
                {target?.grade ?? (target?.score != null ? `${target.score}` : "Not marked")}
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">What's going well?</Label>
            <Input value={goingWell} onChange={(e) => setGoingWell(e.target.value)} placeholder="e.g. strong problem solving" />
            <p className="text-[11px] text-muted-foreground">2–6 word phrase. Leave blank to let AI infer from the grade.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">What needs work?</Label>
            <Input value={needsWork} onChange={(e) => setNeedsWork(e.target.value)} placeholder="e.g. shows working steps" />
            <p className="text-[11px] text-muted-foreground">2–6 word phrase.</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
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

          <Button className="w-full" onClick={run} disabled={busy || !canEdit || quota.blocked}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {comment ? "Regenerate" : "Generate"}
          </Button>
          {!canEdit && <p className="text-xs text-destructive">You need grade-edit permission to generate comments.</p>}

          {comment ? (
            <div className="space-y-2">
              <Label className="text-xs">Comment</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={5} />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={insert} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Insert into report card
                </Button>
                <Button variant="outline" onClick={run} disabled={busy}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <Sparkles className="h-5 w-5 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">No comment yet — fill in the prompts and generate one.</p>
            </div>
          )}

          <div className="pt-2 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{quota.used} / {quota.limit ?? "∞"} AI comments used this month</span>
              {quota.warn && <span className="text-destructive">80% of quota used</span>}
            </div>
            {quota.limit ? <Progress value={quota.pct} className="h-1" /> : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}