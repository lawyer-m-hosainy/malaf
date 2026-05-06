import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useCasesStore } from "@/store/useCasesStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useInvoicesStore } from "@/store/useInvoicesStore";
import { useEnforcementStore } from "@/store/useEnforcementStore";
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
  setTenantIdCache(null);
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

const DEFAULT_ROLE: UserRole = "محامي";

/**
 * يقرأ أو يُنشئ ملف المستخدم من Supabase (جدول profiles).
 * Firebase Auth يبقى للمصادقة فقط — Supabase للبيانات.
 */
async function resolveUserProfile(
  user: User
): Promise<{ role: UserRole; orgId: string } | null> {
  try {
    // محاولة قراءة الملف الشخصي من Supabase
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", user.uid)
      .single();

    if (profile && !error) {
      return {
        role: (profile.role as UserRole) || DEFAULT_ROLE,
        orgId: profile.org_id || "",
      };
    }

    // الملف غير موجود — إنشاؤه مع مكتب افتراضي
    // 1. إنشاء مكتب (organization) افتراضي أولاً
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: user.displayName || "مكتب المحاماة",
        slug: `office-${user.uid.slice(0, 8)}`,
        plan: "free",
      })
      .select("id")
      .single();

    if (orgError || !org) {
      console.error("فشل إنشاء المكتب:", orgError);
      return null;
    }

    // 2. إنشاء الملف الشخصي مربوطاً بالمكتب
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.uid,
      org_id: org.id,
      full_name: user.displayName || "المستخدم",
      email: user.email || "",
      role: DEFAULT_ROLE,
    });

    if (profileError) {
      console.error("فشل إنشاء الملف الشخصي:", profileError);
      return null;
    }

    return { role: DEFAULT_ROLE, orgId: org.id };
  } catch (error) {
    console.error("خطأ في تحميل ملف المستخدم:", error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await resolveUserProfile(firebaseUser);
        if (!profile) {
          toast.error("تعذر تحميل ملف المستخدم. يرجى إعادة تسجيل الدخول.");
          auth.signOut();
          setTenantIdCache(null);
          useAuthStore.getState().setCurrentUser(null);
          setUser(null);
          setLoading(false);
          return;
        }

        const { role, orgId } = profile;
        // تخزين orgId مؤقتاً بديلاً عن tenantId
        setTenantIdCache(orgId);
        useAuthStore.getState().setCurrentUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "المستخدم",
          email: firebaseUser.email || "",
          role,
          orgId,
          avatar: firebaseUser.photoURL || undefined,
        });
        setUser(firebaseUser);
      } else {
        setUser(null);
        resetAllStores(); // ✅ مسح جميع البيانات — منع تسرب بيانات مكتب لآخر
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
