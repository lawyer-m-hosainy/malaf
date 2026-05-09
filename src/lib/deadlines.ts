import { addDays, isFriday, addDays as fnsAddDays, parseISO, format } from 'date-fns';
import { EGYPT_DEADLINES } from '../types/case';

// R7-FIX: أنواع المواعيد القانونية الكاملة — قانون المرافعات + القوانين الخاصة
export type CaseDeadlineType =
  | 'استئناف مدني'       // 40 يوم — م 227 مرافعات
  | 'طعن بالنقض'         // 60 يوم — م 252 مرافعات
  | 'معارضة جنائية'      // 10 أيام — م 398 إجراءات جنائية
  | 'استئناف جنائي'      // 10 أيام — م 406 إجراءات جنائية
  | 'طعن إداري'          // 60 يوم — م 44 قانون مجلس الدولة
  | 'استئناف عمالي'      // 30 يوم — قانون العمل 12/2003
  | 'طعن ضريبي'          // 30 يوم — أمام لجان الطعن الضريبي
  | 'استئناف إيجارات'    // 40 يوم — دعاوى الإيجارات
  | 'التماس إعادة نظر'  // 40 يوم — م 241 مرافعات
  | 'تظلم تأديبي';      // 60 يوم — مجلس الدولة

// R7-FIX: ثوابت مواعيد إضافية
const EXTRA_DEADLINES: Record<string, number> = {
  'استئناف عمالي': 30,
  'طعن ضريبي': 30,
  'استئناف إيجارات': 40,
  'التماس إعادة نظر': 40,
  'تظلم تأديبي': 60,
};

interface DeadlineResult {
  deadlineDate: Date;
  deadlineDateStr: string;
  isRecess: boolean;
  daysRemaining: number;
  notes: string;
  legalBasis: string; // R7-FIX: السند القانوني
}

/**
 * R7-FIX: حساب المواعيد القانونية المصرية الشاملة
 * - يتخطى أيام الجمعة (عطلة رسمية)
 * - يُنبّه عند وقوع الميعاد في العطلة القضائية (1 يوليو — 1 أكتوبر)
 * - السند القانوني لكل نوع ميعاد
 */
export function calculateEgyptDeadline(
  judgmentDateStr: string,
  type: CaseDeadlineType
): DeadlineResult {
  const judgmentDate = parseISO(judgmentDateStr);
  let daysToAdd = 0;
  let legalBasis = '';

  switch (type) {
    case 'استئناف مدني':
      daysToAdd = EGYPT_DEADLINES.APPEAL_CIVIL; // 40
      legalBasis = 'المادة 227 من قانون المرافعات المدنية والتجارية';
      break;
    case 'طعن بالنقض':
      daysToAdd = EGYPT_DEADLINES.CASSATION; // 60
      legalBasis = 'المادة 252 من قانون المرافعات';
      break;
    case 'معارضة جنائية':
      daysToAdd = 10;
      legalBasis = 'المادة 398 من قانون الإجراءات الجنائية';
      break;
    case 'استئناف جنائي':
      daysToAdd = 10;
      legalBasis = 'المادة 406 من قانون الإجراءات الجنائية';
      break;
    case 'طعن إداري':
      daysToAdd = EGYPT_DEADLINES.ADMIN_APPEAL; // 60
      legalBasis = 'المادة 44 من قانون مجلس الدولة رقم 47/1972';
      break;
    default:
      daysToAdd = EXTRA_DEADLINES[type] || 40;
      legalBasis = type === 'استئناف عمالي' ? 'قانون العمل رقم 12/2003' :
                   type === 'طعن ضريبي' ? 'قانون الإجراءات الضريبية الموحد رقم 206/2020' :
                   type === 'التماس إعادة نظر' ? 'المادة 241 من قانون المرافعات' :
                   type === 'تظلم تأديبي' ? 'قانون مجلس الدولة — المحاكم التأديبية' :
                   'قانون المرافعات المدنية والتجارية';
      break;
  }

  let finalDate = fnsAddDays(judgmentDate, daysToAdd);

  // إذا وقع على يوم الجمعة → ينتقل للسبت
  if (isFriday(finalDate)) {
    finalDate = fnsAddDays(finalDate, 1);
  }

  // العطلة القضائية (1 يوليو — 1 أكتوبر)
  const month = finalDate.getMonth() + 1;
  const isRecess = month >= 7 && month <= 9;

  // حساب الأيام المتبقية
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDay = new Date(finalDate.getFullYear(), finalDate.getMonth(), finalDate.getDate());
  const daysRemaining = Math.ceil((deadlineDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let notes = '';
  if (isRecess) {
    notes = 'تنبيه: الميعاد يقع خلال العطلة القضائية — تمتد المواعيد حتى 1 أكتوبر (م 18 مرافعات)';
  }
  if (daysRemaining <= 5 && daysRemaining > 0) {
    notes += (notes ? ' | ' : '') + '⚠️ تنبيه عاجل: متبقي أقل من 5 أيام!';
  }
  if (daysRemaining <= 0) {
    notes += (notes ? ' | ' : '') + '❌ الميعاد انتهى!';
  }

  return {
    deadlineDate: finalDate,
    deadlineDateStr: format(finalDate, 'yyyy-MM-dd'),
    isRecess,
    daysRemaining,
    notes,
    legalBasis,
  };
}

// ═══════════════════════════════════════════════════════
// R7-FIX: مصطلحات نتائج الجلسات الرسمية المصرية
// ═══════════════════════════════════════════════════════
export const SESSION_OUTCOMES = [
  'حجز للحكم',
  'حجز للحكم مع مذكرات',
  'حجز للحكم بدون مذكرات',
  'تأجيل للمرافعة',
  'تأجيل للاطلاع',
  'تأجيل لإعلان المدعى عليه',
  'تأجيل لتقديم مذكرة',
  'تأجيل لسماع الشهود',
  'تأجيل لورود التقرير',
  'تأجيل لتنفيذ قرار المحكمة',
  'تأجيل لإيداع الأمانة',
  'ندب خبير',
  'إحالة للتحقيق',
  'شطب',
  'وقف الدعوى تعليقياً',
  'وقف الدعوى جزائياً',
  'وقف الدعوى اتفاقياً',
  'انقطاع سير الخصومة',
  'ضم الدعوى لأخرى',
  'إحالة لدائرة أخرى',
] as const;

export type SessionOutcome = typeof SESSION_OUTCOMES[number];
