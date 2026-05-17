import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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
  refresh: () => Promise<void>;
  can: (perm: string) => boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null, permissions: [], loading: true, refresh: async () => {}, can: () => false,
});

export const useTenant = () => useContext(TenantContext);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, profile, role } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !profile?.tenant_id) {
      setTenant(null); setPermissions([]); setLoading(false);
      return;
    }
    const tenantId = profile.tenant_id;
    const [{ data: t }, { data: perms }] = await Promise.all([
      supabase.from("tenants").select(
        "id, name, slug, logo_url, primary_color, country_code, currency_code, timezone, locale, school_type, curriculum, subscription_plan, subscription_status, is_demo"
      ).eq("id", tenantId).maybeSingle(),
      supabase.from("user_roles")
        .select("roles!inner(role_permissions(permissions(key)))")
        .eq("user_id", user.id),
    ]);
    setTenant(t as any);
    const keys = new Set<string>();
    (perms as any[] | null)?.forEach((ur) => {
      ur.roles?.role_permissions?.forEach((rp: any) => {
        if (rp.permissions?.key) keys.add(rp.permissions.key);
      });
    });
    setPermissions(Array.from(keys));
    setLoading(false);
  }, [user, profile?.tenant_id]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const can = useCallback((perm: string) => {
    if (role === "super_admin" || role === "school_admin") return true;
    return permissions.includes(perm);
  }, [permissions, role]);

  return (
    <TenantContext.Provider value={{ tenant, permissions, loading, refresh: load, can }}>
      {children}
    </TenantContext.Provider>
  );
}