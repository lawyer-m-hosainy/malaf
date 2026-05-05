import { useCasesStore } from "@/store/useCasesStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useInvoicesStore } from "@/store/useInvoicesStore";
import { useFinanceStore } from "@/store/useFinanceStore";

export const seedDemoData = async () => {
  const casesStore = useCasesStore.getState();
  const clientsStore = useClientsStore.getState();
  const teamStore = useTeamStore.getState();
  const invoicesStore = useInvoicesStore.getState();
  const financeStore = useFinanceStore.getState();

  // 1. Seed Team
  const demoTeam = [
    { id: 'T1', name: 'أحمد النيل', role: 'شريك مؤسس', email: 'ahmed@nile.com', specialization: 'نقض وجنايات', status: 'نشط' },
    { id: 'T2', name: 'سارة المنصوري', role: 'مدير مكتب', email: 'sara@nile.com', specialization: 'إدارة عمليات', status: 'نشط' },
    { id: 'T3', name: 'محمود حسن', role: 'محامي استئناف', email: 'mahmoud@nile.com', specialization: 'مدني وتجاري', status: 'نشط' },
    { id: 'T4', name: 'ليلى علي', role: 'محامي مبتدئ', email: 'laila@nile.com', specialization: 'أحوال شخصية', status: 'نشط' },
    { id: 'T5', name: 'زينب محمد', role: 'سكرتارية قانونية', email: 'zeinab@nile.com', specialization: 'أرشفة ومتابعة', status: 'نشط' },
  ];
  teamStore.setTeamMembers(demoTeam as any);

  // 2. Seed Clients
  const demoClients = [
    { id: 'C1', name: 'شركة النيل للصناعات الغذائية', type: 'منشأة', phone: '01012345678', email: 'info@nilefood.com', commercialRegistration: '123456', vatNumber: '100-200-300' },
    { id: 'C2', name: 'محمد أحمد عبد الرحمن', type: 'فرد', phone: '01223456789', email: 'm.ahmed@gmail.com', nationalId: '29001011234567' },
    { id: 'C3', name: 'البنك المصري للتجارة', type: 'منشأة', phone: '0223456789', email: 'legal@egybank.com', commercialRegistration: '987654' },
    { id: 'C4', name: 'شركة المقاولات المتحدة', type: 'منشأة', phone: '01112223334', email: 'contact@united-const.com', commercialRegistration: '554433' },
    { id: 'C5', name: 'ليلى محمود كامل', type: 'فرد', phone: '01098765432', email: 'layla.m@yahoo.com', nationalId: '28505051234567' },
    { id: 'C6', name: 'فندق كليوباترا ريزورت', type: 'منشأة', phone: '0653456789', email: 'gm@cleopatra.com', commercialRegistration: '887766' },
    // Adding more to reach ~30
    ...Array.from({ length: 24 }).map((_, i) => ({
      id: `C${i + 7}`,
      name: `موكل تجريبي رقم ${i + 7}`,
      type: i % 2 === 0 ? 'فرد' : 'منشأة',
      phone: `010000000${i + 7}`,
      email: `test${i + 7}@example.com`,
      nationalId: `290000000000${i + 7}`,
    }))
  ];
  clientsStore.setClients(demoClients as any);

  // 3. Seed POAs
  const demoPOAs = [
    { id: 'P1', clientId: 'C1', poaNumber: '1234', poaLetter: 'أ', poaYear: '2023', office: 'توثيق الأهرام', status: 'ساري', expiryDate: '2028-01-01' },
    { id: 'P2', clientId: 'C2', poaNumber: '5678', poaLetter: 'ب', poaYear: '2024', office: 'توثيق عابدين', status: 'ساري', expiryDate: '2026-05-15' },
    { id: 'P3', clientId: 'C5', poaNumber: '9012', poaLetter: 'ج', poaYear: '2024', office: 'توثيق الجيزة', status: 'ساري', expiryDate: '2024-05-30' }, // Expires VERY soon
    ...Array.from({ length: 17 }).map((_, i) => ({
      id: `P${i + 4}`,
      clientId: `C${i + 4}`,
      poaNumber: `${1000 + i}`,
      poaLetter: 'أ',
      poaYear: '2024',
      office: 'توثيق القاهرة',
      status: 'ساري',
      expiryDate: '2029-01-01'
    }))
  ];
  clientsStore.setPOAs(demoPOAs as any);

  // 4. Seed Cases
  const demoCases = [
    { 
      id: '123-2024-مدني', 
      clientId: 'C1', 
      title: 'نزاع عقدي على توريد خامات', 
      court: 'المحكمة الاقتصادية', 
      type: 'اقتصادي', 
      status: 'متداولة', 
      plaintiff: 'شركة النيل للصناعات الغذائية', 
      defendant: 'شركة التوريدات العالمية',
      currentTier: 'ابتدائي',
      firstInstanceNumber: '123',
      firstInstanceYear: '2024',
      commercialRegRef: '123456',
      createdAt: new Date().toISOString()
    },
    { 
      id: '456-2023-جنائي', 
      clientId: 'C2', 
      title: 'قضية تبديد أمانة', 
      court: 'محكمة الجنايات', 
      type: 'جنائي', 
      status: 'متداولة', 
      plaintiff: 'النيابة العامة', 
      defendant: 'محمد أحمد عبد الرحمن',
      currentTier: 'مستأنف',
      appealNumber: '456',
      appealYear: '2023',
      criminalTier: 'جنحة',
      criminalStage: 'الطعن بالاستئناف',
      prosecutionRef: 'محضر 789 لسنة 2023 عابدين',
      createdAt: new Date().toISOString()
    },
    { 
      id: '789-2024-أسرة', 
      clientId: 'C5', 
      title: 'دعوى نفقة زوجية', 
      court: 'محكمة الأسرة بالمعادي', 
      type: 'أحوال شخصية', 
      status: 'متداولة', 
      plaintiff: 'ليلى محمود كامل', 
      defendant: 'أحمد علي حسن',
      currentTier: 'ابتدائي',
      firstInstanceNumber: '789',
      firstInstanceYear: '2024',
      familyCaseType: 'نفقة زوجية',
      createdAt: new Date().toISOString()
    },
    ...Array.from({ length: 47 }).map((_, i) => ({
      id: `${1000 + i}-2024-مدني`,
      clientId: `C${(i % 30) + 1}`,
      title: `قضية تجريبية رقم ${i + 4}`,
      court: i % 2 === 0 ? 'محكمة جنوب القاهرة' : 'محكمة شمال القاهرة',
      type: 'مدني',
      status: 'متداولة',
      plaintiff: 'الموكل',
      defendant: 'الخصم',
      currentTier: 'ابتدائي',
      firstInstanceNumber: `${1000 + i}`,
      firstInstanceYear: '2024',
      createdAt: new Date().toISOString()
    }))
  ];
  casesStore.setCases(demoCases as any);

  // 5. Seed Sessions
  const demoSessions = Array.from({ length: 100 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + (i - 50)); // Some past, some future
    return {
      id: `S${i + 1}`,
      caseId: demoCases[i % 50].id,
      caseName: demoCases[i % 50].title,
      date: date.toISOString().split('T')[0],
      time: '09:00',
      court: demoCases[i % 50].court,
      circuit: 'الدائرة 5 مدني',
      status: date < new Date() ? 'منتهية' : 'قادمة',
      responsibleLawyer: demoTeam[i % 5].name,
    };
  });
  casesStore.setSessions(demoSessions as any);

  // 6. Seed Invoices
  const demoInvoices = Array.from({ length: 30 }).map((_, i) => {
    const base = 5000 + (i * 1000);
    const vat = base * 0.14;
    return {
      id: `INV-2024-${100 + i}`,
      clientId: demoClients[i % 30].id,
      clientName: demoClients[i % 30].name,
      base,
      vat,
      total: base + vat,
      status: i % 2 === 0 ? 'مدفوعة' : 'غير مدفوعة',
      date: new Date(Date.now() - (i * 86400000)).toISOString(),
      dueDate: new Date(Date.now() + ((i - 15) * 86400000)).toISOString(),
    };
  });
  invoicesStore.setInvoices(demoInvoices as any);

  // 7. Seed Expenses
  const demoExpenses = Array.from({ length: 15 }).map((_, i) => ({
    id: `EXP-${100 + i}`,
    clientId: demoClients[i % 30].id,
    caseId: demoCases[i % 50].id,
    category: 'رسوم قضائية' as any,
    amount: 500 + (i * 100),
    date: new Date().toISOString(),
    status: 'تم السداد' as any,
    description: `مصروفات قضائية للقضية ${i + 1}`,
  }));
  financeStore.setExpenses(demoExpenses as any);

  // 8. Seed Tasks (including Expert tasks)
  const demoTasks = Array.from({ length: 25 }).map((_, i) => ({
    id: `T-${100 + i}`,
    title: i < 10 ? `مهمة خبير: ${demoCases[i].title}` : `مهمة عمل رقم ${i}`,
    description: i < 10 ? 'متابعة مكتب الخبراء وتقديم المستندات المطلوبة' : `تفاصيل المهمة رقم ${i}`,
    status: i % 3 === 0 ? 'completed' : 'pending' as any,
    priority: i % 2 === 0 ? 'high' : 'medium' as any,
    dueDate: new Date(Date.now() + (i * 86400000)).toISOString(),
    assignedTo: demoTeam[i % 5].id,
    caseId: demoCases[i % 50].id,
  }));
  teamStore.setTasks(demoTasks as any);

  console.log("✅ Seed complete: Nile Law Firm demo data loaded.");
};
