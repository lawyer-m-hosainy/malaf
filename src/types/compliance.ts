export interface ComplianceRecord {
  id: string;
  title: string;
  type: 'سجل تجاري' | 'ترخيص استثمار' | 'شهادة زكاة' | 'أخرى';
  expiryDate: string;
  status: 'ساري' | 'منتهي' | 'قريب الانتهاء';
  reminderDays: number;
}

export interface RiskRegister {
  id: string;
  tenantId?: string;
  title: string;
  category: 'تشغيلي' | 'قانوني' | 'تقني' | 'مالي' | 'امتثال';
  severity: 'High' | 'Medium' | 'Low';
  status: 'مفتوح' | 'قيد المعالجة' | 'مغلق';
  ownerId: string;
  mitigationPlan: string;
  dueDate?: string;
  createdAt: string;
}

export interface Control {
  id: string;
  tenantId?: string;
  title: string;
  controlType: 'وقائي' | 'كاشف' | 'تصحيحي';
  ownerId: string;
  frequency: 'يومي' | 'أسبوعي' | 'شهري' | 'ربع سنوي';
  status: 'فعال' | 'بحاجة تحسين' | 'متوقف';
  lastReviewAt?: string;
  createdAt: string;
}

export interface ComplianceIssue {
  id: string;
  tenantId?: string;
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'جديد' | 'قيد المعالجة' | 'مغلق';
  ownerId: string;
  dueDate?: string;
  evidenceUrls?: string[];
  createdAt: string;
}

export interface RegulatoryObligation {
  id: string;
  tenantId?: string;
  title: string;
  regulator: string;
  dueDate: string;
  status: 'ملتزم' | 'قريب الاستحقاق' | 'متأخر';
  ownerId: string;
  notes?: string;
}
