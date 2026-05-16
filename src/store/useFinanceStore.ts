import { create } from 'zustand';
import { Expense, TimeEntry, ReceivableAccount, TrustAccount, PricingModel } from '../types';


interface FinanceState {
  expenses: Expense[];
  timeEntries: TimeEntry[];
  receivables: ReceivableAccount[];
  trustAccounts: TrustAccount[];
  pricingModels: PricingModel[];
  
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  setTimeEntries: (entries: TimeEntry[]) => void;
  setReceivables: (receivables: ReceivableAccount[]) => void;
  addReceivable: (receivable: ReceivableAccount) => void;
  addCollectionAction: (receivableId: string, action: ReceivableAccount['actions'][number]) => void;
  reconcileReceivable: (receivableId: string) => void;
  closeReceivable: (receivableId: string) => void;
  setTrustAccounts: (accounts: TrustAccount[]) => void;
  addTrustAccount: (account: TrustAccount) => void;
  disburseTrustAccount: (accountId: string) => void;
  addTimeEntry: (entry: TimeEntry) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;
  toggleTimeEntryBilledStatus: (id: string) => void;
  toggleExpenseCollected: (id: string) => void;
  setPricingModels: (models: PricingModel[]) => void;
  hasLoaded: boolean;
  reset: () => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  expenses: [],
  timeEntries: [],
  receivables: [],
  trustAccounts: [],
  pricingModels: [],
  hasLoaded: false,

  reset: () => set({ expenses: [], timeEntries: [], receivables: [], trustAccounts: [], pricingModels: [], hasLoaded: false }),

  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) => set((state) => ({ expenses: [expense, ...state.expenses] })),
  setTimeEntries: (timeEntries) => set({ timeEntries }),
  setReceivables: (receivables) => set({ receivables }),
  addReceivable: (receivable) => set((state) => ({ receivables: [receivable, ...state.receivables] })),
  
  addCollectionAction: (receivableId, action) => set((state) => ({
    receivables: state.receivables.map((r) =>
      r.id === receivableId ? { ...r, actions: [...r.actions, action] } : r
    ),
  })),
  reconcileReceivable: (receivableId) => set((state) => ({
    receivables: state.receivables.map((r) =>
      r.id === receivableId ? { ...r, isReconciled: true } : r
    ),
  })),
  closeReceivable: (receivableId) => set((state) => ({
    receivables: state.receivables.map((r) => {
      if (r.id !== receivableId) return r;
      if (!r.isReconciled) return r;
      return { ...r, status: "مغلق" };
    }),
  })),
  
  setTrustAccounts: (trustAccounts) => set({ trustAccounts, hasLoaded: true }),
  addTrustAccount: (account) =>
    set((state) => ({ trustAccounts: [account, ...state.trustAccounts] })),
  disburseTrustAccount: (accountId) => set((state) => ({
    trustAccounts: state.trustAccounts.map((a) =>
      a.id === accountId ? { ...a, status: "تم الصرف" } : a
    ),
  })),
  addTimeEntry: (entry) =>
    set((state) => ({ timeEntries: [entry, ...state.timeEntries] })),
  updateTimeEntry: (id, updates) => set((state) => ({
    timeEntries: state.timeEntries.map((te) => 
      te.id === id ? { ...te, ...updates } : te
    )
  })),
  deleteTimeEntry: (id) => set((state) => ({
    timeEntries: state.timeEntries.filter((te) => te.id !== id)
  })),
  toggleTimeEntryBilledStatus: (id) => set((state) => ({
    timeEntries: state.timeEntries.map((te) =>
      te.id === id ? { ...te, isBilled: !te.isBilled } : te
    )
  })),
  toggleExpenseCollected: (id) => set((state) => ({
    expenses: state.expenses.map((e) =>
      e.id === id ? { ...e, isCollected: !e.isCollected } : e
    )
  })),
  setPricingModels: (pricingModels) => set({ pricingModels }),
}));
