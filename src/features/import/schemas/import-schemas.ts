/**
 * Import Schemas — malaf.pro
 * ═══════════════════════════
 * مخططات Zod للتحقق من صحة البيانات المستوردة (موكلين، قضايا، جلسات).
 * تتعامل مع البيانات القذرة (dirty data) من Excel/CSV وتُطبّعها.
 */

import { z } from 'zod';

// ─── Shared Transformers ─────────────────────────────────────

/** تنظيف النصوص: إزالة المسافات الزائدة والأسطر الفارغة */
const cleanText = (s: string) => s.trim().replace(/\s+/g, ' ');

/** تحويل التواريخ من صيغ مصرية متعددة */
const flexibleDate = z.preprocess((val) => {
  if (!val || val === '' || val === null || val === undefined) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  if (typeof val === 'number') {
    // Excel serial date number
    const excelEpoch = new Date(1899, 11, 30);
    const msPerDay = 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + val * msPerDay);
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return undefined;

    // Try multiple formats:
    // 15/3/1990, 15-3-1990, 1990-03-15, 15/03/1990
    const patterns = [
      // DD/MM/YYYY or DD-MM-YYYY
      /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/,
      // YYYY-MM-DD or YYYY/MM/DD
      /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/,
    ];

    for (const pattern of patterns) {
      const match = s.match(pattern);
      if (match) {
        let year: number, month: number, day: number;
        if (match[1].length === 4) {
          // YYYY-MM-DD
          [, year, month, day] = match.map(Number);
        } else {
          // DD/MM/YYYY
          [, day, month, year] = match.map(Number);
        }
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) return date;
      }
    }

    // Fallback: native Date parsing
    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}, z.date().optional());

/** تنظيف رقم الهاتف المصري */
const egyptPhone = z.preprocess((val) => {
  if (!val || val === '') return undefined;
  let s = String(val).trim().replace(/[\s\-()]+/g, '');
  // تحويل +201... أو 00201... إلى 01...
  if (s.startsWith('+20')) s = '0' + s.slice(3);
  if (s.startsWith('0020')) s = '0' + s.slice(4);
  if (s.startsWith('20') && s.length === 12) s = '0' + s.slice(2);
  return s || undefined;
}, z.string().regex(/^(01)[0-9]{9}$/, 'رقم الهاتف المصري غير صحيح — يجب أن يبدأ بـ 01 ويتبعه 9 أرقام').optional());

/** تنظيف الرقم القومي */
const nationalId = z.preprocess((val) => {
  if (!val || val === '') return undefined;
  return String(val).trim().replace(/[\s\-]/g, '');
}, z.string().regex(/^\d{14}$/, 'الرقم القومي يجب أن يكون 14 رقماً بالضبط').optional());

// ─── Client Import Schema ────────────────────────────────────

export const ClientImportSchema = z.object({
  // الاسم (إلزامي)
  name: z.preprocess(
    (val) => (typeof val === 'string' ? cleanText(val) : val),
    z.string()
      .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
      .max(100, 'الاسم طويل جداً — الحد الأقصى 100 حرف')
  ),

  // النوع
  type: z.preprocess(
    (val) => {
      if (!val) return 'فرد';
      const s = String(val).trim();
      if (['فرد', 'شخص', 'individual', 'person'].includes(s.toLowerCase())) return 'فرد';
      if (['منشأة', 'شركة', 'مؤسسة', 'company', 'entity', 'corporate'].includes(s.toLowerCase())) return 'منشأة';
      return s;
    },
    z.enum(['فرد', 'منشأة']).default('فرد')
  ),

  // الرقم القومي
  national_id: nationalId,

  // رقم الهاتف
  phone: egyptPhone,

  // البريد الإلكتروني
  email: z.preprocess(
    (val) => {
      if (!val || val === '') return undefined;
      return String(val).trim().toLowerCase();
    },
    z.string().email('البريد الإلكتروني غير صحيح').optional()
  ),

  // العنوان
  address: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? cleanText(val) : undefined),
    z.string().max(500).optional()
  ),

  // المحافظة
  governorate: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? cleanText(val) : undefined),
    z.string().optional()
  ),

  // السجل التجاري (للمنشآت)
  commercial_registration: z.preprocess(
    (val) => (val ? String(val).trim() : undefined),
    z.string().optional()
  ),

  // الرقم الضريبي
  vat_number: z.preprocess(
    (val) => (val ? String(val).trim() : undefined),
    z.string().optional()
  ),

  // تاريخ الميلاد
  birth_date: flexibleDate,

  // ملاحظات
  notes: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim() : undefined),
    z.string().max(5000, 'الملاحظات طويلة جداً').optional()
  ),
});

export type ClientImportRow = z.infer<typeof ClientImportSchema>;

// ─── Case Import Schema ──────────────────────────────────────

export const CaseImportSchema = z.object({
  // رقم القضية (إلزامي)
  case_number: z.preprocess(
    (val) => String(val || '').trim(),
    z.string().min(1, 'رقم القضية مطلوب')
  ),

  // عنوان القضية
  title: z.preprocess(
    (val) => (typeof val === 'string' ? cleanText(val) : val),
    z.string().min(3, 'عنوان القضية قصير جداً').max(500)
  ),

  // اسم الموكل (سيُربط بالموكل الموجود)
  client_name: z.preprocess(
    (val) => (typeof val === 'string' ? cleanText(val) : val),
    z.string().min(1, 'اسم الموكل مطلوب')
  ),

  // صفة الموكل
  client_role: z.preprocess(
    (val) => {
      if (!val) return undefined;
      const s = String(val).trim();
      if (['مدعي', 'مدعى', 'plaintiff'].includes(s.toLowerCase())) return 'مدعي';
      if (['مدعى عليه', 'مدعي عليه', 'defendant'].includes(s.toLowerCase())) return 'مدعى عليه';
      return s;
    },
    z.enum(['مدعي', 'مدعى عليه']).optional()
  ),

  // نوع القضية
  type: z.preprocess(
    (val) => (typeof val === 'string' ? cleanText(val) : 'مدني'),
    z.enum([
      'تجاري', 'عمالي', 'مدني', 'جنائي', 'أحوال شخصية',
      'إداري', 'اقتصادي', 'عقاري', 'إيجارات', 'ضرائب', 'تأديبي',
    ]).default('مدني')
  ),

  // الحالة
  status: z.preprocess(
    (val) => {
      if (!val) return 'متداولة';
      const s = String(val).trim();
      const map: Record<string, string> = {
        active: 'متداولة', open: 'متداولة', متداولة: 'متداولة',
        closed: 'مغلقة', مغلقة: 'مغلقة',
        pending: 'تحت الدراسة', 'تحت الدراسة': 'تحت الدراسة',
        archived: 'محفوظة', محفوظة: 'محفوظة',
      };
      return map[s.toLowerCase()] || map[s] || 'متداولة';
    },
    z.enum(['متداولة', 'مغلقة', 'تحت الدراسة', 'محفوظة', 'حكم نهائي',
      'محكوم فيها', 'مستأنفة', 'طعن', 'تنفيذ']).default('متداولة')
  ),

  // المحكمة
  court_name: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? cleanText(val) : undefined),
    z.string().optional()
  ),

  // المدعي
  plaintiff: z.preprocess(
    (val) => (typeof val === 'string' ? cleanText(val) : undefined),
    z.string().optional()
  ),

  // المدعى عليه
  defendant: z.preprocess(
    (val) => (typeof val === 'string' ? cleanText(val) : undefined),
    z.string().optional()
  ),

  // تاريخ القيد
  filing_date: flexibleDate,

  // ملاحظات
  notes: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim() : undefined),
    z.string().max(5000).optional()
  ),
});

export type CaseImportRow = z.infer<typeof CaseImportSchema>;

// ─── Session Import Schema ───────────────────────────────────

export const SessionImportSchema = z.object({
  // رقم القضية (للربط)
  case_number: z.preprocess(
    (val) => String(val || '').trim(),
    z.string().min(1, 'رقم القضية مطلوب')
  ),

  // تاريخ الجلسة
  date: z.preprocess(
    (val) => {
      const result = flexibleDate.safeParse(val);
      if (result.success && result.data) {
        return result.data.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      return typeof val === 'string' ? val.trim() : '';
    },
    z.string().min(1, 'تاريخ الجلسة مطلوب')
  ),

  // وقت الجلسة
  time: z.preprocess(
    (val) => {
      if (!val) return '09:00';
      return String(val).trim();
    },
    z.string().default('09:00')
  ),

  // المحكمة
  court: z.preprocess(
    (val) => (typeof val === 'string' ? cleanText(val) : ''),
    z.string()
  ),

  // الدائرة
  circuit: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? cleanText(val) : undefined),
    z.string().optional()
  ),

  // القرار السابق
  previous_decision: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? cleanText(val) : undefined),
    z.string().optional()
  ),

  // الحالة
  status: z.preprocess(
    (val) => {
      if (!val) return 'قادمة';
      const s = String(val).trim();
      if (['قادمة', 'upcoming', 'scheduled'].includes(s.toLowerCase())) return 'قادمة';
      if (['منتهية', 'done', 'completed'].includes(s.toLowerCase())) return 'منتهية';
      if (['مؤجلة', 'postponed', 'delayed'].includes(s.toLowerCase())) return 'مؤجلة';
      return 'قادمة';
    },
    z.enum(['قادمة', 'منتهية', 'مؤجلة']).default('قادمة')
  ),

  // ملاحظات
  notes: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim() : undefined),
    z.string().max(5000).optional()
  ),
});

export type SessionImportRow = z.infer<typeof SessionImportSchema>;

// ─── Column Mapping ──────────────────────────────────────────
// خريطة الأعمدة: لربط الأعمدة العربية/الإنجليزية بأسماء الحقول

export const COLUMN_ALIASES: Record<string, string[]> = {
  // Client columns
  name: ['الاسم', 'اسم الموكل', 'اسم العميل', 'Name', 'Client Name', 'الإسم'],
  type: ['النوع', 'Type', 'نوع الموكل', 'Client Type'],
  national_id: ['الرقم القومي', 'National ID', 'رقم الهوية', 'NID'],
  phone: ['الهاتف', 'رقم الهاتف', 'Phone', 'Mobile', 'الموبايل', 'الجوال'],
  email: ['البريد', 'البريد الإلكتروني', 'Email', 'E-mail'],
  address: ['العنوان', 'Address', 'عنوان'],
  governorate: ['المحافظة', 'Governorate', 'City', 'المدينة'],
  commercial_registration: ['السجل التجاري', 'Commercial Reg', 'CR'],
  vat_number: ['الرقم الضريبي', 'VAT', 'Tax ID'],
  birth_date: ['تاريخ الميلاد', 'Birth Date', 'DOB'],
  notes: ['ملاحظات', 'Notes'],

  // Case columns
  case_number: ['رقم القضية', 'Case Number', 'Case No', 'رقم الدعوى'],
  title: ['عنوان القضية', 'العنوان', 'Title', 'Case Title'],
  client_name: ['اسم الموكل', 'Client', 'الموكل'],
  client_role: ['صفة الموكل', 'Client Role', 'Role'],
  status: ['الحالة', 'Status', 'حالة القضية'],
  court_name: ['المحكمة', 'Court', 'Court Name'],
  plaintiff: ['المدعي', 'Plaintiff'],
  defendant: ['المدعى عليه', 'Defendant'],
  filing_date: ['تاريخ القيد', 'Filing Date', 'تاريخ رفع الدعوى'],

  // Session columns
  date: ['التاريخ', 'تاريخ الجلسة', 'Date', 'Session Date'],
  time: ['الوقت', 'Time', 'وقت الجلسة'],
  court: ['المحكمة', 'Court'],
  circuit: ['الدائرة', 'Circuit'],
  previous_decision: ['القرار السابق', 'Previous Decision'],
};

/**
 * تطبيع أسماء الأعمدة: يحوّل الأعمدة العربية/الإنجليزية لأسماء الحقول المعيارية
 */
export function normalizeColumnName(header: string): string {
  const cleaned = header.trim();
  for (const [fieldName, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((a) => a.toLowerCase() === cleaned.toLowerCase()) || fieldName === cleaned) {
      return fieldName;
    }
  }
  // Return snake_case version as fallback
  return cleaned
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '');
}
