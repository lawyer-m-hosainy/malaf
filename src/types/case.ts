import { Document } from './common';

export type EgyptCourtType = 
  | 'محكمة النقض'
  | 'محكمة الاستئناف'
  | 'المحكمة الابتدائية'
  | 'المحكمة الجنائية الابتدائية'
  | 'المحكمة الاقتصادية'
  | 'الدائرة العمالية'
  | 'محاكم الأسرة'
  | 'مجلس الدولة' // Administrative Court
  | 'محكمة القضاء الإداري'
  | 'المحكمة الإدارية العليا'
  | 'المحكمة الدستورية العليا'
  | 'محكمة أمن الدولة العليا'
  | 'محكمة الطفل'
  | 'محكمة الجنايات';

/** @deprecated Use EgyptCourtType instead */
export type KSACourtType = EgyptCourtType;

export type EgyptCaseCategory = 
  | 'تجاري' 
  | 'عمالي' 
  | 'مدني' 
  | 'جنائي' 
  | 'أحوال شخصية' 
  | 'إداري' 
  | 'اقتصادي'
  | 'عقاري';

export type CriminalTier = 'جناية' | 'جنحة' | 'مخالفة';
export type CriminalStage = 'مرحلة التحقيق' | 'مرحلة المحاكمة' | 'الطعن بالاستئناف' | 'الطعن بالنقض';

export type FamilyCaseType = 
  | 'خلع' | 'طلاق رجعي' | 'طلاق بائن' | 'طلاق ثلاث'
  | 'نفقة زوجية' | 'نفقة أولاد' | 'حضانة' | 'رؤية'
  | 'ولاية على النفس' | 'ولاية على المال'
  | 'زواج عرفي - إثبات' | 'زواج عرفي - إنكار'
  | 'ميراث وتركات' | 'إثبات نسب';

export interface Case {
  id: string;
  tenantId?: string;
  clientId: string; // رابط مع الموكل (Mandatory)
  clientRole?: 'مدعي' | 'مدعى عليه'; // صفة الموكل
  workflowStage?: 'intake' | 'pleadings' | 'hearing' | 'judgment' | 'closed';
  court: EgyptCourtType;
  circuit?: string; // الدائرة
  title?: string; // مسمى القضية
  automatedNumber?: string; // الرقم الآلي
  circulationCode?: string; // كود التداول
  archiveCode?: string; // كود الحفظ
  type: EgyptCaseCategory;
  plaintiff: string; // المدعي
  defendant: string; // المدعى عليه
  memorandums: string[]; // مذكرات وصحائف دعوى
  documents?: Document[];
  powerOfAttorneyRef: string; // رقم التوكيل (مشهر بالشهر العقاري)
  status: 'متداولة' | 'مغلقة' | 'تحت الدراسة' | 'محفوظة';
  eLitigationStatus?: 'مربوط ببوابة التقاضي' | 'غير مربوط'; // E-Litigation Portal Tracker
  
  // ─── Multi-Tier Case Numbering (Egyptian System) ───
  firstInstanceNumber?: string; // رقم الحصر / الدعوى (ابتدائي)
  firstInstanceYear?: string;   // سنة الدعوى (ابتدائي)
  appealNumber?: string;        // رقم الاستئناف
  appealYear?: string;          // سنة الاستئناف
  cassationNumber?: string;     // رقم الطعن بالنقض
  cassationYear?: string;       // سنة النقض
  stateCouncilYearQ?: string;   // رقم مجلس الدولة (سنة ق)
  currentTier?: 'ابتدائي' | 'مستأنف' | 'نقض' | 'إعادة';
  // ──────────────────────────────────────────────────

  // Criminal-specific fields
  criminalTier?: CriminalTier;
  criminalStage?: CriminalStage;
  prosecutionRef?: string; // مرجع النيابة العامة
  // Family-specific fields
  familyCaseType?: FamilyCaseType;
  // Economic court fields
  commercialRegRef?: string; // سجل تجاري للشركة الموكلة
  taxIdRef?: string; // رقم ضريبي للشركة الموكلة
  createdAt: string;
}

export interface Session {
  id: string;
  caseId: string;
  caseName: string;
  date: string; // YYYY-MM-DD
  time: string;
  court: string;
  circuit?: string; // الدائرة
  previousDecision?: string; // القرار السابق
  postponementReason?: string; // سبب التأجيل
  nextSessionDate?: string; // الجلسة القادمة
  responsibleLawyer?: string; // المحامي المسؤول
  notes?: string;
  status: 'قادمة' | 'منتهية' | 'مؤجلة';
}

export interface Deadline {
  id: string;
  caseId: string;
  title: string;
  date: string;
  type: 'تقديم صحيفة' | 'موعد جلسة' | 'انتهاء مدة استئناف' | 'انتهاء مدة طعن بالنقض' | 'أخرى';
  status: 'pending' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
}

export interface SpecializedWorkflowStep {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: string;
  notes?: string;
}

export interface SpecializedTrack {
  id: string;
  tenantId?: string;
  caseId: string;
  caseType: 'عمالي' | 'جنائي' | 'أحوال شخصية' | 'اقتصادي' | 'إداري';
  stage: string;
  slaDueAt?: string;
  status: 'نشط' | 'متأخر' | 'مغلق';
  checklist: {
    id: string;
    title: string;
    done: boolean;
  }[];
  documentTemplates: {
    id: string;
    title: string;
    type: 'مذكرة' | 'صحيفة' | 'لائحة' | 'اعتراض' | 'أخرى';
  }[];
  steps: SpecializedWorkflowStep[];
  createdAt: string;
}

// ─── Egyptian Deadline Constants ─────────────────────────────
export const EGYPT_DEADLINES = {
  APPEAL_CIVIL: 40,         // استئناف مدني = 40 يوم
  CASSATION: 60,            // طعن بالنقض = 60 يوم
  ADMIN_APPEAL: 60,         // طعن في قرار إداري = 60 يوم من الإخطار
  JUDICIAL_RECESS_START: '07-01', // الإجازة القضائية: 1 يوليو
  JUDICIAL_RECESS_END: '10-01',   // حتى 1 أكتوبر
  WORK_DAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Sat'], // الجمعة فقط إجازة
} as const;
