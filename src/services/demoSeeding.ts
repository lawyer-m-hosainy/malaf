import { useClientsStore } from "@/store/useClientsStore";
import { useCasesStore } from "@/store/useCasesStore";
import { useInvoicesStore } from "@/store/useInvoicesStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useEnforcementStore } from "@/store/useEnforcementStore";
import { Client, Case, Session, Deadline, Invoice, TeamMember, Task, TrustAccount } from "@/types";

/**
 * دالة بذر البيانات التجريبية - مكتب "النيل للمحاماة"
 */
export const seedDemoData = () => {
  const clients: Client[] = [
    { id: "CL-EG-001", name: "شركة النيل للتطوير العقاري", type: "منشأة", commercialRegistration: "1010556677", vatNumber: "300123456700003", phone: "+201012345678", email: "info@nile-realestate.com" },
    { id: "CL-EG-002", name: "أحمد محمود المنصوري", type: "فرد", nationalId: "28501011234567", phone: "+201223344556", email: "ahmed.mansouri@email.com" },
    { id: "CL-EG-003", name: "مؤسسة الأهرام للاستيراد", type: "منشأة", commercialRegistration: "4030998877", vatNumber: "310987654300003", phone: "+201112223334", email: "hr@ahram-import.eg" },
    { id: "CL-EG-004", name: "سارة حسن الجندي", type: "فرد", nationalId: "29205051234567", phone: "+201556677889", email: "sara.jundi@email.com" },
    { id: "CL-EG-005", name: "بنك مصر (فرع قصر النيل)", type: "منشأة", commercialRegistration: "12345", vatNumber: "300000000000003", phone: "+20223912345", email: "legal@banquemisr.com" },
  ];

  const cases: Case[] = [
    {
      id: "C-2026-001",
      clientId: "CL-EG-001",
      type: "تجاري",
      status: "متداولة",
      court: "المحكمة الاقتصادية",
      plaintiff: "شركة النيل للتطوير العقاري",
      defendant: "شركة المقاولات المتحدة",
      title: "دعوى تعويض عن تأخير تنفيذ",
      circuit: "الدائرة الثالثة تجاري",
      automatedNumber: "123456789",
      powerOfAttorneyRef: "1234 / ب / 2023",
      eLitigationStatus: "مربوط ببوابة التقاضي",
      createdAt: new Date().toISOString(),
      circulationCode: "CIRC-101",
      currentTier: "ابتدائي",
      firstInstanceNumber: "1542/2024",
      memorandums: [],
    },
    {
      id: "C-2026-002",
      clientId: "CL-EG-002",
      type: "جنائي",
      status: "تحت الدراسة",
      court: "المحكمة الجنائية الابتدائية",
      plaintiff: "النيابة العامة",
      defendant: "أحمد محمود المنصوري",
      title: "جنحة شيك بدون رصيد",
      circuit: "دائرة الجنح",
      automatedNumber: "987654321",
      powerOfAttorneyRef: "5566 / ج / 2024",
      eLitigationStatus: "غير مربوط",
      createdAt: new Date().toISOString(),
      circulationCode: "CIRC-102",
      currentTier: "ابتدائي",
      criminalTier: "جنحة",
      criminalStage: "مرحلة المحاكمة",
      prosecutionRef: "123/2024 نيابة العجوزة",
      memorandums: [],
    },
    {
      id: "C-2026-003",
      clientId: "CL-EG-004",
      type: "أحوال شخصية",
      status: "متداولة",
      court: "محاكم الأسرة",
      plaintiff: "سارة حسن الجندي",
      defendant: "إبراهيم علي محمود",
      title: "دعوى نفقة زوجية وصغير",
      circuit: "دائرة الأسرة",
      automatedNumber: "456123789",
      powerOfAttorneyRef: "7788 / أ / 2024",
      eLitigationStatus: "غير مربوط",
      createdAt: new Date().toISOString(),
      circulationCode: "CIRC-103",
      currentTier: "ابتدائي",
      familyCaseType: "نفقة زوجية",
      memorandums: [],
    },
  ];

  const sessions: Session[] = [
    {
      id: "S-EG-001",
      caseId: "C-2026-001",
      caseName: "شركة النيل ضد المقاولات المتحدة",
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // بعد يومين
      time: "09:00",
      court: "المحكمة الاقتصادية",
      circuit: "الدائرة الثالثة",
      status: "قادمة",
      responsibleLawyer: "أ. خالد محمود",
    },
    {
      id: "S-EG-002",
      caseId: "C-2026-002",
      caseName: "جنحة شيك - أحمد المنصوري",
      date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      time: "10:30",
      court: "المحكمة الجنائية الابتدائية",
      circuit: "دائرة السبت",
      status: "قادمة",
      responsibleLawyer: "أ. منى سعيد",
    },
  ];

  const invoices: Invoice[] = [
    { id: "INV-2026-001", clientId: "CL-EG-001", clientName: "شركة النيل للتطوير العقاري", base: 50000, vat: 7000, total: 57000, status: "مدفوعة", date: new Date().toISOString() },
    { id: "INV-2026-002", clientId: "CL-EG-002", clientName: "أحمد محمود المنصوري", base: 10000, vat: 1400, total: 11400, status: "غير مدفوعة", date: new Date().toISOString() },
  ];

  const team: TeamMember[] = [
    { id: "TM-001", name: "د. إبراهيم الفقي", role: "محامي شريك", email: "ibrahim@nile-law.eg", avatar: "https://i.pravatar.cc/150?u=ibrahim", activeCases: 10, pendingTasks: 2, completedTasks: 15, joinDate: new Date().toISOString(), status: 'نشط' },
    { id: "TM-002", name: "أ. محمود صبري", role: "محامي مستشار", email: "mahmoud@nile-law.eg", avatar: "https://i.pravatar.cc/150?u=mahmoud", activeCases: 5, pendingTasks: 4, completedTasks: 20, joinDate: new Date().toISOString(), status: 'نشط' },
    { id: "TM-003", name: "أ. رانيا يوسف", role: "محامي", email: "rania@nile-law.eg", avatar: "https://i.pravatar.cc/150?u=rania", activeCases: 8, pendingTasks: 1, completedTasks: 10, joinDate: new Date().toISOString(), status: 'نشط' },
  ];

  const tasks: Task[] = [
    { id: "TK-001", title: "إعداد مذكرة الرد", status: "pending", priority: "high", dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), assignedTo: "TM-002", caseId: "C-2026-001" },
  ];

  // Populate stores
  useClientsStore.getState().setClients(clients);
  useCasesStore.getState().setCases(cases);
  useCasesStore.getState().setSessions(sessions);
  useInvoicesStore.getState().setInvoices(invoices);
  useTeamStore.getState().setTeamMembers(team);
  useTeamStore.getState().setTasks(tasks);

  console.log("✅ تم تحميل البيانات التجريبية لمكتب النيل للمحاماة بنجاح.");
};
