import { 
  Client, Case, Session, UserProfile, Notification, Task, OfficeSettings, Expense, TeamMember,
  ComplianceRecord, LegalPrecedent, ContractTemplate, IPRecord, TimeEntry, Deadline, EnforcementCase, AdvisoryRequest,
  RiskRegister, Control, ComplianceIssue, RegulatoryObligation, ReceivableAccount, ContractRequest, IPFiling, IPRenewal, IPOpposition, IPEnforcementAction,
  SpecializedTrack, KeyAccount, Proposal, PricingModel, QAReview, KnowledgeAsset, TrainingPathway, EgyptAssessment, ConflictCheckRecord
} from "../types";

export const mockUser: UserProfile = {
  id: 'U-001',
  name: 'د. أحمد حسني المحامي',
  email: 'm.hosainy.law@gmail.com',
  role: 'مدير مكتب',
  avatar: 'https://picsum.photos/seed/lawyer/200/200'
};

export const mockOfficeSettings: OfficeSettings = {
  name: 'مكتب د. أحمد حسني للمحاماة والاستشارات القانونية',
  vatNumber: '123456789',
  address: 'القاهرة، وسط البلد، شارع قصر النيل، برج النيل، الدور 12',
  phone: '+20223456789',
  email: 'info@hosni-law.eg',
  logo: 'https://picsum.photos/seed/law-logo/200/200'
};

export const mockNotifications: Notification[] = [
  { id: 'N-1', title: 'موعد جلسة قادم', description: 'قضية شركة النيل للتجارة - غداً الساعة 10:00 صباحاً', type: 'warning', isRead: false, createdAt: '2024-04-07T10:00:00Z' },
  { id: 'N-2', title: 'تحديث بوابة التقاضي', description: 'تم تحديث حالة 3 قضايا على بوابة التقاضي الإلكتروني.', type: 'success', isRead: true, createdAt: '2024-04-06T15:30:00Z' },
  { id: 'N-3', title: 'عميل جديد', description: 'تمت إضافة "محمد عبدالرحمن السيد" إلى قائمة العملاء.', type: 'info', isRead: false, createdAt: '2024-04-07T09:15:00Z' },
];

export const mockTasks: Task[] = [
  { id: 'T-1', caseId: 'C-1001', title: 'تجهيز اللائحة الاعتراضية', assignedTo: 'U-001', dueDate: '2024-04-10', status: 'pending', priority: 'high' },
  { id: 'T-2', caseId: 'C-1003', title: 'مراجعة عقد التأسيس', assignedTo: 'U-001', dueDate: '2024-04-12', status: 'pending', priority: 'medium' },
  { id: 'T-3', caseId: 'C-1005', title: 'سداد الرسوم القضائية', assignedTo: 'U-001', dueDate: '2024-04-08', status: 'completed', priority: 'low' },
];

export const mockClients: Client[] = [
  { id: '1', name: 'شركة النيل للتجارة والتوريدات', type: 'منشأة', commercialRegistration: '54321', vatNumber: '123456789', phone: '+201012345678' },
  { id: '2', name: 'محمد عبدالرحمن السيد', type: 'فرد', nationalId: '28501011234567', phone: '+201112345678' },
  { id: '3', name: 'مؤسسة الأهرام الرقمية', type: 'منشأة', commercialRegistration: '98765', vatNumber: '987654321', phone: '+201212345678' },
  { id: '4', name: 'فاطمة أحمد حسن', type: 'فرد', nationalId: '29003221234567', phone: '+201512345678' },
  { id: '5', name: 'شركة بيراميدز للمقاولات', type: 'منشأة', commercialRegistration: '55566', vatNumber: '555666777', phone: '+201012349876' },
  { id: '6', name: 'أحمد محمود عبدالله', type: 'فرد', nationalId: '28807151234567', phone: '+201098765432' },
  { id: '7', name: 'مجموعة القاهرة المالية', type: 'منشأة', commercialRegistration: '11122', vatNumber: '111222333', phone: '+201198765432' },
  { id: '8', name: 'نورهان سعيد محمد', type: 'فرد', nationalId: '29505101234567', phone: '+201298765432' },
  { id: '9', name: 'شركة المصرية للاتصالات', type: 'منشأة', commercialRegistration: '22233', vatNumber: '222333444', phone: '+201598765432' },
  { id: '10', name: 'محمد عبدالرحمن السيد', type: 'فرد', nationalId: '29201011234567', phone: '+201098761234' },
];

export const mockCases: Case[] = [
  { 
    id: 'C-1001', 
    clientId: '1',
    court: 'المحكمة الاقتصادية', 
    type: 'تجاري',
    plaintiff: 'شركة النيل للتجارة والتوريدات', 
    defendant: 'شركة بيراميدز للمقاولات', 
    memorandums: ['صحيفة دعوى', 'مذكرة دفاع'], 
    powerOfAttorneyRef: 'توكيل رسمي عام رقم 4412',
    status: 'متداولة', 
    eLitigationStatus: 'مربوط ببوابة التقاضي',
    createdAt: '2024-01-15'
  },
  { 
    id: 'C-1002', 
    clientId: '2',
    court: 'المحكمة الابتدائية', 
    type: 'مدني',
    plaintiff: 'محمد عبدالرحمن السيد', 
    defendant: 'أحمد محمود عبدالله', 
    memorandums: ['صحيفة دعوى'], 
    powerOfAttorneyRef: 'توكيل رسمي خاص رقم 9876',
    status: 'تحت الدراسة', 
    eLitigationStatus: 'غير مربوط',
    createdAt: '2024-02-10'
  },
  { 
    id: 'C-1003', 
    clientId: '4',
    court: 'الدائرة العمالية', 
    type: 'عمالي',
    plaintiff: 'فاطمة أحمد حسن', 
    defendant: 'مؤسسة الأهرام الرقمية', 
    memorandums: ['مذكرة دفاع'], 
    powerOfAttorneyRef: 'توكيل رسمي عام رقم 5556',
    status: 'متداولة', 
    eLitigationStatus: 'مربوط ببوابة التقاضي',
    createdAt: '2024-03-05'
  },
  { 
    id: 'C-1004', 
    clientId: '5',
    court: 'محكمة القضاء الإداري', 
    type: 'إداري',
    plaintiff: 'شركة بيراميدز للمقاولات', 
    defendant: 'محافظة القاهرة', 
    memorandums: ['صحيفة طعن إداري'], 
    powerOfAttorneyRef: 'توكيل رسمي عام رقم 1112',
    status: 'مغلقة', 
    eLitigationStatus: 'مربوط ببوابة التقاضي',
    createdAt: '2023-12-20'
  },
  { 
    id: 'C-1005', 
    clientId: '10',
    court: 'المحكمة الجنائية الابتدائية', 
    type: 'جنائي',
    criminalTier: 'جنحة',
    criminalStage: 'مرحلة المحاكمة',
    plaintiff: 'النيابة العامة', 
    defendant: 'محمد عبدالرحمن السيد', 
    memorandums: ['مذكرة دفاع'], 
    powerOfAttorneyRef: 'توكيل رسمي خاص رقم 2223',
    status: 'متداولة', 
    eLitigationStatus: 'غير مربوط',
    createdAt: '2024-03-25'
  },
];

export const mockSessions: Session[] = [
  { id: 'S-001', caseId: 'C-1001', caseName: 'النيل للتجارة ضد بيراميدز', date: '2024-04-10', time: '10:00', court: 'المحكمة الاقتصادية بالقاهرة', status: 'قادمة' },
  { id: 'S-002', caseId: 'C-1003', caseName: 'فاطمة حسن ضد الأهرام الرقمية', date: '2024-04-12', time: '09:30', court: 'الدائرة العمالية بالجيزة', status: 'قادمة' },
  { id: 'S-003', caseId: 'C-1005', caseName: 'النيابة العامة ضد محمد السيد', date: '2024-04-15', time: '11:00', court: 'محكمة جنح مصر الجديدة', status: 'قادمة' },
];

export const mockExpenses: Expense[] = [
  { id: 'EXP-001', clientId: '1', caseId: 'C-1001', caseName: 'النيل للتجارة ضد بيراميدز', category: 'رسوم قضائية', amount: 2500, date: '2024-03-15', status: 'تم السداد', description: 'رسوم قيد الدعوى في المحكمة الاقتصادية' },
  { id: 'EXP-002', clientId: '10', caseId: 'C-1005', caseName: 'النيابة العامة ضد محمد السيد', category: 'أمانة خبير', amount: 5000, date: '2024-03-20', status: 'معلق', description: 'أتعاب خبير تقني لتقييم الأضرار' },
  { id: 'EXP-003', clientId: '1', caseId: 'C-1001', caseName: 'النيل للتجارة ضد بيراميدز', category: 'مصروفات انتقال', amount: 350, date: '2024-03-22', status: 'تم السداد', description: 'تكاليف الانتقال لحضور جلسة في الإسكندرية' },
];

export const mockTeamMembers: TeamMember[] = [
  { 
    id: 'U-001', 
    name: 'د. أحمد حسني المحامي', 
    email: 'm.hosainy.law@gmail.com', 
    role: 'محامي شريك', 
    avatar: 'https://picsum.photos/seed/lawyer1/100/100',
    activeCases: 12,
    pendingTasks: 5,
    completedTasks: 45,
    joinDate: '2020-01-01',
    status: 'نشط'
  },
  { 
    id: 'U-002', 
    name: 'أ. هبة عبداللطيف', 
    email: 'heba@hosni-law.eg', 
    role: 'محامي مستشار', 
    avatar: 'https://picsum.photos/seed/lawyer2/100/100',
    activeCases: 8,
    pendingTasks: 3,
    completedTasks: 32,
    joinDate: '2021-06-15',
    status: 'نشط'
  },
  { 
    id: 'U-003', 
    name: 'أ. عمر محمد علي', 
    email: 'omar@hosni-law.eg', 
    role: 'محامي متدرب', 
    avatar: 'https://picsum.photos/seed/lawyer3/100/100',
    activeCases: 4,
    pendingTasks: 7,
    completedTasks: 12,
    joinDate: '2023-09-01',
    status: 'نشط'
  }
];

export const mockCompliance: ComplianceRecord[] = [
  { id: 'COMP-1', title: 'السجل التجاري للمكتب', type: 'سجل تجاري', expiryDate: '2025-01-01', status: 'ساري', reminderDays: 30 },
  { id: 'COMP-2', title: 'ترخيص مزاولة المهنة', type: 'ترخيص استثمار', expiryDate: '2024-06-15', status: 'قريب الانتهاء', reminderDays: 15 },
];

export const mockPrecedents: LegalPrecedent[] = [
  { id: 'PREC-1', title: 'حكم في قضية منازعة تجارية', category: 'تجاري', summary: 'إثبات صحة عقد توريد بناءً على المراسلات الإلكترونية.', tags: ['عقود', 'تجاري', 'إثبات'], date: '2023-11-10' },
  { id: 'PREC-2', title: 'مذكرة دفاع في قضية عمالية', category: 'عمالي', summary: 'رد على دعوى فصل تعسفي بناءً على المادة 122 من قانون العمل رقم 12/2003.', tags: ['عمالي', 'فصل تعسفي'], date: '2024-01-20' },
];

export const mockContracts: ContractTemplate[] = [
  { id: 'TMP-1', title: 'عقد تأسيس شركة ذات مسؤولية محدودة', description: 'نموذج متوافق مع قانون الشركات رقم 159/1981.', content: '...', category: 'تجاري' },
  { id: 'TMP-2', title: 'عقد عمل مصري', description: 'نموذج متوافق مع قانون العمل رقم 12/2003.', content: '...', category: 'عمالي' },
];

export const mockIP: IPRecord[] = [
  { id: 'IP-1', title: 'شعار شركة النيل', type: 'علامة تجارية', owner: 'شركة النيل للصناعات الغذائية', registrationNumber: '123456', expiryDate: '2030-01-01', status: 'مسجلة' },
  { id: 'IP-2', title: 'نظام إدارة قانوني', type: 'حق مؤلف', owner: 'د. أحمد حسني المحامي', registrationNumber: '789012', expiryDate: '2028-05-20', status: 'تحت الفحص' },
];

export const mockTimeEntries: TimeEntry[] = [
  { id: 'TIME-1', lawyerId: 'U-001', caseId: 'C-1001', description: 'دراسة ملف القضية وكتابة المذكرة', duration: 120, date: '2024-04-07', isBilled: false, billable: true },
  { id: 'TIME-2', lawyerId: 'U-002', caseId: 'C-1003', description: 'جلسة استماع في المحكمة العمالية', duration: 90, date: '2024-04-06', isBilled: true, billable: true },
];

export const mockDeadlines: Deadline[] = [
  { id: 'D-1', caseId: 'C-1001', title: 'تقديم اللائحة الاعتراضية', date: '2024-04-15', type: 'تقديم صحيفة', status: 'pending', priority: 'high' },
  { id: 'D-2', caseId: 'C-1003', title: 'انتهاء مهلة الاستئناف', date: '2024-04-20', type: 'انتهاء مدة استئناف', status: 'pending', priority: 'high' },
  { id: 'D-3', caseId: 'C-1005', title: 'تقديم بينة إضافية', date: '2024-04-18', type: 'أخرى', status: 'pending', priority: 'medium' },
];

export const mockEnforcementCases: EnforcementCase[] = [
  {
    id: "E-1001",
    tenantId: "demo-tenant",
    fileNumber: "ENF-2026-0001",
    source: "قضية_مكتب",
    caseId: "C-1001",
    clientId: "1",
    clientName: "شركة النيل للتجارة والتوريدات",
    debtorName: "شركة بيراميدز للمقاولات",
    amountClaimed: 185000,
    amountCollected: 50000,
    status: "مفتوح",
    stageDeadline: "2026-04-18",
    createdAt: "2026-03-10",
    executionType: "حكم قضائي",
    currentStep: 1,
    judgmentNumber: "1234/2026",
    judgmentDate: "2026-03-01",
    judgmentCourt: "المحكمة الاقتصادية بالقاهرة",
    actions: [
      { id: "EA-1", enforcementCaseId: "E-1001", title: "تقديم طلب تنفيذ جبري", date: "2026-03-10", performedBy: "U-001", type: "إجراء قانوني" },
      { id: "EA-2", enforcementCaseId: "E-1001", title: "إصدار أمر تنفيذ", date: "2026-03-15", performedBy: "U-001", type: "إجراء قانوني" },
      { id: "EA-3", enforcementCaseId: "E-1001", title: "تحصيل دفعة أولى", notes: "تم تحصيل دفعة 50,000 ج.م", date: "2026-03-25", performedBy: "U-002", type: "تحصيل" },
    ],
  },
];

export const mockAdvisoryRequests: AdvisoryRequest[] = [
  {
    id: "AR-1001",
    tenantId: "demo-tenant",
    title: "الرأي القانوني حول بند جزائي في عقد توريد",
    clientName: "شركة النيل للتجارة والتوريدات",
    requestedBy: "مدير الشؤون القانونية",
    assignedTo: "U-002",
    status: "قيد المراجعة",
    priority: "عالي",
    slaDueAt: "2026-04-12T12:00:00Z",
    createdAt: "2026-04-08T09:00:00Z",
    opinions: [],
    approvals: [
      { id: "AP-1", requestId: "AR-1001", approverId: "U-001", approverName: "د. أحمد حسني", status: "بانتظار الاعتماد" },
    ],
  },
  {
    id: "AR-1002",
    tenantId: "demo-tenant",
    title: "مذكرة التزام نظامي لشركة ناشئة",
    clientName: "مؤسسة الأهرام الرقمية",
    requestedBy: "الرئيس التنفيذي",
    assignedTo: "U-003",
    status: "مسودة رأي",
    priority: "متوسط",
    slaDueAt: "2026-04-15T12:00:00Z",
    createdAt: "2026-04-07T10:00:00Z",
    opinions: [
      { id: "OP-1", requestId: "AR-1002", content: "تم إعداد مسودة أولية تتضمن الالتزامات النظامية الأساسية.", authorId: "U-003", createdAt: "2026-04-08T08:00:00Z" },
    ],
    approvals: [],
  },
];

export const mockRiskRegisters: RiskRegister[] = [
  {
    id: "R-001",
    tenantId: "demo-tenant",
    title: "تأخر رفع مذكرة حرجة",
    category: "قانوني",
    severity: "High",
    status: "قيد المعالجة",
    ownerId: "U-001",
    mitigationPlan: "تفعيل تنبيه مبكر + مراجعة أسبوعية للمواعيد الحرجة",
    dueDate: "2026-04-15",
    createdAt: "2026-04-08T08:00:00Z",
  },
  {
    id: "R-002",
    tenantId: "demo-tenant",
    title: "ضعف توثيق مراجعات الامتثال",
    category: "امتثال",
    severity: "Medium",
    status: "مفتوح",
    ownerId: "U-002",
    mitigationPlan: "اعتماد نموذج مراجعة موحد وربط أدلة الإثبات",
    dueDate: "2026-04-20",
    createdAt: "2026-04-08T09:00:00Z",
  },
];

export const mockControls: Control[] = [
  {
    id: "CTL-001",
    tenantId: "demo-tenant",
    title: "مراجعة صلاحيات المستخدمين",
    controlType: "وقائي",
    ownerId: "U-001",
    frequency: "شهري",
    status: "فعال",
    lastReviewAt: "2026-04-01",
    createdAt: "2026-03-01",
  },
  {
    id: "CTL-002",
    tenantId: "demo-tenant",
    title: "مراجعة سجل الأحداث الحساسة",
    controlType: "كاشف",
    ownerId: "U-002",
    frequency: "أسبوعي",
    status: "بحاجة تحسين",
    lastReviewAt: "2026-04-07",
    createdAt: "2026-03-05",
  },
];

export const mockComplianceIssues: ComplianceIssue[] = [
  {
    id: "ISS-001",
    tenantId: "demo-tenant",
    title: "نقص أدلة الامتثال لملف عميل",
    description: "لا يوجد إرفاق كامل للمستندات النظامية المطلوبة في ملف العميل.",
    severity: "Medium",
    status: "قيد المعالجة",
    ownerId: "U-003",
    dueDate: "2026-04-13",
    evidenceUrls: [],
    createdAt: "2026-04-08T07:00:00Z",
  },
];

export const mockRegulatoryObligations: RegulatoryObligation[] = [
  {
    id: "OB-001",
    tenantId: "demo-tenant",
    title: "تحديث سياسة حفظ المستندات",
    regulator: "وزارة العدل المصرية",
    dueDate: "2026-04-18",
    status: "قريب الاستحقاق",
    ownerId: "U-001",
    notes: "يجب اعتماد النسخة النهائية قبل نهاية الأسبوع القادم.",
  },
];

export const mockReceivables: ReceivableAccount[] = [
  {
    id: "RCV-1001",
    tenantId: "demo-tenant",
    caseId: "C-1001",
    clientId: "1",
    clientName: "شركة النيل للتجارة والتوريدات",
    totalAmount: 185000,
    collectedAmount: 50000,
    outstandingAmount: 135000,
    dueDate: "2026-04-20",
    status: "تحت التحصيل",
    isReconciled: false,
    actions: [
      { id: "CA-1", receivableId: "RCV-1001", type: "إصدار مطالبة", notes: "إرسال المطالبة الأولى", createdAt: "2026-04-05T09:00:00Z", createdBy: "U-001" },
      { id: "CA-2", receivableId: "RCV-1001", type: "إنذار رسمي", notes: "إنذار بعد 14 يوم", createdAt: "2026-04-07T10:30:00Z", createdBy: "U-001" },
    ],
    paymentPlan: {
      id: "PP-1001",
      receivableId: "RCV-1001",
      status: "نشط",
      createdAt: "2026-04-08T08:00:00Z",
      installments: [
        { dueDate: "2026-04-15", amount: 50000, paid: true },
        { dueDate: "2026-04-22", amount: 40000, paid: false },
        { dueDate: "2026-04-29", amount: 45000, paid: false },
      ],
    },
    createdAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "RCV-1002",
    tenantId: "demo-tenant",
    caseId: "C-1003",
    clientId: "4",
    clientName: "فاطمة أحمد حسن",
    totalAmount: 30000,
    collectedAmount: 30000,
    outstandingAmount: 0,
    dueDate: "2026-04-05",
    status: "مسوى",
    isReconciled: true,
    actions: [
      { id: "CA-3", receivableId: "RCV-1002", type: "تسوية", notes: "سداد كامل", amount: 30000, createdAt: "2026-04-05T12:00:00Z", createdBy: "U-002" },
    ],
    createdAt: "2026-03-20T08:00:00Z",
  },
];

export const mockContractRequests: ContractRequest[] = [
  {
    id: "CR-1001",
    tenantId: "demo-tenant",
    title: "عقد توريد مواد بناء",
    clientName: "شركة الراجحي العقارية",
    stage: "اعتماد",
    status: "قيد التنفيذ",
    createdBy: "U-001",
    createdAt: "2026-04-05T08:00:00Z",
    renewalDate: "2027-04-05",
    versions: [
      {
        id: "CV-1",
        requestId: "CR-1001",
        versionNumber: 1,
        content: "المسودة الأولى لعقد التوريد...",
        createdBy: "U-002",
        createdAt: "2026-04-05T09:00:00Z",
        changeSummary: "نسخة أولية",
      },
      {
        id: "CV-2",
        requestId: "CR-1001",
        versionNumber: 2,
        content: "المسودة الثانية مع تعديل بنود الجزاء...",
        createdBy: "U-001",
        createdAt: "2026-04-07T11:00:00Z",
        changeSummary: "تعديل بند الجزاء ومدة التوريد",
      },
    ],
    approvals: [
      {
        id: "APC-1",
        requestId: "CR-1001",
        approverId: "U-001",
        approverName: "د. أحمد حسني",
        status: "بانتظار الاعتماد",
      },
    ],
    obligations: [
      {
        id: "OBL-1",
        requestId: "CR-1001",
        title: "تسليم الدفعة الأولى",
        dueDate: "2026-04-20",
        ownerId: "U-002",
        status: "قادم",
      },
    ],
  },
];

export const mockIPFilings: IPFiling[] = [
  {
    id: "IPF-001",
    tenantId: "demo-tenant",
    ipRecordId: "IP-1",
    clientName: "شركة الراجحي العقارية",
    type: "علامة تجارية",
    filingDate: "2026-03-01",
    authority: "ITPO",
    status: "قيد الفحص",
    feeAmount: 1500,
    documentUrls: [],
  },
];

export const mockIPRenewals: IPRenewal[] = [
  {
    id: "IPR-001",
    tenantId: "demo-tenant",
    ipRecordId: "IP-1",
    dueDate: "2026-04-20",
    status: "قادم",
    feeAmount: 1200,
    paid: false,
  },
];

export const mockIPOppositions: IPOpposition[] = [
  {
    id: "IPO-001",
    tenantId: "demo-tenant",
    ipRecordId: "IP-1",
    againstParty: "شركة منافسة",
    reason: "تشابه علامة تجارية",
    filedAt: "2026-04-01",
    status: "قيد النظر",
    documentUrls: [],
  },
];

export const mockIPEnforcementActions: IPEnforcementAction[] = [
  {
    id: "IPE-001",
    tenantId: "demo-tenant",
    ipRecordId: "IP-1",
    actionType: "إنذار",
    description: "إرسال إنذار رسمي بوقف التعدي على العلامة",
    actionDate: "2026-04-03",
    status: "قيد المتابعة",
    feeAmount: 800,
    documentUrls: [],
  },
];

export const mockSpecializedTracks: SpecializedTrack[] = [
  {
    id: "ST-LAB-001",
    tenantId: "demo-tenant",
    caseId: "C-1003",
    caseType: "عمالي",
    stage: "مواعيد الاعتراض",
    slaDueAt: "2026-04-14T12:00:00Z",
    status: "نشط",
    checklist: [
      { id: "CHK-L1", title: "التحقق من المادة النظامية ذات الصلة", done: true },
      { id: "CHK-L2", title: "مراجعة بيانات العقد العمالي", done: false },
    ],
    documentTemplates: [
      { id: "TPL-L1", title: "مذكرة رد عمالية", type: "مذكرة" },
      { id: "TPL-L2", title: "اعتراض على حكم عمالي", type: "اعتراض" },
    ],
    steps: [
      { id: "S-L1", name: "claim intake", completed: true, dueDate: "2026-04-05" },
      { id: "S-L2", name: "مواعيد الاعتراض", completed: false, dueDate: "2026-04-14" },
      { id: "S-L3", name: "جلسات", completed: false },
      { id: "S-L4", name: "تسوية/حكم", completed: false },
    ],
    createdAt: "2026-04-08T09:00:00Z",
  },
  {
    id: "ST-CRM-001",
    tenantId: "demo-tenant",
    caseId: "C-1005",
    caseType: "جنائي",
    stage: "مذكرات الدفاع",
    slaDueAt: "2026-04-12T12:00:00Z",
    status: "متأخر",
    checklist: [
      { id: "CHK-C1", title: "مراجعة محاضر التحقيق", done: true },
      { id: "CHK-C2", title: "اعتماد مذكرة الدفاع من الشريك", done: false },
    ],
    documentTemplates: [
      { id: "TPL-C1", title: "مذكرة دفاع جزائية", type: "مذكرة" },
      { id: "TPL-C2", title: "لائحة استئناف جزائية", type: "لائحة" },
    ],
    steps: [
      { id: "S-C1", name: "تحقيق", completed: true },
      { id: "S-C2", name: "مذكرات الدفاع", completed: false, dueDate: "2026-04-12" },
      { id: "S-C3", name: "جلسات", completed: false },
      { id: "S-C4", name: "حكم واستئناف", completed: false },
    ],
    createdAt: "2026-04-07T09:00:00Z",
  },
];

export const mockPricingModels: PricingModel[] = [
  { id: 'PM-1', type: 'ساعة', rate: 1500, description: 'استشارة قانونية بالساعة - شركاء' },
  { id: 'PM-2', type: 'شهري', retainerAmount: 25000, description: 'عقد مستشار خارجي (Retainer) - خدمات عامة' },
  { id: 'PM-3', type: 'مرحلي', description: 'تمثيل قضائي - دفعات حسب مراحل التقاضي', phases: [
    { name: 'قيد الدعوى', amount: 30000, completionCriteria: 'صدور رقم معاملة من المحكمة التجارية' },
    { name: 'المرافعات', amount: 50000, completionCriteria: 'انتهاء جلسات المرافعة والحجز للحكم' },
    { name: 'صدور الحكم', amount: 20000, completionCriteria: 'استلام نسخة الحكم الابتدائي' }
  ]},
  { id: 'PM-4', type: 'مقطوع', rate: 100000, description: 'تأسيس شركة مساهمة مقفلة - شامل الرسوم' },
];

export const mockKeyAccounts: KeyAccount[] = [
  { 
    id: 'KA-1', 
    clientId: '9', // STC
    accountManagerId: 'U-001', 
    strategicValue: 'High', 
    industry: 'الاتصالات والتقنية', 
    annualTargetRevenue: 2000000, 
    currentPipeValue: 450000,
    growthPlan: 'توسعة الخدمات لتشمل فروع الشركة الإقليمية والملكية الفكرية.'
  },
  { 
    id: 'KA-2', 
    clientId: '7', // Tadawul
    accountManagerId: 'U-002', 
    strategicValue: 'High', 
    industry: 'الخدمات المالية', 
    annualTargetRevenue: 1500000, 
    currentPipeValue: 300000 
  },
];

export const mockProposals: Proposal[] = [
  { 
    id: 'PROP-1', 
    title: 'عرض تقديم خدمات استشارية - التحول لشركة مساهمة', 
    keyAccountId: 'KA-1', 
    status: 'قيد التفاوض', 
    value: 450000, 
    pricingModelId: 'PM-4', 
    validUntil: '2026-06-01', 
    assignedLawyerId: 'U-001', 
    winProbability: 75, 
    tags: ['تحول شركات', 'استشارات'],
    createdAt: '2026-04-01' 
  },
  { 
    id: 'PROP-2', 
    title: 'تمثيل قانوني في منازعة عقارية كبرى', 
    keyAccountId: 'KA-2', 
    status: 'مرسلة', 
    value: 300000, 
    pricingModelId: 'PM-3', 
    validUntil: '2026-05-15', 
    assignedLawyerId: 'U-002', 
    winProbability: 60, 
    tags: ['عقارات', 'تقاضي'],
    createdAt: '2026-04-05' 
  },
  { 
    id: 'PROP-3', 
    title: 'مراجعة عقود الموردين الدولية', 
    status: 'مسودة', 
    value: 120000, 
    pricingModelId: 'PM-2', 
    validUntil: '2026-05-30', 
    assignedLawyerId: 'U-003', 
    winProbability: 40, 
    tags: ['عقود دولية'],
    createdAt: '2026-04-08' 
  },
];

export const mockQAReviews: QAReview[] = [
  {
    id: 'QA-1',
    caseId: 'C-1001',
    reviewerId: 'U-001',
    status: 'Pending',
    checklist: [
      { id: 'QA-CH-1', requirement: 'التحقق من صحة بيانات التوكيل الرسمي', isMet: true },
      { id: 'QA-CH-2', requirement: 'مراجعة المذكرة لغوياً وقانونياً', isMet: false, comment: 'تحتاج مراجعة الأخطاء المطبعية في الصفحة 3' },
      { id: 'QA-CH-3', requirement: 'موافاة العميل بالنسخة النهائية للاعتماد', isMet: true },
    ],
    overallComment: 'المذكرة قوية ولكن تحتاج لتدقيق نهائي.',
  },
];

export const mockKnowledgeAssets: KnowledgeAsset[] = [
  {
    id: 'KA-101',
    title: 'دليل الإجراءات أمام المحكمة الاقتصادية',
    category: 'Procedure',
    tags: ['تجاري', 'إجراءات'],
    contentUrl: '/docs/commercial-procedures.pdf',
    version: 1,
    authorId: 'U-001',
    isVerified: true,
    verifiedBy: 'U-001',
    createdAt: '2025-10-01',
    updatedAt: '2026-01-15',
  },
  {
    id: 'KA-102',
    title: 'بحث: المسؤولية التقصيرية في عقود المقاولات',
    category: 'Research',
    tags: ['عقود', 'مقاولات'],
    contentUrl: '/docs/tort-liability.pdf',
    version: 2,
    authorId: 'U-002',
    isVerified: false,
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
];

export const mockTrainingPathways: TrainingPathway[] = [
  {
    id: 'TP-1',
    userId: 'U-003', // فهد العتيبي (متدرب)
    title: 'مسار تأهيل المرافعات المدنية والتجارية',
    description: 'دورة مكثفة حول إجراءات التقاضي في المحاكم الاقتصادية والمدنية.',
    modules: [
      { id: 'M1', title: 'مقدمة في قانون المحاكم الاقتصادية', status: 'Completed', score: 95, completedAt: '2026-02-10' },
      { id: 'M2', title: 'صياغة صحف الدعاوى والمذكرات', status: 'InProgress' },
      { id: 'M3', title: 'فنون الترافع والارتجال القضائي', status: 'NotStarted' },
    ],
    mentorId: 'U-001',
    overallProgress: 45,
    startDate: '2026-01-01',
  },
];

export const mockAssessments: EgyptAssessment[] = [
  {
    id: 'ASM-1',
    pathwayId: 'TP-1',
    title: 'تقييم وحدة صياغة الصحف والمذكرات',
    questions: [
      { id: 'Q1', text: 'ما هي مدة الاستئناف في القضايا المدنية؟', options: ['20 يوم', '40 يوم', '60 يوم'], correctOption: 1 },
      { id: 'Q2', text: 'هل يجوز تقديم بينة جديدة أمام الاستئناف؟', options: ['نعم مطلقاً', 'لا يجوز', 'نعم بضوابط محددة'], correctOption: 2 },
    ],
    passingScore: 70,
  },
];

export const mockConflictRecords: ConflictCheckRecord[] = [
  {
    id: 'CCR-1',
    query: 'شركة القاهرة العقارية',
    checkedAt: '2026-04-01T10:00:00Z',
    checkedBy: 'U-001',
    status: 'IndirectConflict',
    matches: [
      {
        entityName: 'مجموعة القاهرة المالية',
        relationshipType: 'Subsidiary',
        relatedToId: 'CL-101',
        description: 'تبعاً لمجموعة القاهرة المالية (عميل نشط)',
        severity: 'High',
      }
    ],
    resolutionNotes: 'يجرى التنسيق مع الشريك المسؤول لفحص طبيعة التعامل.',
  }
];
