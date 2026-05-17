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
import { toast } from "sonner";
import { clearDecryptCache } from "@/lib/encryption";

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

/**
 * Reads or creates the user profile from Supabase (profiles table).
 * The DB trigger `handle_new_user` auto-creates org + profile on signup.
 * This function reads the profile, retrying once if the trigger hasn't finished yet.
 */
async function resolveUserProfile(
  user: any
): Promise<{ role: UserRole; orgId: string }> {
  try {
    // 1. Try to fetch existing profile
    let { data: profile, error } = await supabase
      .from("profiles")
      .select("id, role, full_name, org_id, organization_id")
      .eq("id", user.id)
      .maybeSingle();

    // 2. If no profile yet, the DB trigger might still be running — wait & retry
    if (!profile) {
      if (import.meta.env.DEV) console.log("[AuthProvider] No profile found, waiting for trigger...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retry = await supabase
        .from("profiles")
        .select("id, role, full_name, org_id, organization_id")
        .eq("id", user.id)
        .maybeSingle();
      profile = retry.data;
      error = retry.error;
    }

    // 3. If profile exists, sync org_id to JWT metadata for RLS
    if (profile && !error) {
      const profileOrgId = profile.organization_id || profile.org_id || "";
      if (import.meta.env.DEV) console.log("[AuthProvider] ✅ Profile found. orgId:", profileOrgId);
      
      if (user.user_metadata?.org_id !== profileOrgId && profileOrgId) {
        try {
          await supabase.auth.updateUser({
            data: { org_id: profileOrgId, role: profile.role }
          });
        } catch (e) {
          if (import.meta.env.DEV) console.warn("[AuthProvider] Failed to sync org_id to JWT (non-fatal):", e);
        }
      }
      
      return {
        role: (profile.role as UserRole) || DEFAULT_ROLE,
        orgId: profileOrgId,
      };
    }

    // 4. Fallback: manually create org + profile if trigger didn't fire
    if (import.meta.env.DEV) console.warn("[AuthProvider] Profile not found after retry, creating manually...");

    let orgId = "";

    try {
      // Try to find existing org first
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", `office-${user.id.slice(0, 8)}`)
        .maybeSingle();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        // Create new org
        const { data: newOrg } = await supabase
          .from("organizations")
          .insert({
            name: user.user_metadata?.full_name || "مكتب المحاماة",
            slug: `office-${user.id.slice(0, 8)}`,
          })
          .select("id")
          .single();
        if (newOrg) orgId = newOrg.id;
      }
    } catch (orgErr) {
      if (import.meta.env.DEV) console.error("[AuthProvider] Org creation failed (non-fatal):", orgErr);
    }

    // 5. Create profile (best effort)
    if (orgId) {
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          org_id: orgId,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "المستخدم",
          email: user.email || "",
          role: DEFAULT_ROLE,
        });
        if (import.meta.env.DEV) console.log("[AuthProvider] ✅ Profile created manually");
      } catch (profileErr) {
        if (import.meta.env.DEV) console.error("[AuthProvider] Profile creation failed (non-fatal):", profileErr);
      }

      // Sync to JWT
      try {
        await supabase.auth.updateUser({
          data: { org_id: orgId, role: DEFAULT_ROLE }
        });
      } catch (e) {
        if (import.meta.env.DEV) console.warn("[AuthProvider] JWT sync failed (non-fatal):", e);
      }
    }

    // ✅ ALWAYS return a valid profile — never return null
    // This prevents the user from being signed out after successful authentication
    return {
      role: (user.user_metadata?.role as UserRole) || DEFAULT_ROLE,
      orgId: orgId || user.user_metadata?.org_id || "",
    };
  } catch (error) {
    if (import.meta.env.DEV) console.error("[AuthProvider] Error in resolveUserProfile (non-fatal):", error);
    // ✅ Even on total failure, let the user in with defaults
    return {
      role: DEFAULT_ROLE,
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
