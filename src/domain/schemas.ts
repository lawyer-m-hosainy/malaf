import { z } from 'zod';

// ═══════════════════════════════════════════════════════
// إعادة تصدير الـ Schemas الأساسية من الملف الموحد
// لتوحيد المرجعية وتجنب التكرار
// ═══════════════════════════════════════════════════════
export {
  clientSchema,
  caseSchema,
  invoiceSchema,
  trustAccountSchema,
  poaSchema,
  expenseSchema,
  sessionSchema,
  taskSchema,
  enforcementSchema,
  timeEntrySchema,
  calendarEventSchema,
} from '../lib/schemas';

// ═══════════════════════════════════════════════════════
// Strict Domain Schemas — للتحقق المتقدم (Server-side / Import validation)
// هذه schemas أكثر صرامة من schemas النماذج وتُستخدم عند الاستيراد المجمع
// ═══════════════════════════════════════════════════════

// Egyptian Court Enum — القائمة الكاملة للمحاكم المصرية
export const EgyptCourtEnum = z.enum([
  'محكمة النقض', 'محكمة الاستئناف', 'المحكمة الابتدائية',
  'المحكمة الجنائية الابتدائية', 'المحكمة الاقتصادية', 'الدائرة العمالية',
  'محاكم الأسرة', 'مجلس الدولة', 'محكمة القضاء الإداري',
  'المحكمة الإدارية العليا', 'المحكمة الدستورية العليا',
  'محكمة أمن الدولة العليا', 'محكمة الطفل', 'محكمة الجنايات',
  // أسماء مختصرة من النماذج
  'الجزئية', 'الابتدائية', 'الاستئناف', 'النقض', 'المحكمة التجارية',
]);

// Strict Client Schema — للتحقق الكامل مع ID
export const StrictClientSchema = z.object({
  id: z.string(),
  type: z.enum(['فرد', 'منشأة']),
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  nationalId: z.string().optional(),
  commercialRegistration: z.string().optional(),
  vatNumber: z.string().optional(),
  phone: z.string().regex(/^(\+201|01)[0-9]{9}$/, "رقم الجوال يجب أن يكون بالصيغة المصرية"),
});

export type ClientValidationData = z.infer<typeof StrictClientSchema>;

// Strict Case Schema
export const StrictCaseSchema = z.object({
  id: z.string(),
  clientId: z.string().min(1, "يجب اختيار الموكل وربطه بالقضية"),
  court: EgyptCourtEnum,
  plaintiff: z.string().min(1),
  defendant: z.string().min(1),
  status: z.enum(['متداولة', 'تحت الدراسة', 'مغلقة', 'محفوظة', 'حكم نهائي', 'محكوم فيها', 'مستأنفة', 'طعن', 'تنفيذ']),
  createdAt: z.string()
});

export type CaseValidationData = z.infer<typeof StrictCaseSchema>;

// Strict Invoice Schema — Egyptian 14% VAT
export const StrictInvoiceSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  subtotal: z.number().positive(),
  vatAmount: z.number().nonnegative(),
  stampDuty: z.number().nonnegative().optional(),
  total: z.number().positive()
}).refine(data => {
  const expectedVat = data.subtotal * 0.14;
  return Math.abs(data.vatAmount - expectedVat) < 1.0 || data.vatAmount === 0; 
}, {
  message: "ضريبة القيمة المضافة يجب أن تكون 14% من القيمة الأساسية",
  path: ['vatAmount']
}).refine(data => {
  const expectedTotal = data.subtotal + data.vatAmount + (data.stampDuty || 0);
  return Math.abs(data.total - expectedTotal) < 0.01;
}, {
  message: "المجموع الكلي غير مطابق",
  path: ['total']
});

export type InvoiceValidationData = z.infer<typeof StrictInvoiceSchema>;

// Egyptian National ID validation (14 digits, starts with 2 or 3)
export const EgyptNationalIdSchema = z.string()
  .length(14, "الرقم القومي يجب أن يكون 14 رقم")
  .regex(/^[23]\d{13}$/, "الرقم القومي يجب أن يبدأ بـ 2 أو 3");

// ═══════════════════════════════════════════════════════
// Backward Compatibility Aliases
// ═══════════════════════════════════════════════════════
/** @deprecated Use StrictClientSchema */
export const ClientSchema = StrictClientSchema;
/** @deprecated Use StrictCaseSchema */
export const CaseSchema = StrictCaseSchema;
/** @deprecated Use StrictInvoiceSchema */
export const InvoiceSchema = StrictInvoiceSchema;
