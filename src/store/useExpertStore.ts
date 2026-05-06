import { create } from 'zustand';

export type ExpertType = 'هندسي' | 'حسابي' | 'زراعي' | 'طبي' | 'آخر';
export type ExpertStatus = 'جارية' | 'منتهية' | 'مُعترض عليها';

export interface ExpertSession {
  id: string;
  date: string;
  result: string;
  nextSession?: string;
}

export interface ExpertMission {
  id: string;
  caseId: string;
  caseName: string;
  expertType: ExpertType;
  expertName: string;
  missionNumber: string;
  assignmentDate: string;
  sessions: ExpertSession[];
  depositAmount: number; // أمانة الخبير
  depositDate?: string;
  reportDueDate?: string;
  reportReceived: boolean;
  reportContent?: string;
  objectionFiled: boolean;
  status: ExpertStatus;
}

interface ExpertState {
  missions: ExpertMission[];
  setMissions: (missions: ExpertMission[]) => void;
  addMission: (mission: ExpertMission) => void;
  updateMission: (id: string, data: Partial<ExpertMission>) => void;
  reset: () => void;
}

export const useExpertStore = create<ExpertState>((set) => ({
  missions: [],
  reset: () => set({ missions: [] }),
  setMissions: (missions) => set({ missions }),
  addMission: (mission) => set((state) => ({ missions: [mission, ...state.missions] })),
  updateMission: (id, data) => set((state) => ({
    missions: state.missions.map(m => m.id === id ? { ...m, ...data } : m)
  })),
}));
