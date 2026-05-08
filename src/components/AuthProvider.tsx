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
import { UserRole } from "@/types";
import { setTenantIdCache } from "@/lib/tenant";
import { toast } from "sonner";

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
  setTenantIdCache(null);
}

interface AuthContextType {
  user: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

const DEFAULT_ROLE: UserRole = "محامي";

/**
 * Reads or creates the user profile from Supabase (profiles table).
 * All authentication and data is handled through Supabase only.
 */
async function resolveUserProfile(
  user: any
): Promise<{ role: UserRole; orgId: string } | null> {
  try {
    // 1. Fetch profile from Supabase
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", user.id)
      .limit(1)
      .single();

    if (profile && !error) {
      // Keep raw_user_meta_data updated with org_id for RLS policies
      if (user.user_metadata?.org_id !== profile.org_id) {
        await supabase.auth.updateUser({
          data: { org_id: profile.org_id, role: profile.role }
        });
      }
      
      return {
        role: (profile.role as UserRole) || DEFAULT_ROLE,
        orgId: profile.org_id || "",
      };
    }

    // 2. No profile exists — Create default organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: user.user_metadata?.full_name || "مكتب المحاماة",
        slug: `office-${user.id.slice(0, 8)}`,
      })
      .select("id")
      .single();

    if (orgError || !org) {
      console.error("Failed to create organization:", orgError);
      return null;
    }

    // 3. Create profile linked to the new organization
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      org_id: org.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "المستخدم",
      email: user.email || "",
      role: DEFAULT_ROLE,
    });

    if (profileError) {
      console.error("Failed to create profile:", profileError);
      return null;
    }
    
    // 4. Set org_id in Supabase Auth user metadata so get_user_org_id() SQL function works
    await supabase.auth.updateUser({
      data: { org_id: org.id, role: DEFAULT_ROLE }
    });

    return { role: DEFAULT_ROLE, orgId: org.id };
  } catch (error) {
    console.error("Error loading user profile:", error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleAuthChange(session?.user || null);
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthChange(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = async (supabaseUser: any) => {
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
