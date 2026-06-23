import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Sparkles, Trash2, Search, ChevronRight } from "lucide-react";

type LA = { id: string; code: string; name: string; grade_level_id: string | null; sort_order: number | null };
type Strand = { id: string; learning_area_id: string; name: string; sort_order: number | null };
type SS = { id: string; strand_id: string; name: string; sort_order: number | null };
type LO = { id: string; sub_strand_id: string; description: string; code: string | null; sort_order: number | null };

// Minimal KICD seed for a single grade level — extensible per grade.
// One representative learning area with full strand → sub-strand → outcome chain.
const KICD_SEED: Record<string, { area: { code: string; name: string }; strands: { name: string; subs: { name: string; outcomes: string[] }[] }[] }[]> = {
  G4: [
    {
      area: { code: "MATH", name: "Mathematics" },
      strands: [
        { name: "Numbers", subs: [
          { name: "Whole Numbers", outcomes: ["Read and write whole numbers up to 1,000,000", "Identify place value of digits up to millions", "Round off whole numbers to the nearest 10, 100, 1000"] },
          { name: "Fractions", outcomes: ["Identify equivalent fractions", "Compare and order fractions"] },
        ]},
        { name: "Measurement", subs: [
          { name: "Length", outcomes: ["Estimate and measure length in metres and centimetres", "Convert metres to centimetres"] },
          { name: "Mass", outcomes: ["Estimate and measure mass in kilograms and grams"] },
        ]},
        { name: "Geometry", subs: [
          { name: "Lines and Angles", outcomes: ["Identify types of lines", "Measure angles using a protractor"] },
        ]},
      ],
    },
    {
      area: { code: "ENG", name: "English" },
      strands: [
        { name: "Listening and Speaking", subs: [
          { name: "Pronunciation", outcomes: ["Pronounce vowel sounds correctly", "Use stress in two-syllable words"] },
        ]},
        { name: "Reading", subs: [
          { name: "Comprehension", outcomes: ["Answer literal questions from a text", "Identify main idea and supporting details"] },
        ]},
      ],
    },
  ],
  G5: [
    {
      area: { code: "MATH", name: "Mathematics" },
      strands: [
        { name: "Numbers", subs: [
          { name: "Decimals", outcomes: ["Read and write decimals up to thousandths", "Add and subtract decimals"] },
        ]},
      ],
    },
  ],
};

const DEFAULT_COMPETENCIES = [
  "Communication and Collaboration",
  "Critical Thinking and Problem Solving",
  "Imagination and Creativity",
  "Citizenship",
  "Digital Literacy",
  "Learning to Learn",
  "Self-Efficacy",
];
const DEFAULT_VALUES = ["Love", "Responsibility", "Respect", "Unity", "Peace", "Patriotism", "Integrity"];

export function CbcCurriculumTab() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [areas, setAreas] = useState<LA[]>([]);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [subs, setSubs] = useState<SS[]>([]);
  const [outcomes, setOutcomes] = useState<LO[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [comps, setComps] = useState<any[]>([]);
  const [values, setValues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedGrade, setSeedGrade] = useState<string>("G4");
  const [search, setSearch] = useState("");
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [activeStrand, setActiveStrand] = useState<string | null>(null);
  const [newArea, setNewArea] = useState({ code: "", name: "" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [a, s, ss, lo, g, c, v] = await Promise.all([
      supabase.from("learning_areas").select("*").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("strands").select("*").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("sub_strands").select("*").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("learning_outcomes").select("*").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("grade_levels").select("id,code,name").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("core_competencies").select("*").eq("tenant_id", tenantId),
      supabase.from("cbc_values").select("*").eq("tenant_id", tenantId),
    ]);
    setAreas((a.data as any) || []); setStrands((s.data as any) || []);
    setSubs((ss.data as any) || []); setOutcomes((lo.data as any) || []);
    setGrades(g.data || []); setComps(c.data || []); setValues(v.data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const seedKicd = async () => {
    if (!tenantId) return;
    const data = KICD_SEED[seedGrade];
    if (!data) return toast({ title: "No preset", description: `KICD seed for ${seedGrade} is not yet bundled.`, variant: "destructive" });
    setSeeding(true);
    const grade = grades.find((g) => g.code === seedGrade);
    const gradeId = grade?.id || null;
    try {
      for (const [i, item] of data.entries()) {
        const { data: areaIns, error: aerr } = await supabase.from("learning_areas")
          .insert({ tenant_id: tenantId, code: item.area.code, name: item.area.name, grade_level_id: gradeId, sort_order: (i + 1) * 10 })
          .select("id").single();
        if (aerr || !areaIns) throw aerr;
        for (const [si, st] of item.strands.entries()) {
          const { data: strandIns, error: serr } = await supabase.from("strands")
            .insert({ tenant_id: tenantId, learning_area_id: areaIns.id, name: st.name, sort_order: (si + 1) * 10 })
            .select("id").single();
          if (serr || !strandIns) throw serr;
          for (const [ssi, sub] of st.subs.entries()) {
            const { data: subIns, error: sserr } = await supabase.from("sub_strands")
              .insert({ tenant_id: tenantId, strand_id: strandIns.id, name: sub.name, sort_order: (ssi + 1) * 10 })
              .select("id").single();
            if (sserr || !subIns) throw sserr;
            const outs = sub.outcomes.map((d, oi) => ({ tenant_id: tenantId, sub_strand_id: subIns.id, description: d, sort_order: (oi + 1) * 10 }));
            if (outs.length) await supabase.from("learning_outcomes").insert(outs as any);
          }
        }
      }
      // Also seed core competencies + values via existing RPC
      await supabase.rpc("seed_cbc_competencies_and_values" as any, { _tenant: tenantId });
      toast({ title: "CBC curriculum seeded", description: `${seedGrade} loaded` });
      load();
    } catch (e: any) {
      toast({ title: "Seed failed", description: e?.message || "Unknown error", variant: "destructive" });
    } finally { setSeeding(false); }
  };

  const addArea = async () => {
    if (!tenantId || !newArea.name) return;
    const { error } = await supabase.from("learning_areas").insert({ ...newArea, tenant_id: tenantId, sort_order: (areas.length + 1) * 10 });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setNewArea({ code: "", name: "" });
    toast({ title: "Learning area added" });
    load();
  };
  const addStrand = async (areaId: string, name: string) => {
    await supabase.from("strands").insert({ tenant_id: tenantId!, learning_area_id: areaId, name, sort_order: (strands.filter((s) => s.learning_area_id === areaId).length + 1) * 10 });
    load();
  };
  const addSub = async (strandId: string, name: string) => {
    await supabase.from("sub_strands").insert({ tenant_id: tenantId!, strand_id: strandId, name, sort_order: (subs.filter((s) => s.strand_id === strandId).length + 1) * 10 });
    load();
  };
  const addOutcome = async (subId: string, description: string) => {
    await supabase.from("learning_outcomes").insert({ tenant_id: tenantId!, sub_strand_id: subId, description, sort_order: (outcomes.filter((o) => o.sub_strand_id === subId).length + 1) * 10 });
    load();
  };
  const delArea = async (id: string) => {
    const hasChildren = strands.some((s) => s.learning_area_id === id);
    if (hasChildren) return toast({ title: "Cannot delete", description: "Remove strands first.", variant: "destructive" });
    await supabase.from("learning_areas").delete().eq("id", id); load();
  };
  const delStrand = async (id: string) => {
    const hasChildren = subs.some((s) => s.strand_id === id);
    if (hasChildren) return toast({ title: "Cannot delete", description: "Remove sub-strands first.", variant: "destructive" });
    await supabase.from("strands").delete().eq("id", id); load();
  };
  const delSub = async (id: string) => {
    const hasChildren = outcomes.some((o) => o.sub_strand_id === id);
    if (hasChildren) return toast({ title: "Cannot delete", description: "Remove outcomes first.", variant: "destructive" });
    await supabase.from("sub_strands").delete().eq("id", id); load();
  };
  const delOutcome = async (id: string) => { await supabase.from("learning_outcomes").delete().eq("id", id); load(); };

  const filteredAreas = useMemo(() => {
    if (!search.trim()) return areas;
    const q = search.toLowerCase();
    const matchIds = new Set<string>();
    areas.forEach((a) => { if (a.name.toLowerCase().includes(q) || (a.code || "").toLowerCase().includes(q)) matchIds.add(a.id); });
    strands.forEach((s) => { if (s.name.toLowerCase().includes(q)) matchIds.add(s.learning_area_id); });
    subs.forEach((ss) => { const st = strands.find((s) => s.id === ss.strand_id); if (st && ss.name.toLowerCase().includes(q)) matchIds.add(st.learning_area_id); });
    outcomes.forEach((o) => {
      if (o.description.toLowerCase().includes(q)) {
        const ss = subs.find((s) => s.id === o.sub_strand_id);
        const st = ss && strands.find((s) => s.id === ss.strand_id);
        if (st) matchIds.add(st.learning_area_id);
      }
    });
    return areas.filter((a) => matchIds.has(a.id));
  }, [areas, strands, subs, outcomes, search]);

  const isEmpty = areas.length === 0;

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>CBC Curriculum</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Seed KICD curriculum for</div>
              <select className="border rounded px-2 py-1 text-sm bg-background" value={seedGrade} onChange={(e) => setSeedGrade(e.target.value)}>
                {["PP1","PP2","G1","G2","G3","G4","G5","G6","G7","G8","G9"].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <Button size="sm" onClick={seedKicd} disabled={seeding}>
              {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Seed
            </Button>
            <div className="flex-1" />
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-8 w-56" />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[200px_1fr_auto]">
            <Input placeholder="Code" value={newArea.code} onChange={(e) => setNewArea({ ...newArea, code: e.target.value })} />
            <Input placeholder="New learning area name" value={newArea.name} onChange={(e) => setNewArea({ ...newArea, name: e.target.value })} />
            <Button size="sm" onClick={addArea}><Plus className="h-4 w-4 mr-1" />Add area</Button>
          </div>

          {isEmpty ? (
            <div className="text-center py-12 border rounded-lg border-dashed space-y-2">
              <p className="text-sm font-medium">Set up your CBC curriculum</p>
              <p className="text-xs text-muted-foreground">Pick a grade level above and click <strong>Seed</strong>, or build manually below.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3 border rounded-lg overflow-hidden min-h-[400px]">
              {/* Pane 1: Learning Areas */}
              <div className="border-r divide-y">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase bg-muted/30">Learning areas</div>
                {filteredAreas.map((a) => {
                  const sCount = strands.filter((s) => s.learning_area_id === a.id).length;
                  const grade = grades.find((g) => g.id === a.grade_level_id);
                  return (
                    <button key={a.id} onClick={() => { setActiveArea(a.id); setActiveStrand(null); }} className={`w-full text-left px-3 py-2 hover:bg-muted/40 flex items-center justify-between ${activeArea === a.id ? "bg-muted/60" : ""}`}>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground flex gap-1 items-center">
                          {a.code && <span className="font-mono">{a.code}</span>}
                          {grade && <Badge variant="outline" className="text-[10px] px-1 py-0">{grade.code}</Badge>}
                          <span>· {sCount} strand{sCount === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); delArea(a.id); }} />
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Pane 2: Strands */}
              <div className="border-r divide-y">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase bg-muted/30">Strands</div>
                {activeArea ? (
                  <>
                    <AddInline placeholder="Add strand…" onAdd={(v) => addStrand(activeArea, v)} />
                    {strands.filter((s) => s.learning_area_id === activeArea).map((s) => {
                      const ssCount = subs.filter((x) => x.strand_id === s.id).length;
                      return (
                        <button key={s.id} onClick={() => setActiveStrand(s.id)} className={`w-full text-left px-3 py-2 hover:bg-muted/40 flex items-center justify-between ${activeStrand === s.id ? "bg-muted/60" : ""}`}>
                          <div>
                            <div className="text-sm">{s.name}</div>
                            <div className="text-[11px] text-muted-foreground">{ssCount} sub-strand{ssCount === 1 ? "" : "s"}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); delStrand(s.id); }} />
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </button>
                      );
                    })}
                  </>
                ) : <div className="px-3 py-4 text-xs text-muted-foreground">Select a learning area</div>}
              </div>
              {/* Pane 3: Sub-strands + outcomes */}
              <div className="divide-y">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase bg-muted/30">Sub-strands &amp; outcomes</div>
                {activeStrand ? (
                  <>
                    <AddInline placeholder="Add sub-strand…" onAdd={(v) => addSub(activeStrand, v)} />
                    {subs.filter((x) => x.strand_id === activeStrand).map((ss) => (
                      <div key={ss.id} className="px-3 py-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{ss.name}</div>
                          <Trash2 className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => delSub(ss.id)} />
                        </div>
                        <ul className="ml-2 space-y-1">
                          {outcomes.filter((o) => o.sub_strand_id === ss.id).map((o) => (
                            <li key={o.id} className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                              <span>• {o.description}</span>
                              <Trash2 className="h-3 w-3 shrink-0 cursor-pointer hover:text-destructive" onClick={() => delOutcome(o.id)} />
                            </li>
                          ))}
                        </ul>
                        <AddInline placeholder="Add learning outcome…" onAdd={(v) => addOutcome(ss.id, v)} compact />
                      </div>
                    ))}
                  </>
                ) : <div className="px-3 py-4 text-xs text-muted-foreground">Select a strand</div>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>CBC Core Competencies &amp; Values</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <CompetencyList title="Core competencies" defaults={DEFAULT_COMPETENCIES} items={comps} tenantId={tenantId!} table="core_competencies" onChange={load} />
          <CompetencyList title="Values" defaults={DEFAULT_VALUES} items={values} tenantId={tenantId!} table="cbc_values" onChange={load} />
        </CardContent>
      </Card>
    </div>
  );
}

function AddInline({ placeholder, onAdd, compact }: { placeholder: string; onAdd: (v: string) => void; compact?: boolean }) {
  const [v, setV] = useState("");
  return (
    <div className={`flex gap-1 ${compact ? "px-0" : "px-3 py-2"}`}>
      <Input placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} className="h-7 text-xs" />
      <Button size="sm" variant="outline" className="h-7" onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }}>Add</Button>
    </div>
  );
}

function CompetencyList({ title, defaults, items, tenantId, table, onChange }: { title: string; defaults: string[]; items: any[]; tenantId: string; table: string; onChange: () => void }) {
  const seed = async () => {
    const existing = new Set(items.map((i) => i.name));
    const toAdd = defaults.filter((d) => !existing.has(d)).map((name) => ({ tenant_id: tenantId, name }));
    if (toAdd.length === 0) return toast({ title: "All defaults already present" });
    const { error } = await supabase.from(table as any).insert(toAdd as any);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `${toAdd.length} added` });
    onChange();
  };
  const remove = async (id: string) => { await supabase.from(table as any).delete().eq("id", id); onChange(); };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <Button size="sm" variant="outline" onClick={seed}><Sparkles className="h-3 w-3 mr-1" />Seed defaults</Button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No {title.toLowerCase()} yet. Click seed to load KICD defaults.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-sm border rounded px-2 py-1">
              <span>{c.name}</span>
              <Trash2 className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => remove(c.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}