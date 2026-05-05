import { create } from 'zustand';
import { ContractRequest, ContractTemplate } from '../types';


interface CLMState {
  contractRequests: ContractRequest[];
  contracts: ContractTemplate[];
  setContractRequests: (requests: ContractRequest[]) => void;
  addContractRequest: (request: ContractRequest) => void;
  setContracts: (contracts: ContractTemplate[]) => void;
  addContractTemplate: (template: ContractTemplate) => void;
  addContractVersion: (requestId: string, version: ContractRequest['versions'][number]) => void;
  updateContractStage: (requestId: string, stage: ContractRequest['stage']) => void;
  decideContractApproval: (requestId: string, approvalId: string, status: 'معتمد' | 'مرفوض', notes?: string) => void;
  updateContractObligationStatus: (requestId: string, obligationId: string, status: 'قادم' | 'مكتمل' | 'متأخر') => void;
}

const MOCK_CONTRACT_REQUESTS: ContractRequest[] = [
  {
    id: "REQ-99881",
    title: "عقد شراكة تقنية",
    clientName: "شركة الابتكار الرقمي",
    stage: "اعتماد",
    status: "قيد التنفيذ",
    createdBy: "محامي المؤسسة",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    renewalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    versions: [
      {
        id: "V-1",
        requestId: "REQ-99881",
        versionNumber: 1,
        content: "المسودة الأولى للعقد...",
        createdBy: "محامي المؤسسة",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        changeSummary: "إنشاء المسودة"
      }
    ],
    approvals: [
      {
        id: "APP-1",
        requestId: "REQ-99881",
        approverId: "USR-1",
        approverName: "المدير المالي",
        status: "بانتظار الاعتماد"
      }
    ],
    obligations: [
      {
        id: "OBL-1",
        requestId: "REQ-99881",
        title: "تسليم الدفعة الأولى",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        ownerId: "USR-2",
        status: "قادم"
      }
    ]
  },
  {
    id: "REQ-33221",
    title: "عقد إيجار مكتب",
    clientName: "شركة العقارات الحديثة",
    stage: "تجديد/إنهاء",
    status: "موقع",
    createdBy: "إدارة الأملاك",
    createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
    renewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Renew in 5 days
    versions: [
      {
        id: "V-1",
        requestId: "REQ-33221",
        versionNumber: 1,
        content: "عقد إيجار قياسي...",
        createdBy: "إدارة الأملاك",
        createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
        changeSummary: "النسخة النهائية الموقعة"
      }
    ],
    approvals: [],
    obligations: []
  }
];

export const useCLMStore = create<CLMState>((set) => ({
  contractRequests: MOCK_CONTRACT_REQUESTS,
  contracts: [],

  setContractRequests: (contractRequests) => set({ contractRequests }),
  addContractRequest: (request) => set((state) => ({ contractRequests: [request, ...state.contractRequests] })),
  setContracts: (contracts) => set({ contracts }),
  addContractTemplate: (template) =>
    set((state) => ({ contracts: [template, ...state.contracts] })),

  addContractVersion: (requestId, version) => set((state) => ({
    contractRequests: state.contractRequests.map((r) =>
      r.id === requestId ? { ...r, versions: [...r.versions, version] } : r
    ),
  })),

  updateContractStage: (requestId, stage) => set((state) => ({
    contractRequests: state.contractRequests.map((r) =>
      r.id === requestId ? { ...r, stage } : r
    ),
  })),

  decideContractApproval: (requestId, approvalId, status, notes) => set((state) => ({
    contractRequests: state.contractRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            approvals: r.approvals.map((a) =>
              a.id === approvalId ? { ...a, status, notes, decidedAt: new Date().toISOString() } : a
            ),
            status: status === 'معتمد' ? 'معتمد' : r.status,
          }
        : r
    ),
  })),

  updateContractObligationStatus: (requestId, obligationId, status) => set((state) => ({
    contractRequests: state.contractRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            obligations: r.obligations.map((o) => (o.id === obligationId ? { ...o, status } : o)),
          }
        : r
    ),
  })),
}));
