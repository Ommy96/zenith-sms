import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Download, Building, Users, ClipboardCheck, TrendingUp } from "lucide-react";

const REPORTS = [
  { key: "qaso", label: "QASO Report", icon: ClipboardCheck, desc: "Quality Assurance & Standards Officer pack — enrolment, attendance, exams." },
  { key: "internal_audit", label: "Internal Audit", icon: FileText, desc: "Financial summary: billings, collections, expenses, net cash flow." },
  { key: "bom", label: "Board of Management", icon: Building, desc: "Combined operational + financial pack for BoM meetings." },
  { key: "pta", label: "PTA Report", icon: Users, desc: "Events, communications, and parent engagement summary." },
  { key: "enrolment_trend", label: "Enrolment Trend", icon: TrendingUp, desc: "Per-class enrolment snapshot." },
] as const;

export default function AuditReports() {
  const { tenant } = useTenant();
  const today = new Date().toISOString().slice(0, 10);
  const ninetyAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(ninetyAgo);
  const [to, setTo] = useState(today);
  const [type, setType] = useState<typeof REPORTS[number]["key"]>("qaso");
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!tenant) return;
    setBusy(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-report-pdf`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ tenant_id: tenant.id, report_type: type, from_date: from, to_date: to }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${type}-${from}-to-${to}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Report generated");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-7 w-7 text-primary" /> Audit-Ready Reports</h1>
        <p className="text-muted-foreground mt-1">One-click PDF packs with school letterhead. Date-range parameterised and reproducible.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Generate Report</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <Label>Report type</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORTS.map(r => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <div className="flex items-end">
              <Button onClick={generate} disabled={busy} className="w-full">
                <Download className="h-4 w-4 mr-2" />{busy ? "Generating..." : "Generate PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {REPORTS.map(r => {
          const Icon = r.icon;
          return (
            <Card key={r.key} className={type === r.key ? "border-primary" : ""}>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5 text-primary" /> {r.label}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{r.desc}</p>
                <Button size="sm" variant="outline" onClick={() => setType(r.key)}>Select</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}