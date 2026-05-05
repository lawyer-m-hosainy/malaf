export type EgyptGovernorate =
  | 'القاهرة' | 'الجيزة' | 'الإسكندرية' | 'الدقهلية' | 'الشرقية'
  | 'المنوفية' | 'الغربية' | 'كفر الشيخ' | 'دمياط' | 'البحيرة'
  | 'الإسماعيلية' | 'السويس' | 'بورسعيد' | 'الفيوم' | 'بني سويف'
  | 'المنيا' | 'أسيوط' | 'سوهاج' | 'قنا' | 'الأقصر' | 'أسوان'
  | 'البحر الأحمر' | 'الوادي الجديد' | 'مطروح' | 'شمال سيناء'
  | 'جنوب سيناء' | 'حلوان' | 'السادس من أكتوبر';

export type Religion = 'muslim' | 'christian' | 'other';
export type MaritalStatus = 'أعزب' | 'متزوج' | 'مطلق' | 'أرمل' | 'عرفي';

export interface Client {
  id: string;
  tenantId?: string;
  type: 'فرد' | 'منشأة'; // Individual or Entity
  name: string;
  
  // Strict Validation Fields (Egyptian)
  nationalId?: string; // الرقم القومي (14 digits for 'فرد')
  commercialRegistration?: string; // رقم السجل التجاري (for 'منشأة')
  vatNumber?: string; // الرقم الضريبي
  
  // Egyptian-specific fields
  governorate?: EgyptGovernorate; // المحافظة
  religion?: Religion; // الديانة (determines personal status court jurisdiction)
  maritalStatus?: MaritalStatus; // الحالة الاجتماعية
  
  // Advanced Relationship Mapping
  parentEntityId?: string; // الشركة الأم
  subsidiaries?: string[]; // الشركات التابعة
  shareholders?: { name: string; percentage: number; id?: string }[]; // المساهمون
  boardMembers?: { name: string; position: string; id?: string }[]; // أعضاء مجلس الإدارة
  relatedEntities?: string[]; // كيانات ذات علاقة
  
  // Phone must default to Egyptian format
  phone: string; // Format: +201XXXXXXXXX (11 local digits)
  email?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
}

export interface ConflictCheckRecord {
  id: string;
  query: string;
  checkedAt: string;
  checkedBy: string;
  status: 'Clear' | 'DirectConflict' | 'IndirectConflict' | 'Waived';
  matches: {
    entityName: string;
    relationshipType: 'Client' | 'AdverseParty' | 'Subsidiary' | 'Shareholder' | 'BoardMember';
    relatedToId: string;
    description: string;
    severity: 'High' | 'Medium' | 'Low';
  }[];
  resolutionNotes?: string;
  resolutionDate?: string;
  resolvedBy?: string;
}

export interface ConflictCheck {
  id: string;
  query: string;
  results: {
    type: 'عميل' | 'قضية' | 'خصم';
    name: string;
    status: string;
    matchScore: number;
  }[];
  checkedBy: string;
  date: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: 'موقع إلكتروني' | 'توصية' | 'وسائل تواصل' | 'أخرى';
  interest: string;
  status: 'جديد' | 'قيد التواصل' | 'تم تحديد موعد' | 'تحول لعميل' | 'مستبعد';
  createdAt: string;
}

export interface KeyAccount {
  id: string;
  clientId: string;
  accountManagerId: string;
  strategicValue: 'High' | 'Medium' | 'Low';
  industry: string;
  annualTargetRevenue: number;
  currentPipeValue: number;
  growthPlan?: string;
  notes?: string;
}
