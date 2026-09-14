import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, School, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Holding page for a fresh sign-up whose school hasn't been created yet. */
export default function Provisioning() {
  const { user, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading, refresh } = useTenant();
  const navigate = useNavigate();
  const [schoolName, setSchoolName] = useState(
    sessionStorage.getItem("zenith.pending_school_name") ??
      (user?.user_metadata?.requested_school_name as string) ?? "",
  );
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth/login", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (tenant) navigate("/setup", { replace: true });
  }, [tenant, navigate]);

  useEffect(() => {
    const name = schoolName.trim();
    if (attempted.current || !user || tenantLoading || tenant || !name) return;
    attempted.current = true;
    void provision(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tenantLoading, tenant, schoolName]);

  const provision = async (name: string) => {
    setWorking(true);
    setFailed(null);
    const { data, error } = await supabase.functions.invoke("create-tenant", {
      body: { school_name: name, requested_by_user_id: user?.id },
    });
    setWorking(false);
    if (error || (data as any)?.error) {
      const message = (data as any)?.error ?? error?.message ?? "Something went wrong";
      setFailed(message);
      return;
    }
    sessionStorage.removeItem("zenith.pending_school_name");
    await refresh();
    toast.success("Your school is ready", { duration: 3000 });
    navigate("/setup", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            {failed ? <AlertTriangle className="h-6 w-6 text-destructive" /> : <School className="h-6 w-6 text-primary" />}
          </div>
          <CardTitle className="text-xl">
            {failed ? "We couldn't create your school" : working ? "Setting up your school" : "Name your school"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {working ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> This only takes a moment…
            </div>
          ) : (
            <>
              {failed && <p className="text-sm text-destructive">{failed}</p>}
              <p className="text-sm text-muted-foreground">
                Your account isn't linked to a school yet. Enter your school's name to finish setting up.
              </p>
              <div className="space-y-2">
                <Label>School name</Label>
                <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Karama Academy" />
              </div>
              <Button className="w-full" disabled={!schoolName.trim()} onClick={() => provision(schoolName.trim())}>
                Create my school
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            className="w-full"
            onClick={async () => { await supabase.auth.signOut(); navigate("/auth/login", { replace: true }); }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
