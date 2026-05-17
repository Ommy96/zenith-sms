import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const CANONICAL_FIELDS = [
  { value: "__skip__", label: "— Skip column —" },
  { value: "admission_number", label: "Admission Number" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "full_name", label: "Full Name (split)" },
  { value: "gender", label: "Gender" },
  { value: "date_of_birth", label: "Date of Birth" },
  { value: "grade", label: "Grade / Class" },
  { value: "email", label: "Student Email" },
  { value: "phone", label: "Student Phone" },
  { value: "address", label: "Address" },
  { value: "guardian_name", label: "Guardian Name" },
  { value: "guardian_phone", label: "Guardian Phone" },
  { value: "guardian_email", label: "Guardian Email" },
  { value: "guardian_relationship", label: "Guardian Relationship" },
  { value: "admission_date", label: "Admission Date" },
  { value: "status", label: "Status" },
];

type Step = "upload" | "mapping" | "review" | "complete";
type RowError = { row: number; errors: string[]; data: Record<string, unknown> };

function signatureFor(headers: string[]) {
  return headers.map((h) => h.trim().toLowerCase()).sort().join("|");
}

function normalizeDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Excel serial date
    const d = new Date(Date.UTC(1899, 11, 30) as number);
    d.setUTCDate(d.getUTCDate() + v);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export default function StudentsImport() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const schoolId = profile?.tenant_id ?? null;
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [cacheHit, setCacheHit] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    if (json.length === 0) {
      toast({ title: "Empty file", description: "No rows found.", variant: "destructive" });
      return;
    }
    const hdrs = Object.keys(json[0]);
    setHeaders(hdrs);
    setRows(json);
    await suggestMapping(hdrs, json.slice(0, 3));
    setStep("mapping");
  };

  const suggestMapping = async (hdrs: string[], sample: Record<string, unknown>[]) => {
    if (!schoolId) return;
    setAiLoading(true);
    setCacheHit(false);
    try {
      const sig = signatureFor(hdrs);
      const { data: cached } = await supabase
        .from("import_mappings")
        .select("mapping, id, use_count")
        .eq("tenant_id", schoolId)
        .eq("source_type", "students")
        .eq("header_signature", sig)
        .maybeSingle();

      if (cached?.mapping) {
        setMapping(cached.mapping as Record<string, string>);
        setCacheHit(true);
        await supabase.from("import_mappings")
          .update({ use_count: (cached.use_count ?? 0) + 1, last_used_at: new Date().toISOString() })
          .eq("id", cached.id);
        return;
      }

      const { data, error } = await supabase.functions.invoke("suggest-import-mapping", {
        body: { headers: hdrs, sampleRows: sample },
      });
      if (error) throw error;
      const m: Record<string, string> = {};
      (data?.mapping ?? []).forEach((entry: { header: string; canonical_field: string | null }) => {
        m[entry.header] = entry.canonical_field ?? "__skip__";
      });
      hdrs.forEach((h) => { if (!(h in m)) m[h] = "__skip__"; });
      setMapping(m);
    } catch (e) {
      console.error(e);
      toast({ title: "AI mapping failed", description: "You can still map columns manually.", variant: "destructive" });
      const m: Record<string, string> = {};
      hdrs.forEach((h) => { m[h] = "__skip__"; });
      setMapping(m);
    } finally {
      setAiLoading(false);
    }
  };

  const cacheMapping = async () => {
    if (!schoolId) return;
    const sig = signatureFor(headers);
    await supabase.from("import_mappings").upsert(
      { tenant_id: schoolId, source_type: "students", header_signature: sig, mapping, last_used_at: new Date().toISOString() },
      { onConflict: "tenant_id,source_type,header_signature" },
    );
  };

  const transformRow = (raw: Record<string, unknown>): { record: Record<string, unknown>; errs: string[] } => {
    const record: Record<string, unknown> = {};
    const errs: string[] = [];
    for (const [header, field] of Object.entries(mapping)) {
      if (field === "__skip__") continue;
      const val = raw[header];
      if (val == null || String(val).trim() === "") continue;
      if (field === "full_name") {
        const parts = String(val).trim().split(/\s+/);
        record.first_name = parts[0];
        record.last_name = parts.slice(1).join(" ") || parts[0];
      } else if (field === "date_of_birth" || field === "admission_date") {
        const d = normalizeDate(val);
        if (!d) errs.push(`Invalid date in "${header}"`);
        else record[field] = d;
      } else if (field === "gender") {
        const g = String(val).trim().toLowerCase();
        record[field] = g.startsWith("m") ? "male" : g.startsWith("f") ? "female" : g;
      } else {
        record[field] = String(val).trim();
      }
    }
    if (!record.first_name) errs.push("Missing first name");
    if (!record.last_name) errs.push("Missing last name");
    return { record, errs };
  };

  const runImport = async () => {
    if (!schoolId) return;
    setImporting(true);
    setProgress(0);
    const errList: RowError[] = [];
    const valid: Record<string, unknown>[] = [];
    rows.forEach((raw, i) => {
      const { record, errs } = transformRow(raw);
      if (errs.length) errList.push({ row: i + 2, errors: errs, data: raw });
      else valid.push({ ...record, tenant_id: schoolId, status: record.status ?? "active" });
    });

    let inserted = 0;
    const chunkSize = 50;
    for (let i = 0; i < valid.length; i += chunkSize) {
      const chunk = valid.slice(i, i + chunkSize);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("students").insert(chunk as any);
      if (error) {
        chunk.forEach((r, idx) => errList.push({ row: i + idx + 2, errors: [error.message], data: r }));
      } else {
        inserted += chunk.length;
      }
      setProgress(Math.round(((i + chunk.length) / valid.length) * 100));
    }

    if (user) {
      await supabase.from("activity_logs").insert({
        user_id: user.id, tenant_id: schoolId, action: "bulk_import_students",
        entity_type: "students",
        details: { file: fileName, inserted, errors: errList.length },
      });
    }
    await cacheMapping();

    setImportedCount(inserted);
    setErrors(errList);
    setImporting(false);
    setStep("complete");
    toast({ title: "Import complete", description: `${inserted} student(s) imported. ${errList.length} error(s).` });
  };

  const downloadErrors = () => {
    const data = errors.map((e) => ({ row: e.row, errors: e.errors.join("; "), ...e.data }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errors");
    XLSX.writeFile(wb, "import-errors.xlsx");
  };

  const previewRows = useMemo(() => rows.slice(0, 10), [rows]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/students")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Bulk Import Students</h1>
          <p className="text-sm text-muted-foreground">Upload Excel or CSV. AI suggests column mappings.</p>
        </div>
      </div>

      {step === "upload" && (
        <Card>
          <CardContent className="pt-10 pb-12">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-12 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-medium">Click to upload .xlsx, .xls or .csv</p>
              <p className="text-sm text-muted-foreground mt-1">First row should contain column headers</p>
              <input
                type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </CardContent>
        </Card>
      )}

      {step === "mapping" && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" /> {fileName}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {rows.length} rows · review the suggested mappings below
              </p>
            </div>
            <div className="flex items-center gap-2">
              {aiLoading && (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> AI mapping…
                </Badge>
              )}
              {!aiLoading && cacheHit && (
                <Badge className="bg-success/10 text-success border-success/20 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Cached mapping
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHead key={h} className="min-w-[180px] align-top">
                        <div className="space-y-2 py-2">
                          <Select value={mapping[h] ?? "__skip__"} onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v }))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CANONICAL_FIELDS.map((f) => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="text-xs font-medium text-foreground truncate" title={h}>{h}</div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((r, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => (
                        <TableCell key={h} className="text-xs truncate max-w-[200px]">
                          {String(r[h] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Cancel</Button>
              <Button onClick={() => setStep("review")} disabled={aiLoading}>
                Continue to Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              About to import <strong>{rows.length}</strong> rows. Invalid rows will be skipped and downloadable.
            </p>
            {importing && <Progress value={progress} />}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("mapping")} disabled={importing}>Back</Button>
              <Button onClick={runImport} disabled={importing}>
                {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing…</> : "Import Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "complete" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" /> Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-muted-foreground">Imported</p>
                <p className="text-2xl font-bold text-success">{importedCount}</p>
              </div>
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-warning">{errors.length}</p>
              </div>
            </div>
            {errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-warning" /> Row errors
                  </p>
                  <Button size="sm" variant="outline" onClick={downloadErrors}>
                    <Download className="h-4 w-4 mr-1" /> Download corrections file
                  </Button>
                </div>
                <div className="max-h-64 overflow-auto rounded border text-xs">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Row</TableHead><TableHead>Errors</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.slice(0, 50).map((e) => (
                        <TableRow key={e.row}>
                          <TableCell>{e.row}</TableCell>
                          <TableCell className="text-destructive">{e.errors.join("; ")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setStep("upload"); setRows([]); setHeaders([]); setErrors([]); }}>
                Import Another File
              </Button>
              <Button onClick={() => navigate("/students")}>Go to Students</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}