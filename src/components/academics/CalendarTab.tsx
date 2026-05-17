import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, CheckCircle2, Trash2 } from "lucide-react";

type Year = { id: string; name: string; start_date: string; end_date: string; is_current: boolean };
type Term = { id: string; academic_year_id: string; name: string; start_date: string; end_date: string; is_current: boolean };

export function CalendarTab() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [years, setYears] = useState<Year[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [yForm, setYForm] = useState({ name: "", start_date: "", end_date: "" });
  const [tForm, setTForm] = useState({ academic_year_id: "", name: "", start_date: "", end_date: "" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: y }, { data: t }] = await Promise.all([
      supabase.from("academic_years").select("*").eq("tenant_id", tenantId).order("start_date", { ascending: false }),
      supabase.from("terms").select("*").eq("tenant_id", tenantId).order("start_date", { ascending: false }),
    ]);
    setYears((y as Year[]) || []);
    setTerms((t as Term[]) || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const addYear = async () => {
    if (!tenantId || !yForm.name || !yForm.start_date || !yForm.end_date) return;
    const { error } = await supabase.from("academic_years").insert({ ...yForm, tenant_id: tenantId });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setYForm({ name: "", start_date: "", end_date: "" });
    load();
  };
  const addTerm = async () => {
    if (!tenantId || !tForm.academic_year_id || !tForm.name) return;
    const { error } = await supabase.from("terms").insert({ ...tForm, tenant_id: tenantId });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setTForm({ academic_year_id: "", name: "", start_date: "", end_date: "" });
    load();
  };
  const setCurrentYear = async (id: string) => {
    if (!tenantId) return;
    await supabase.from("academic_years").update({ is_current: false }).eq("tenant_id", tenantId);
    await supabase.from("academic_years").update({ is_current: true }).eq("id", id);
    load();
  };
  const setCurrentTerm = async (id: string) => {
    if (!tenantId) return;
    await supabase.from("terms").update({ is_current: false }).eq("tenant_id", tenantId);
    await supabase.from("terms").update({ is_current: true }).eq("id", id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Academic Years</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="2026" value={yForm.name} onChange={(e) => setYForm({ ...yForm, name: e.target.value })} />
            <Input type="date" value={yForm.start_date} onChange={(e) => setYForm({ ...yForm, start_date: e.target.value })} />
            <Input type="date" value={yForm.end_date} onChange={(e) => setYForm({ ...yForm, end_date: e.target.value })} />
          </div>
          <Button size="sm" onClick={addYear}><Plus className="h-4 w-4 mr-1" />Add year</Button>
          <div className="space-y-1 mt-3">
            {years.map((y) => (
              <div key={y.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="font-medium">{y.name} {y.is_current && <Badge variant="secondary" className="ml-2">Current</Badge>}</div>
                  <div className="text-xs text-muted-foreground">{y.start_date} → {y.end_date}</div>
                </div>
                {!y.is_current && <Button size="sm" variant="outline" onClick={() => setCurrentYear(y.id)}><CheckCircle2 className="h-3 w-3 mr-1" />Set current</Button>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Terms</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select className="border rounded px-2 py-1 text-sm bg-background" value={tForm.academic_year_id} onChange={(e) => setTForm({ ...tForm, academic_year_id: e.target.value })}>
              <option value="">Select year…</option>
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <Input placeholder="Term 1" value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} />
            <Input type="date" value={tForm.start_date} onChange={(e) => setTForm({ ...tForm, start_date: e.target.value })} />
            <Input type="date" value={tForm.end_date} onChange={(e) => setTForm({ ...tForm, end_date: e.target.value })} />
          </div>
          <Button size="sm" onClick={addTerm}><Plus className="h-4 w-4 mr-1" />Add term</Button>
          <div className="space-y-1 mt-3">
            {terms.map((t) => {
              const y = years.find((yr) => yr.id === t.academic_year_id);
              return (
                <div key={t.id} className="flex items-center justify-between rounded border p-2">
                  <div>
                    <div className="font-medium">{t.name} <span className="text-muted-foreground text-xs">({y?.name})</span> {t.is_current && <Badge variant="secondary" className="ml-2">Current</Badge>}</div>
                    <div className="text-xs text-muted-foreground">{t.start_date} → {t.end_date}</div>
                  </div>
                  {!t.is_current && <Button size="sm" variant="outline" onClick={() => setCurrentTerm(t.id)}><CheckCircle2 className="h-3 w-3 mr-1" />Set current</Button>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}