import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Sparkles, Trash2 } from "lucide-react";

type GL = { id: string; code: string; name: string; stage: string | null; sort_order: number };

const PRESETS = [
  { value: "cbc", label: "CBC (Kenya)" },
  { value: "8-4-4", label: "8-4-4 (Kenya legacy)" },
  { value: "ug", label: "Uganda (P / S)" },
  { value: "tz", label: "Tanzania (NECTA)" },
  { value: "igcse", label: "International (IGCSE / IB)" },
];

export function GradeLevelsTab() {
  const { profile } = useAuth();
  const { tenant } = useTenant();
  const tenantId = profile?.tenant_id;
  const [levels, setLevels] = useState<GL[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", name: "" });
  const [preset, setPreset] = useState<string>(tenant?.curriculum === "cbc" ? "cbc" : "cbc");
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase.from("grade_levels").select("*").eq("tenant_id", tenantId).order("sort_order");
    setLevels((data as GL[]) || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const seed = async () => {
    if (!tenantId) return;
    setSeeding(true);
    const { error } = await supabase.rpc("seed_grade_levels" as any, { _tenant: tenantId, _curriculum: preset });
    setSeeding(false);
    if (error) return toast({ title: "Seed failed", description: error.message, variant: "destructive" });
    toast({ title: "Grade levels seeded", description: PRESETS.find((p) => p.value === preset)?.label });
    load();
  };

  const add = async () => {
    if (!tenantId || !form.code || !form.name) return;
    const sort_order = (levels[levels.length - 1]?.sort_order || 0) + 1;
    const { error } = await supabase.from("grade_levels").insert({ ...form, sort_order, tenant_id: tenantId });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setForm({ code: "", name: "" });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this grade level?")) return;
    await supabase.from("grade_levels").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle>Grade Levels</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Seed from preset</div>
            <select className="border rounded px-2 py-1 text-sm bg-background" value={preset} onChange={(e) => setPreset(e.target.value)}>
              {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <Button size="sm" onClick={seed} disabled={seeding}>
            {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Seed preset
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="Code (e.g. G7)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input placeholder="Name (e.g. Grade 7)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2" />
        </div>
        <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add level</Button>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {levels.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded border p-2 text-sm">
              <div>
                <div className="font-medium">{l.name}</div>
                <div className="text-xs text-muted-foreground">{l.code} {l.stage && <Badge variant="outline" className="ml-1">{l.stage}</Badge>}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}