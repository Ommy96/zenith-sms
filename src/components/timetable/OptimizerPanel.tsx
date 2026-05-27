import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Props = {
  tenantId: string;
  classId: string;
  termId: string;
  className?: string;
  onApplied?: () => void;
};

type Weights = { spread: number; gaps: number; roomType: number; doubleBlock: number; preferredRoom: number };
const DEFAULT_W: Weights = { spread: 5, gaps: 3, roomType: 4, doubleBlock: 2, preferredRoom: 1 };

export function OptimizerPanel({ tenantId, classId, termId, className, onApplied }: Props) {
  const [weights, setWeights] = useState<Weights>(DEFAULT_W);
  const [iterations, setIterations] = useState(4000);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("timetable_optimization_runs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("term_id", termId)
      .eq("class_id", classId)
      .order("created_at", { ascending: false })
      .limit(5);
    setHistory(data || []);
  };
  useEffect(() => { if (tenantId && classId && termId) loadHistory(); /* eslint-disable-next-line */ }, [tenantId, classId, termId]);

  const run = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("auto-timetable-optimize", {
      body: { tenantId, classId, termId, iterations, weights },
    });
    setRunning(false);
    if (error || (data as any)?.error) {
      toast({ title: "Optimizer failed", description: error?.message || (data as any)?.error, variant: "destructive" });
      return;
    }
    setLastRun(data);
    toast({ title: "Optimized", description: `Placed ${data.placed}, score ${data.score?.toFixed?.(1) ?? data.score}` });
    loadHistory();
    onApplied?.();
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" />Constraint optimizer</CardTitle>
        <Button size="sm" onClick={run} disabled={running || !classId}>
          {running ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
          Run optimizer
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-5">
          {(Object.keys(weights) as (keyof Weights)[]).map((k) => (
            <div key={k} className="space-y-1">
              <Label className="text-xs capitalize text-muted-foreground">{labelFor(k)}</Label>
              <Input type="number" min={0} max={50} value={weights[k]}
                onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) || 0 })} />
            </div>
          ))}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Iterations</Label>
            <Input type="number" min={100} max={20000} step={100} value={iterations}
              onChange={(e) => setIterations(Math.max(100, Number(e.target.value) || 4000))} />
          </div>
        </div>

        {lastRun && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Score: {Number(lastRun.score).toFixed(1)}</Badge>
              <Badge variant="outline">Placed: {lastRun.placed}</Badge>
              {lastRun.unplaced > 0 ? (
                <Badge variant="destructive">Unplaced: {lastRun.unplaced}</Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-500/15 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />Fully scheduled
                </Badge>
              )}
              <Badge variant="outline">Hard: {lastRun.hard_violations}</Badge>
              <Badge variant="outline">Soft: {lastRun.soft_violations}</Badge>
              <Badge variant="outline">{lastRun.duration_ms} ms</Badge>
            </div>
            {Array.isArray(lastRun.violations) && lastRun.violations.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />Top violations
                </div>
                <ul className="text-xs space-y-0.5 max-h-32 overflow-auto">
                  {lastRun.violations.map((v: any, i: number) => (
                    <li key={i} className="font-mono text-muted-foreground">{v.type} — {JSON.stringify(v).slice(0, 120)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Recent runs</div>
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-1">When</th><th>Score</th><th>Placed</th><th>Unplaced</th><th>Soft</th><th>Hard</th></tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-1">{new Date(r.created_at).toLocaleString()}</td>
                    <td>{Number(r.score).toFixed(1)}</td>
                    <td>{r.placed}</td>
                    <td>{r.unplaced}</td>
                    <td>{r.soft_violations}</td>
                    <td>{r.hard_violations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function labelFor(k: keyof Weights): string {
  return {
    spread: "Spread", gaps: "Teacher gaps", roomType: "Room match",
    doubleBlock: "Double blocks", preferredRoom: "Preferred room",
  }[k];
}