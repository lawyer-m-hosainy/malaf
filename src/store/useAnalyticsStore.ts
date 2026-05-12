import { create } from 'zustand';
import { ConflictCheckRecord } from '../types';
import { useTeamStore } from './useTeamStore';
import { useClientsStore } from './useClientsStore';
import { useCasesStore } from './useCasesStore';
import { useAuthStore } from './useAuthStore';
import { supabase } from '@/lib/supabase';
import { getCurrentTenantId } from '@/lib/tenant';

interface AnalyticsState {
  financialSummary: { totalRevenue: number; totalVat: number; collectionRate: number; projectedRevenue: number; totalCollected: number; totalExpenses: number; };
  practiceAreaStats: { area: string; count: number; value: number }[];
  isLoading: boolean;
  fetchAnalyticsData: () => Promise<void>;
  getAttorneyPerformance: () => { name: string; cases: number; winningRate: number; billableHours: number }[];
  executeConflictCheck: (query: string) => ConflictCheckRecord;
  reset: () => void;
}

const INITIAL_FINANCIAL = { totalRevenue: 0, totalVat: 0, collectionRate: 0, projectedRevenue: 0, totalCollected: 0, totalExpenses: 0 };

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  financialSummary: INITIAL_FINANCIAL,
  practiceAreaStats: [],
  isLoading: false,

  reset: () => set({ financialSummary: INITIAL_FINANCIAL, practiceAreaStats: [], isLoading: false }),

  fetchAnalyticsData: async () => {
    const orgId = getCurrentTenantId();
    if (!orgId) return;
    
    set({ isLoading: true });
    
    try {
      const [invoicesRes, expensesRes, casesRes] = await Promise.all([
        supabase.from('invoices').select('amount, status').eq('org_id', orgId).is('deleted_at', null),
        supabase.from('expenses').select('amount').eq('org_id', orgId).is('deleted_at', null),
        supabase.from('cases').select('type').eq('org_id', orgId).is('deleted_at', null)
      ]);
      
      const invoices = invoicesRes.data || [];
      const expenses = expensesRes.data || [];
      const cases = casesRes.data || [];
      
      const totalRevenue = invoices.reduce((sum, r) => sum + Number(r.amount), 0);
      const totalCollected = invoices.filter(r => r.status === 'paid').reduce((sum, r) => sum + Number(r.amount), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalVat = Math.round(totalRevenue * 0.14);
      const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
      
      const areas: Record<string, number> = {};
      cases.forEach(c => {
        const t = c.type || 'أخرى';
        areas[t] = (areas[t] || 0) + 1;
      });
      
      const practiceAreaStats = Object.entries(areas).map(([area, count]) => ({
        area,
        count,
        value: count * 50000
      }));
      
      set({
        financialSummary: {
          totalRevenue,
          totalVat,
          collectionRate: Math.round(collectionRate),
          projectedRevenue: Math.round(totalRevenue * 1.2),
          totalCollected,
          totalExpenses
        },
        practiceAreaStats,
        isLoading: false
      });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },
  getAttorneyPerformance: () => {
    const teamMembers = useTeamStore.getState().teamMembers || [];
    const cases = useCasesStore.getState().cases || [];
    
    return teamMembers
      .filter(m => m.role === 'محامي' || m.role === 'محامي شريك' || m.role === 'محامي مستشار' || m.role === 'محامي متدرب')
      .map(member => {
        const memberCases = cases.filter(c => c.clientId && c.assignedTo === member.id);
        const closedCases = memberCases.filter(c => c.status === 'مغلقة');
        const winningRate = memberCases.length > 0 ? Math.round((closedCases.length / memberCases.length) * 100) : 0;
        return {
          name: member.name,
          cases: memberCases.length,
          winningRate,
          billableHours: memberCases.length * 12, // estimated
        };
      });
  },
  executeConflictCheck: (query) => {
    const clientsState = useClientsStore.getState();
    const casesState = useCasesStore.getState();
    const authState = useAuthStore.getState();

    const normalizedQuery = query.toLowerCase();
    const matches: ConflictCheckRecord['matches'] = [];

    clientsState.clients.forEach(client => {
      if (client.name.toLowerCase().includes(normalizedQuery)) {
        matches.push({
          entityName: client.name,
          relationshipType: 'Client',
          relatedToId: client.id,
          description: 'تطابق مباشر مع اسم عميل موجود',
          severity: 'High'
        });
      }
      
      client.subsidiaries?.forEach(sub => {
        if (sub.toLowerCase().includes(normalizedQuery)) {
          matches.push({
            entityName: sub,
            relationshipType: 'Subsidiary',
            relatedToId: client.id,
            description: `شركة تابعة للعميل: ${client.name}`,
            severity: 'Medium'
          });
        }
      });
    });

    casesState.cases.forEach(c => {
      if (c.defendant.toLowerCase().includes(normalizedQuery)) {
        matches.push({
          entityName: c.defendant,
          relationshipType: 'AdverseParty',
          relatedToId: c.id,
          description: `خصم في قضية نشطة: ${c.plaintiff} ضد ${c.defendant}`,
          severity: 'High'
        });
      }
    });

    return {
      id: `CCR-${Date.now()}`,
      query,
      checkedAt: new Date().toISOString(),
      checkedBy: authState.currentUser?.id || 'System',
      status: matches.length > 0 ? (matches.some(m => m.severity === 'High') ? 'DirectConflict' : 'IndirectConflict') : 'Clear',
      matches
    };
  }
}));
