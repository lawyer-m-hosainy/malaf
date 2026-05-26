import { create } from 'zustand';

export type MissionType = 'property_valuation' | 'accounting_audit' | 'technical_inspection' | 'document_analysis' | 'forensic_medical' | 'mixed';
export type MissionStatus = 'in_progress' | 'awaiting_deposit' | 'under_discussion' | 'report_filed' | 'completed';

export interface ExpertMission {
  id: string;
  case_id: string;
  case_number: string;
  case_year: string;
  court_name: string;
  court_chamber?: string;

  // بيانات الخبير
  expert_name: string;
  expert_registry_no: string;
  expert_specialty: string;
  expert_phone?: string;

  // نطاق المأمورية
  mission_type: MissionType;
  mission_scope: string;

  // المواعيد
  referral_order_date: string;
  deposit_deadline?: string;
  discussion_session?: string;

  // الأتعاب
  estimated_fees?: number;

  // الحالة والمتابعة
  status: MissionStatus;
  assigned_lawyer_id?: string;
  notes?: string;
  
  created_at: string;
}

interface ExpertState {
  missions: ExpertMission[];
  setMissions: (missions: ExpertMission[]) => void;
  addMission: (mission: ExpertMission) => void;
  updateMission: (id: string, data: Partial<ExpertMission>) => void;
  deleteMission: (id: string) => void;
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
  deleteMission: (id) => set((state) => ({
    missions: state.missions.filter(m => m.id !== id)
  })),
}));
