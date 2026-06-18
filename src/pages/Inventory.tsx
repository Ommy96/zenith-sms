import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, Truck, ClipboardList, FileText, Tag, Plus, AlertTriangle, Loader2, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import {
  useEntityList,
  EntityListSection,
  EntityFormDialog,
} from "@/components/scaffolding";

export default function Inventory() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Inventory & Procurement</h1>
        <p className="text-sm text-muted-foreground mt-1">Stores, stock, assets, requisitions and purchase orders.</p>
      </motion.div>
      {tenantId && (
        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="stock"><Package className="h-4 w-4 mr-2" />Stock</TabsTrigger>
            <TabsTrigger value="suppliers"><Truck className="h-4 w-4 mr-2" />Suppliers</TabsTrigger>
            <TabsTrigger value="requisitions"><ClipboardList className="h-4 w-4 mr-2" />Requisitions</TabsTrigger>
            <TabsTrigger value="po"><FileText className="h-4 w-4 mr-2" />Purchase Orders</TabsTrigger>
            <TabsTrigger value="assets"><Tag className="h-4 w-4 mr-2" />Assets</TabsTrigger>
          </TabsList>
          <TabsContent value="stock" className="mt-6"><StockTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="suppliers" className="mt-6"><SuppliersTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="requisitions" className="mt-6"><RequisitionsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="po" className="mt-6"><PurchaseOrdersTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="assets" className="mt-6"><AssetsTab tenantId={tenantId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function StockTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", category: "", unit: "unit", store_id: "", reorder_level: "0", unit_cost: "0", quantity_on_hand: "0" });
  const [move, setMove] = useState({ type: "in", qty: "", reason: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from("stock_items").select("*, stores(name)").eq("tenant_id", tenantId).order("name").limit(500),
      supabase.from("stores").select("id,name").eq("tenant_id", tenantId).order("name"),
    ]);
    setItems(a.data || []); setStores(b.data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    setSaving(true);
    const qty = parseFloat(form.quantity_on_hand) || 0;
    const { data: created, error } = await supabase.from("stock_items").insert({
      tenant_id: tenantId, name: form.name.trim(), sku: form.sku || null, category: form.category || null,
      unit: form.unit, store_id: form.store_id || null,
      reorder_level: parseFloat(form.reorder_level) || 0,
      unit_cost: parseFloat(form.unit_cost) || 0,
      quantity_on_hand: 0,
    }).select().single();
    if (!error && created && qty > 0) {
      await supabase.from("stock_movements").insert({
        tenant_id: tenantId, stock_item_id: created.id, movement_type: "in", quantity: qty,
        unit_cost: parseFloat(form.unit_cost) || 0, reason: "Opening stock",
      });
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Item created"); setOpen(false);
    setForm({ name: "", sku: "", category: "", unit: "unit", store_id: "", reorder_level: "0", unit_cost: "0", quantity_on_hand: "0" });
    load();
  };

  const recordMove = async () => {
    const qty = parseFloat(move.qty);
    if (!qty || qty <= 0) return toast.error("Quantity required");
    const { error } = await supabase.from("stock_movements").insert({
      tenant_id: tenantId, stock_item_id: moveOpen.id, movement_type: move.type as any,
      quantity: qty, reason: move.reason || null, unit_cost: moveOpen.unit_cost,
    });
    if (error) return toast.error(error.message);
    toast.success("Movement recorded");
    setMoveOpen(null); setMove({ type: "in", qty: "", reason: "" }); load();
  };

  const lowStock = items.filter(i => i.reorder_level > 0 && i.quantity_on_hand < i.reorder_level);

  return (
    <div className="space-y-4">
      {lowStock.length > 0 && (
        <Card className="p-4 bg-warning/5 border-warning/20 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div className="text-sm">
            <span className="font-medium">{lowStock.length} item{lowStock.length > 1 ? "s" : ""} below reorder level.</span>
            <span className="text-muted-foreground"> Draft requisitions auto-created.</span>
          </div>
        </Card>
      )}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{items.length} stock items</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> :
        items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">No stock items yet.</Card> :
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr><th className="text-left p-3">Item</th><th className="text-left p-3">Store</th>
                <th className="text-right p-3">On hand</th><th className="text-right p-3">Reorder</th>
                <th className="text-right p-3">Unit cost</th><th className="text-right p-3 w-0">Actions</th></tr>
            </thead>
            <tbody>
              {items.map(i => {
                const low = i.reorder_level > 0 && i.quantity_on_hand < i.reorder_level;
                return (
                  <tr key={i.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{i.sku || "—"} · {i.unit}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">{i.stores?.name || "—"}</td>
                    <td className={"p-3 text-right font-mono " + (low ? "text-destructive font-semibold" : "")}>
                      {Number(i.quantity_on_hand).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">{Number(i.reorder_level).toLocaleString()}</td>
                    <td className="p-3 text-right">{Number(i.unit_cost).toLocaleString()}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => setMoveOpen(i)}>Move</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Stock Item</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="text-xs">SKU</Label>
                <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label className="text-xs">Unit</Label>
                <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="kg, box, unit" /></div>
            </div>
            <div><Label className="text-xs">Store</Label>
              <Select value={form.store_id} onValueChange={v => setForm({ ...form, store_id: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Opening qty</Label>
                <Input type="number" value={form.quantity_on_hand} onChange={e => setForm({ ...form, quantity_on_hand: e.target.value })} /></div>
              <div><Label className="text-xs">Reorder at</Label>
                <Input type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} /></div>
              <div><Label className="text-xs">Unit cost</Label>
                <Input type="number" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} /></div>
            </div>
            {stores.length === 0 && <p className="text-xs text-muted-foreground">Tip: create stores from the database to track location.</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!moveOpen} onOpenChange={(o) => !o && setMoveOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Movement — {moveOpen?.name}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              {(["in", "out", "adjustment", "write_off"] as const).map(t => (
                <Button key={t} size="sm" variant={move.type === t ? "default" : "outline"} onClick={() => setMove({ ...move, type: t })}>
                  {t === "in" ? <ArrowDown className="h-4 w-4 mr-1" /> : t === "out" ? <ArrowUp className="h-4 w-4 mr-1" /> : null}
                  {t.replace("_", " ")}
                </Button>
              ))}
            </div>
            <div><Label className="text-xs">Quantity</Label>
              <Input type="number" value={move.qty} onChange={e => setMove({ ...move, qty: e.target.value })} /></div>
            <div><Label className="text-xs">Reason / reference</Label>
              <Input value={move.reason} onChange={e => setMove({ ...move, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={recordMove}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SuppliersTab({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "", payment_terms: "", tax_pin: "" });

  const { rows: items, loading, refresh } = useEntityList(async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name");
    if (error) throw error;
    return data ?? [];
  }, [tenantId]);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name required");
      return false;
    }
    const { error } = await supabase.from("suppliers").insert({ tenant_id: tenantId, ...form, name: form.name.trim() });
    if (error) throw error;
    toast.success("Supplier added");
    setForm({ name: "", contact_person: "", phone: "", email: "", payment_terms: "", tax_pin: "" });
    await refresh();
  };

  return (
    <>
      <EntityListSection
        loading={loading}
        rows={items}
        summary={`${items.length} suppliers`}
        emptyMessage="No suppliers yet."
        action={{ label: "Add Supplier", onClick: () => setOpen(true) }}
        renderList={(rows) => (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((s: any) => (
            <Card key={s.id} className="p-4">
              <div className="font-medium">{s.name}</div>
              {s.contact_person && <div className="text-sm text-muted-foreground">{s.contact_person}</div>}
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                {s.phone && <div>📞 {s.phone}</div>}
                {s.email && <div>✉️ {s.email}</div>}
                {s.payment_terms && <div>💳 {s.payment_terms}</div>}
              </div>
            </Card>
            ))}
          </div>
        )}
      />
      <EntityFormDialog
        open={open}
        onOpenChange={setOpen}
        title="Add Supplier"
        submitLabel="Add"
        onSubmit={save}
        size="sm"
      >
            <div><Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Contact person</Label>
              <Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label className="text-xs">Email</Label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Tax PIN</Label>
                <Input value={form.tax_pin} onChange={e => setForm({ ...form, tax_pin: e.target.value })} /></div>
              <div><Label className="text-xs">Payment terms</Label>
                <Input value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} placeholder="Net 30" /></div>
            </div>
      </EntityFormDialog>
    </>
  );
}

const REQ_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  submitted: "bg-primary/10 text-primary border-primary/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  ordered: "bg-accent text-accent-foreground border-border",
  closed: "bg-muted text-muted-foreground border-border",
};

function RequisitionsTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ department: "", justification: "", needed_by: "", description: "", quantity: "1", unit: "unit", unit_cost: "0" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("requisitions")
      .select("*, requisition_lines(*)").eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }).limit(100);
    setItems(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.description.trim()) return toast.error("Description required");
    setSaving(true);
    const qty = parseFloat(form.quantity) || 1;
    const cost = parseFloat(form.unit_cost) || 0;
    const { data: req, error } = await supabase.from("requisitions").insert({
      tenant_id: tenantId, department: form.department || null,
      justification: form.justification || null,
      needed_by: form.needed_by || null, status: "submitted",
      total_estimated: qty * cost,
    }).select().single();
    if (error || !req) { setSaving(false); return toast.error(error?.message || "Failed"); }
    await supabase.from("requisition_lines").insert({
      tenant_id: tenantId, requisition_id: req.id,
      description: form.description.trim(), quantity: qty,
      unit: form.unit, estimated_unit_cost: cost, estimated_total: qty * cost,
    });
    setSaving(false);
    toast.success("Requisition submitted");
    setOpen(false);
    setForm({ department: "", justification: "", needed_by: "", description: "", quantity: "1", unit: "unit", unit_cost: "0" });
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const upd: any = { status };
    if (status === "approved") { upd.approved_at = new Date().toISOString(); }
    const { error } = await supabase.from("requisitions").update(upd).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{items.length} requisitions</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />New Requisition</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> :
        items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">No requisitions yet.</Card> :
        <div className="space-y-2">
          {items.map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-sm font-medium">{r.requisition_number}</span>
                <Badge variant="outline" className={REQ_COLORS[r.status]}>{r.status}</Badge>
                {r.is_auto_generated && <Badge variant="outline">auto-reorder</Badge>}
                {r.department && <Badge variant="outline">{r.department}</Badge>}
                <span className="ml-auto text-sm font-medium">≈ {Number(r.total_estimated).toLocaleString()}</span>
              </div>
              {r.justification && <p className="text-sm text-muted-foreground line-clamp-2">{r.justification}</p>}
              <div className="text-xs text-muted-foreground mt-1">
                {r.requisition_lines?.length || 0} line{r.requisition_lines?.length === 1 ? "" : "s"}
                {r.needed_by && ` · Needed by ${new Date(r.needed_by).toLocaleDateString()}`}
              </div>
              <div className="flex gap-2 mt-3">
                {r.status === "draft" && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "submitted")}>Submit</Button>}
                {r.status === "submitted" && <>
                  <Button size="sm" onClick={() => setStatus(r.id, "approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}>Reject</Button>
                </>}
              </div>
            </Card>
          ))}
        </div>
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Requisition</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Department</Label>
                <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div><Label className="text-xs">Needed by</Label>
                <Input type="date" value={form.needed_by} onChange={e => setForm({ ...form, needed_by: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Item description *</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Qty</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><Label className="text-xs">Unit</Label>
                <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              <div><Label className="text-xs">Est. unit cost</Label>
                <Input type="number" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Justification</Label>
              <Textarea rows={3} value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const PO_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  approved: "bg-success/10 text-success border-success/20",
  sent: "bg-primary/10 text-primary border-primary/20",
  partially_received: "bg-warning/10 text-warning border-warning/20",
  received: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

function PurchaseOrdersTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplier_id: "", expected_date: "", description: "", quantity: "1", unit_cost: "0", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from("purchase_orders").select("*, suppliers(name), po_lines(*)").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(100),
      supabase.from("suppliers").select("id,name").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
    ]);
    setItems(a.data || []); setSuppliers(b.data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.supplier_id || !form.description.trim()) return toast.error("Supplier and item required");
    setSaving(true);
    const qty = parseFloat(form.quantity) || 1;
    const cost = parseFloat(form.unit_cost) || 0;
    const total = qty * cost;
    const { data: po, error } = await supabase.from("purchase_orders").insert({
      tenant_id: tenantId, supplier_id: form.supplier_id,
      expected_date: form.expected_date || null, notes: form.notes || null,
      subtotal: total, total: total, status: "draft",
    }).select().single();
    if (error || !po) { setSaving(false); return toast.error(error?.message || "Failed"); }
    await supabase.from("po_lines").insert({
      tenant_id: tenantId, po_id: po.id, description: form.description.trim(),
      quantity: qty, unit_cost: cost, line_total: total,
    });
    setSaving(false);
    toast.success("Purchase order created"); setOpen(false);
    setForm({ supplier_id: "", expected_date: "", description: "", quantity: "1", unit_cost: "0", notes: "" });
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const upd: any = { status };
    if (status === "approved") upd.approved_at = new Date().toISOString();
    const { error } = await supabase.from("purchase_orders").update(upd).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{items.length} purchase orders</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />New PO</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> :
        items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">No purchase orders yet.</Card> :
        <div className="space-y-2">
          {items.map(po => (
            <Card key={po.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-sm font-medium">{po.po_number}</span>
                <Badge variant="outline" className={PO_COLORS[po.status]}>{po.status.replace("_", " ")}</Badge>
                <Badge variant="outline">{po.suppliers?.name || "—"}</Badge>
                <span className="ml-auto font-medium">{Number(po.total).toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {po.po_lines?.length || 0} line{po.po_lines?.length === 1 ? "" : "s"}
                {po.expected_date && ` · Expected ${new Date(po.expected_date).toLocaleDateString()}`}
              </div>
              <div className="flex gap-2 mt-3">
                {po.status === "draft" && <Button size="sm" onClick={() => setStatus(po.id, "approved")}>Approve</Button>}
                {po.status === "approved" && <Button size="sm" variant="outline" onClick={() => setStatus(po.id, "sent")}>Mark Sent</Button>}
                {(po.status === "sent" || po.status === "partially_received") &&
                  <Button size="sm" variant="outline" onClick={() => setStatus(po.id, "received")}>Mark Received</Button>}
              </div>
            </Card>
          ))}
        </div>
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label className="text-xs">Supplier *</Label>
              <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Item *</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Qty</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><Label className="text-xs">Unit cost</Label>
                <Input type="number" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} /></div>
              <div><Label className="text-xs">Expected</Label>
                <Input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssetsTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ asset_tag: "", name: "", category: "", serial_number: "", location: "", purchase_date: "", purchase_cost: "0" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("assets").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(500);
    setItems(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.asset_tag.trim() || !form.name.trim()) return toast.error("Tag and name required");
    setSaving(true);
    const { error } = await supabase.from("assets").insert({
      tenant_id: tenantId, asset_tag: form.asset_tag.trim(), name: form.name.trim(),
      category: form.category || null, serial_number: form.serial_number || null,
      location: form.location || null, purchase_date: form.purchase_date || null,
      purchase_cost: parseFloat(form.purchase_cost) || 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Asset registered"); setOpen(false);
    setForm({ asset_tag: "", name: "", category: "", serial_number: "", location: "", purchase_date: "", purchase_cost: "0" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{items.length} assets</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Register Asset</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> :
        items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">No assets registered.</Card> :
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr><th className="text-left p-3">Tag</th><th className="text-left p-3">Name</th>
                <th className="text-left p-3">Category</th><th className="text-left p-3">Location</th>
                <th className="text-left p-3">Status</th><th className="text-right p-3">Cost</th></tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{a.asset_tag}</td>
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3 text-muted-foreground">{a.category || "—"}</td>
                  <td className="p-3 text-muted-foreground">{a.location || "—"}</td>
                  <td className="p-3"><Badge variant="outline">{a.status}</Badge></td>
                  <td className="p-3 text-right">{Number(a.purchase_cost || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      }
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Register Asset</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Asset tag *</Label>
                <Input value={form.asset_tag} onChange={e => setForm({ ...form, asset_tag: e.target.value })} placeholder="AST-0001" /></div>
              <div><Label className="text-xs">Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label className="text-xs">Serial #</Label>
                <Input value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Location</Label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Purchase date</Label>
                <Input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} /></div>
              <div><Label className="text-xs">Cost</Label>
                <Input type="number" value={form.purchase_cost} onChange={e => setForm({ ...form, purchase_cost: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Register"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}