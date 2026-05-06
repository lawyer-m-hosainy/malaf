import { create } from 'zustand';
import { Case, Session, Deadline } from '../types';
import { useNotificationsStore } from './useNotificationsStore';

interface CasesState {
  cases: Case[];
  sessions: Session[];
  deadlines: Deadline[];
  setCases: (cases: Case[]) => void;
  addCase: (caseData: Case) => void;
  updateCase: (id: string, updatedData: Partial<Case>) => void;
  deleteCase: (id: string) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  setDeadlines: (deadlines: Deadline[]) => void;
  addDeadline: (deadline: Deadline) => void;
  updateDeadlineStatus: (id: string, status: 'pending' | 'completed' | 'overdue') => void;
  hasLoaded: boolean;
  isLoading: boolean;
  hasLoadedSessions: boolean;
  loadSessions: () => Promise<void>;
  reset: () => void;
}

const checkDeadlines = (deadlines: Deadline[]) => {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const approaching = deadlines.filter(d => 
    d.status === 'pending' && 
    new Date(d.date) > now && 
    new Date(d.date) <= sevenDaysFromNow
  );

  approaching.forEach(d => {
    useNotificationsStore.getState().addNotification({
      title: `موعد نهائي يقترب: ${d.title}`,
      message: `متبقي أقل من 7 أيام على الموعد النهائي: ${d.date}`,
      type: 'warning'
    });
  });
};

const checkSessions = (sessions: Session[]) => {
  const now = new Date();
  const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  
  const upcoming = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate > now && sessionDate <= fortyEightHoursFromNow;
  });

  upcoming.forEach(s => {
    const sessionDate = new Date(s.date);
    const hoursDiff = Math.round((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    let timeLabel = `${hoursDiff} ساعة`;
    if (hoursDiff <= 24 && hoursDiff > 0) timeLabel = "24 ساعة";
    else if (hoursDiff <= 48 && hoursDiff > 24) timeLabel = "48 ساعة";
    
    useNotificationsStore.getState().addNotification({
      title: `تذكير جلسة قادمة (${timeLabel})`,
      message: `جلسة ${s.caseName} في ${s.court} يوم ${s.date}`,
      type: 'info'
    });
  });
};

export const useCasesStore = create<CasesState>((set, get) => ({
  cases: [],
  sessions: [],
  deadlines: [],

  hasLoaded: false,
  isLoading: false,
  hasLoadedSessions: false,

  reset: () => set({ cases: [], sessions: [], deadlines: [], hasLoaded: false, hasLoadedSessions: false, isLoading: false }),

  setCases: (cases) => set({ cases, hasLoaded: true }),
  addCase: (caseData) => set((state) => ({ cases: [caseData, ...state.cases] })),
  updateCase: (id, updatedData) => {
    // R7: AUTO-TRANSITION TO ENFORCEMENT
    if (updatedData.status === ('حكم نهائي' as any)) {
      import('./useEnforcementStore').then(({ useEnforcementStore }) => {
        const createFromCase = useEnforcementStore.getState().createEnforcementFromCase;
        const currentCase = get().cases.find((c: any) => c.id === id);
        if (currentCase && currentCase.status !== ('حكم نهائي' as any)) {
          createFromCase(currentCase, "تم النقل الآلي", 0, "أخرى" as any, "", "");
        }
      });
    }

    set((state) => ({
      cases: state.cases.map(c => c.id === id ? { ...c, ...updatedData } : c)
    }));
  },
  deleteCase: (id) => set((state) => ({
    cases: state.cases.filter(c => c.id !== id)
  })),
  setSessions: (sessions) => {
    set({ sessions });
    checkSessions(sessions);
  },
  addSession: (session) => {
    set((state) => ({ sessions: [session, ...state.sessions] }));
    useNotificationsStore.getState().addNotification({
      title: `تذكير: جلسة ${session.caseName}`,
      message: `جلسة يوم ${session.date} الساعة ${session.time} في ${session.court}`,
      type: 'info'
    });
  },
  setDeadlines: (deadlines) => {
    set({ deadlines });
    checkDeadlines(deadlines);
  },
  addDeadline: (deadline) => {
    set((state) => ({ deadlines: [...state.deadlines, deadline] }));
    useNotificationsStore.getState().addNotification({
      title: `موعد نهائي جديد: ${deadline.title}`,
      message: `تاريخ الاستحقاق: ${deadline.date}`,
      type: 'warning'
    });
    checkDeadlines([deadline]);
  },
  updateDeadlineStatus: (id, status) => set((state) => ({
    deadlines: state.deadlines.map(d => d.id === id ? { ...d, status } : d)
  })),
  loadSessions: async () => {
    if (get().hasLoadedSessions) return;
    set({ isLoading: true });
    try {
      // In a real app, this would fetch from an API
      set({ hasLoadedSessions: true, isLoading: false });
      checkSessions(get().sessions);
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
