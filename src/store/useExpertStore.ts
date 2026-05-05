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
}

export const useExpertStore = create<ExpertState>((set) => ({
  missions: [
    {
      id: "EXP-88112",
      caseId: "C-1001",
      caseName: "شركة الأفق ضد مؤسسة البناء",
      expertType: "حسابي",
      expertName: "مكتب الخبراء بشمال القاهرة - خبير/ سعيد الجمال",
      missionNumber: "450/2026",
      assignmentDate: "2026-04-10",
      depositAmount: 5000,
      depositDate: "2026-04-15",
      reportReceived: false,
      objectionFiled: false,
      status: "جارية",
      sessions: [
        {
          id: "S-1",
          date: "2026-04-20",
          result: "حضور ممثل الشركة لتقديم المستندات المطلوبة",
          nextSession: "2026-05-10"
        }
      ]
    }
  ],
  setMissions: (missions) => set({ missions }),
  addMission: (mission) => set((state) => ({ missions: [mission, ...state.missions] })),
  updateMission: (id, data) => set((state) => ({
    missions: state.missions.map(m => m.id === id ? { ...m, ...data } : m)
  })),
}));
