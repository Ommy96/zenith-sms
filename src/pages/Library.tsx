import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, BookOpen, ScanLine, Loader2, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export default function Library() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Library</h1>
        <p className="text-sm text-muted-foreground mt-1">Catalog, checkouts, returns and fines.</p>
      </motion.div>
      {tenantId && (
        <Tabs defaultValue="catalog" className="w-full">
          <TabsList>
            <TabsTrigger value="catalog"><BookOpen className="h-4 w-4 mr-2" />Catalog</TabsTrigger>
            <TabsTrigger value="loans"><ScanLine className="h-4 w-4 mr-2" />Checkouts</TabsTrigger>
          </TabsList>
          <TabsContent value="catalog" className="mt-6"><CatalogTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="loans" className="mt-6"><LoansTab tenantId={tenantId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function CatalogTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", author: "", isbn: "", barcode: "", category: "", location: "", total_copies: "1",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("library_items").select("*")
      .eq("tenant_id", tenantId).order("title").limit(500);
    setItems(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    const copies = parseInt(form.total_copies) || 1;
    const { error } = await supabase.from("library_items").insert({
      tenant_id: tenantId,
      title: form.title.trim(),
      author: form.author || null,
      isbn: form.isbn || null,
      barcode: form.barcode || null,
      category: form.category || null,
      location: form.location || null,
      total_copies: copies,
      available_copies: copies,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Item added");
    setOpen(false);
    setForm({ title: "", author: "", isbn: "", barcode: "", category: "", location: "", total_copies: "1" });
    load();
  };

  const filtered = items.filter(i =>
    !q || i.title?.toLowerCase().includes(q.toLowerCase()) ||
    i.author?.toLowerCase().includes(q.toLowerCase()) ||
    i.isbn?.includes(q) || i.barcode?.includes(q)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search title, author, ISBN, barcode" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No items found.</Card>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr><th className="text-left p-3">Title</th><th className="text-left p-3">Author</th>
                  <th className="text-left p-3">Category</th><th className="text-left p-3">Barcode</th>
                  <th className="text-left p-3">Location</th><th className="text-right p-3">Available</th></tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="p-3 font-medium">{i.title}</td>
                    <td className="p-3 text-muted-foreground">{i.author || "—"}</td>
                    <td className="p-3"><Badge variant="outline">{i.category || "—"}</Badge></td>
                    <td className="p-3 font-mono text-xs">{i.barcode || "—"}</td>
                    <td className="p-3 text-muted-foreground">{i.location || "—"}</td>
                    <td className="p-3 text-right">
                      <span className={i.available_copies === 0 ? "text-destructive font-medium" : ""}>
                        {i.available_copies}/{i.total_copies}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Library Item</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Author</Label>
                <Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} /></div>
              <div><Label className="text-xs">Category</Label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Fiction, Science…" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">ISBN</Label>
                <Input value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} /></div>
              <div><Label className="text-xs">Barcode</Label>
                <Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Location</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Shelf A3" /></div>
              <div><Label className="text-xs">Copies</Label>
                <Input type="number" min="1" value={form.total_copies} onChange={e => setForm({ ...form, total_copies: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoansTab({ tenantId }: { tenantId: string }) {
  const [loans, setLoans] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scan, setScan] = useState("");
  const [form, setForm] = useState({ item_id: "", student_id: "", due_date: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const due = new Date(); due.setDate(due.getDate() + 14);
    setForm(f => ({ ...f, due_date: f.due_date || due.toISOString().slice(0, 10) }));
    const [a, b, c] = await Promise.all([
      supabase.from("library_loans").select("*, library_items(title,author,barcode), students(first_name,last_name,admission_number)")
        .eq("tenant_id", tenantId).order("checked_out_at", { ascending: false }).limit(100),
      supabase.from("library_items").select("id,title,author,barcode,available_copies")
        .eq("tenant_id", tenantId).gt("available_copies", 0).order("title").limit(500),
      supabase.from("students").select("id,first_name,last_name,admission_number")
        .eq("tenant_id", tenantId).eq("status", "active").order("first_name").limit(500),
    ]);
    setLoans(a.data || []); setItems(b.data || []); setStudents(c.data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const handleScan = (val: string) => {
    setScan(val);
    const match = items.find(i => i.barcode === val.trim());
    if (match) {
      setForm(f => ({ ...f, item_id: match.id }));
      toast.success(`Selected: ${match.title}`);
      setScan("");
    }
  };

  const checkout = async () => {
    if (!form.item_id || !form.student_id) return toast.error("Item & borrower required");
    setSaving(true);
    const { error } = await supabase.from("library_loans").insert({
      tenant_id: tenantId, item_id: form.item_id, borrower_type: "student",
      student_id: form.student_id, due_date: form.due_date, status: "active",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Checked out");
    setOpen(false); setForm({ item_id: "", student_id: "", due_date: form.due_date }); load();
  };

  const returnLoan = async (id: string, due: string) => {
    const overdue = new Date(due) < new Date();
    const days = overdue ? Math.ceil((Date.now() - new Date(due).getTime()) / 86400000) : 0;
    const fine = days * 10;
    const { error } = await supabase.from("library_loans").update({
      status: "returned", returned_at: new Date().toISOString(), fine_amount: fine,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(fine > 0 ? `Returned. Fine: KES ${fine}` : "Returned");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{loans.filter(l => l.status === "active").length} active checkouts</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Check Out</Button>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> :
        loans.length === 0 ? <Card className="p-12 text-center text-muted-foreground">No loans yet.</Card> :
        <div className="space-y-2">
          {loans.map(l => {
            const overdue = l.status === "active" && new Date(l.due_date) < new Date();
            return (
              <Card key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{l.library_items?.title}</span>
                    <Badge variant="outline">{l.students?.first_name} {l.students?.last_name}</Badge>
                    {l.status === "active" && !overdue && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Active</Badge>}
                    {l.status === "active" && overdue && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>}
                    {l.status === "returned" && <Badge variant="outline" className="bg-success/10 text-success border-success/20">Returned</Badge>}
                    {l.fine_amount > 0 && <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Fine: {l.fine_amount}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Due {new Date(l.due_date).toLocaleDateString()}
                    {l.returned_at && ` · Returned ${new Date(l.returned_at).toLocaleDateString()}`}
                  </p>
                </div>
                {l.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => returnLoan(l.id, l.due_date)}>Return</Button>
                )}
              </Card>
            );
          })}
        </div>
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Check Out Book</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label className="text-xs">Scan barcode</Label>
              <Input autoFocus placeholder="Scan or type barcode then Enter"
                value={scan} onChange={e => handleScan(e.target.value)} /></div>
            <div><Label className="text-xs">Or select item *</Label>
              <Select value={form.item_id} onValueChange={v => setForm({ ...form, item_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger>
                <SelectContent>
                  {items.map(i => <SelectItem key={i.id} value={i.id}>{i.title} ({i.available_copies} avail)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Borrower *</Label>
              <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Due date</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={checkout} disabled={saving}>{saving ? "Saving…" : "Check Out"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}