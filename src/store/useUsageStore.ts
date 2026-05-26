import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UsageState {
  aiDocCount: Record<string, number>; // monthKey -> count
  incrementAiDocCount: () => void;
  getAiDocCount: () => number;
  getLimit: (plan: 'free' | 'basic' | 'pro') => number;
  reset: () => void;
}

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      aiDocCount: {},
      
      reset: () => set({ aiDocCount: {} }),
      
      incrementAiDocCount: () => {
        const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM
        set((state) => ({
          aiDocCount: {
            ...state.aiDocCount,
            [monthKey]: (state.aiDocCount[monthKey] || 0) + 1
          }
        }));
      },

      getAiDocCount: () => {
        const monthKey = new Date().toISOString().substring(0, 7);
        return get().aiDocCount[monthKey] || 0;
      },

      getLimit: (plan) => {
        switch (plan) {
          case 'free': return 5;
          case 'basic': return 20;
          case 'pro': return Infinity;
          default: return 5;
        }
      }
    }),
    {
      name: 'usage-storage',
    }
  )
);
