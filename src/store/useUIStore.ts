import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OfficeSettings, Notification, WikiArticle, Workflow, AuditLog, ESignatureRequest } from '../types';


interface UIState {
  officeSettings: OfficeSettings;
  notifications: Notification[];
  wikiArticles: WikiArticle[];
  workflows: Workflow[];
  auditLogs: AuditLog[];
  eSignatures: ESignatureRequest[];
  isSidebarOpen: boolean;
  isAiFallback: boolean;

  toggleSidebar: () => void;
  closeSidebar: () => void;
  setAiFallback: (isFallback: boolean) => void;

  setOfficeSettings: (settings: OfficeSettings) => void;
  setNotifications: (notifications: Notification[]) => void;
  markNotificationAsRead: (id: string) => void;
  setWikiArticles: (articles: WikiArticle[]) => void;
  addWikiArticle: (article: WikiArticle) => void;
  setWorkflows: (workflows: Workflow[]) => void;
  addAuditLog: (log: AuditLog) => void;
  setESignatures: (requests: ESignatureRequest[]) => void;
  addESignature: (request: ESignatureRequest) => void;
  /** تسجيل الخروج: إعادة ضبط إعدادات الواجهة */
  reset: () => void;
}

const initialState = {
  officeSettings: {
    name: "",
    vatNumber: "",
    address: "",
    phone: "",
    email: "",
    logo: ""
  },
  notifications: [],
  wikiArticles: [
    {
      id: "W-001",
      title: "أهم نقاط نظام الشركات الجديد ومدى تأثيره على العقود التجارية",
      content: "يتضمن نظام الشركات الجديد العديد من الأحكام التي تهدف إلى تعزيز المرونة للشركات...",
      category: "أنظمة",
      author: "أحمد بن علي",
      lastUpdated: "2024-04-18",
      tags: ["نظام الشركات الجديد", "تجاري"]
    },
    {
      id: "W-002",
      title: "متطلبات رفع دعوى في المنازعات العقارية",
      content: "تتطلب المنازعات العقارية التأكد من عدة مستندات قبل قيد الدعوى ومنها...",
      category: "إجراءات",
      author: "سعد بن عبدالله",
      lastUpdated: "2024-04-12",
      tags: ["المنازعات العقارية", "محكمة عامة"]
    },
    {
      id: "W-003",
      title: "شروط التحكيم التجاري وصياغة شرط التحكيم",
      content: "يجب أن يكون شرط التحكيم التجاري واضحاً ومحدداً للمركز أو الآلية المتبعة...",
      category: "أبحاث",
      author: "فريق البحث",
      lastUpdated: "2024-04-05",
      tags: ["التحكيم التجاري", "عقود"]
    }
  ] as WikiArticle[],
  workflows: [],
  auditLogs: [],
  eSignatures: [],
  isSidebarOpen: false,
  isAiFallback: false,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
  ...initialState,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  setAiFallback: (isAiFallback) => set({ isAiFallback }),

  setOfficeSettings: (officeSettings) => set({ officeSettings }),
  setNotifications: (notifications) => set({ notifications }),
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  })),
  setWikiArticles: (wikiArticles) => set({ wikiArticles }),
  addWikiArticle: (article) => set((state) => ({ wikiArticles: [article, ...state.wikiArticles] })),
  setWorkflows: (workflows) => set({ workflows }),
  addAuditLog: (log) => set((state) => ({ auditLogs: [log, ...state.auditLogs] })),
  setESignatures: (eSignatures) => set({ eSignatures }),
  addESignature: (request) => set((state) => ({ eSignatures: [request, ...state.eSignatures] })),
  reset: () => set({ ...initialState }),
    }),
    {
      name: 'malaf-ui-storage',
      partialize: (state) => ({ 
        officeSettings: state.officeSettings,
        isSidebarOpen: state.isSidebarOpen,
        isAiFallback: state.isAiFallback
      }),
    }
  )
);
