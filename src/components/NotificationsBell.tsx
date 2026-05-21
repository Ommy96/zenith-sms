import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface NotifRow {
  id: string;
  title: string;
  body: string | null;
  category: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationsBell({ portal = false }: { portal?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const unread = items.filter((n) => !n.read_at).length;

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, category, action_url, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`notif:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line
  }, [user?.id]);

  const markOne = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setItems((xs) => xs.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };
  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id).is("read_at", null);
    setItems((xs) => xs.map((n) => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
  };

  const handleClick = (n: NotifRow) => {
    if (!n.read_at) markOne(n.id);
    if (n.action_url) navigate(n.action_url);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={portal ? "h-9 w-9" : "h-9 w-9 rounded-lg relative"}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="text-sm font-semibold">Notifications</div>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="p-6 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No notifications yet</div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition ${!n.read_at ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      {n.body && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>}
                      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
                        {n.category} · {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    {!n.read_at && (
                      <button onClick={(e) => { e.stopPropagation(); markOne(n.id); }} className="text-muted-foreground hover:text-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}