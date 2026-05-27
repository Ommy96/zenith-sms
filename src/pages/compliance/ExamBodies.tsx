import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, Upload } from "lucide-react";

const BODIES = [
  { code: "knec", name: "KNEC (Kenya)", exams: ["KCPE", "KCSE", "KPSEA"] },
  { code: "uneb", name: "UNEB (Uganda)", exams: ["PLE", "UCE", "UACE"] },
  { code: "necta", name: "NECTA (Tanzania)", exams: ["PSLE", "CSEE", "ACSEE"] },
  { code: "reb", name: "REB (Rwanda)", exams: ["P6", "S3", "S6"] },
];

export default function ExamBodies() {
  const { tenant } = useTenant();
  const [body, setBody] = useState("knec");
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);

  const importResults = async () => {
    if (!tenant || !csv.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("knec-results-import", {
        body: { tenant_id: tenant.id, body_code: body, csv },
      });
      if (error) throw error;
      toast.success(`Matched ${data.matched}, unmatched ${data.unmatched}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><GraduationCap className="h-7 w-7 text-primary" /> Exam Bodies</h1>
        <p className="text-muted-foreground mt-1">Register candidates and import results for national exam bodies.</p>
      </div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import Results</TabsTrigger>
          <TabsTrigger value="info">Supported Bodies</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <Card>
            <CardHeader><CardTitle>Bulk Results Import</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Exam Body</Label>
                  <Select value={body} onValueChange={setBody}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BODIES.map(b => <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Upload CSV file</Label>
                  <Input type="file" accept=".csv" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    setCsv(await f.text());
                  }} />
                </div>
              </div>
              <div>
                <Label>CSV contents (columns: index_number, candidate_name, subject_code, grade, points)</Label>
                <Textarea rows={10} className="font-mono text-xs" value={csv} onChange={(e) => setCsv(e.target.value)}
                  placeholder="index_number,candidate_name,subject_code,grade,points&#10;12345678,John Doe,101,A,12" />
              </div>
              <Button onClick={importResults} disabled={busy || !csv.trim()}>
                <Upload className="h-4 w-4 mr-2" />{busy ? "Importing..." : "Import Results"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-3">
          {BODIES.map(b => (
            <Card key={b.code}>
              <CardHeader><CardTitle className="text-base">{b.name}</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Supported exams: <strong>{b.exams.join(", ")}</strong>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}