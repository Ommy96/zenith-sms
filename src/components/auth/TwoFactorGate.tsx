import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const SENSITIVE_ROLES = new Set([
  "super_admin",
  "school_admin",
  "principal",
  "bursar",
]);

/**
 * Gates protected routes behind a 2FA requirement for sensitive roles.
 * - Sensitive role + no verified TOTP factor  → /settings/security/2fa?required=1
 * - Sensitive role + AAL1 when AAL2 is needed → /login?step_up=1
 * - Everyone else                             → render children
 */
export function TwoFactorGate({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [need, setNeed] = useState<null | "enroll" | "step_up">(null);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) { setChecking(false); return; }
      const isSensitive = role ? SENSITIVE_ROLES.has(role) : false;
      if (!isSensitive) { setChecking(false); setNeed(null); return; }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = (factors?.totp ?? []).some((f: any) => f.status === "verified");
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!active) return;
      if (!verified) setNeed("enroll");
      else if (aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2") setNeed("step_up");
      else setNeed(null);
      setChecking(false);
    })();
    return () => { active = false; };
  }, [user, role]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (need === "enroll" && location.pathname !== "/settings/security/2fa") {
    return <Navigate to="/settings/security/2fa?required=1" replace />;
  }
  if (need === "step_up") {
    return <Navigate to="/login?step_up=1" replace />;
  }
  return <>{children}</>;
}