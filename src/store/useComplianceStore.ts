import { create } from 'zustand';
import { 
  RiskRegister, Control, ComplianceIssue, RegulatoryObligation, 
  ComplianceRecord, LegalPrecedent, QAReview, ConflictCheckRecord,
  KnowledgeAsset, SpecializedTrack, TrainingPathway, KSAAssessment
} from '../types';


interface ComplianceState {
  riskRegisters: RiskRegister[];
  controls: Control[];
  complianceIssues: ComplianceIssue[];
  regulatoryObligations: RegulatoryObligation[];
  compliance: ComplianceRecord[];
  precedents: LegalPrecedent[];
  qaReviews: QAReview[];
  conflictHistory: ConflictCheckRecord[];
  knowledgeAssets: KnowledgeAsset[];
  specializedTracks: SpecializedTrack[];
  trainingPathways: TrainingPathway[];
  assessments: KSAAssessment[];

  setRiskRegisters: (registers: RiskRegister[]) => void;
  setControls: (controls: Control[]) => void;
  setComplianceIssues: (issues: ComplianceIssue[]) => void;
  setRegulatoryObligations: (obligations: RegulatoryObligation[]) => void;
  setCompliance: (compliance: ComplianceRecord[]) => void;
  addComplianceRecord: (record: ComplianceRecord) => void;
  updateComplianceRecord: (id: string, updates: Partial<ComplianceRecord>) => void;
  removeComplianceRecord: (id: string) => void;
  setPrecedents: (precedents: LegalPrecedent[]) => void;
  setQAReviews: (reviews: QAReview[]) => void;
  addQAReview: (review: QAReview) => void;
  addPrecedent: (precedent: LegalPrecedent) => void;
  addConflictRecord: (record: ConflictCheckRecord) => void;
  setKnowledgeAssets: (assets: KnowledgeAsset[]) => void;
  addKnowledgeAsset: (asset: KnowledgeAsset) => void;
  setSpecializedTracks: (tracks: SpecializedTrack[]) => void;
  addSpecializedTrack: (track: SpecializedTrack) => void;
  setTrainingPathways: (pathways: TrainingPathway[]) => void;
  setAssessments: (assessments: KSAAssessment[]) => void;

  updateRiskStatus: (id: string, status: RiskRegister['status']) => void;
  updateComplianceIssueStatus: (id: string, status: ComplianceIssue['status']) => void;
  updateQAChecklist: (reviewId: string, itemId: string, isMet: boolean) => void;
  updateQAStatus: (reviewId: string, status: QAReview['status']) => void;
  toggleSpecializedChecklist: (trackId: string, checklistId: string) => void;
  updateSpecializedTrackStatus: (trackId: string, status: SpecializedTrack['status']) => void;
  updateTrainingModuleStatus: (pathwayId: string, moduleId: string, status: TrainingPathway['modules'][number]['status']) => void;
  reset: () => void;
}

const MOCK_PRECEDENTS: LegalPrecedent[] = [];

const MOCK_QA_REVIEWS: QAReview[] = [];

export const useComplianceStore = create<ComplianceState>((set) => ({
  riskRegisters: [],
  controls: [],
  complianceIssues: [],
  regulatoryObligations: [],
  compliance: [],
  precedents: [],
  qaReviews: [],
  conflictHistory: [],
  knowledgeAssets: [],
  specializedTracks: [],
  trainingPathways: [],
  assessments: [],

  reset: () => set({
    riskRegisters: [],
    controls: [],
    complianceIssues: [],
    regulatoryObligations: [],
    compliance: [],
    precedents: [],
    qaReviews: [],
    conflictHistory: [],
    knowledgeAssets: [],
    specializedTracks: [],
    trainingPathways: [],
    assessments: [],
  }),

  setRiskRegisters: (riskRegisters) => set({ riskRegisters }),
  setControls: (controls) => set({ controls }),
  setComplianceIssues: (complianceIssues) => set({ complianceIssues }),
  setRegulatoryObligations: (regulatoryObligations) => set({ regulatoryObligations }),
  setCompliance: (compliance) => set({ compliance }),
  precedents: MOCK_PRECEDENTS,
  qaReviews: MOCK_QA_REVIEWS,
  conflictHistory: [],
  knowledgeAssets: [
    {
      id: "A-001",
      title: "دليل صياغة عقود التأسيس للشركات ذات المسؤولية المحدودة",
      category: "Procedure",
      version: 2,
      isVerified: true,
      updatedAt: "2024-03-15",
      createdAt: "2024-01-10",
      authorId: "U-001",
      contentUrl: "/docs/llc-guide.pdf",
      tags: ["شركات", "عقود", "نماذج"],
    },
    {
      id: "A-002",
      title: "أحدث التعديلات على قانون الإفلاس المصري",
      category: "Research",
      version: 1,
      isVerified: true,
      updatedAt: "2024-04-10",
      createdAt: "2024-04-10",
      authorId: "U-002",
      contentUrl: "/docs/bankruptcy-amendments.pdf",
      tags: ["نظام الإفلاس", "أبحاث", "تحديثات"],
    }
  ],
  specializedTracks: [
    {
      id: "ST-LAB-1029",
      caseId: "C-152468",
      caseType: "عمالي",
      stage: "محكمة ابتدائية",
      slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now (SLA alert)
      status: "نشط",
      checklist: [
        { id: "chk-1", title: "مراجعة عقد العمل والملاحق", done: true },
        { id: "chk-2", title: "احتساب مكافأة نهاية الخدمة بدقة", done: true },
        { id: "chk-3", title: "إرفاق كشف الحساب البنكي لتحويل الرواتب", done: false },
        { id: "chk-4", title: "صياغة لائحة الدعوى العمالية", done: false },
      ],
      documentTemplates: [
        { id: "tpl-1", title: "لائحة دعوى عمالية", type: "لائحة" },
        { id: "tpl-2", title: "مذكرة رد عمالية", type: "مذكرة" }
      ],
      steps: [
        { id: "s-1", name: "جمع المستندات", completed: true },
        { id: "s-2", name: "محاولة الصلح عبر منصة ودي", completed: true, notes: "فشلت محاولة الصلح" },
        { id: "s-3", name: "رفع الدعوى في بوابة المحاكم", completed: false },
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "ST-CRI-9921",
      caseId: "C-998822",
      caseType: "جنائي",
      stage: "النيابة العامة",
      slaDueAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days late
      status: "متأخر",
      checklist: [
        { id: "chk-1", title: "استلام لائحة الاتهام", done: true },
        { id: "chk-2", title: "الاطلاع على ملف التحقيق", done: false },
        { id: "chk-3", title: "إعداد مذكرة الدفوع الشكلية والموضوعية", done: false },
      ],
      documentTemplates: [
        { id: "tpl-1", title: "مذكرة دفوع جزائية", type: "مذكرة" },
        { id: "tpl-2", title: "طلب إخلاء سبيل", type: "أخرى" }
      ],
      steps: [
        { id: "s-1", name: "حضور جلسة التحقيق", completed: true },
        { id: "s-2", name: "تقديم الدفوع الأولية", completed: false },
      ],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  trainingPathways: [],
  assessments: [],

  setRiskRegisters: (riskRegisters) => set({ riskRegisters }),
  setControls: (controls) => set({ controls }),
  setComplianceIssues: (complianceIssues) => set({ complianceIssues }),
  setRegulatoryObligations: (regulatoryObligations) => set({ regulatoryObligations }),
  setCompliance: (compliance) => set({ compliance }),
  addComplianceRecord: (record) => set((state) => ({ compliance: [record, ...state.compliance] })),
  updateComplianceRecord: (id, updates) => set((state) => ({
    compliance: state.compliance.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  removeComplianceRecord: (id) => set((state) => ({
    compliance: state.compliance.filter(r => r.id !== id)
  })),
  setPrecedents: (precedents) => set({ precedents }),
  setQAReviews: (qaReviews) => set({ qaReviews }),
  addQAReview: (review) =>
    set((state) => ({ qaReviews: [review, ...state.qaReviews] })),
  addPrecedent: (precedent) =>
    set((state) => ({ precedents: [precedent, ...state.precedents] })),
  addConflictRecord: (record) => set((state) => ({ conflictHistory: [record, ...state.conflictHistory] })),
  setKnowledgeAssets: (knowledgeAssets) => set({ knowledgeAssets }),
  addKnowledgeAsset: (asset) =>
    set((state) => ({ knowledgeAssets: [asset, ...state.knowledgeAssets] })),
  setSpecializedTracks: (specializedTracks) => set({ specializedTracks }),
  addSpecializedTrack: (track) => set((state) => ({ specializedTracks: [track, ...state.specializedTracks] })),
  setTrainingPathways: (trainingPathways) => set({ trainingPathways }),
  setAssessments: (assessments) => set({ assessments }),

  updateRiskStatus: (id, status) => set((state) => ({
    riskRegisters: state.riskRegisters.map((r) => (r.id === id ? { ...r, status } : r)),
  })),
  updateComplianceIssueStatus: (id, status) => set((state) => ({
    complianceIssues: state.complianceIssues.map((i) => (i.id === id ? { ...i, status } : i)),
  })),
  updateQAChecklist: (reviewId, itemId, isMet) => set((state) => ({
    qaReviews: state.qaReviews.map(review => 
      review.id === reviewId 
        ? { ...review, checklist: review.checklist.map(item => item.id === itemId ? { ...item, isMet } : item) }
        : review
    )
  })),
  updateQAStatus: (reviewId, status) => set((state) => ({
    qaReviews: state.qaReviews.map(review => review.id === reviewId ? { ...review, status, completedAt: status === 'Approved' ? new Date().toISOString() : review.completedAt } : review)
  })),
  toggleSpecializedChecklist: (trackId, checklistId) => set((state) => ({
    specializedTracks: state.specializedTracks.map((t) =>
      t.id === trackId
        ? {
            ...t,
            checklist: t.checklist.map((c) => (c.id === checklistId ? { ...c, done: !c.done } : c)),
          }
        : t
    ),
  })),
  updateSpecializedTrackStatus: (trackId, status) => set((state) => ({
    specializedTracks: state.specializedTracks.map((t) =>
      t.id === trackId ? { ...t, status } : t
    ),
  })),
  updateTrainingModuleStatus: (pathwayId, moduleId, status) => set((state) => ({
    trainingPathways: state.trainingPathways.map(pathway => 
      pathway.id === pathwayId 
        ? { 
            ...pathway, 
            modules: pathway.modules.map(mod => mod.id === moduleId ? { ...mod, status, completedAt: status === 'Completed' ? new Date().toISOString() : mod.completedAt } : mod),
            overallProgress: Math.round((pathway.modules.length > 0 ? (pathway.modules.filter(m => m.status === 'Completed').length / pathway.modules.length) * 100 : 0))
          }
        : pathway
    )
  })),
}));
