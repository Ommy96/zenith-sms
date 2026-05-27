import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Sparkles, Copy, Download, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const DOC_TYPES = [
  { value: "Transfer letter",          desc: "Confirms a student is leaving and is clear of obligations" },
  { value: "Recommendation letter",    desc: "Endorses a student for further studies or opportunities" },
  { value: "Bonafide certificate",     desc: "Confirms current enrolment for visas, banks, scholarships" },
  { value: "Fee-extension letter",     desc: "Grants extra time to settle outstanding fees" },
  { value: "Show-cause notice",        desc: "Formal disciplinary notice requiring a written response" },
  { value: "Indemnity letter",         desc: "Acknowledges responsibility for an off-site activity" },
  { value: "Custom letter",            desc: "Free-form letter from your brief" },
];

const TONES = ["Formal", "Warm", "Direct", "Encouraging"];

interface Student { id: string; first_name: string; last_name: string; admission_number: string | null }

export default function Documents() {
  const { profile } = useAuth();
  const { can } = useTenant();
  const tenantId = profile?.tenant_id;

  const [docType, setDocType] = useState<string>(DOC_TYPES[0].value);
  const [purpose, setPurpose] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState<string>("Formal");
  const [studentId, setStudentId] = useState<string>("");
  const [studentName, setStudentName] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState("");
  const [header, setHeader] = useState<any>(null);
  const [meta, setMeta] = useState<{ used: number; limit: number | null; provider?: string; cached?: boolean } | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    supabase.from("students")
      .select("id,first_name,last_name,admission_number")
      .eq("tenant_id", tenantId).eq("status", "active")
      .order("first_name").limit(500)
      .then(({ data }) => setStudents((data ?? []) as Student[]));
  }, [tenantId]);

  const docDesc = useMemo(() => DOC_TYPES.find(d => d.value === docType)?.desc ?? "", [docType]);

  const generate = async () => {
    if (!purpose.trim()) return toast({ title: "Purpose is required", variant: "destructive" });
    setGenerating(true); setDraft(""); setHeader(null);
    const { data, error } = await supabase.functions.invoke("ai-document-draft", {
      body: {
        docType,
        studentId: studentId || undefined,
        studentName: studentName || undefined,
        admissionNumber: admissionNumber || undefined,
        purpose, keyPoints, tone,
      },
    });
    setGenerating(false);
    const err = (data as any)?.error || error?.message;
    if (err) return toast({ title: "Generation failed", description: err, variant: "destructive" });
    setDraft((data as any).draft || "");
    setHeader((data as any).header || null);
    setMeta({
      used: (data as any).used,
      limit: (data as any).limit ?? null,
      provider: (data as any).provider,
      cached: (data as any).cacheHit,
    });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(formatted());
    toast({ title: "Copied to clipboard" });
  };

  const formatted = () => {
    if (!draft) return "";
    const h = header || {};
    return [
      h.schoolName ?? "",
      h.date ?? "",
      "",
      `Subject: ${h.docType ?? docType}`,
      h.studentName ? `Re: ${h.studentName}${h.admissionNumber && h.admissionNumber !== "N/A" ? ` (Adm. No. ${h.admissionNumber})` : ""}` : "",
      "",
      draft,
      "",
      "Yours sincerely,",
      "_____________________",
      "School Administration",
    ].filter(Boolean).join("\n");
  };

  const download = () => {
    const blob = new Blob([formatted()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docType.replace(/\s+/g, "_")}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setDraft(""); setHeader(null); setMeta(null); };

  const allowed = can("ai.use") || can("communication.send");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">AI Document Generator</h1>
          <p className="text-sm text-muted-foreground">
            Draft school letters in seconds — review, edit, then send. Drafts are stored only in this browser.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Document type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.value}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{docDesc}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Student (optional)</Label>
                <Select value={studentId || "none"} onValueChange={(v) => {
                  if (v === "none") { setStudentId(""); setStudentName(""); setAdmissionNumber(""); return; }
                  setStudentId(v);
                  const s = students.find(x => x.id === v);
                  if (s) {
                    setStudentName(`${s.first_name} ${s.last_name}`);
                    setAdmissionNumber(s.admission_number ?? "");
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific student</SelectItem>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} {s.admission_number ? `(${s.admission_number})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!studentId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Recipient name (optional)</Label>
                  <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g. Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Reference number (optional)</Label>
                  <Input value={admissionNumber} onChange={(e) => setAdmissionNumber(e.target.value)} placeholder="Adm. no. / ref" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input
                value={purpose} onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Transfer to St Mary's effective end of Term 2"
              />
            </div>
            <div className="space-y-2">
              <Label>Key points to include</Label>
              <Textarea
                value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)}
                rows={5}
                placeholder="One point per line. e.g.&#10;- All fees settled to date&#10;- Good conduct record&#10;- Parents requesting closer to home"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={reset} disabled={!draft}>
                <RotateCcw className="h-4 w-4 mr-1" /> Clear
              </Button>
              <Button onClick={generate} disabled={generating || !allowed}>
                {generating
                  ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Drafting…</>
                  : <><Sparkles className="h-4 w-4 mr-1" /> Generate draft</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Draft</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copy} disabled={!draft}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={download} disabled={!draft}>
                <Download className="h-3.5 w-3.5 mr-1" /> .txt
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!draft && !generating && (
              <div className="text-sm text-muted-foreground italic">
                Fill the brief on the left and press <span className="font-medium">Generate draft</span>.
              </div>
            )}
            {generating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Drafting your document…
              </div>
            )}
            {draft && (
              <>
                <Textarea
                  className="min-h-[420px] font-mono text-sm"
                  value={formatted()}
                  onChange={(e) => {
                    // Allow free editing — drop header parsing, just keep what user types as the body.
                    setDraft(e.target.value);
                    setHeader(null);
                  }}
                />
                {meta && (
                  <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                    {meta.provider && <Badge variant="outline">{meta.provider}</Badge>}
                    {meta.cached && <Badge variant="secondary">cached</Badge>}
                    <span>
                      AI usage this month: <span className="font-medium">{meta.used}</span>
                      {meta.limit != null && ` / ${meta.limit}`}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}