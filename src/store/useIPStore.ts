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
}

const MOCK_IP_RECORDS: IPRecord[] = [
  {
    id: "IP-1122",
    title: "شعار العلامة التجارية العزم",
    type: "علامة تجارية",
    owner: "شركة العزم للمقاولات",
    registrationNumber: "SA-TM-998811",
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expires in 10 days
    status: "مسجلة"
  },
  {
    id: "IP-3344",
    title: "خوارزمية الذكاء المالي",
    type: "براءة اختراع",
    owner: "مؤسسة الرواد التقنية",
    registrationNumber: "SA-PT-445522",
    expiryDate: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "تحت الفحص"
  }
];

const MOCK_IP_RENEWALS: IPRenewal[] = [
  {
    id: "REN-1",
    ipRecordId: "IP-1122",
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "قادم",
    paid: false,
    feeAmount: 1500
  }
];

const MOCK_IP_OPPOSITIONS: IPOpposition[] = [
  {
    id: "OPP-1",
    ipRecordId: "IP-1122",
    againstParty: "شركة العزم الحديثة",
    reason: "تشابه العلامة التجارية في نفس الفئة",
    filedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "قيد النظر"
  }
];

const MOCK_IP_ENFORCEMENT: IPEnforcementAction[] = [
  {
    id: "ENF-1",
    ipRecordId: "IP-3344",
    actionType: "إنذار",
    description: "استخدام الخوارزمية بدون ترخيص في تطبيق منافس",
    actionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "مفتوح"
  }
];

const MOCK_IP_FILINGS: IPFiling[] = [
  {
    id: "FIL-1029",
    ipRecordId: "IP-1122",
    clientName: "شركة العزم للمقاولات",
    type: "علامة تجارية",
    filingDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    authority: "جهاز تنمية التجارة الداخلية",
    status: "مقبول",
    feeAmount: 3000
  },
  {
    id: "FIL-3392",
    ipRecordId: "IP-3344",
    clientName: "مؤسسة الرواد التقنية",
    type: "براءة اختراع",
    filingDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    authority: "جهاز تنمية التجارة الداخلية",
    status: "قيد الفحص",
    feeAmount: 7500
  }
];

export const useIPStore = create<IPState>((set) => ({
  ipFilings: MOCK_IP_FILINGS,
  ipRenewals: MOCK_IP_RENEWALS,
  ipOppositions: MOCK_IP_OPPOSITIONS,
  ipEnforcementActions: MOCK_IP_ENFORCEMENT,
  ipRecords: MOCK_IP_RECORDS,

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
