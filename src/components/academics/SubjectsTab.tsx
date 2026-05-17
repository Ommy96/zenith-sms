import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2 } from "lucide-react";

const CATEGORIES = ["core","elective","co_curricular","life_skills"];
const ASSESS = ["continuous","exam","both"];

export function SubjectsTab() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", name: "", category: "core", curriculum_tag: "", assessment_type: "both" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase.from("subjects").select("*").eq("tenant_id", tenantId).order("name");
    setRows(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!tenantId) return toast({ title: "No school selected", description: "Finish school setup first.", variant: "destructive" });
    if (!form.code || !form.name) return toast({ title: "Missing fields", description: "Enter a subject code and name.", variant: "destructive" });
    const { error } = await supabase.from("subjects").insert({ ...form, tenant_id: tenantId } as any);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setForm({ code: "", name: "", category: "core", curriculum_tag: "", assessment_type: "both" });
    load();
  };
  const remove = async (id: string) => { if (!confirm("Delete subject?")) return; await supabase.from("subjects").delete().eq("id", id); load(); };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle>Subjects</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-5">
          <Input placeholder="Code (MATH)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
          <select className="border rounded px-2 py-1 text-sm bg-background" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
          </select>
          <select className="border rounded px-2 py-1 text-sm bg-background" value={form.assessment_type} onChange={(e) => setForm({ ...form, assessment_type: e.target.value })}>
            {ASSESS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add subject</Button>
        <div className="grid gap-2 md:grid-cols-3">
          {rows.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <div className="font-medium">{s.name} <span className="text-xs text-muted-foreground">{s.code}</span></div>
                <div className="text-xs"><Badge variant="outline">{s.category}</Badge> <Badge variant="outline" className="ml-1">{s.assessment_type}</Badge></div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}