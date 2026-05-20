import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PortalProfile() {
  const { signOut, user } = useAuth();
  const { children: kids } = usePortal();
  const navigate = useNavigate();
  const [guardian, setGuardian] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("guardians").select("*").eq("portal_user_id", user.id).maybeSingle()
      .then(({ data }) => setGuardian(data));
  }, [user?.id]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-1">
          <div className="text-xs uppercase text-muted-foreground tracking-wide">Parent / Guardian</div>
          <div className="text-xl font-bold">{guardian?.full_name || "—"}</div>
          <div className="text-sm text-muted-foreground">{guardian?.phone_primary}</div>
          <div className="text-sm text-muted-foreground">{guardian?.email}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Linked children ({kids.length})</h2>
          </div>
          <ul className="space-y-1 text-sm">
            {kids.map((k) => (
              <li key={k.id} className="flex items-center justify-between py-1">
                <span>{k.full_name}</span>
                <span className="text-xs text-muted-foreground">{k.admission_number}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full"
        onClick={async () => { await signOut(); navigate("/portal/login", { replace: true }); }}
      >
        <LogOut className="h-4 w-4 mr-2" /> Sign out
      </Button>
    </div>
  );
}