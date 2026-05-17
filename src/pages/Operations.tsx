import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bus, Library, Package, MapPin, BookOpen, Box, Truck, Clock,
  Plus, Trash2, Loader2, Edit, MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  maintenance: "bg-warning/10 text-warning border-warning/20",
  available: "bg-success/10 text-success border-success/20",
  issued: "bg-primary/10 text-primary border-primary/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  good: "bg-success/10 text-success border-success/20",
  fair: "bg-warning/10 text-warning border-warning/20",
  poor: "bg-destructive/10 text-destructive border-destructive/20",
  low_stock: "bg-warning/10 text-warning border-warning/20",
};

// ─── Transport ───
function TransportSection({ schoolId }: { schoolId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: "", vehicle_number: "", driver_name: "", student_count: "0", avg_trip_minutes: "", status: "active" });
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("transport_routes").select("*").eq("tenant_id", schoolId).order("name");
    setItems(data || []);
    setLoading(false);
  }, [schoolId]);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setEditing(null); setForm({ name: "", vehicle_number: "", driver_name: "", student_count: "0", avg_trip_minutes: "", status: "active" }); setDialogOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ name: r.name, vehicle_number: r.vehicle_number || "", driver_name: r.driver_name || "", student_count: String(r.student_count || 0), avg_trip_minutes: String(r.avg_trip_minutes || ""), status: r.status }); setDialogOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { tenant_id: schoolId, name: form.name.trim(), vehicle_number: form.vehicle_number || null, driver_name: form.driver_name || null, student_count: parseInt(form.student_count) || 0, avg_trip_minutes: parseInt(form.avg_trip_minutes) || null, status: form.status };
    if (editing) await supabase.from("transport_routes").update(payload).eq("id", editing.id);
    else await supabase.from("transport_routes").insert(payload);
    setSaving(false); setDialogOpen(false); fetch(); toast.success(editing ? "Route updated" : "Route added");
  };

  const del = async () => { if (!deleteTarget) return; await supabase.from("transport_routes").delete().eq("id", deleteTarget.id); setDeleteTarget(null); fetch(); toast.success("Route deleted"); };

  const totalStudents = items.reduce((s, i) => s + (i.student_count || 0), 0);
  const avgTrip = items.length > 0 ? Math.round(items.reduce((s, i) => s + (i.avg_trip_minutes || 0), 0) / items.length) : 0;
  const stats = [
    { label: "Active Routes", value: String(items.filter(i => i.status === "active").length), icon: MapPin },
    { label: "Vehicles", value: String(items.length), icon: Truck },
    { label: "Students Using", value: String(totalStudents), icon: Bus },
    { label: "Avg Trip Time", value: avgTrip ? `${avgTrip} min` : "—", icon: Clock },
  ];

  return (
    <OperationsLayout title="Transport Management" icon={Bus} stats={stats} loading={loading} items={items} onAdd={openAdd}
      renderItem={(item) => ({
        name: item.name,
        detail: `${item.vehicle_number || "No vehicle"} · ${item.student_count || 0} students · Driver: ${item.driver_name || "Unassigned"}`,
        status: item.status,
      })}
      onEdit={openEdit} onDelete={setDeleteTarget}
    >
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Route" : "Add Route"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-3">
            <div><Label className="text-xs">Route Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Vehicle #</Label><Input value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></div>
              <div><Label className="text-xs">Driver</Label><Input value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Students</Label><Input type="number" value={form.student_count} onChange={e => setForm({ ...form, student_count: e.target.value })} /></div>
              <div><Label className="text-xs">Avg Trip (min)</Label><Input type="number" value={form.avg_trip_minutes} onChange={e => setForm({ ...form, avg_trip_minutes: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={del} label={deleteTarget?.name} />
    </OperationsLayout>
  );
}

// ─── Library ───
function LibrarySection({ schoolId }: { schoolId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ title: "", isbn: "", shelf_location: "", status: "available", issued_to: "", due_date: "" });
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("library_books").select("*").eq("tenant_id", schoolId).order("title");
    setItems(data || []);
    setLoading(false);
  }, [schoolId]);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setEditing(null); setForm({ title: "", isbn: "", shelf_location: "", status: "available", issued_to: "", due_date: "" }); setDialogOpen(true); };
  const openEdit = (b: any) => { setEditing(b); setForm({ title: b.title, isbn: b.isbn || "", shelf_location: b.shelf_location || "", status: b.status, issued_to: b.issued_to || "", due_date: b.due_date || "" }); setDialogOpen(true); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { tenant_id: schoolId, title: form.title.trim(), isbn: form.isbn || null, shelf_location: form.shelf_location || null, status: form.status, issued_to: form.issued_to || null, due_date: form.due_date || null };
    if (editing) await supabase.from("library_books").update(payload).eq("id", editing.id);
    else await supabase.from("library_books").insert(payload);
    setSaving(false); setDialogOpen(false); fetch(); toast.success(editing ? "Book updated" : "Book added");
  };

  const del = async () => { if (!deleteTarget) return; await supabase.from("library_books").delete().eq("id", deleteTarget.id); setDeleteTarget(null); fetch(); toast.success("Book deleted"); };

  const issued = items.filter(i => i.status === "issued").length;
  const overdueCount = items.filter(i => i.status === "overdue").length;
  const stats = [
    { label: "Total Books", value: String(items.length), icon: BookOpen },
    { label: "Issued", value: String(issued), icon: Library },
    { label: "Overdue", value: String(overdueCount), icon: Clock },
    { label: "Available", value: String(items.filter(i => i.status === "available").length), icon: Box },
  ];

  return (
    <OperationsLayout title="Library Management" icon={Library} stats={stats} loading={loading} items={items} onAdd={openAdd}
      renderItem={(item) => ({
        name: item.title,
        detail: `${item.isbn ? `ISBN: ${item.isbn}` : "No ISBN"} · ${item.shelf_location ? `Shelf: ${item.shelf_location}` : ""}${item.issued_to ? ` · Issued to: ${item.issued_to}` : ""}`,
        status: item.status,
      })}
      onEdit={openEdit} onDelete={setDeleteTarget}
    >
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Book" : "Add Book"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-3">
            <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">ISBN</Label><Input value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} /></div>
              <div><Label className="text-xs">Shelf</Label><Input value={form.shelf_location} onChange={e => setForm({ ...form, shelf_location: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="issued">Issued</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Issued To</Label><Input value={form.issued_to} onChange={e => setForm({ ...form, issued_to: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={del} label={deleteTarget?.title} />
    </OperationsLayout>
  );
}

// ─── Inventory ───
function InventorySection({ schoolId }: { schoolId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: "", category: "", quantity: "1", location: "", condition: "good", value: "0" });
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("inventory_assets").select("*").eq("tenant_id", schoolId).order("name");
    setItems(data || []);
    setLoading(false);
  }, [schoolId]);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setEditing(null); setForm({ name: "", category: "", quantity: "1", location: "", condition: "good", value: "0" }); setDialogOpen(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ name: a.name, category: a.category || "", quantity: String(a.quantity || 1), location: a.location || "", condition: a.condition, value: String(a.value || 0) }); setDialogOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { tenant_id: schoolId, name: form.name.trim(), category: form.category || null, quantity: parseInt(form.quantity) || 1, location: form.location || null, condition: form.condition, value: parseFloat(form.value) || 0 };
    if (editing) await supabase.from("inventory_assets").update(payload).eq("id", editing.id);
    else await supabase.from("inventory_assets").insert(payload);
    setSaving(false); setDialogOpen(false); fetch(); toast.success(editing ? "Asset updated" : "Asset added");
  };

  const del = async () => { if (!deleteTarget) return; await supabase.from("inventory_assets").delete().eq("id", deleteTarget.id); setDeleteTarget(null); fetch(); toast.success("Asset deleted"); };

  const totalValue = items.reduce((s, i) => s + Number(i.value || 0), 0);
  const categories = new Set(items.map(i => i.category).filter(Boolean));
  const lowStock = items.filter(i => (i.quantity || 0) <= 5).length;
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  const stats = [
    { label: "Total Assets", value: String(items.reduce((s, i) => s + (i.quantity || 0), 0)), icon: Package },
    { label: "Categories", value: String(categories.size), icon: Box },
    { label: "Low Stock", value: String(lowStock), icon: Clock },
    { label: "Total Value", value: fmt(totalValue), icon: Box },
  ];

  return (
    <OperationsLayout title="Inventory & Assets" icon={Package} stats={stats} loading={loading} items={items} onAdd={openAdd}
      renderItem={(item) => ({
        name: item.name,
        detail: `${item.quantity || 0} items · ${item.category || "Uncategorized"} · ${item.location || "No location"}`,
        status: item.condition,
      })}
      onEdit={openEdit} onDelete={setDeleteTarget}
    >
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Asset" : "Add Asset"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label className="text-xs">Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label className="text-xs">Value ($)</Label><Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Condition</Label>
              <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="good">Good</SelectItem><SelectItem value="fair">Fair</SelectItem><SelectItem value="poor">Poor</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={del} label={deleteTarget?.name} />
    </OperationsLayout>
  );
}

// ─── Shared Layout ───
function OperationsLayout({ title, icon: Icon, stats, loading, items, onAdd, renderItem, onEdit, onDelete, children }: {
  title: string; icon: any; stats: { label: string; value: string; icon: any }[];
  loading: boolean; items: any[]; onAdd: () => void;
  renderItem: (item: any) => { name: string; detail: string; status: string };
  onEdit: (item: any) => void; onDelete: (item: any) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor {title.toLowerCase()}</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={onAdd}><Plus className="h-3.5 w-3.5" /> Add New</Button>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Icon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No items yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const rendered = renderItem(item);
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{rendered.name}</p>
                    <p className="text-xs text-muted-foreground">{rendered.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[11px] shrink-0 capitalize ${statusColors[rendered.status] || ""}`}>{rendered.status.replace("_", " ")}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-sm gap-2" onClick={() => onEdit(item)}><Edit className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-sm gap-2 text-destructive" onClick={() => onDelete(item)}><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Delete Dialog ───
function DeleteDialog({ target, onClose, onConfirm, label }: { target: any; onClose: () => void; onConfirm: () => void; label?: string }) {
  return (
    <AlertDialog open={!!target} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Item</AlertDialogTitle>
          <AlertDialogDescription>Delete "{label}"? This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Export ───
export default function Operations() {
  const location = useLocation();
  const { profile } = useAuth();
  const schoolId = profile?.tenant_id;

  if (!schoolId) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (location.pathname === "/transport") return <TransportSection schoolId={schoolId} />;
  if (location.pathname === "/library") return <LibrarySection schoolId={schoolId} />;
  if (location.pathname === "/inventory") return <InventorySection schoolId={schoolId} />;

  return null;
}
