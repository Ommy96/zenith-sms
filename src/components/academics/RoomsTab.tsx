import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2 } from "lucide-react";

const TYPES = ["classroom","lab","hall","sports","library","other"];

export function RoomsTab() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "classroom", capacity: "" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase.from("rooms").select("*").eq("tenant_id", tenantId).order("name");
    setRows(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!tenantId || !form.name) return;
    const { error } = await supabase.from("rooms").insert({
      tenant_id: tenantId, name: form.name, type: form.type as any, capacity: form.capacity ? parseInt(form.capacity) : null,
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setForm({ name: "", type: "classroom", capacity: "" }); load();
  };
  const remove = async (id: string) => { if (!confirm("Delete room?")) return; await supabase.from("rooms").delete().eq("id", id); load(); };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle>Rooms</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-4">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
          <select className="border rounded px-2 py-1 text-sm bg-background" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Input placeholder="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </div>
        <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add room</Button>
        <div className="grid gap-2 md:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.type} {r.capacity && `• cap ${r.capacity}`}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}