import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortal } from "@/contexts/PortalContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck, Loader2, LogOut, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/portal/PortalStates";

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between gap-3 py-2"><span className="text-muted-foreground">{label}</span><span className="text-right">{value || "—"}</span></div>
);

export default function PortalProfile() {
  const { guardian, children: kids, activeChild, setActiveChildId, refresh } = usePortal();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const prefs = guardian?.metadata?.notification_prefs ?? {};
  const [editing, setEditing] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [address, setAddress] = useState("");
  const [wa, setWa] = useState(true);
  const [email, setEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOccupation(guardian?.occupation ?? ""); setAddress(guardian?.residential_address ?? "");
    setWa(prefs.whatsapp ?? true); setEmail(prefs.email ?? true);
  }, [guardian?.id]); // eslint-disable-line

  const save = async (next?: { whatsapp: boolean; email: boolean }) => {
    setSaving(true);
    const { data, error } = await supabase.rpc("portal_update_my_guardian" as any, {
      _occupation: occupation, _address: address, _prefs: next ?? { whatsapp: wa, email },
    });
    setSaving(false);
    if (error || !data) return toast.error("Couldn't save. Please try again.");
    toast.success("Saved"); setEditing(false); refresh();
  };
  const togglePref = (key: "whatsapp" | "email", v: boolean) => {
    const next = { whatsapp: key === "whatsapp" ? v : wa, email: key === "email" ? v : email };
    setWa(next.whatsapp); setEmail(next.email); save(next);
  };

  return (
    <div className="space-y-4 text-base">
      <PageTitle>Profile</PageTitle>

      <Card><CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My details</h2>
          {guardian && !editing && <Button variant="ghost" className="min-h-11" onClick={() => setEditing(true)}><Pencil className="mr-1 h-4 w-4" /> Edit</Button>}
        </div>
        {!guardian ? <p className="text-muted-foreground">Your guardian details aren't linked yet. Please contact the school.</p> : (
          <div className="divide-y">
            <Row label="Name" value={guardian.full_name} />
            <Row label="Relationship" value={guardian.relationship_default} />
            <div className="flex justify-between gap-3 py-2"><span className="text-muted-foreground">Phone</span>
              <span className="flex items-center gap-1">{guardian.phone_primary || "—"}
                <Badge variant="secondary" className="gap-1"><BadgeCheck className="h-3.5 w-3.5 text-success" />Verified</Badge></span></div>
            <Row label="Email" value={guardian.email} />
            {editing ? (
              <div className="space-y-3 pt-3">
                <div className="space-y-1"><Label className="text-base">Occupation</Label><Input className="h-12 text-base" value={occupation} onChange={(e) => setOccupation(e.target.value)} maxLength={120} /></div>
                <div className="space-y-1"><Label className="text-base">Address</Label><Input className="h-12 text-base" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} /></div>
                <div className="flex gap-2">
                  <Button variant="outline" className="min-h-11 flex-1" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button className="min-h-11 flex-1" disabled={saving} onClick={() => save()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
                </div>
              </div>
            ) : (<>
              <Row label="Occupation" value={guardian.occupation} />
              <Row label="Address" value={guardian.residential_address} />
            </>)}
          </div>
        )}
        <p className="mt-3 text-sm text-muted-foreground">To change your phone number or email, please contact the school office.</p>
      </CardContent></Card>

      <Card><CardContent className="p-4">
        <h2 className="mb-2 text-lg font-semibold">My children</h2>
        <div className="divide-y">
          {kids.map((k) => (
            <div key={k.id} className="flex items-center gap-3 py-3">
              <Avatar className="h-12 w-12">{k.photo_url && <AvatarImage src={k.photo_url} />}
                <AvatarFallback className="bg-primary/15 text-primary">{(k.first_name?.[0] || "") + (k.last_name?.[0] || "")}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{k.full_name}</p>
                <p className="text-sm text-muted-foreground"><span className="font-mono">{k.admission_number || "—"}</span> · {k.class_name || "No class"}</p>
              </div>
              {kids.length > 1 && (
                <Button variant={k.id === activeChild?.id ? "secondary" : "outline"} className="min-h-11" onClick={() => { setActiveChildId(k.id); navigate("/portal"); }}>
                  View
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent></Card>

      {guardian && (
        <Card><CardContent className="space-y-1 p-4">
          <h2 className="mb-1 text-lg font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">Fee reminders, payment confirmations and report card alerts.</p>
          <label className="flex min-h-12 items-center justify-between"><span>WhatsApp</span><Switch checked={wa} onCheckedChange={(v) => togglePref("whatsapp", v)} disabled={saving} /></label>
          <label className="flex min-h-12 items-center justify-between"><span>Email</span><Switch checked={email} onCheckedChange={(v) => togglePref("email", v)} disabled={saving} /></label>
          <label className="flex min-h-12 items-center justify-between opacity-60">
            <span>SMS <span className="block text-sm text-muted-foreground">SMS temporarily unavailable</span></span><Switch checked={false} disabled /></label>
        </CardContent></Card>
      )}

      <Button variant="outline" className="min-h-12 w-full text-base" onClick={async () => { await signOut(); navigate("/portal/login", { replace: true }); }}>
        <LogOut className="mr-2 h-5 w-5" /> Sign out
      </Button>
    </div>
  );
}
