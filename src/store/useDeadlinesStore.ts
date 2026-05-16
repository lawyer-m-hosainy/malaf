import { create } from 'zustand';
import { CaseDeadlineType, calculateEgyptDeadline } from '@/lib/deadlines';
import { useCasesStore } from './useCasesStore';
import { useNotificationsStore } from './useNotificationsStore';

export interface CalculatedDeadline {
  id: string;
  type: CaseDeadlineType;
  judgmentDate: string;
  deadlineDateStr: string;
  daysRemaining: number;
  notes: string;
  legalBasis: string;
  caseId?: string; // Optional linkage to a case
  title?: string; // e.g. "استئناف مدني - الدعوى رقم 123"
}

interface DeadlinesStoreState {
  history: CalculatedDeadline[];
  isOpen: boolean; // For controlling a global dialog if needed
  setIsOpen: (isOpen: boolean) => void;
  calculateAndAdd: (
    type: CaseDeadlineType,
    judgmentDate: string,
    caseId?: string,
    title?: string
  ) => CalculatedDeadline;
  saveToAgenda: (calc: CalculatedDeadline) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

export const useDeadlinesStore = create<DeadlinesStoreState>((set, get) => ({
  history: [],
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  
  calculateAndAdd: (type, judgmentDate, caseId, title) => {
    const result = calculateEgyptDeadline(judgmentDate, type);
    
    const newCalculation: CalculatedDeadline = {
      id: `calc-${Date.now()}`,
      type,
      judgmentDate,
      deadlineDateStr: result.deadlineDateStr,
      daysRemaining: result.daysRemaining,
      notes: result.notes,
      legalBasis: result.legalBasis,
      caseId,
      title: title || `موعد ${type}`
    };

    set((state) => ({ history: [newCalculation, ...state.history] }));
    return newCalculation;
  },

  saveToAgenda: (calc) => {
    // Add to useCasesStore deadlines as requested
    const newDeadlineId = `dl-${Date.now()}`;
    
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (calc.daysRemaining <= 5) priority = 'high';
    
    // Map deadline type if possible, or use 'أخرى'
    let deadlineType: any = 'أخرى';
    if (calc.type.includes('استئناف')) deadlineType = 'انتهاء مدة استئناف';
    if (calc.type.includes('نقض')) deadlineType = 'انتهاء مدة طعن بالنقض';

    useCasesStore.getState().addDeadline({
      id: newDeadlineId,
      caseId: calc.caseId || 'general',
      title: calc.title || `موعد قانوني: ${calc.type}`,
      date: calc.deadlineDateStr,
      type: deadlineType,
      status: 'pending',
      priority
    });

    // Notify user
    useNotificationsStore.getState().addNotification({
      title: 'تم الحفظ في الأجندة',
      message: `تم حفظ موعد "${calc.type}" لتاريخ ${calc.deadlineDateStr}`,
      type: 'success'
    });
  },

  removeFromHistory: (id) => set((state) => ({ 
    history: state.history.filter(c => c.id !== id) 
  })),

  clearHistory: () => set({ history: [] })
}));
