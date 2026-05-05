export interface IPRecord {
  id: string;
  title: string;
  type: 'علامة تجارية' | 'براءة اختراع' | 'حق مؤلف';
  owner: string;
  registrationNumber: string;
  expiryDate: string;
  status: 'مسجلة' | 'تحت الفحص' | 'منتهية';
}

export interface IPFiling {
  id: string;
  tenantId?: string;
  ipRecordId: string;
  clientName: string;
  type: 'علامة تجارية' | 'براءة اختراع' | 'حق مؤلف';
  filingDate: string;
  authority: string;
  status: 'قيد التقديم' | 'قيد الفحص' | 'مقبول' | 'مرفوض';
  feeAmount?: number;
  documentUrls?: string[];
}

export interface IPRenewal {
  id: string;
  tenantId?: string;
  ipRecordId: string;
  dueDate: string;
  status: 'قادم' | 'مكتمل' | 'متأخر';
  feeAmount?: number;
  paid: boolean;
  receiptUrl?: string;
}

export interface IPOpposition {
  id: string;
  tenantId?: string;
  ipRecordId: string;
  againstParty: string;
  reason: string;
  filedAt: string;
  status: 'مسجل' | 'قيد النظر' | 'محسوم';
  documentUrls?: string[];
}

export interface IPEnforcementAction {
  id: string;
  tenantId?: string;
  ipRecordId: string;
  actionType: 'إنذار' | 'دعوى' | 'تسوية' | 'تنفيذ حكم';
  description: string;
  actionDate: string;
  status: 'مفتوح' | 'قيد المتابعة' | 'مغلق';
  feeAmount?: number;
  documentUrls?: string[];
}
