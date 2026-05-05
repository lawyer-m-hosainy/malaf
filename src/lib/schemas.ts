import { z } from 'zod';

// التحقق من رقم الجوال المصري (+201xxxxxxxxx)
const egyptMobileRegex = /^\+201[0-9]{9}$/;

export const clientSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن يكون حرفين على الأقل" }),
  type: z.enum(['فرد', 'منشأة'], { message: "نوع العميل مطلوب" }),
  phone: z.string().regex(egyptMobileRegex, { message: "رقم الجوال يجب أن يبدأ بـ +201 ويتبعه 9 أرقام" }).optional().or(z.literal('')),
  nationalId: z.string().optional().or(z.literal('')),
  commercialRegistration: z.string().optional().or(z.literal('')),
  vatNumber: z.string().optional().or(z.literal('')),
  address: z.string().optional(),
  email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }).optional().or(z.literal('')),
});

export const caseSchema = z.object({
  id: z.string().min(1, { message: "رقم القضية / المرجع مطلوب" }),
  clientId: z.string().min(1, { message: "يجب اختيار موكل" }),
  court: z.string().min(1, { message: "نوع المحكمة مطلوب" }),
  plaintiff: z.string().min(1, { message: "اسم المدعي مطلوب" }),
  defendant: z.string().min(1, { message: "اسم المدعى عليه مطلوب" }),
  powerOfAttorneyRef: z.string().min(1, { message: "رقم الوكالة مطلوب" }),
  status: z.string().optional(),
  type: z.string().optional(),
});

export const invoiceSchema = z.object({
  clientName: z.string().min(1, { message: "يجب اختيار عميل" }),
  base: z.number().min(0, { message: "المبلغ الأساسي يجب أن يكون 0 أو أكثر" }),
  taxRate: z.number().min(0).max(100).default(14),
  status: z.enum(['مدفوعة', 'غير مدفوعة', 'مسودة']).default('مسودة'),
  dueDate: z.string().optional().or(z.literal('')),
});

export const trustAccountSchema = z.object({
  clientName: z.string().min(1, { message: "يجب اختيار عميل" }),
  amount: z.number().positive({ message: "المبلغ يجب أن يكون أكبر من الصفر" }),
  type: z.enum(['أمانة', 'مقدم أتعاب', 'مبلغ تنفيذ'], { message: "نوع العملية مطلوب" }),
  description: z.string().min(3, { message: "الوصف مطلوب" }),
  date: z.string().min(1, { message: "التاريخ مطلوب" }),
});
