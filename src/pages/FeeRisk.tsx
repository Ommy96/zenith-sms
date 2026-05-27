import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingDown, Loader2, RefreshCcw, AlertTriangle, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RiskRow {
  student_id: string;
  name: string;
  admission_number: string;
  class_name: string | null;
  balance: number;
  overdue_balance: number;
  overdue_invoices: number;
  avg_days_late: number;
  last_payment: string | null;
  total_paid: number;
  total_billed: number;
  risk_score: number;
  risk_band: "high" | "medium" | "low";
}

const bandColor: Record<string, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  medium: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
  low: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
};

export default function FeeRisk() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [band, setBand] = useState<"all" | "high" | "medium" | "low">("all");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const run = async (withAi = true) => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("ai-fee-predictor", {
      body: { tenantId, narrate: withAi, topN: 20 },
    });
    setLoading(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setRows(data.students || []);
    setNarrative(data.narrative || null);
    setGeneratedAt(data.generated_at || null);
  };

  useEffect(() => { if (tenantId) run(false); /* fast initial load without AI */ }, [tenantId]);

  const filtered = rows.filter((r) => {
    if (band !== "all" && r.risk_band !== band) return false;
    if (filter && !`${r.name} ${r.admission_number} ${r.class_name || ""}`.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const summary = {
    high: rows.filter((r) => r.risk_band === "high").length,
    medium: rows.filter((r) => r.risk_band === "medium").length,
    low: rows.filter((r) => r.risk_band === "low").length,
    overdue_total: rows.reduce((s, r) => s + r.overdue_balance, 0),
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <TrendingDown className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Fee Default Predictor</h1>
            <p className="text-sm text-muted-foreground">
              AI-ranked students most likely to default this term, with recommended actions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {generatedAt && (
            <span className="text-xs text-muted-foreground">
              Updated {new Date(generatedAt).toLocaleString()}
            </span>
          )}
          <Button onClick={() => run(true)} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
            Refresh with AI narrative
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">High risk</p>
          <p className="text-2xl font-bold text-destructive">{summary.high}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Medium risk</p>
          <p className="text-2xl font-bold text-amber-500">{summary.medium}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Low risk</p>
          <p className="text-2xl font-bold text-emerald-500">{summary.low}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total overdue</p>
          <p className="text-2xl font-bold">{summary.overdue_total.toLocaleString()}</p>
        </CardContent></Card>
      </div>

      {narrative && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-primary" />
              AI Analysis & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{narrative}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Ranked students ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                value={filter} onChange={(e) => setFilter(e.target.value)}
                placeholder="Search name, class…" className="h-8 w-56"
              />
              <select
                value={band} onChange={(e) => setBand(e.target.value as any)}
                className="h-8 px-2 rounded-md border bg-background text-sm"
              >
                <option value="all">All bands</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
                <TableHead className="text-right">Avg days late</TableHead>
                <TableHead className="text-right">Risk</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {loading ? "Computing…" : "No students match."}
                </TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.student_id}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.admission_number}</div>
                  </TableCell>
                  <TableCell>{r.class_name || "—"}</TableCell>
                  <TableCell className="text-right">{r.balance.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{r.overdue_balance.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{r.avg_days_late || 0}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={bandColor[r.risk_band]}>
                      {r.risk_score} · {r.risk_band}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`/students/${r.student_id}`}>
                        <MessageCircle className="h-4 w-4 mr-1" /> Open
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}