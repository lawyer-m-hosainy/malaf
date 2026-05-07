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
