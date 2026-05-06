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
  reset: () => void;
}

const MOCK_CONTRACT_REQUESTS: ContractRequest[] = [];

export const useCLMStore = create<CLMState>((set) => ({
  contractRequests: [],
  contracts: [],

  reset: () => set({ contractRequests: [], contracts: [] }),

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
