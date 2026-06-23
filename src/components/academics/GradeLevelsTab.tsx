import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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

const CBC_SORT_MAP: Record<string, number> = {
  PG: 5, PP1: 10, PP2: 20,
  G1: 30, G2: 40, G3: 50, G4: 60, G5: 70, G6: 80,
  G7: 90, G8: 100, G9: 110, G10: 120, G11: 130, G12: 140,
};
const STAGE_ORDER: Record<string, number> = {
  pre_primary: 1, lower_primary: 2, upper_primary: 3,
  primary: 2, junior_secondary: 4, senior_secondary: 5,
  secondary: 4, o_level: 4, a_level: 5,
};

export function GradeLevelsTab() {
  const { profile } = useAuth();
  const { tenant } = useTenant();
  const tenantId = profile?.tenant_id;
  const [levels, setLevels] = useState<GL[]>([]);
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", name: "" });
  const [preset, setPreset] = useState<string>(tenant?.curriculum === "cbc" ? "cbc" : "cbc");
  const [seeding, setSeeding] = useState(false);
  const [sortMode, setSortMode] = useState<"curriculum" | "alpha">("curriculum");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase.from("grade_levels").select("*").eq("tenant_id", tenantId);
    setLevels((data as GL[]) || []);
    const { data: cls } = await supabase.from("classes").select("grade_level_id").eq("tenant_id", tenantId);
    const counts: Record<string, number> = {};
    (cls || []).forEach((c: any) => { if (c.grade_level_id) counts[c.grade_level_id] = (counts[c.grade_level_id] || 0) + 1; });
    setClassCounts(counts);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const seed = async () => {
    if (!tenantId) return toast({ title: "No school selected", description: "Finish school setup first.", variant: "destructive" });
    setSeeding(true);
    const { error } = await supabase.rpc("seed_grade_levels" as any, { _tenant: tenantId, _curriculum: preset });
    if (error) { setSeeding(false); return toast({ title: "Seed failed", description: error.message, variant: "destructive" }); }
    // backfill sort_order for CBC codes if applicable
    const { data: seeded } = await supabase.from("grade_levels").select("id,code").eq("tenant_id", tenantId);
    await Promise.all((seeded || []).map((g: any) => {
      const so = CBC_SORT_MAP[g.code];
      if (so) return supabase.from("grade_levels").update({ sort_order: so }).eq("id", g.id);
      return Promise.resolve();
    }));
    setSeeding(false);
    toast({ title: "Grade levels seeded", description: PRESETS.find((p) => p.value === preset)?.label });
    load();
  };

  const add = async () => {
    if (!tenantId) return toast({ title: "No school selected", description: "Finish school setup first.", variant: "destructive" });
    if (!form.code || !form.name) {
      return toast({ title: "Missing fields", description: "Enter both a code and a name.", variant: "destructive" });
    }
    const sort_order = CBC_SORT_MAP[form.code.toUpperCase()] ?? ((Math.max(0, ...levels.map((l) => l.sort_order || 0)) || 0) + 10);
    const { error } = await supabase.from("grade_levels").insert({ ...form, sort_order, tenant_id: tenantId });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setForm({ code: "", name: "" });
    load();
  };
  const remove = async (id: string) => {
    if ((classCounts[id] || 0) > 0) return;
    if (!confirm("Delete this grade level?")) return;
    const { error } = await supabase.from("grade_levels").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Grade level deleted" });
    load();
  };

  const sorted = [...levels].sort((a, b) => {
    if (sortMode === "alpha") return a.name.localeCompare(b.name);
    const aSo = a.sort_order ?? CBC_SORT_MAP[a.code] ?? null;
    const bSo = b.sort_order ?? CBC_SORT_MAP[b.code] ?? null;
    if (aSo != null && bSo != null && aSo !== bSo) return aSo - bSo;
    if (aSo != null && bSo == null) return -1;
    if (aSo == null && bSo != null) return 1;
    const aSt = STAGE_ORDER[a.stage || ""] ?? 99;
    const bSt = STAGE_ORDER[b.stage || ""] ?? 99;
    if (aSt !== bSt) return aSt - bSt;
    return a.code.localeCompare(b.code);
  });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <TooltipProvider delayDuration={200}>
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

        {levels.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Sort:</span>
            <button onClick={() => setSortMode("curriculum")} className={`px-2 py-1 rounded border ${sortMode === "curriculum" ? "bg-primary text-primary-foreground" : "bg-background"}`}>By curriculum order</button>
            <button onClick={() => setSortMode("alpha")} className={`px-2 py-1 rounded border ${sortMode === "alpha" ? "bg-primary text-primary-foreground" : "bg-background"}`}>Alphabetical</button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {sorted.map((l) => {
            const used = classCounts[l.id] || 0;
            const blocked = used > 0;
            return (
              <div key={l.id} className="flex items-center justify-between rounded border p-2 text-sm">
                <div>
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.code} {l.stage && <Badge variant="outline" className="ml-1">{l.stage}</Badge>}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Used by {used} class{used === 1 ? "" : "es"}</div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button size="icon" variant="ghost" onClick={() => remove(l.id)} disabled={blocked}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{blocked ? `Cannot delete — ${used} class${used === 1 ? "" : "es"} use this level` : "Delete grade level"}</TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}