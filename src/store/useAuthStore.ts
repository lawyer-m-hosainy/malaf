import { create } from 'zustand';
import { UserProfile } from '../types';


interface AuthState {
  currentUser: UserProfile | null;
  isDemoMode: boolean;
  setCurrentUser: (user: UserProfile | null) => void;
  setDemoMode: (isDemoMode: boolean) => void;
  hasPermission: (action: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isDemoMode: false,
  
  setCurrentUser: (user) => set({ currentUser: user }),
  setDemoMode: (isDemoMode) => set({ isDemoMode }),
  
  hasPermission: (action: string) => {
    const userRole = get().currentUser?.role;
    if (!userRole) return false;

    // Define permission mapping
    const permissions: Record<string, string[]> = {
      'محامي شريك': ['*'], // Full Access
      'مدير مكتب': ['*'], // Full Access (Admin)
      'محامي': ['view_cases', 'edit_cases', 'view_clients', 'legal_qa', 'conflict_check'],
      'محامي مستشار': ['view_cases', 'view_clients', 'legal_qa', 'conflict_check', 'view_reports'],
      'سكرتير': ['view_clients', 'edit_clients', 'view_cases', 'documents', 'finance_basic'],
      'محامي متدرب': ['view_cases', 'training_portal', 'view_wiki'],
    };

    const rolePerms = permissions[userRole] || [];
    return rolePerms.includes('*') || rolePerms.includes(action);
  }
}));
