import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * دالة مساعدة لدمج فئات Tailwind CSS بشكل آمن ومنع التعارضات.
 * 
 * @param {ClassValue[]} inputs - مصفوفة من فئات CSS أو شروطها
 * @returns {string} النص النهائي المدمج للفئات
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * تنسيق الأرقام وفق النظام المصري (الأرقام العربية الشرقية).
 * 
 * @param {number} num - الرقم المراد تنسيقه
 * @returns {string} الرقم منسقاً نصياً
 * 
 * @example
 * formatNumber(1234) // "١٬٢٣٤"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}

/**
 * تنسيق المبالغ المالية بالجنيه المصري (EGP).
 * 
 * @param {number} amount - المبلغ المالي
 * @returns {string} المبلغ منسقاً مع رمز العملة
 * 
 * @example
 * formatCurrency(1500.50) // "١٬٥٠٠٫٥٠ ج.م."
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * تحويل وتنسيق التاريخ الميلادي إلى التاريخ الهجري (تقويم أم القرى).
 * 
 * @param {Date} date - التاريخ الميلادي
 * @returns {string} التاريخ الهجري نصياً باللغة العربية
 */
export function formatHijriDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    return "";
  }
}

/**
 * استخراج رقم اليوم الهجري فقط من التاريخ.
 * 
 * @param {Date} date - التاريخ الميلادي
 * @returns {string} رقم اليوم بالهجري
 */
export function formatHijriDayNumber(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric'
    }).format(date);
  } catch (e) {
    return "";
  }
}
