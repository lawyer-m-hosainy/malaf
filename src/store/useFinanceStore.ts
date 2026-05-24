import { create } from 'zustand';
import { Expense, TimeEntry, ReceivableAccount, TrustAccount, PricingModel, TrustTransaction, TrustPageStats, TrustTransactionFormData, TrustTransactionType, DBPaymentPlan, DBPaymentInstallment } from '../types';
import { fetchTrustTransactions, fetchTrustPageStats, saveTrustTransaction, deleteTrustTransaction, fetchClientTrustBalance, fetchPaymentPlans, savePaymentPlan, recordInstallmentPayment } from '../services/legalDataService';


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

  // ─── Trust State & Actions ───
  trustTransactions: TrustTransaction[];
  trustStats: TrustPageStats;
  trustLoading: boolean;
  trustError: string | null;
  trustFilterType: "all" | "deposit" | "withdrawal";
  trustSearchQuery: string;

  loadTrustTransactions: () => Promise<void>;
  addTrustTransaction: (data: TrustTransactionFormData) => Promise<void>;
  removeTrustTransaction: (id: string) => Promise<void>;
  getClientBalance: (clientId: string, caseId?: string) => Promise<number>;
  setTrustFilterType: (type: "all" | "deposit" | "withdrawal") => void;
  setTrustSearchQuery: (query: string) => void;
  getFilteredTrustTransactions: () => TrustTransaction[];

  // ─── Payment Plans State & Actions ───
  paymentPlans: DBPaymentPlan[];
  plansLoading: boolean;
  plansError: string | null;
  loadPaymentPlans: () => Promise<void>;
  createPaymentPlan: (
    plan: Omit<DBPaymentPlan, "id" | "createdAt" | "clientName" | "caseName" | "installments">,
    installments: Omit<DBPaymentInstallment, "id" | "planId" | "organization_id">[]
  ) => Promise<void>;
  payInstallment: (
    installmentId: string,
    amount: number,
    paidDate: string,
    notes?: string
  ) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
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

  // ─── Trust State & Actions Implementation ───
  trustTransactions: [] as TrustTransaction[],
  trustStats: { totalDeposits: 0, totalWithdrawals: 0, totalAvailableBalance: 0, transactionCount: 0 } as TrustPageStats,
  trustLoading: false,
  trustError: null as string | null,
  trustFilterType: "all" as "all" | "deposit" | "withdrawal",
  trustSearchQuery: "",

  loadTrustTransactions: async () => {
    set({ trustLoading: true, trustError: null });
    try {
      const [transactions, stats] = await Promise.all([
        fetchTrustTransactions(),
        fetchTrustPageStats(),
      ]);
      set({ trustTransactions: transactions, trustStats: stats });
    } catch {
      set({ trustError: "فشل تحميل بيانات الأمانات" });
    } finally {
      set({ trustLoading: false });
    }
  },

  addTrustTransaction: async (data: TrustTransactionFormData) => {
    const amount = parseFloat(data.amount);
    if (data.transactionType === "withdrawal") {
      const balance = await get().getClientBalance(data.clientId, data.caseId);
      if (amount > balance) {
        throw new Error(`الرصيد المتاح ${balance.toLocaleString("ar-EG")} ج.م فقط`);
      }
    }
    await saveTrustTransaction({ ...data, amount });
    await get().loadTrustTransactions();
  },

  removeTrustTransaction: async (id: string) => {
    await deleteTrustTransaction(id);
    set((state: any) => ({
      trustTransactions: state.trustTransactions.filter((t: TrustTransaction) => t.id !== id),
    }));
    const stats = await fetchTrustPageStats();
    set({ trustStats: stats });
  },

  getClientBalance: async (clientId: string, caseId?: string): Promise<number> => {
    const { trustTransactions } = get();
    if (trustTransactions.length > 0) {
      const relevant = trustTransactions.filter(
        (t: TrustTransaction) =>
          t.clientId === clientId && (caseId ? t.caseId === caseId : true)
      );
      return relevant.reduce((bal: number, t: TrustTransaction) =>
        t.transactionType === "deposit" ? bal + t.amount : bal - t.amount, 0
      );
    }
    return fetchClientTrustBalance(clientId, caseId);
  },

  setTrustFilterType: (type: "all" | "deposit" | "withdrawal") =>
    set({ trustFilterType: type }),
  setTrustSearchQuery: (query: string) =>
    set({ trustSearchQuery: query }),

  getFilteredTrustTransactions: () => {
    const { trustTransactions, trustFilterType, trustSearchQuery } = get();
    return trustTransactions.filter((t: TrustTransaction) => {
      if (trustFilterType !== "all" && t.transactionType !== trustFilterType) return false;
      if (trustSearchQuery) {
        const q = trustSearchQuery.toLowerCase();
        return (
          t.clientName?.toLowerCase().includes(q) ||
          t.caseName?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.receiptNumber?.toLowerCase().includes(q) ||
          false
        );
      }
      return true;
    });
  },

  // ─── Payment Plans Implementation ───
  paymentPlans: [] as DBPaymentPlan[],
  plansLoading: false,
  plansError: null as string | null,

  loadPaymentPlans: async () => {
    set({ plansLoading: true, plansError: null });
    try {
      const plans = await fetchPaymentPlans();
      set({ paymentPlans: plans });
    } catch {
      set({ plansError: "فشل تحميل خطط الدفع والأقساط" });
    } finally {
      set({ plansLoading: false });
    }
  },

  createPaymentPlan: async (plan, installments) => {
    set({ plansLoading: true });
    try {
      await savePaymentPlan(plan, installments);
      await get().loadPaymentPlans();
    } catch (e: any) {
      throw new Error(e.message || "فشل تسجيل خطة الدفع");
    } finally {
      set({ plansLoading: false });
    }
  },

  payInstallment: async (installmentId, amount, paidDate, notes) => {
    set({ plansLoading: true });
    try {
      await recordInstallmentPayment(installmentId, amount, paidDate, notes);
      await get().loadPaymentPlans();
    } catch (e: any) {
      throw new Error(e.message || "فشل سداد القسط");
    } finally {
      set({ plansLoading: false });
    }
  },
}));
