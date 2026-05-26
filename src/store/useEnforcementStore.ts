import { create } from 'zustand';
import { EnforcementCase } from '../types';
import type { Case } from '../types';


/**
 * Generates a sequential enforcement file number.
 * Format: ENF-YYYY-NNNN (e.g. ENF-2026-0001)
 */
function generateFileNumber(existingCases: EnforcementCase[]): string {
  const year = new Date().getFullYear();
  const prefix = `ENF-${year}-`;
  
  // Find the highest number for this year
  let maxNum = 0;
  existingCases.forEach((ec) => {
    if (ec.fileNumber?.startsWith(prefix)) {
      const num = parseInt(ec.fileNumber.replace(prefix, ''), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  
  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
}

interface EnforcementState {
  enforcementCases: EnforcementCase[];
  setEnforcementCases: (cases: EnforcementCase[]) => void;
  addEnforcementCase: (newCase: EnforcementCase) => void;
  addEnforcementAction: (caseId: string, action: EnforcementCase['actions'][number]) => void;
  
  /** تحديث مرحلة ملف التنفيذ */
  updateEnforcementStage: (caseId: string, updates: Partial<EnforcementCase>) => void;
  
  /** إنشاء ملف تنفيذ تلقائي من قضية مكتب */
  createEnforcementFromCase: (
    caseData: Case,
    clientName: string,
    amountClaimed: number,
    executionType: EnforcementCase['executionType'],
    judgmentNumber?: string,
    judgmentDate?: string,
  ) => EnforcementCase;
  
  /** إنشاء ملف تنفيذ يدوي من حكم خارجي */
  createEnforcementManual: (data: {
    clientId: string;
    clientName: string;
    debtorName: string;
    amountClaimed: number;
    executionType: EnforcementCase['executionType'];
    judgmentNumber?: string;
    judgmentDate?: string;
    judgmentCourt?: string;
  }) => EnforcementCase;
  
  /** الحصول على رقم الملف التالي */
  getNextFileNumber: () => string;
  hasLoaded: boolean;
  reset: () => void;
}

const MOCK_ENFORCEMENT_CASES: EnforcementCase[] = [
  {
    id: "ENF-827391",
    fileNumber: "ENF-2026-0001",
    source: "قضية_مكتب",
    caseId: "C-152468",
    clientId: "C-177617",
    clientName: "شركة العزم للمقاولات",
    debtorName: "مؤسسة القمة للتجارة",
    amountClaimed: 150000,
    amountCollected: 0,
    status: "إعلان السند",
    currentStep: 2,
    executionType: "حكم قضائي",
    judgmentNumber: "44/2026",
    judgmentDate: "2026-03-15",
    judgmentCourt: "المحكمة التجارية",
    bailiffName: "أحمد محمود (محضر عابدين)",
    announcementDate: "2026-04-10",
    bailiffRecordNumber: "محضر 44 لسنة 2026 محضرين",
    linkedCaseId: "C-152468",
    linkedCaseRef: "C-152468 - المحكمة التجارية",
    stageDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    actions: [
      {
        id: "ACT-1",
        enforcementCaseId: "ENF-827391",
        title: "استلام الصيغة التنفيذية",
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        performedBy: "محامي الإدارة",
        type: "إجراء قانوني"
      }
    ],
  },
  {
    id: "ENF-443219",
    fileNumber: "ENF-2026-0002",
    source: "حكم_خارجي",
    caseId: "C-998822",
    clientId: "C-334411",
    clientName: "أحمد عبدالله العقاري",
    debtorName: "شركة الأفق للتقنية",
    amountClaimed: 500000,
    amountCollected: 200000,
    status: "إشكال في التنفيذ",
    currentStep: 4,
    executionType: "حكم قضائي",
    judgmentNumber: "112/2025",
    judgmentDate: "2025-12-01",
    judgmentCourt: "المحكمة العامة",
    bailiffName: "سيد حسنين",
    announcementDate: "2025-12-20",
    bailiffRecordNumber: "محضر 100 لسنة 2025",
    poaDate: "2026-01-05",
    hasObjection: true,
    objectionType: "إشكال موضوعي",
    objectionSessionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    objectingParty: "المنفذ ضده",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    actions: [
      {
        id: "ACT-2",
        enforcementCaseId: "ENF-443219",
        title: "إيداع إشكال في التنفيذ",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        performedBy: "محاسب المكتب",
        type: "إجراء قانوني",
        notes: "تم وقف التنفيذ لحين الفصل في الإشكال"
      }
    ]
  }
];

export const useEnforcementStore = create<EnforcementState>((set, get) => ({
  enforcementCases: [],
  hasLoaded: false,

  reset: () => set({ enforcementCases: [], hasLoaded: false }),
  setEnforcementCases: (enforcementCases) => set({ enforcementCases, hasLoaded: true }),
  
  addEnforcementCase: (newCase) => set((state) => ({ 
    enforcementCases: [newCase, ...state.enforcementCases] 
  })),
  
  addEnforcementAction: (enforcementCaseId, action) => set((state) => ({
    enforcementCases: state.enforcementCases.map((ec) =>
      ec.id === enforcementCaseId ? { ...ec, actions: [...ec.actions, action] } : ec
    ),
  })),

  updateEnforcementStage: (caseId, updates) => set((state) => ({
    enforcementCases: state.enforcementCases.map((ec) =>
      ec.id === caseId ? { ...ec, ...updates } : ec
    ),
  })),

  getNextFileNumber: () => {
    return generateFileNumber(get().enforcementCases);
  },

  createEnforcementFromCase: (caseData, clientName, amountClaimed, executionType, judgmentNumber, judgmentDate) => {
    const state = get();
    const fileNumber = generateFileNumber(state.enforcementCases);
    const id = `ENF-${Math.floor(Math.random() * 900000) + 100000}`;
    
    const newCase: EnforcementCase = {
      id,
      fileNumber,
      source: 'قضية_مكتب',
      caseId: caseData.id,
      clientId: caseData.clientId,
      clientName,
      debtorName: caseData.defendant,
      amountClaimed,
      amountCollected: 0,
      status: 'مفتوح',
      currentStep: 1,
      executionType,
      judgmentNumber,
      judgmentDate,
      judgmentCourt: caseData.court,
      linkedCaseId: caseData.id,
      linkedCaseRef: `${caseData.id} - ${caseData.court}`,
      createdAt: new Date().toISOString(),
      actions: [{
        id: `ACT-${Date.now()}`,
        enforcementCaseId: id,
        title: 'فتح ملف تنفيذ من قضية المكتب',
        date: new Date().toISOString(),
        performedBy: 'النظام',
        type: 'إجراء قانوني',
      }],
    };
    
    set((s) => ({ enforcementCases: [newCase, ...s.enforcementCases] }));
    return newCase;
  },

  createEnforcementManual: (data) => {
    const state = get();
    const fileNumber = generateFileNumber(state.enforcementCases);
    const id = `ENF-${Math.floor(Math.random() * 900000) + 100000}`;
    
    const newCase: EnforcementCase = {
      id,
      fileNumber,
      source: 'حكم_خارجي',
      caseId: '',
      clientId: data.clientId,
      clientName: data.clientName,
      debtorName: data.debtorName,
      amountClaimed: data.amountClaimed,
      amountCollected: 0,
      status: 'مفتوح',
      currentStep: 1,
      executionType: data.executionType,
      judgmentNumber: data.judgmentNumber,
      judgmentDate: data.judgmentDate,
      judgmentCourt: data.judgmentCourt,
      createdAt: new Date().toISOString(),
      actions: [{
        id: `ACT-${Date.now()}`,
        enforcementCaseId: id,
        title: 'فتح ملف تنفيذ من حكم خارجي',
        date: new Date().toISOString(),
        performedBy: 'النظام',
        type: 'إجراء قانوني',
      }],
    };
    
    set((s) => ({ enforcementCases: [newCase, ...s.enforcementCases] }));
    return newCase;
  },
}));
