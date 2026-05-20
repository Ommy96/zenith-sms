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
}

interface PortalContextType {
  isPortalUser: boolean;
  children: PortalChild[];
  activeChild: PortalChild | null;
  setActiveChildId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PortalContext = createContext<PortalContextType>({
  isPortalUser: false, children: [], activeChild: null,
  setActiveChildId: () => {}, loading: true, refresh: async () => {},
});

export const usePortal = () => useContext(PortalContext);

export function PortalProvider({ children: kids }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalChild[]>([]);
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem("portal_active_child")
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("id, first_name, last_name, admission_number, photo_url, tenant_id, current_class_id, stream");
    const list: PortalChild[] = (data || []).map((s: any) => ({
      ...s,
      full_name: [s.first_name, s.last_name].filter(Boolean).join(" "),
    }));
    setItems(list);
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
    <PortalContext.Provider value={{ isPortalUser, children: items, activeChild, setActiveChildId, loading, refresh: load }}>
      {kids}
    </PortalContext.Provider>
  );
}