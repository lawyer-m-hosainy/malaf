/**
 * Feature Flags - نظام إدارة الميزات بدون مكتبات خارجية
 */

const FLAGS = {
  ai_document_generation: import.meta.env.VITE_FLAG_AI_DOCS === 'true',
  new_case_form_v2:       import.meta.env.VITE_FLAG_CASE_FORM_V2 === 'true',
  eta_integration:        import.meta.env.VITE_FLAG_ETA === 'true',
  video_consultation:     false, // Disabled as per user request
  advanced_analytics:     import.meta.env.VITE_FLAG_ANALYTICS === 'true',
};

/**
 * التحقق مما إذا كانت ميزة معينة مفعلة
 * @param flag - اسم مؤشر الميزة المراد التحقق منها
 * @returns قيمة منطقية تشير إلى ما إذا كانت الميزة مفعلة أم لا
 */
export function isFeatureEnabled(flag: keyof typeof FLAGS): boolean {
  // في بيئة التطوير، يمكن تفعيل كل الميزات افتراضياً إذا لزم الأمر
  if (import.meta.env.DEV) {
    // return true; 
  }
  return FLAGS[flag] ?? false;
}

export default FLAGS;
