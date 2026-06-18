import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { identifySentryUser } from "@/lib/observability/sentry";
import { identifyPostHogUser } from "@/lib/observability/posthog";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: { full_name: string; email: string; tenant_id: string | null } | null;
  role: string | null;
  isDemo: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSchool: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, role: null, isDemo: false, loading: true, signOut: async () => {}, refreshSchool: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, email, default_tenant_id")
      .eq("id", userId)
      .maybeSingle();

    const tenantId = (profileData as any)?.default_tenant_id ?? null;
    if (profileData) {
      setProfile({
        full_name: (profileData as any).full_name,
        email: (profileData as any).email,
        tenant_id: tenantId,
      });
    }

    identifySentryUser({ id: userId, email: (profileData as any)?.email }, tenantId);
    identifyPostHogUser({ id: userId, email: (profileData as any)?.email }, tenantId);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role_id, roles!inner(name)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (roleData) setRole(((roleData as any).roles?.name) ?? null);

    if (tenantId) {
      const { data: schoolData } = await supabase
        .from("tenants").select("is_demo").eq("id", tenantId).maybeSingle();
      setIsDemo(!!schoolData?.is_demo);
    } else {
      setIsDemo(false);
    }
  };

  const refreshSchool = async () => {
    if (!profile?.tenant_id) return;
    const { data } = await supabase.from("tenants").select("is_demo").eq("id", profile.tenant_id).maybeSingle();
    setIsDemo(!!data?.is_demo);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
    identifySentryUser(null);
    identifyPostHogUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, role, isDemo, loading, signOut, refreshSchool }}>
      {children}
    </AuthContext.Provider>
  );
}
