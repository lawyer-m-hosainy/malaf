/**
 * ═══════════════════════════════════════════════════════
 * أدوات التنسيق المصرية — مَلَف (Malaf)
 * ═══════════════════════════════════════════════════════
 * توحيد تنسيق التواريخ والأرقام والعملات
 * عبر جميع صفحات التطبيق.
 * 
 * القواعد:
 * - التاريخ: DD/MM/YYYY (التنسيق المصري)
 * - العملة: ج.م (جنيه مصري)
 * - الأرقام: أرقام إنجليزية فقط (0-9) — ليست هندية (٠-٩)
 * ═══════════════════════════════════════════════════════
 */

/**
 * تنسيق التاريخ بالصيغة المصرية DD/MM/YYYY
 * @example formatDateEG('2026-04-01') → '01/04/2026'
 * @example formatDateEG(new Date()) → '09/05/2026'
 */
export function formatDateEG(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    // استخدام en-GB للحصول على DD/MM/YYYY (أرقام إنجليزية)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * تنسيق التاريخ بصيغة قصيرة مع اسم اليوم والشهر بالعربية
 * @example formatDateShortAR('2026-04-01') → 'الثلاثاء، 1 أبريل'
 */
export function formatDateShortAR(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    // ar-EG مع useGrouping: false لضمان أرقام إنجليزية
    const formatted = d.toLocaleDateString('ar-EG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    // تحويل الأرقام الهندية لإنجليزية
    return forceWesternNumerals(formatted);
  } catch {
    return '—';
  }
}

/**
 * تنسيق المبالغ المالية مع رمز الجنيه المصري
 * @example formatEGP(25000) → '25,000 ج.م'
 * @example formatEGP(0) → '0 ج.م'
 */
export function formatEGP(amount: number | null | undefined): string {
  if (amount == null) return '0 ج.م';
  // en-EG يعطي فواصل إنجليزية + أرقام إنجليزية
  return `${amount.toLocaleString('en-EG')} ج.م`;
}

/**
 * تنسيق الأرقام بأرقام إنجليزية مع فواصل الآلاف
 * @example formatNumber(1500) → '1,500'
 */
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '0';
  return num.toLocaleString('en-EG');
}

/**
 * تحويل الأرقام العربية الهندية (٠١٢٣٤٥٦٧٨٩) إلى إنجليزية (0123456789)
 * @example forceWesternNumerals('٢٥/٠٤/٢٠٢٦') → '25/04/2026'
 */
export function forceWesternNumerals(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
