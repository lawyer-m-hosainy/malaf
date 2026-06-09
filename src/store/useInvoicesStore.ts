import { create } from 'zustand';
import { Invoice } from '../types';
import { fetchInvoices, saveInvoice, deleteInvoice } from '@/services/legalDataService';
import { calculateVAT } from '../lib/finance';
import { useNotificationsStore } from './useNotificationsStore';

interface InvoicesState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  loadInvoices: () => Promise<void>;
  addInvoice: (invoiceData: Omit<Invoice, 'vat' | 'total'>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  removeInvoice: (id: string) => Promise<void>;
  hasLoaded: boolean;
  setInvoices: (invoices: Invoice[]) => void;
  reset: () => void;
}

const checkOverdueInvoices = (invoices: Invoice | Invoice[]) => {
  const invoiceList = Array.isArray(invoices) ? invoices : [invoices];
  const overdue = invoiceList.filter(inv => inv.status === 'غير مدفوعة' && new Date(inv.date) < new Date());
  
  if (overdue.length > 0) {
    overdue.forEach(inv => {
      useNotificationsStore.getState().addNotification({
        title: `فاتورة متأخرة: ${inv.id}`,
        message: `المبلغ المستحق: ${inv.total} ج.م - تاريخ الإصدار: ${inv.date}`,
        type: 'error'
      });
    });
  }
};

export const useInvoicesStore = create<InvoicesState>((set, get) => ({
  invoices: [],
  isLoading: false,
  error: null,
  hasLoaded: false,

  reset: () => set({ invoices: [], isLoading: false, error: null, hasLoaded: false }),
  setInvoices: (invoices) => set({ invoices, hasLoaded: true }),

  loadInvoices: async () => {
    if (get().hasLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const invoices = await fetchInvoices() || [];
      // Sort by descending date
      invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      set({ invoices, isLoading: false, hasLoaded: true });

      checkOverdueInvoices(invoices);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addInvoice: async (invoiceData) => {
    set({ isLoading: true, error: null });
    try {
      // Auto-calculate VAT
      const discount = (invoiceData as any).discount || 0;
      const vat = calculateVAT(invoiceData.base, discount);
      const total = (invoiceData.base - discount) + vat;
      
      const newInvoice: Invoice = {
        ...invoiceData,
        vat,
        total
      } as Invoice;
      
      await saveInvoice(newInvoice);
      set(state => ({ invoices: [newInvoice, ...state.invoices], isLoading: false }));

      useNotificationsStore.getState().addNotification({
        title: `تم إنشاء فاتورة جديدة: ${newInvoice.id}`,
        message: `المبلغ الإجمالي: ${newInvoice.total} ج.م`,
        type: 'success'
      });
      
      checkOverdueInvoices(newInvoice);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateInvoiceStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const invoice = state.invoices.find(i => i.id === id);
      if (!invoice) throw new Error("Invoice not found");
      
      const updatedInvoice = { ...invoice, status };
      await saveInvoice(updatedInvoice, true);
      
      set(state => ({
        invoices: state.invoices.map(i => i.id === id ? updatedInvoice : i),
        isLoading: false
      }));

      if (status === 'غير مدفوعة') {
        checkOverdueInvoices(updatedInvoice);
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  removeInvoice: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteInvoice(id);
      set(state => ({
        invoices: state.invoices.filter(i => i.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  }
}));
