import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '../types';

interface AuthState {
  currentUser: UserProfile | null;
  isDemoMode: boolean;
  setCurrentUser: (user: UserProfile | null) => void;
  setDemoMode: (isDemoMode: boolean) => void;
  hasPermission: (action: string) => boolean;
  /** تسجيل الخروج: مسح جميع بيانات المستخدم من الـ store */
  reset: () => void;
}

const initialState = {
  currentUser: null as UserProfile | null,
  isDemoMode: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

  setCurrentUser: (user) => set({ currentUser: user }),
  setDemoMode: (isDemoMode) => set({ isDemoMode }),

  reset: () => set({ ...initialState }),

  hasPermission: (action: string) => {
    const userRole = get().currentUser?.role;
    if (!userRole) return false;

    // خريطة صلاحيات الأدوار (مصرية)
    const permissions: Record<string, string[]> = {
      'محامي شريك': ['*'], // صلاحية كاملة
      'مدير مكتب':  ['*'], // صلاحية كاملة
      'محامي': ['view_cases', 'edit_cases', 'view_clients', 'legal_qa', 'conflict_check', 'org_admin', 'view_reports'],
      'محامي مستشار': ['view_cases', 'view_clients', 'legal_qa', 'conflict_check', 'view_reports'],
      'سكرتير': ['view_clients', 'edit_clients', 'view_cases', 'documents', 'finance_basic'],
      'محامي متدرب': ['view_cases', 'training_portal', 'view_wiki'],
    };

    const rolePerms = permissions[userRole] || [];
    return rolePerms.includes('*') || rolePerms.includes(action);
  },
    }),
    {
      name: 'auth-storage',
    }
  )
);
