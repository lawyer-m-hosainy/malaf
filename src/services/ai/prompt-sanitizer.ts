/**
 * AI Prompt Sanitizer - نظام حماية من هجمات حقن المطالبات (Prompt Injection) وحماية الخصوصية
 */

// --- أنماط الكشف عن المحاولات الخطيرة (isSafePrompt) ---
const INJECTION_PATTERNS: RegExp[] = [
  // --- Ignore variants ---
  // تم الإصلاح: إضافة s? لدعم الجمع (instructions)
  /\bignore\b.{0,30}\b(instructions?|prompt|above|previous|system|rules)\b/i,
  
  // --- تجاهل عربي ---
  /تجاهل.{0,20}(التعليمات|الأوامر|السابقة|كل)/i,

  // --- Forget / Disregard ---
  /\b(forget|disregard|override|bypass)\b.{0,20}\b(instruction|above|previous|told|rules)\b/i,

  // --- New instructions ---
  /\b(your\s+new|new\s+instructions?|instructions?\s+are\s*:)/i,

  // --- System role takeover ---
  /\b(system\s*:\s*you|you\s+are\s+now\s+(an?\s+)?(unrestricted|jailbreak|DAN))/i,

  // --- Jailbreak keywords ---
  /\b(jailbreak|jailbroken|DAN\b|developer\s+mode|unrestricted\s+AI|no\s+restrictions)\b/i,
  /\b(act\s+as\s+(DAN|an?\s+unrestricted)|pretend\s+(you\s+have\s+no|there\s+are\s+no))/i,

  // --- Arabic jailbreak ---
  /بدون\s+قيود|ذكاء\s+اصطناعي\s+حر|بلا\s+قيود/i,

  // --- XSS / Script injection ---
  /\]\]>\s*<\/?\s*script/i,
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on(load|error|click|mouse)\s*=/i,

  // --- Human/Assistant turn injection ---
  /\n\n(human|assistant|user|system)\s*:/i,
  /\\n\\n(human|assistant)\s*:/i,
];

/**
 * يتحقق مما إذا كان الـ prompt آمناً للاستخدام (يقرر المنع من عدمه)
 */
export function isSafePrompt(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  if (input.trim().length === 0) return true;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      pattern.lastIndex = 0;
      return false;
    }
  }

  return true;
}

/**
 * تطهير الـ prompt من البيانات الحساسة ومحاولات الحقن غير المباشرة
 */
export function sanitizePrompt(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // الإصلاح: بيانات DB مثل أسماء الموكلين يجب أن تكون سطراً واحداً
  // أي شيء بعد السطر الأول يعتبر محاولة حقن مشبوهة ويتم حذفه
  let cleaned = input.split('\n')[0];

  // نظّف الـ PII
  cleaned = cleaned
    .replace(/\b\d{14}\b/g, '[REDACTED_NID]')     // رقم قومي مصري
    .replace(/\b\d{16}\b/g, '[REDACTED_CARD]')    // بطاقة بنكية
    .replace(/\b01[0-9]{9}\b/g, '[REDACTED_PHONE]'); // رقم موبايل مصري

  // حذف SQL fragments الخطيرة
  cleaned = cleaned.replace(/['"`];\s*(DROP|DELETE|INSERT|UPDATE|SELECT\s+\*)\s+/gi, '');
  cleaned = cleaned.replace(/--\s*$/gm, '');

  return cleaned.trim();
}

/**
 * الوظيفة القديمة للتوافق مع الكود الحالي
 */
export function sanitizeUserInput(input: string): string {
  return sanitizePrompt(input);
}

/**
 * تطهير كافة الحقول في كائن البيانات قبل إرسالها للذكاء الاصطناعي
 */
export function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizePrompt(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
