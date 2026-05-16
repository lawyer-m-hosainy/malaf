export type ExpenseCategory = 'دمغة محاماة' | 'رسوم نقابة' | 'أمانة خبير' | 'رسم إعلان (محضر)' | 'رسوم قضائية' | 'مصروفات انتقال' | 'مصروفات طباعة ونسخ' | 'أمانة تنفيذ' | 'رسوم شهر عقاري' | 'أخرى';

export interface Expense {
  id: string;
  clientId: string; // Linking to client for deducting from retainer
  clientName?: string;
  caseId?: string;
  caseName?: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  status: 'تم السداد' | 'معلق' | 'مخصوم من الأمانة';
  description: string;
  paidBy?: string; // المدفوع بواسطة (اسم المحامي)
  isCollected?: boolean; // هل تم تحصيلها من الموكل أم لا
}

export interface TimeEntry {
  id: string;
  lawyerId: string;
  caseId: string;
  description: string;
  duration: number; // in minutes
  hourlyRate?: number; // سعر ساعة المحامي
  billable: boolean;
  date: string;
  isBilled: boolean;
  notes?: string;
}

export interface TrustAccount {
  id: string;
  clientId: string;
  clientName: string;
  caseId?: string;
  amount: number;
  type: 'أمانة' | 'مقدم أتعاب' | 'مبلغ تنفيذ';
  status: 'نشط' | 'تم الصرف' | 'مسترد';
  description: string;
  date: string;
}

export type PricingStructure = 'ساعة' | 'مقطوع' | 'شهري' | 'مرحلي';

export interface PricingModel {
  id: string;
  type: PricingStructure;
  rate?: number; // Hourly rate or Fixed amount
  retainerAmount?: number;
  description: string;
  phases?: {
    name: string;
    amount: number;
    completionCriteria: string;
  }[];
}

export interface CollectionAction {
  id: string;
  receivableId: string;
  type: 'إصدار مطالبة' | 'إنذار رسمي' | 'جدولة سداد' | 'تسوية' | 'متابعة';
  notes?: string;
  amount?: number;
  createdAt: string;
  createdBy: string;
}

export interface PaymentPlan {
  id: string;
  receivableId: string;
  installments: {
    dueDate: string;
    amount: number;
    paid: boolean;
  }[];
  status: 'نشط' | 'مكتمل' | 'متأخر';
  createdAt: string;
}

export interface ReceivableAccount {
  id: string;
  tenantId?: string;
  caseId: string;
  clientId: string;
  clientName: string;
  totalAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  dueDate: string;
  status: 'مفتوح' | 'متأخر' | 'تحت التحصيل' | 'مسوى' | 'مغلق';
  isReconciled: boolean;
  actions: CollectionAction[];
  paymentPlan?: PaymentPlan;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId?: string;
  clientId: string;
  clientName: string;
  base: number;
  vat: number; // الخدمات القانونية معفاة من VAT في مصر
  stampDuty?: number; // رسوم دمغة
  incomeTax?: number; // ضريبة دخل المهن الحرة
  total: number;
  status: 'مدفوعة' | 'غير مدفوعة' | 'مسودة';
  date: string;
  currency?: string; // Default: EGP / ج.م
}

// ─── ERP: Cost Center per Case ─────────────────────────────
export interface CaseCostCenter {
  caseId: string;
  totalTimeCost: number;      // إجمالي الوقت المحوّل لفلوس
  directExpenses: number;     // المصروفات المباشرة (رسوم، مواصلات، طباعة)
  collectedFees: number;      // الأتعاب المحصّلة
  netProfit: number;          // صافي ربح القضية
}

// ─── ERP: Lawyer Profitability ─────────────────────────────
export interface LawyerProfitability {
  lawyerId: string;
  monthlyRevenue: number;     // إيرادات المحامي الشهرية
  monthlyCost: number;        // تكلفته (راتب + overhead)
  netProfitability: number;   // صافي ربحيته للمكتب
  collectionRate: number;     // نسبة تحصيل الفواتير (collected vs invoiced)
}

// ─── ERP: Approval Workflows ─────────────────────────────
export interface ApprovalRequest {
  id: string;
  entityType: 'case' | 'expense' | 'invoice';
  entityId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  decidedAt?: string;
}
