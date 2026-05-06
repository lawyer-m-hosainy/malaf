import { create } from 'zustand';
import { Client, Lead, KeyAccount, Proposal } from '../types';
import { useNotificationsStore } from './useNotificationsStore';

export type POAType = 'عام' | 'خاص' | 'قضايا فقط' | 'عقاري';
export type POAOffice = 'الشهر العقاري' | 'موثق خاص' | 'قنصلية';
export type POAStatus = 'ساري' | 'ملغي' | 'منتهي';

export interface PowerOfAttorney {
  id: string;
  clientId: string;
  poaNumber: string;
  poaLetter: string;
  poaYear: string;
  office: POAOffice;
  type: POAType;
  issueDate: string;
  expiryDate?: string;
  status: POAStatus;
  cancellationRequested: boolean;
}

const checkPOAExpiry = (poas: PowerOfAttorney | PowerOfAttorney[]) => {
  const poaList = Array.isArray(poas) ? poas : [poas];
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const activePOAs = poaList.filter(p => 
    p.status === 'ساري' && 
    p.expiryDate && 
    new Date(p.expiryDate) >= now
  );

  activePOAs.forEach(p => {
    const expiryDate = new Date(p.expiryDate!);
    const label = `التوكيل رقم ${p.poaNumber} لسنة ${p.poaYear}`;
    
    if (expiryDate <= threeDaysFromNow) {
      useNotificationsStore.getState().addNotification({
        title: `🔴 عاجل: توكيل ينتهي خلال 3 أيام`,
        message: `${label} ينتهي في ${p.expiryDate} — يجب التجديد فوراً`,
        type: 'error'
      });
    } else if (expiryDate <= sevenDaysFromNow) {
      useNotificationsStore.getState().addNotification({
        title: `🟠 تنبيه: توكيل ينتهي خلال 7 أيام`,
        message: `${label} ينتهي في ${p.expiryDate} — يُرجى المبادرة بالتجديد`,
        type: 'warning'
      });
    } else if (expiryDate <= thirtyDaysFromNow) {
      useNotificationsStore.getState().addNotification({
        title: `تنبيه: توكيل ينتهي قريباً`,
        message: `${label} ينتهي في ${p.expiryDate}`,
        type: 'warning'
      });
    }
  });
};
interface ClientsState {
  clients: Client[];
  leads: Lead[];
  keyAccounts: KeyAccount[];
  proposals: Proposal[];
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, updatedData: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  setKeyAccounts: (keyAccounts: KeyAccount[]) => void;
  addKeyAccount: (account: KeyAccount) => void;
  setProposals: (proposals: Proposal[]) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposalStatus: (id: string, status: Proposal['status']) => void;
  poas: PowerOfAttorney[];
  setPOAs: (poas: PowerOfAttorney[]) => void;
  addPOA: (poa: PowerOfAttorney) => void;
  updatePOA: (id: string, updatedData: Partial<PowerOfAttorney>) => void;
  hasLoaded: boolean;
  currentPage: number;
  hasMore: boolean;
  setCurrentPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  /** مسح جميع بيانات الموكلين عند تسجيل الخروج */
  reset: () => void;
}

const MOCK_CLIENTS: Client[] = [
  {
    id: "CL-101",
    name: "شركة الأفق للتطوير العقاري",
    type: "منشأة",
    commercialRegistration: "1010123456",
    vatNumber: "300123456700003",
    phone: "+201012345678"
  },
  {
    id: "CL-102",
    name: "مؤسسة البناء الحديث",
    type: "منشأة",
    commercialRegistration: "4030123456",
    vatNumber: "300987654300003",
    phone: "+201112345678"
  },
  {
    id: "CL-103",
    name: "أحمد بن عبدالله المفلح",
    type: "فرد",
    nationalId: "28501011234567",
    phone: "+201212345678"
  }
];

const INITIAL_CLIENTS_STATE = {
  clients: [] as Client[],
  leads: [] as Lead[],
  keyAccounts: [] as KeyAccount[],
  proposals: [] as Proposal[],
  poas: [] as PowerOfAttorney[],
  hasLoaded: false,
  currentPage: 0,
  hasMore: true,
};

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  leads: [],
  keyAccounts: [],
  proposals: [],
  poas: [],

  hasLoaded: false,
  currentPage: 0,
  hasMore: true,

  reset: () => set({ ...INITIAL_CLIENTS_STATE }),

  setClients: (clients) => set({ clients, hasLoaded: true }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setHasMore: (hasMore) => set({ hasMore }),
  addClient: (client) => set((state) => ({ clients: [client, ...state.clients] })),
  updateClient: (id, updatedData) => set((state) => ({
    clients: state.clients.map(c => c.id === id ? { ...c, ...updatedData } : c)
  })),
  deleteClient: (id) => set((state) => ({
    clients: state.clients.filter(c => c.id !== id)
  })),
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  setKeyAccounts: (keyAccounts) => set({ keyAccounts }),
  addKeyAccount: (account) => set((state) => ({ keyAccounts: [account, ...state.keyAccounts] })),
  setProposals: (proposals) => set({ proposals }),
  addProposal: (proposal) => set((state) => ({ proposals: [proposal, ...state.proposals] })),
  updateProposalStatus: (id, status) => set((state) => ({
    proposals: state.proposals.map(p => p.id === id ? { ...p, status } : p)
  })),
  setPOAs: (poas) => {
    set({ poas });
    checkPOAExpiry(poas);
  },
  addPOA: (poa) => {
    set((state) => ({ poas: [poa, ...state.poas] }));
    checkPOAExpiry(poa);
  },
  updatePOA: (id, updatedData) => set((state) => {
    const updatedPOAs = state.poas.map(p => p.id === id ? { ...p, ...updatedData } : p);
    const updatedPOA = updatedPOAs.find(p => p.id === id);
    if (updatedPOA) {
      checkPOAExpiry(updatedPOA);
    }
    return { poas: updatedPOAs };
  }),
}));
