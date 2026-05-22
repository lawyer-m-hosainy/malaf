import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useCasesStore } from "@/store/useCasesStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useInvoicesStore } from "@/store/useInvoicesStore";
import { useEnforcementStore } from "@/store/useEnforcementStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import { useAdvisoryStore } from "@/store/useAdvisoryStore";
import { useCLMStore } from "@/store/useCLMStore";
import { useComplianceStore } from "@/store/useComplianceStore";
import { useCriminalStore } from "@/store/useCriminalStore";
import { useExpertStore } from "@/store/useExpertStore";
import { useIPStore } from "@/store/useIPStore";
import { useUsageStore } from "@/store/useUsageStore";
import { useUIStore } from "@/store/useUIStore";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { UserRole } from "@/types";
import { setTenantIdCache } from "@/lib/tenant";
import { clearDecryptCache } from "@/lib/encryption";
import { ensureUserOrganization, syncOrgToJwt } from "@/services/organizationSetup";

/** مسح جميع بيانات الجلسة عند تسجيل الخروج */
function resetAllStores() {
  useAuthStore.getState().reset();
  useClientsStore.getState().reset();
  useCasesStore.getState().reset();
  useFinanceStore.getState().reset();
  useTeamStore.getState().reset();
  useInvoicesStore.getState().reset();
  useEnforcementStore.getState().reset();
  useNotificationsStore.getState().reset();
  useAdvisoryStore.getState().reset();
  useCLMStore.getState().reset();
  useComplianceStore.getState().reset();
  useCriminalStore.getState().reset();
  useExpertStore.getState().reset();
  useIPStore.getState().reset();
  useUsageStore.getState().reset();
  useUIStore.getState().reset();
  useAnalyticsStore.getState().reset(); // R2-FIX: كان مفقوداً
  setTenantIdCache(null);
  clearDecryptCache();
  // R1-FIX: مسح شامل لكل بيانات المنصة من التخزين المحلي
  const keysToRemove = Object.keys(localStorage).filter(
    k => k.startsWith('malaf') || k.startsWith('auth') || k.startsWith('sb-') || k === 'demoStartedAt'
  );
  keysToRemove.forEach(k => localStorage.removeItem(k));
  sessionStorage.clear();
}

interface AuthContextType {
  user: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

const DEFAULT_ROLE: UserRole = "محامي";

/** يقرأ أو ينشئ مكتب المستخدم ويربطه بـ JWT وذاكرة التطبيق */
async function resolveUserProfile(user: any): Promise<{ role: UserRole; orgId: string }> {
  try {
    const orgId = await ensureUserOrganization(user);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id, org_id")
      .eq("id", user.id)
      .maybeSingle();

    const profileOrgId = profile?.organization_id || profile?.org_id || orgId;
    const role = (profile?.role as UserRole) || (user.user_metadata?.role as UserRole) || DEFAULT_ROLE;

    if (profileOrgId && user.user_metadata?.org_id !== profileOrgId) {
      await syncOrgToJwt(profileOrgId, role);
    }

    return {
      role,
      orgId: profileOrgId || user.user_metadata?.org_id || "",
    };
  } catch (error) {
    console.error("[AuthProvider] resolveUserProfile error:", error);
    return {
      role: (user.user_metadata?.role as UserRole) || DEFAULT_ROLE,
      orgId: user.user_metadata?.org_id || "",
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  // R185-FIX: Guard against re-entrant handleAuthChange calls
  const processingRef = React.useRef(false);

  useEffect(() => {
    // Supabase v2 onAuthStateChange fires INITIAL_SESSION immediately upon subscribing.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // R185-FIX: Prevent infinite loops — USER_UPDATED and TOKEN_REFRESHED
        // are triggered by our own supabase.auth.updateUser() call inside resolveUserProfile.
        // Processing them as full auth changes creates a re-entrant loop → Error #185.
        if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
           setUser(session?.user || null);
           return;
        }
        handleAuthChange(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = async (supabaseUser: any) => {
    // R185-FIX: Prevent concurrent calls (e.g. INITIAL_SESSION + SIGNED_IN firing together)
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      if (supabaseUser) {
        if (import.meta.env.DEV) console.log("[AuthProvider] Processing auth for:", supabaseUser.email);
        const profile = await resolveUserProfile(supabaseUser);

        const { role, orgId } = profile;
        setTenantIdCache(orgId);
        
        useAuthStore.getState().setCurrentUser({
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || "المستخدم",
          email: supabaseUser.email || "",
          role,
          orgId,
          avatar: supabaseUser.user_metadata?.avatar_url || undefined,
        });
        setUser(supabaseUser);
      } else {
        setUser(null);
        resetAllStores(); // Clear all data
      }
      setLoading(false);
    } finally {
      processingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
