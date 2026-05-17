import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Plus, Trash2, Loader2, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

export default function Communication() {
  const { user, profile } = useAuth();
  const schoolId = profile?.tenant_id;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("all");
  const [priority, setPriority] = useState("medium");

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("tenant_id", schoolId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  const { data: waInbox = [] } = useQuery({
    queryKey: ["wa-inbox", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await (supabase as any)
        .from("whatsapp_messages")
        .select("id, from_phone, body, created_at, student_id, direction")
        .eq("tenant_id", schoolId)
        .eq("direction", "in")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId || !user) throw new Error("Not authenticated");
      const { error } = await supabase.from("announcements").insert({
        title,
        content,
        audience,
        priority,
        tenant_id: schoolId,
        author_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created");
      setDialogOpen(false);
      setTitle("");
      setContent("");
      setAudience("all");
      setPriority("medium");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = [
    { label: "Total", value: announcements.length },
    { label: "High Priority", value: announcements.filter((a) => a.priority === "high").length },
    { label: "For Parents", value: announcements.filter((a) => a.audience === "parents").length },
    { label: "For All", value: announcements.filter((a) => a.audience === "all").length },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Communication Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Announcements and notifications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> New Announcement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your announcement..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="parents">Parents</SelectItem>
                      <SelectItem value="teachers">Teachers</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending} className="w-full">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Announcement"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* WhatsApp inbox preview */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Recent WhatsApp messages</h2>
          </div>
          <Link to="/communication/whatsapp" className="text-xs text-primary inline-flex items-center gap-1">
            Open inbox <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {waInbox.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground">No incoming WhatsApp messages yet.</div>
        ) : (
          <ul className="divide-y">
            {waInbox.map((m: any) => (
              <li key={m.id} className="p-3 text-sm flex items-center gap-3">
                <Badge variant="outline" className="text-[10px]">WA</Badge>
                <span className="font-medium text-xs">{m.from_phone}</span>
                <span className="flex-1 truncate text-muted-foreground text-xs">{m.body}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Announcements list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No announcements yet. Create your first one!</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-card-foreground">{a.title}</p>
                  {a.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(a.created_at!).toLocaleDateString()} · {a.audience}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`text-[11px] ${priorityColors[a.priority || "medium"]}`}>
                  {a.priority || "medium"}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(a.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
