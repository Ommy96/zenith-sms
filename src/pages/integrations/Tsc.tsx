import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Download, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/downloadCsv";

export default function TscPage() {
  const { profile } = useAuth();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const tenantId = profile?.tenant_id;
  const [busy, setBusy] = useState<string | null>(null);

  async function run(type: string) {
    if (!tenantId) return;
    setBusy(type);
    const { data, error } = await supabase.functions.invoke("compliance-export", { body: { type, tenant_id: tenantId, params: {} } });
    setBusy(null);
    if (error || !data?.csv) {
      toast({ title: "Export failed", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    downloadCsv(data.csv, data.filename);
    toast({ title: "Exported", description: `${data.row_count} rows · ${data.filename}` });
  }

  if (tenant && tenant.country_code !== "KE") {
    return <Card><CardHeader><CardTitle>TSC</CardTitle><CardDescription>Kenya only.</CardDescription></CardHeader></Card>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>System</span><span>›</span><span>Integrations</span><span>›</span><span className="text-foreground">TSC</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Teachers Service Commission</h1>
        <p className="text-sm text-muted-foreground mt-1">Teacher returns, job-group tracking and subject specialisation checks.</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4" /> Annual TSC teacher returns</CardTitle>
          <CardDescription>One row per registered teacher with TSC number, job group, registered subjects and personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => run("tsc_returns")} disabled={busy === "tsc_returns"}>
            {busy === "tsc_returns" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Generate TSC returns CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" /> Subject specialisation check</CardTitle>
          <CardDescription>Lists teachers who are teaching subjects they are not TSC-registered for. Useful for audits and timetable QA.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => run("tsc_subject_mismatch")} disabled={busy === "tsc_subject_mismatch"}>
            {busy === "tsc_subject_mismatch" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Download mismatch report
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Tip: maintain each teacher's registered subjects on their Staff profile (TSC Registered Subjects field).</p>
        </CardContent>
      </Card>
    </div>
  );
}