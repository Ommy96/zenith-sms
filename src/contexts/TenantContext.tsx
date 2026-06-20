import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface Tenant {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  primary_color: string | null;
  country_code: string;
  currency_code: string;
  timezone: string;
  locale: string;
  school_type: string | null;
  curriculum: string | null;
  subscription_plan: string;
  subscription_status: string;
  is_demo: boolean;
}

interface TenantContextType {
  tenant: Tenant | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  can: (perm: string) => boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null, permissions: [], loading: true, error: null, refresh: async () => {}, can: () => false,
});

export const useTenant = () => useContext(TenantContext);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, profile, role, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setTenant(null); setPermissions([]); setError(null); setLoading(false);
      return;
    }
    if (!profile?.tenant_id) {
      // User authenticated but no tenant assigned — RequireAuth will route to /onboarding.
      setTenant(null); setPermissions([]); setError(null); setLoading(false);
      return;
    }
    try {
      const tenantId = profile.tenant_id;
      const [{ data: t, error: tErr }, { data: perms, error: pErr }] = await Promise.all([
        supabase.from("tenants").select(
          "id, name, slug, logo_url, primary_color, country_code, currency_code, timezone, locale, school_type, curriculum, subscription_plan, subscription_status, is_demo"
        ).eq("id", tenantId).maybeSingle(),
        supabase.from("user_roles")
          .select("roles!inner(role_permissions(permissions(key)))")
          .eq("user_id", user.id),
      ]);
      if (tErr) throw tErr;
      if (pErr) throw pErr;
      setTenant(t as any);
      const keys = new Set<string>();
      (perms as any[] | null)?.forEach((ur) => {
        ur.roles?.role_permissions?.forEach((rp: any) => {
          if (rp.permissions?.key) keys.add(rp.permissions.key);
        });
      });
      setPermissions(Array.from(keys));
      setError(null);
    } catch (err: any) {
      console.error("[Tenant] load failed:", err);
      setError(err?.message || "Failed to load workspace");
      setTenant(null);
    } finally {
      setLoading(false);
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    }
  }, [user, profile?.tenant_id]);

  useEffect(() => {
    // Invariant 1: wait until auth has resolved before doing anything.
    if (authLoading) return;

    // If unauthenticated, resolve immediately — no tenant fetch.
    if (!user) {
      setTenant(null); setPermissions([]); setError(null); setLoading(false);
      return;
    }

    // Authed but profile not yet fetched — wait (auth context will populate it).
    if (!profile) {
      setLoading(true);
    } else {
      setLoading(true);
      load();
    }

    // Invariant 2: 5s hard timeout matching AuthContext.
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn("[Tenant] load timed out after 5s");
          setError((e) => e ?? "Workspace load timed out. Please try again.");
        }
        return false;
      });
    }, 5000);

    return () => {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    };
  }, [authLoading, user, profile, load]);

  const can = useCallback((perm: string) => {
    if (role === "super_admin" || role === "school_admin") return true;
    return permissions.includes(perm);
  }, [permissions, role]);

  return (
    <TenantContext.Provider value={{ tenant, permissions, loading, error, refresh: load, can }}>
      {children}
    </TenantContext.Provider>
  );
}