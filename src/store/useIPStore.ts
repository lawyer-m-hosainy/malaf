import { create } from 'zustand';
import { IPFiling, IPRenewal, IPOpposition, IPEnforcementAction, IPRecord } from '../types';


interface IPState {
  ipFilings: IPFiling[];
  ipRenewals: IPRenewal[];
  ipOppositions: IPOpposition[];
  ipEnforcementActions: IPEnforcementAction[];
  ipRecords: IPRecord[];

  setIPFilings: (filings: IPFiling[]) => void;
  addIPFiling: (filing: IPFiling) => void;
  setIPRenewals: (renewals: IPRenewal[]) => void;
  setIPOppositions: (oppositions: IPOpposition[]) => void;
  setIPEnforcementActions: (actions: IPEnforcementAction[]) => void;
  setIPRecords: (records: IPRecord[]) => void;
  addIPRecord: (record: IPRecord) => void;
  renewIPRecord: (id: string) => void;

  updateIPRenewalStatus: (id: string, status: IPRenewal['status']) => void;
  updateIPOppositionStatus: (id: string, status: IPOpposition['status']) => void;
  updateIPEnforcementStatus: (id: string, status: IPEnforcementAction['status']) => void;
  reset: () => void;
}

const MOCK_IP_RECORDS: IPRecord[] = [];

const MOCK_IP_RENEWALS: IPRenewal[] = [];

const MOCK_IP_OPPOSITIONS: IPOpposition[] = [];

const MOCK_IP_ENFORCEMENT: IPEnforcementAction[] = [];

const MOCK_IP_FILINGS: IPFiling[] = [];

export const useIPStore = create<IPState>((set) => ({
  ipFilings: [],
  ipRenewals: [],
  ipOppositions: [],
  ipEnforcementActions: [],
  ipRecords: [],

  reset: () => set({
    ipFilings: [],
    ipRenewals: [],
    ipOppositions: [],
    ipEnforcementActions: [],
    ipRecords: [],
  }),

  setIPFilings: (ipFilings) => set({ ipFilings }),
  addIPFiling: (filing) => set((state) => ({ ipFilings: [filing, ...state.ipFilings] })),
  setIPRenewals: (ipRenewals) => set({ ipRenewals }),
  setIPOppositions: (ipOppositions) => set({ ipOppositions }),
  setIPEnforcementActions: (ipEnforcementActions) => set({ ipEnforcementActions }),
  setIPRecords: (ipRecords) => set({ ipRecords }),
  addIPRecord: (record) => set((state) => ({ ipRecords: [...state.ipRecords, record] })),
  renewIPRecord: (id) => set((state) => ({
    ipRecords: state.ipRecords.map((r) =>
      r.id === id ? { ...r, status: 'مسجلة' as const, expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } : r
    ),
  })),

  updateIPRenewalStatus: (id, status) => set((state) => ({
    ipRenewals: state.ipRenewals.map((r) => (r.id === id ? { ...r, status, paid: status === 'مكتمل' ? true : r.paid } : r)),
  })),
  updateIPOppositionStatus: (id, status) => set((state) => ({
    ipOppositions: state.ipOppositions.map((o) => (o.id === id ? { ...o, status } : o)),
  })),
  updateIPEnforcementStatus: (id, status) => set((state) => ({
    ipEnforcementActions: state.ipEnforcementActions.map((a) => (a.id === id ? { ...a, status } : a)),
  })),
}));
