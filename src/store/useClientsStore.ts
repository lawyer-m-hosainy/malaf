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
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const expiringSoon = poaList.filter(p => 
    p.status === 'ساري' && 
    p.expiryDate && 
    new Date(p.expiryDate) <= thirtyDaysFromNow && 
    new Date(p.expiryDate) >= new Date()
  );

  if (expiringSoon.length > 0) {
    expiringSoon.forEach(p => {
      useNotificationsStore.getState().addNotification({
        title: `تنبيه: توكيل ينتهي قريباً`,
        message: `التوكيل رقم ${p.poaNumber} لسنة ${p.poaYear} ينتهي في ${p.expiryDate}`,
        type: 'warning'
      });
    });
  }
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
    phone: "+966501234567"
  },
  {
    id: "CL-102",
    name: "مؤسسة البناء الحديث",
    type: "منشأة",
    commercialRegistration: "4030123456",
    vatNumber: "300987654300003",
    phone: "+966551234567"
  },
  {
    id: "CL-103",
    name: "أحمد بن عبدالله المفلح",
    type: "فرد",
    nationalId: "1023456789",
    phone: "+966541234567"
  }
];

const INITIAL_CLIENTS_STATE = {
  clients: [] as Client[],
  leads: [] as Lead[],
  keyAccounts: [] as KeyAccount[],
  proposals: [] as Proposal[],
  poas: [] as PowerOfAttorney[],
  hasLoaded: false,
};

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  leads: [],
  keyAccounts: [],
  proposals: [],
  poas: [
    {
      id: "POA-1",
      clientId: "CL-101",
      poaNumber: "1542",
      poaLetter: "ب",
      poaYear: "2023",
      office: "الشهر العقاري",
      type: "قضايا فقط",
      issueDate: "2023-05-15",
      status: "ساري",
      cancellationRequested: false
    }
  ],

  hasLoaded: false,

  reset: () => set({ ...INITIAL_CLIENTS_STATE }),

  setClients: (clients) => set({ clients, hasLoaded: true }),
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
