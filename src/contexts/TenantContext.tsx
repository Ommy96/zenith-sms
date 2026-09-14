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
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

const TENANT_COLUMNS =
  "id, name, slug, logo_url, primary_color, country_code, currency_code, timezone, locale, school_type, curriculum, subscription_plan, subscription_status, is_demo, address, phone, email";

const LAST_TENANT_KEY = "zenith.last_tenant_id";

interface TenantContextType {
  /** Active tenant (null while loading or when the user has none). */
  tenant: Tenant | null;
  current_tenant: Tenant | null;
  available_tenants: Tenant[];
  switch_tenant: (tenantId: string) => void;
  user_permissions: string[];
  permissions: string[];
  roles: string[];
  has_permission: (permission: string) => boolean;
  can: (permission: string) => boolean;
  is_loading: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const noop = () => {};

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  current_tenant: null,
  available_tenants: [],
  switch_tenant: noop,
  user_permissions: [],
  permissions: [],
  roles: [],
  has_permission: () => false,
  can: () => false,
  is_loading: true,
  loading: true,
  error: null,
  refresh: async () => {},
});

export const useTenant = () => useContext(TenantContext);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setTenants([]); setTenant(null); setPermissions([]); setRoles([]); setError(null); setLoading(false);
      return;
    }
    try {
      const [{ data: memberships, error: mErr }, { data: roleRows, error: rErr }] = await Promise.all([
        supabase
          .from("user_tenants")
          .select(`tenant_id, is_active, tenants!inner(${TENANT_COLUMNS})`)
          .eq("user_id", user.id),
        supabase
          .from("user_roles")
          .select("tenant_id, roles!inner(name, role_permissions(permissions(name)))")
          .eq("user_id", user.id),
      ]);
      if (mErr) throw mErr;
      if (rErr) throw rErr;

      const list: Tenant[] = ((memberships as any[]) ?? [])
        .filter((m) => m.is_active !== false && m.tenants)
        .map((m) => m.tenants as Tenant);
      setTenants(list);

      const stored = typeof window !== "undefined" ? window.localStorage.getItem(LAST_TENANT_KEY) : null;
      const active = list.find((t) => t.id === stored) ?? list[0] ?? null;
      setTenant(active);
      if (active && typeof window !== "undefined") window.localStorage.setItem(LAST_TENANT_KEY, active.id);

      const roleNames = new Set<string>();
      const permKeys = new Set<string>();
      ((roleRows as any[]) ?? []).forEach((ur) => {
        const scoped = !ur.tenant_id || !active || ur.tenant_id === active.id;
        if (!ur.roles) return;
        if (ur.roles.name === "super_admin") roleNames.add("super_admin");
        if (!scoped) return;
        roleNames.add(ur.roles.name);
        (ur.roles.role_permissions ?? []).forEach((rp: any) => {
          if (rp.permissions?.name) permKeys.add(rp.permissions.name);
        });
      });
      setRoles(Array.from(roleNames));
      setPermissions(Array.from(permKeys));
      setError(null);
    } catch (err: any) {
      console.error("[Tenant] load failed:", err);
      setError(err?.message || "Failed to load workspace");
      setTenant(null);
    } finally {
      setLoading(false);
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setTenants([]); setTenant(null); setPermissions([]); setRoles([]); setError(null); setLoading(false);
      return;
    }
    setLoading(true);
    load();

    // Hard 5s timeout — never hang on a spinner.
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn("[Tenant] load timed out after 5s");
        return false;
      });
    }, 5000);

    return () => {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    };
  }, [authLoading, user, load]);

  const switch_tenant = useCallback((tenantId: string) => {
    const next = tenants.find((t) => t.id === tenantId);
    if (!next) return;
    if (typeof window !== "undefined") window.localStorage.setItem(LAST_TENANT_KEY, tenantId);
    setTenant(next);
    load();
  }, [tenants, load]);

  const has_permission = useCallback((perm: string) => {
    if (roles.includes("super_admin") || roles.includes("school_admin")) return true;
    return permissions.includes(perm);
  }, [permissions, roles]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        current_tenant: tenant,
        available_tenants: tenants,
        switch_tenant,
        user_permissions: permissions,
        permissions,
        roles,
        has_permission,
        can: has_permission,
        is_loading: loading,
        loading,
        error,
        refresh: load,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}
