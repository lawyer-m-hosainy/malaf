import { create } from 'zustand';
import { AdvisoryRequest } from '../types';


interface AdvisoryState {
  advisoryRequests: AdvisoryRequest[];
  setAdvisoryRequests: (requests: AdvisoryRequest[]) => void;
  addAdvisoryOpinion: (requestId: string, opinion: AdvisoryRequest['opinions'][number]) => void;
  updateAdvisoryStatus: (requestId: string, status: AdvisoryRequest['status']) => void;
  decideAdvisoryApproval: (requestId: string, approvalId: string, status: 'معتمد' | 'مرفوض', notes?: string) => void;
}

export const useAdvisoryStore = create<AdvisoryState>((set) => ({
  advisoryRequests: [],

  setAdvisoryRequests: (advisoryRequests) => set({ advisoryRequests }),
  
  addAdvisoryOpinion: (requestId, opinion) => set((state) => ({
    advisoryRequests: state.advisoryRequests.map((r) =>
      r.id === requestId ? { ...r, opinions: [...r.opinions, opinion] } : r
    ),
  })),
  
  updateAdvisoryStatus: (requestId, status) => set((state) => ({
    advisoryRequests: state.advisoryRequests.map((r) =>
      r.id === requestId ? { ...r, status, closedAt: status === 'مغلق' ? new Date().toISOString() : r.closedAt } : r
    ),
  })),
  
  decideAdvisoryApproval: (requestId, approvalId, status, notes) => set((state) => ({
    advisoryRequests: state.advisoryRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            approvals: r.approvals.map((a) =>
              a.id === approvalId ? { ...a, status, notes, decidedAt: new Date().toISOString() } : a
            ),
          }
        : r
    ),
  })),
}));
