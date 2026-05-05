import { create } from 'zustand';
import { ConflictCheckRecord } from '../types';
import { useFinanceStore } from './useFinanceStore';
import { useTeamStore } from './useTeamStore';
import { useCasesStore } from './useCasesStore';
import { useClientsStore } from './useClientsStore';
import { useComplianceStore } from './useComplianceStore';
import { useAuthStore } from './useAuthStore';

interface AnalyticsState {
  getFinancialSummary: () => { totalRevenue: number; totalVat: number; collectionRate: number; projectedRevenue: number; totalCollected: number; totalExpenses: number; };
  getAttorneyPerformance: () => { name: string; cases: number; winningRate: number; billableHours: number }[];
  getPracticeAreaStats: () => { area: string; count: number; value: number }[];
  executeConflictCheck: (query: string) => ConflictCheckRecord;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  getFinancialSummary: () => {
    const receivables = useFinanceStore.getState().receivables || [];
    const expenses = useFinanceStore.getState().expenses || [];
    const totalRevenue = receivables.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalCollected = receivables.reduce((sum, r) => sum + r.collectedAmount, 0);
    const totalVat = Math.round(totalRevenue * 0.14); // 14% VAT
    const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      totalRevenue,
      totalVat,
      collectionRate: Math.round(collectionRate),
      projectedRevenue: Math.round(totalRevenue * 1.2),
      totalCollected,
      totalExpenses
    };
  },
  getAttorneyPerformance: () => {
    const team = useTeamStore.getState().teamMembers || [];
    const timeEntries = useFinanceStore.getState().timeEntries || [];
    
    return team.filter(m => m.role.includes('محامي')).map(m => {
      const billableHours = Math.round(
        timeEntries.filter(t => t.lawyerId === m.id).reduce((sum, t) => sum + t.duration, 0) / 60
      );
      return {
        name: m.name,
        cases: m.activeCases,
        winningRate: m.completedTasks > 0 ? Math.round((m.completedTasks / (m.completedTasks + m.pendingTasks)) * 100) : 0,
        billableHours
      };
    });
  },
  getPracticeAreaStats: () => {
    const cases = useCasesStore.getState().cases || [];
    const areas: Record<string, number> = {};
    cases.forEach(c => {
      areas[c.type] = (areas[c.type] || 0) + 1;
    });
    
    return Object.entries(areas).map(([area, count]) => ({
      area,
      count,
      value: count * 50000 // Mock value per area
    }));
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
