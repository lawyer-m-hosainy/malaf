export interface LegalPrecedent {
  id: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  fileUrl?: string;
  date: string;
}

export interface ContractTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'تجاري' | 'عمالي' | 'عقاري' | 'أحوال شخصية';
}

export interface Proposal {
  id: string;
  title: string;
  keyAccountId?: string;
  leadId?: string;
  status: 'مسودة' | 'مرسلة' | 'قيد التفاوض' | 'مقبولة' | 'مرفوضة' | 'ملغاة';
  value: number;
  pricingModelId: string;
  validUntil: string;
  assignedLawyerId: string;
  winProbability: number; // 0-100
  tags: string[];
  createdAt: string;
}

export interface RFPSubmission {
  id: string;
  proposalId: string;
  authority: string;
  deadline: string;
  submissionDate?: string;
  requirements: {
    title: string;
    isMet: boolean;
  }[];
  status: 'تحت الإعداد' | 'تم التقديم' | 'مستبعد' | 'فوز';
}

export interface ESignatureRequest {
  id: string;
  documentName: string;
  recipientName: string;
  recipientEmail: string;
  status: 'بانتظار التوقيع' | 'تم التوقيع' | 'منتهي الصلاحية';
  sentDate: string;
  signedDate?: string;
}

export interface WikiArticle {
  id: string;
  title: string;
  content: string;
  category: 'أبحاث' | 'إجراءات' | 'نماذج' | 'أنظمة';
  author: string;
  lastUpdated: string;
  tags: string[];
}

export interface ContractVersion {
  id: string;
  requestId: string;
  versionNumber: number;
  content: string;
  createdBy: string;
  createdAt: string;
  changeSummary?: string;
}

export interface ApprovalStep {
  id: string;
  requestId: string;
  approverId: string;
  approverName: string;
  status: 'بانتظار الاعتماد' | 'معتمد' | 'مرفوض';
  notes?: string;
  decidedAt?: string;
}

export interface ContractObligation {
  id: string;
  requestId: string;
  title: string;
  dueDate: string;
  ownerId: string;
  status: 'قادم' | 'مكتمل' | 'متأخر';
}

export interface ContractRequest {
  id: string;
  tenantId?: string;
  title: string;
  clientName: string;
  stage: 'طلب' | 'تفاوض' | 'مراجعة' | 'اعتماد' | 'توقيع' | 'متابعة التزامات' | 'تجديد/إنهاء';
  status: 'مسودة' | 'قيد التنفيذ' | 'معتمد' | 'موقع' | 'مغلق';
  createdBy: string;
  createdAt: string;
  renewalDate?: string;
  versions: ContractVersion[];
  approvals: ApprovalStep[];
  obligations: ContractObligation[];
}
