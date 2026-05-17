import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, ChevronRight, ChevronDown } from "lucide-react";

type LA = { id: string; code: string; name: string };
type Strand = { id: string; learning_area_id: string; name: string };
type SS = { id: string; strand_id: string; name: string };
type LO = { id: string; sub_strand_id: string; description: string; code: string | null };

export function CbcCurriculumTab() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [areas, setAreas] = useState<LA[]>([]);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [subs, setSubs] = useState<SS[]>([]);
  const [outcomes, setOutcomes] = useState<LO[]>([]);
  const [loading, setLoading] = useState(true);
  const [openArea, setOpenArea] = useState<string | null>(null);
  const [openStrand, setOpenStrand] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [newArea, setNewArea] = useState({ code: "", name: "" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [a, s, ss, lo] = await Promise.all([
      supabase.from("learning_areas").select("*").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("strands").select("*").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("sub_strands").select("*").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("learning_outcomes").select("*").eq("tenant_id", tenantId).order("sort_order"),
    ]);
    setAreas(a.data || []); setStrands(s.data || []); setSubs(ss.data || []); setOutcomes(lo.data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const addArea = async () => {
    if (!tenantId || !newArea.name) return;
    const { error } = await supabase.from("learning_areas").insert({ ...newArea, tenant_id: tenantId });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setNewArea({ code: "", name: "" }); load();
  };
  const addStrand = async (areaId: string, name: string) => {
    if (!tenantId || !name) return;
    await supabase.from("strands").insert({ tenant_id: tenantId, learning_area_id: areaId, name });
    load();
  };
  const addSub = async (strandId: string, name: string) => {
    await supabase.from("sub_strands").insert({ tenant_id: tenantId!, strand_id: strandId, name });
    load();
  };
  const addOutcome = async (subId: string, description: string) => {
    await supabase.from("learning_outcomes").insert({ tenant_id: tenantId!, sub_strand_id: subId, description });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle>CBC Curriculum (Learning Areas → Strands → Sub-strands → Outcomes)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Code" value={newArea.code} onChange={(e) => setNewArea({ ...newArea, code: e.target.value })} className="w-24" />
          <Input placeholder="New Learning Area (e.g. Mathematics)" value={newArea.name} onChange={(e) => setNewArea({ ...newArea, name: e.target.value })} />
          <Button size="sm" onClick={addArea}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
        <div className="space-y-2">
          {areas.map((a) => (
            <div key={a.id} className="rounded border">
              <button className="w-full text-left p-3 flex items-center gap-2 hover:bg-muted/40" onClick={() => setOpenArea(openArea === a.id ? null : a.id)}>
                {openArea === a.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium">{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.code}</span>
              </button>
              {openArea === a.id && (
                <div className="border-t p-3 space-y-2 bg-muted/20">
                  <AddInline placeholder="Add strand…" onAdd={(v) => addStrand(a.id, v)} />
                  {strands.filter((s) => s.learning_area_id === a.id).map((s) => (
                    <div key={s.id} className="ml-4 rounded border bg-background">
                      <button className="w-full text-left p-2 flex items-center gap-2 hover:bg-muted/40" onClick={() => setOpenStrand(openStrand === s.id ? null : s.id)}>
                        {openStrand === s.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <span>{s.name}</span>
                      </button>
                      {openStrand === s.id && (
                        <div className="border-t p-2 space-y-2">
                          <AddInline placeholder="Add sub-strand…" onAdd={(v) => addSub(s.id, v)} />
                          {subs.filter((ss) => ss.strand_id === s.id).map((ss) => (
                            <div key={ss.id} className="ml-4 rounded border bg-background">
                              <button className="w-full text-left p-2 flex items-center gap-2 hover:bg-muted/40" onClick={() => setOpenSub(openSub === ss.id ? null : ss.id)}>
                                {openSub === ss.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                <span className="text-sm">{ss.name}</span>
                              </button>
                              {openSub === ss.id && (
                                <div className="border-t p-2 space-y-1">
                                  <AddInline placeholder="Add learning outcome…" onAdd={(v) => addOutcome(ss.id, v)} />
                                  <ul className="ml-4 list-disc text-sm space-y-1">
                                    {outcomes.filter((o) => o.sub_strand_id === ss.id).map((o) => (
                                      <li key={o.id}>{o.description}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AddInline({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2">
      <Input placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} className="h-8 text-sm" />
      <Button size="sm" variant="outline" onClick={() => { if (v) { onAdd(v); setV(""); } }}>Add</Button>
    </div>
  );
}