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
): Promise<{ role: UserRole; orgId: string } | null> {
  try {
    // 1. Try to fetch existing profile
    let { data: profile, error } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .maybeSingle();

    // 2. If no profile yet, the DB trigger might still be running — wait & retry
    if (!profile) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const retry = await supabase
        .from("profiles")
        .select("role, organization_id")
        .eq("id", user.id)
        .maybeSingle();
      profile = retry.data;
      error = retry.error;
    }

    // 3. If profile exists, sync org_id to JWT metadata for RLS
    if (profile && !error) {
      if (user.user_metadata?.org_id !== profile.organization_id) {
        try {
          await supabase.auth.updateUser({
            data: { org_id: profile.organization_id, role: profile.role }
          });
        } catch (e) {
          console.error("Failed to sync org_id to JWT:", e);
        }
      }
      
      return {
        role: (profile.role as UserRole) || DEFAULT_ROLE,
        orgId: profile.organization_id || "",
      };
    }

    // 4. Fallback: manually create org + profile if trigger didn't fire
    console.warn("Profile not found after retry, creating manually...");

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: user.user_metadata?.full_name || "مكتب المحاماة",
        slug: `office-${user.id.slice(0, 8)}`,
      })
      .select("id")
      .single();

    if (orgError || !org) {
      // Maybe org already exists (slug conflict) — try to find it
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", `office-${user.id.slice(0, 8)}`)
        .maybeSingle();
      
      if (!existingOrg) {
        console.error("Failed to create/find organization:", orgError);
        return null;
      }
      
      // Use the existing org
      const orgId = existingOrg.id;
      
      await supabase.from("profiles").upsert({
        id: user.id,
        organization_id: orgId,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "المستخدم",
        email: user.email || "",
        role: DEFAULT_ROLE,
      });
      
      try {
        await supabase.auth.updateUser({
          data: { org_id: orgId, role: DEFAULT_ROLE }
        });
      } catch (e) {
        console.error("Failed to sync org_id to JWT:", e);
      }
      
      return { role: DEFAULT_ROLE, orgId };
    }

    // 5. Create profile linked to new org
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      organization_id: org.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "المستخدم",
      email: user.email || "",
      role: DEFAULT_ROLE,
    });

    if (profileError) {
      console.error("Failed to create profile:", profileError);
      return null;
    }
    
    // 6. Set org_id in JWT metadata so RLS works immediately
    try {
      await supabase.auth.updateUser({
        data: { org_id: org.id, role: DEFAULT_ROLE }
      });
    } catch (e) {
      console.error("Failed to sync org_id to JWT:", e);
    }

    return { role: DEFAULT_ROLE, orgId: org.id };
  } catch (error) {
    console.error("Error loading user profile:", error);
    return null;
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
        const profile = await resolveUserProfile(supabaseUser);
        if (!profile) {
          toast.error("تعذر تحميل ملف المستخدم. يرجى إعادة تسجيل الدخول.");
          await supabase.auth.signOut();
          setTenantIdCache(null);
          useAuthStore.getState().setCurrentUser(null);
          setUser(null);
          setLoading(false);
          return;
        }

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
