import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Check, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const CATEGORIES = ["financial", "attendance", "academic", "communication", "system"] as const;
const CHANNELS = ["in_app", "email", "sms", "whatsapp"] as const;

export default function PortalNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: notifs }, { data: pref }] = await Promise.all([
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setItems(notifs || []);
      setPrefs(pref || null);
      setLoading(false);
    })();
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setItems((xs) => xs.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const togglePref = (cat: string, ch: string, val: boolean) => {
    setPrefs((p: any) => ({
      ...(p || { user_id: user!.id, preferences: {}, quiet_hours_enabled: true }),
      preferences: { ...(p?.preferences || {}), [cat]: { ...(p?.preferences?.[cat] || {}), [ch]: val } },
    }));
  };

  const savePrefs = async () => {
    if (!user || !prefs) return;
    setSaving(true);
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: user.id, preferences: prefs.preferences,
      quiet_hours_enabled: prefs.quiet_hours_enabled ?? true,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Preferences saved");
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold">Notifications</h1>
        <p className="text-xs text-muted-foreground">Activity and preferences</p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="prefs">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto opacity-40 mb-2" /> No notifications yet
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <li key={n.id} className={`rounded-xl border bg-card p-3 ${!n.read_at ? "border-primary/40" : ""}`}>
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{n.title}</div>
                      {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">{n.category} · {new Date(n.created_at).toLocaleString()}</div>
                    </div>
                    {!n.read_at && (
                      <button onClick={() => markRead(n.id)} className="text-muted-foreground"><Check className="h-4 w-4" /></button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="prefs" className="mt-3 space-y-4">
          <div className="rounded-xl border bg-card p-3 text-xs text-muted-foreground">
            Choose which channels deliver each category of notification.
          </div>
          {CATEGORIES.map((cat) => (
            <div key={cat} className="rounded-xl border bg-card p-4">
              <div className="text-sm font-semibold capitalize mb-3">{cat}</div>
              <div className="space-y-2">
                {CHANNELS.map((ch) => (
                  <div key={ch} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{ch.replace("_", " ")}</span>
                    <Switch
                      checked={!!prefs?.preferences?.[cat]?.[ch]}
                      onCheckedChange={(v) => togglePref(cat, ch, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button className="w-full" onClick={savePrefs} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save preferences
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}