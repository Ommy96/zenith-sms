import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface PortalChild {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  admission_number: string | null;
  photo_url: string | null;
  tenant_id: string;
  current_class_id: string | null;
  stream: string | null;
  class_name: string | null;
}

export interface PortalGuardian {
  id: string;
  full_name: string;
  preferred_name: string | null;
  phone_primary: string | null;
  email: string | null;
  occupation: string | null;
  residential_address: string | null;
  relationship_default: string | null;
  metadata: any;
}

export interface PortalSchool { name: string; logo_url: string | null; currency_code: string | null }

interface PortalContextType {
  isPortalUser: boolean;
  children: PortalChild[];
  activeChild: PortalChild | null;
  guardian: PortalGuardian | null;
  school: PortalSchool | null;
  currency: string;
  setActiveChildId: (id: string) => void;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
}

const PortalContext = createContext<PortalContextType>({
  isPortalUser: false, children: [], activeChild: null, guardian: null, school: null, currency: "KES",
  setActiveChildId: () => {}, loading: true, error: false, refresh: async () => {},
});

export const usePortal = () => useContext(PortalContext);

export function PortalProvider({ children: kids }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalChild[]>([]);
  const [guardian, setGuardian] = useState<PortalGuardian | null>(null);
  const [school, setSchool] = useState<PortalSchool | null>(null);
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem("portal_active_child"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true); setError(false);
    // RLS limits both lists to this parent's own record and linked children.
    const [{ data, error: sErr }, { data: g }] = await Promise.all([
      supabase.from("students")
        .select("id, first_name, last_name, admission_number, photo_url, tenant_id, current_class_id, stream, classes:current_class_id(name)"),
      supabase.from("guardians")
        .select("id, full_name, preferred_name, phone_primary, email, occupation, residential_address, relationship_default, metadata")
        .eq("portal_user_id", user.id).maybeSingle(),
    ]);
    if (sErr) { setError(true); setLoading(false); return; }
    const list: PortalChild[] = (data || []).map((s: any) => ({
      ...s, class_name: s.classes?.name ?? null,
      full_name: [s.first_name, s.last_name].filter(Boolean).join(" "),
    }));
    setItems(list);
    setGuardian((g as any) ?? null);
    const tenant = list[0]?.tenant_id;
    if (tenant) {
      const { data: info } = await supabase.rpc("portal_school_info" as any, { _tenant: tenant });
      setSchool(((info as any[]) || [])[0] ?? null);
    }
    if (list.length && (!activeId || !list.find((c) => c.id === activeId))) {
      setActiveId(list[0].id);
      localStorage.setItem("portal_active_child", list[0].id);
    }
    setLoading(false);
  }, [user, activeId]);

  useEffect(() => { load(); }, [user]); // eslint-disable-line

  const setActiveChildId = (id: string) => {
    setActiveId(id);
    localStorage.setItem("portal_active_child", id);
  };

  const activeChild = items.find((c) => c.id === activeId) || items[0] || null;
  const isPortalUser = !!user && !!(user.user_metadata as any)?.portal;

  return (
    <PortalContext.Provider value={{
      isPortalUser, children: items, activeChild, guardian, school, currency: school?.currency_code || "KES",
      setActiveChildId, loading, error, refresh: load,
    }}>
      {kids}
    </PortalContext.Provider>
  );
}
