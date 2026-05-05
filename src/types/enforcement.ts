export type EnforcementSource = 'قضية_مكتب' | 'حكم_خارجي';
export type ExecutionDocType = 'حكم قضائي' | 'شيك' | 'كمبيالة' | 'عقد موثق' | 'محضر صلح' | 'أخرى';

export interface EnforcementAction {
  id: string;
  enforcementCaseId: string;
  title: string;
  notes?: string;
  date: string;
  performedBy: string;
  type: 'إجراء قانوني' | 'اتصال' | 'مذكرة' | 'تحصيل' | 'أخرى';
}

export interface EnforcementCase {
  id: string;
  tenantId?: string;

  /** رقم ملف التنفيذ الداخلي - كود فريد للبحث السريع */
  fileNumber: string; // ENF-2026-0001

  /** مصدر ملف التنفيذ: من قضية مكتب أو حكم خارجي */
  source: EnforcementSource;

  caseId: string; // If linked to an internal case
  clientId: string;
  clientName: string;
  debtorName: string;
  amountClaimed: number;
  amountCollected: number;
  
  status: 'مفتوح' | 'استلام الصيغة' | 'إعلان السند' | 'توكيل المحضر' | 'إشكال في التنفيذ' | 'منفذ' | 'مغلق';
  stageDeadline?: string;
  createdAt: string;

  /** نوع السند التنفيذي */
  executionType: ExecutionDocType;

  // --- Workflow Steps Data ---
  currentStep: number; // 1 to 5

  // Step 1: استلام الصيغة التنفيذية
  judgmentNumber?: string;
  judgmentDate?: string;
  judgmentCourt?: string;

  // Step 2 & 3: إعلان السند التنفيذي و توكيل المحضر للتنفيذ
  bailiffName?: string;
  announcementDate?: string;
  bailiffRecordNumber?: string;
  poaDate?: string; // تاريخ الإيداع

  // Step 4: الإشكال في التنفيذ
  hasObjection?: boolean;
  objectionType?: string;
  objectionSessionDate?: string;
  objectingParty?: string;

  // Step 5: انتهاء التنفيذ
  executionResult?: string;

  /** رقم القضية الأصلية في المكتب (للربط التلقائي) */
  linkedCaseId?: string;
  /** مرجع القضية الأصلية للعرض */
  linkedCaseRef?: string;

  actions: EnforcementAction[];
}
