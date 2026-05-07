import { z } from 'zod';

// التحقق من رقم الجوال المصري (+201xxxxxxxxx أو 01xxxxxxxxx)
const egyptMobileRegex = /^(\+201|01)[0-9]{9}$/;

export const clientSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن يكون حرفين على الأقل" }),
  type: z.enum(['فرد', 'منشأة'], { message: "نوع العميل مطلوب" }),
  phone: z.string().regex(egyptMobileRegex, { message: "رقم الجوال يجب أن يبدأ بـ +201 أو 01 ويتبعه 9 أرقام" }).optional().or(z.literal('')),
  nationalId: z.string().refine(val => val === '' || /^[23]\d{13}$/.test(val), { 
    message: "الرقم القومي يجب أن يكون 14 رقم ويبدأ بـ 2 أو 3" 
  }).optional().or(z.literal('')),
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

export const poaSchema = z.object({
  clientId: z.string().min(1, { message: "يجب اختيار موكل" }),
  poaNumber: z.string().min(1, { message: "رقم التوكيل مطلوب" }),
  poaLetter: z.string().min(1, { message: "حرف التوكيل مطلوب" }),
  poaYear: z.string().regex(/^\d{4}$/, { message: "سنة التوكيل يجب أن تكون 4 أرقام" }),
  office: z.string().min(1, { message: "مكتب التوثيق مطلوب" }),
  type: z.enum(['عام', 'خاص', 'قضايا فقط', 'عقاري'], { message: "نوع التوكيل مطلوب" }),
  issueDate: z.string().min(1, { message: "تاريخ التوثيق مطلوب" }),
  expiryDate: z.string().optional().or(z.literal('')),
  status: z.enum(['ساري', 'ملغي', 'منتهي']).default('ساري'),
});

export const expenseSchema = z.object({
  clientId: z.string().min(1, { message: "يجب اختيار موكل" }),
  caseId: z.string().optional().or(z.literal('')),
  category: z.enum([
    'دمغة محاماة', 'رسوم نقابة', 'أمانة خبير', 'رسم إعلان (محضر)',
    'رسوم قضائية', 'مصروفات انتقال', 'مصروفات طباعة ونسخ',
    'أمانة تنفيذ', 'رسوم شهر عقاري', 'أخرى'
  ], { message: "فئة المصروف مطلوبة" }),
  amount: z.number().positive({ message: "المبلغ يجب أن يكون أكبر من صفر" }),
  date: z.string().min(1, { message: "التاريخ مطلوب" }),
  description: z.string().optional().or(z.literal('')),
});

export const sessionSchema = z.object({
  caseId: z.string().min(1, { message: "يجب اختيار القضية" }),
  date: z.string().min(1, { message: "تاريخ الجلسة مطلوب" }),
  time: z.string().optional().or(z.literal('')),
  courtRoom: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const taskSchema = z.object({
  title: z.string().min(2, { message: "عنوان المهمة مطلوب" }),
  description: z.string().optional().or(z.literal('')),
  priority: z.enum(['منخفض', 'متوسط', 'عالي', 'عاجل']).default('متوسط'),
  assignedTo: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
});

export const enforcementSchema = z.object({
  caseId: z.string().min(1, { message: "يجب ربط طلب التنفيذ بقضية" }),
  amountClaimed: z.number().positive({ message: "المبلغ المطالب به يجب أن يكون أكبر من صفر" }),
  status: z.string().optional(),
});

export const timeEntrySchema = z.object({
  lawyerId: z.string().min(1, { message: "يجب تحديد المحامي" }),
  caseId: z.string().min(1, { message: "يجب تحديد القضية" }),
  description: z.string().min(1, { message: "وصف العمل مطلوب" }),
  duration: z.number().int().positive({ message: "المدة يجب أن تكون أكبر من صفر (بالدقائق)" }),
  date: z.string().min(1, { message: "التاريخ مطلوب" }),
  billable: z.boolean().default(true),
});

export const calendarEventSchema = z.object({
  title: z.string().min(1, { message: "عنوان الحدث مطلوب" }),
  startDate: z.string().min(1, { message: "تاريخ البداية مطلوب" }),
  endDate: z.string().optional().or(z.literal('')),
  type: z.string().optional(),
  caseId: z.string().optional().or(z.literal('')),
});

