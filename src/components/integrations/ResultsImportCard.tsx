import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { downloadCsv } from "@/lib/downloadCsv";

interface Props {
  /** Edge function name, e.g. "uneb-results-import" */
  fn: string;
  boardName: string;      // "UNEB"
  indexLabel: string;     // "UNEB index number"
  description: string;
}

type Result = { matched: number; unmatched: number; sample: any[] } | null;

export function ResultsImportCard({ fn, boardName, indexLabel, description }: Props) {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csv, setCsv] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const pick = async (f: File | null) => {
    if (!f) return;
    setFileName(f.name);
    setCsv(await f.text());
    setResult(null);
  };

  const run = async () => {
    if (!tenantId || !csv) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke(fn, { body: { tenant_id: tenantId, csv } });
    setBusy(false);
    const err = (data as any)?.error || error?.message;
    if (err) return toast({ title: `${boardName} import failed`, description: err, variant: "destructive" });
    setResult({ matched: (data as any).matched ?? 0, unmatched: (data as any).unmatched ?? 0, sample: (data as any).sample ?? [] });
    toast({ title: `${boardName} results processed`, description: `${(data as any).matched ?? 0} learners matched.` });
  };

  const template = () => downloadCsv(
    `${boardName.toLowerCase()}-results-template.csv`,
    [{ index_number: "", subject_code: "", grade: "", points: "" }],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileUp className="h-4 w-4 text-primary" /> Import {boardName} results
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0] ?? null); }}
          className="border border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors"
        >
          <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm">{fileName ?? "Drop the results CSV here, or click to browse"}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Columns: index_number, subject_code, grade, points (optional)
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        </div>

        <div className="flex gap-2">
          <Button onClick={run} disabled={!csv || busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileUp className="h-4 w-4 mr-2" />}
            Match against learners
          </Button>
          <Button variant="outline" onClick={template}>Download template</Button>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> {result.matched} matched
              </Badge>
              <Badge variant={result.unmatched ? "destructive" : "outline"} className="gap-1">
                <AlertCircle className="h-3 w-3" /> {result.unmatched} unmatched
              </Badge>
            </div>
            {result.unmatched > 0 && (
              <p className="text-xs text-muted-foreground">
                Unmatched rows have an {indexLabel} that no learner record carries. Add the index numbers on the learner
                profiles, then re-run the import.
              </p>
            )}
            {result.sample.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr><th className="px-3 py-2 text-left">Learner</th><th className="px-3 py-2 text-left">Subject</th><th className="px-3 py-2 text-left">Grade</th></tr>
                  </thead>
                  <tbody>
                    {result.sample.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1.5 font-mono">{r.student_id?.slice(0, 8)}…</td>
                        <td className="px-3 py-1.5">{r.subject}</td>
                        <td className="px-3 py-1.5">{r.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}