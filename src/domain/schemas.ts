import { z } from 'zod';

// Client Schema — Egyptian validation
export const ClientSchema = z.object({
  id: z.string(),
  type: z.enum(['فرد', 'منشأة']),
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  nationalId: z.string().optional(),
  commercialRegistration: z.string().optional(),
  vatNumber: z.string().optional(),
  // Egyptian phone format validation : +201XXXXXXXXX (11 local digits)
  phone: z.string().regex(/^\+201[0-9]{9}$/, "رقم الجوال يجب أن يكون بالصيغة المصرية +201XXXXXXXXX"),
});

export type ClientValidationData = z.infer<typeof ClientSchema>;

// Case Schema — Egyptian courts
export const CaseSchema = z.object({
  id: z.string(),
  clientId: z.string().min(1, "يجب اختيار الموكل وربطه بالقضية"),
  // Egyptian Court Enum — Must match EgyptCourtType exactly
  court: z.enum([
    'محكمة النقض',
    'محكمة الاستئناف',
    'المحكمة الابتدائية',
    'المحكمة الجنائية الابتدائية',
    'المحكمة الاقتصادية',
    'الدائرة العمالية',
    'محاكم الأسرة',
    'مجلس الدولة',
    'محكمة القضاء الإداري',
    'المحكمة الإدارية العليا',
    'المحكمة الدستورية العليا',
    'محكمة أمن الدولة العليا',
    'محكمة الطفل',
    'محكمة الجنايات'
  ]),
  plaintiff: z.string().min(1),
  defendant: z.string().min(1),
  status: z.enum(['متداولة', 'تحت الدراسة', 'مغلقة', 'محفوظة']),
  createdAt: z.string()
});

export type CaseValidationData = z.infer<typeof CaseSchema>;

// Invoice Schema (Validation) — Egyptian: legal services exempt from VAT
export const InvoiceSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  subtotal: z.number().positive(),
  vatAmount: z.number().nonnegative(),
  stampDuty: z.number().nonnegative().optional(),
  total: z.number().positive()
}).refine(data => {
  // Egyptian legal services are VAT-exempt, so VAT should be 0
  return data.vatAmount === 0;
}, {
  message: "الخدمات القانونية معفاة من ضريبة القيمة المضافة في مصر",
  path: ['vatAmount']
}).refine(data => {
  const expectedTotal = data.subtotal + (data.stampDuty || 0);
  return Math.abs(data.total - expectedTotal) < 0.01;
}, {
  message: "المجموع الكلي غير مطابق لمجموع القيمة الأساسية مع رسوم الدمغة",
  path: ['total']
});

export type InvoiceValidationData = z.infer<typeof InvoiceSchema>;

// Egyptian National ID validation schema (14 digits)
export const EgyptNationalIdSchema = z.string()
  .length(14, "الرقم القومي يجب أن يكون 14 رقم")
  .regex(/^[23]\d{13}$/, "الرقم القومي يجب أن يبدأ بـ 2 أو 3");
