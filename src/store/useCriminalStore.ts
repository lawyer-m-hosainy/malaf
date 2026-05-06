import { create } from 'zustand';

export type CriminalCaseType = 'جناية' | 'جنحة' | 'مخالفة' | 'قضية أحداث' | 'قضية أمن دولة';

export interface PoliceReport {
  reportNumber: string;
  policeStation: string;
  date: string;
  incidentType: string;
  accused: string;
  victim: string;
}

export interface Prosecution {
  prosecutionNumber: string;
  prosecutionOffice: string;
  investigator: string;
  transferDate: string;
  decision: 'حفظ' | 'إحالة للمحكمة' | 'تصرف آخر' | 'قيد التحقيق';
}

export interface CourtRegistration {
  caseNumber: string;
  court: string;
  circuit: string;
  officialCharge: string;
}

export interface Trial {
  // Can link to sessions/experts
  notes: string;
}

export interface VerdictAndAppeal {
  verdict: string;
  verdictDate: string;
  appealDeadlineDays: number;
  appealStatus: string;
}

export interface CriminalCase {
  id: string;
  caseType: CriminalCaseType;
  currentStage: 1 | 2 | 3 | 4 | 5;
  policeReport: PoliceReport;
  prosecution?: Prosecution;
  courtRegistration?: CourtRegistration;
  trial?: Trial;
  verdictAndAppeal?: VerdictAndAppeal;
}

interface CriminalState {
  criminalCases: CriminalCase[];
  setCriminalCases: (cases: CriminalCase[]) => void;
  addCriminalCase: (criminalCase: CriminalCase) => void;
  updateCriminalCase: (id: string, data: Partial<CriminalCase>) => void;
  deleteCriminalCase: (id: string) => void;
  reset: () => void;
}

export const useCriminalStore = create<CriminalState>((set) => ({
  criminalCases: [],

  reset: () => set({ criminalCases: [] }),

  setCriminalCases: (criminalCases) => set({ criminalCases }),
  
  addCriminalCase: (criminalCase) => set((state) => ({
    criminalCases: [criminalCase, ...state.criminalCases]
  })),

  updateCriminalCase: (id, data) => set((state) => ({
    criminalCases: state.criminalCases.map(c => c.id === id ? { ...c, ...data } : c)
  })),

  deleteCriminalCase: (id) => set((state) => ({
    criminalCases: state.criminalCases.filter(c => c.id !== id)
  })),
}));
