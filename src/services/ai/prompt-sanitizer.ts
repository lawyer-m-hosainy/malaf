/**
 * AI Prompt Sanitizer - نظام حماية من هجمات حقن المطالبات (Prompt Injection)
 */

export function sanitizeUserInput(input: string): string {
  if (!input) return "";

  // أنماط هجمات حقن المطالبات الشائعة
  const INJECTION_PATTERNS = [
    /ignore (previous|all|above) instructions?/gi,
    /you are now/gi,
    /new instructions?:/gi,
    /<\|system\|>/gi,
    /\[system\]/gi,
    /act as (an? )?(different|new|unrestricted)/gi,
    /assistant mode/gi,
    /developer mode/gi,
  ];

  let sanitized = input;
  let detected = false;

  INJECTION_PATTERNS.forEach(pattern => {
    if (pattern.test(sanitized)) {
      detected = true;
      sanitized = sanitized.replace(pattern, '[محتوى محذوف لأسباب أمنية]');
    }
  });

  if (detected) {
    console.warn("Prompt Injection attempt detected and blocked.");
    // هنا يمكن إضافة كود لتسجيل الحادثة في Audit Log عبر Supabase
  }

  return sanitized;
}

/**
 * تطهير كافة الحقول في كائن البيانات قبل إرسالها للذكاء الاصطناعي
 */
export function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeUserInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
