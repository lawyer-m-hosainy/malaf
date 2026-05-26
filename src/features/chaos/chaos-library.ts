/**
 * @file chaos-library.ts
 * @description Chaos Experiment Library containing 10 resilience experiments for malaf.pro Staging environment.
 * @author مهندس الموثوقية (SRE)
 * @copyright (c) 2026. All rights reserved.
 */

/**
 * واجهة تعريف تجربة الفوضى المنهجية
 */
export interface ChaosExperiment {
  name: string;
  hypothesis: string;       // "نفترض أن..."
  method: string;           // كيف نُحدث الفوضى
  expectedBehavior: string; // ماذا يجب أن يحدث للمستخدم
  rollbackPlan: string;     // كيف نعود للوضع الطبيعي بعد انتهاء التجربة
  successCriteria: string[]; // معايير نجاح التجربة
}

/**
 * التجربة 1: انقطاع كلي لقاعدة بيانات وسحابة Supabase
 */
export const SUPABASE_OUTAGE: ChaosExperiment = {
  name: "Supabase Outage",
  hypothesis: "عند انقطاع Supabase، لا يحدث White Screen of Death، وتظهر رسالة خطأ عربية واضحة مع الاحتفاظ بالبيانات المحلية.",
  method: "حظر النطاق *.supabase.co في DevTools -> Network -> Block Request URL أو محاكاة الـ Fetch برفض الوعود.",
  expectedBehavior: "تظهر واجهة مستخدم توضح تعذر الاتصال مع إبقاء الكاش القديم معروضاً (لا crash).",
  rollbackPlan: "إزالة الحظر الشبكي وإعادة تحميل الصفحة.",
  successCriteria: [
    "عدم تجمد الصفحة أو اسودادها.",
    "ظهور رسالة تنبيه واضحة: 'تعذر الاتصال بقاعدة البيانات حالياً'.",
    "ظهور زر 'إعادة المحاولة' بفاعلية.",
    "الاحتفاظ بـ React Query Cache سليم."
  ]
};

/**
 * التجربة 2: بطء شديد ومفاجئ في استجابة قاعدة البيانات
 */
export const DATABASE_LATENCY_SPIKE: ChaosExperiment = {
  name: "Database Latency Spike",
  hypothesis: "عند تأخر قاعدة البيانات لـ 5 ثواني، يعرض النظام هياكل تحميل (Loading Skeletons) بدلاً من تجميد الشاشة.",
  method: "Chrome DevTools -> Network -> Throttling -> Custom (Latency: 5000ms).",
  expectedBehavior: "ظهور هياكل التحميل فوراً ليعلم المستخدم أن المعالجة جارية.",
  rollbackPlan: "إعادة الـ Throttling إلى الوضع الطبيعي (No Throttling).",
  successCriteria: [
    "ظهور الـ Skeletons في غضون 200 مللي ثانية.",
    "عدم تجمد الواجهة التفاعلية أو الأزرار.",
    "ظهور رسالة تنبيه للمستخدم بعد 10 ثوانٍ تفيد ببطء الاستجابة."
  ]
};

/**
 * التجربة 3: توقف كامل وعطل شامل في خوادم الضرائب المصرية (ETA API)
 */
export const ETA_API_DOWN: ChaosExperiment = {
  name: "ETA API Complete Failure",
  hypothesis: "عند عطل منظومة الضرائب المصرية، يتم حفظ الفواتير محلياً بحالة 'pending_submission' لضمان عدم فقدان البيانات.",
  method: "تعديل الـ mock الخاص بـ ETAApiClient ليرجع خطأ 503 Service Unavailable.",
  expectedBehavior: "حفظ الفاتورة كمسودة/معلقة، وتنبيه المحامي أن الإرسال الفعلي سيتم تلقائياً فور عودة الخدمة.",
  rollbackPlan: "إزالة الـ mock وإرجاع العميل للوضع الطبيعي.",
  successCriteria: [
    "عدم فقدان أي فاتورة تم إنشاؤها.",
    "حفظ الفاتورة محلياً وتوجيهها لصفحة المسودات.",
    "إرسال تنبيه واضح: 'تم حفظ الفاتورة بنجاح وسيتم إرسالها تلقائياً عند استقرار منظومة الضرائب'."
  ]
};

/**
 * التجربة 4: زيادة بطء استجابة مصلحة الضرائب المصرية وتنشيط قاطع الدورة
 */
export const ETA_API_LATENCY_SPIKE: ChaosExperiment = {
  name: "ETA API Latency & Circuit Breaker",
  hypothesis: "عند بطء الـ ETA API المتكرر وتخطيها 5 إخفاقات، يتم تفعيل الـ Circuit Breaker لمنع إنهاك موارد المنصة.",
  method: "محاكاة تأخير 10 ثوانٍ وإخفاق 5 طلبات متتالية لـ ETA API.",
  expectedBehavior: "انتقال قاطع الدورة لحالة 'OPEN' ورفض الطلبات الفوري دون الانتظار (تجنب الـ Timeout).",
  rollbackPlan: "تصفير عداد الإخفاقات للـ Circuit Breaker يدوياً أو انتظار 60 ثانية للفتح الجزئي.",
  successCriteria: [
    "عدم تعليق الطلبات لمدة طويلة عند فتح القاطع.",
    "تفعيل الـ Circuit Breaker بعد 5 إخفاقات.",
    "ظهور رسالة واضحة للمستخدم: 'الخدمة غير متوفرة مؤقتاً لتفادي تأخير المعالجة، يرجى المحاولة لاحقاً'."
  ]
};

/**
 * التجربة 5: زيادة استهلاك ذاكرة المتصفح وضغط البيانات
 */
export const MEMORY_PRESSURE: ChaosExperiment = {
  name: "Memory Pressure",
  hypothesis: "تستمر المنصة بالعمل بأداء سلس حتى لو كان استهلاك ذاكرة المتصفح يقارب 80%.",
  method: "DevTools -> Memory -> Simulate Memory Pressure، أو فتح 50 ملف قضية في خلفية الذاكرة.",
  expectedBehavior: "المنصة تقوم بتحرير الكاش غير المستخدم (Garbage Collection) والحفاظ على سرعة التصفح.",
  rollbackPlan: "إغلاق التبويبات الزائدة وتنظيف كاش React Query.",
  successCriteria: [
    "عدم حدوث Memory Leak مستمر مع استمرار تصفح القضايا.",
    "بقاء استهلاك الذاكرة للتطبيق تحت معدلات مستقرة.",
    "سرعة استجابة القوائم في أقل من 300 مللي ثانية."
  ]
};

/**
 * التجربة 6: إعادة تشغيل خوادم Render للاستضافة
 */
export const RENDER_SERVICE_RESTART: ChaosExperiment = {
  name: "Render Service Restart",
  hypothesis: "عند إعادة تشغيل خادم الاستضافة وحدوث أخطاء 502 Bad Gateway، يدخل التطبيق في وضع عدم الاتصال ويعرض شاشة انتظار صديقة.",
  method: "إرجاع حالة 502 من الخادم الرئيسي أو محاكاة استجابات الشبكة بالخطأ.",
  expectedBehavior: "تحويل المستخدم لواجهة صديقة بالكامل تفيد بأن 'المنصة قيد التحديث السريع والعودة خلال ثوانٍ'.",
  rollbackPlan: "إرجاع استجابات الشبكة للوضع الطبيعي 200 OK.",
  successCriteria: [
    "عدم إظهار صفحة خطأ المتصفح القبيحة.",
    "ظهور شاشة انتظار متحركة وفاخرة تعكس موثوقية المنصة.",
    "تحديث الصفحة الذكي تلقائياً كل 5 ثوانٍ للتحقق من عودة الخادم."
  ]
};

/**
 * التجربة 7: تلف بيانات التخزين المحلي للمتصفح (Local Storage Corruption)
 */
export const LOCAL_STORAGE_CORRUPTION: ChaosExperiment = {
  name: "Local Storage Corruption",
  hypothesis: "عند تلف بيانات الـ Local Storage أو فقدانها، يقوم النظام بتسجيل خروج آمن للمستخدم دون شاشات متوقفة.",
  method: "كتابة بيانات غير صالحة (JSON تالف) في مفاتيح الـ localStorage الخاصة بالمصادقة وجلسة العمل.",
  expectedBehavior: "توجيه تلقائي وآمن للمستخدم لصفحة تسجيل الدخول مع مسح البيانات التالفة.",
  rollbackPlan: "تسجيل الدخول الصحيح مجدداً لتوليد التوكينات السليمة.",
  successCriteria: [
    "عدم حدوث عطل برمجي عند تعذر قراءة الـ JSON.",
    "تطهير الـ Storage التالف تلقائياً.",
    "إعادة توجيه واضحة وسريعة لصفحة تسجيل الدخول الرسمية."
  ]
};

/**
 * التجربة 8: تعطل نظام إشعارات الواتساب للعملاء
 */
export const WHATSAPP_API_DOWN: ChaosExperiment = {
  name: "WhatsApp API Down",
  hypothesis: "عند انقطاع اتصال مصلحة الواتساب API، يتم تحويل الإشعارات تلقائياً لصفحة التنبيهات الداخلية ولا يتعطل الإجراء القضائي.",
  method: "محاكاة فشل استدعاء WhatsApp Business API وإرجاع عطل من خوادم فيسبوك.",
  expectedBehavior: "حفظ الإشعار بنجاح في قاعدة البيانات كـ 'تنفيذ داخلي' مع رسالة تأكيد دون إعاقة سير عمل المحامي.",
  rollbackPlan: "إعادة تفعيل الاتصال مع WhatsApp API.",
  successCriteria: [
    "نجاح حفظ القضية/الجلسة دون التأثر بفشل الواتساب.",
    "تسجيل الفشل في سجل العمليات لمراجعته لاحقاً.",
    "إشعار المحامي بلوحة التحكم: 'تم التنبيه داخلياً وجاري إعادة محاولة إرسال رسالة الواتساب للعميل'."
  ]
};

/**
 * التجربة 9: توقف خدمات الذكاء الاصطناعي من جوجل (Gemini AI Outage)
 */
export const GEMINI_AI_OUTAGE: ChaosExperiment = {
  name: "Gemini AI Outage",
  hypothesis: "عند انقطاع سحابة Gemini AI، يتم تفعيل القوالب والتحقق التقليدي اليدوي دون إيقاف المحلل الذكي للعقود.",
  method: "محاكاة خطأ 500 أو انتهاء الحصة المجانية لكود API Key لجوجل جمناي.",
  expectedBehavior: "يتحول النظام تلقائياً لنظام الفحص التقليدي (القائم على الكلمات المفتاحية والقوالب المعدة مسبقاً) مع إعلام المستخدم بوجود معالجة احتياطية.",
  rollbackPlan: "إعادة تشغيل الـ API Key السليم وعودة استجابات الذكاء الاصطناعي.",
  successCriteria: [
    "عدم تجميد واجهة المحلل الذكي للعقود.",
    "تنبيه المحامي: 'تم استخدام محرك التدقيق الاحتياطي نظراً لانشغال خوادم الذكاء الاصطناعي'.",
    "توفير نتائج تدقيق أساسية ممتازة مبنية على القواعد الجافة."
  ]
};

/**
 * التجربة 10: عطل مفاجئ في بوابة المدفوعات والاشتراكات (Paymob Gateway)
 */
export const PAYMOB_GATEWAY_TIMEOUT: ChaosExperiment = {
  name: "Paymob Gateway Failure",
  hypothesis: "عند حدوث Timeout أو انقطاع في بوابة Paymob، يعلق النظام طلب الدفع بأمان كـ 'معلق' ويمنح فترة سماح للمستخدم.",
  method: "محاكاة تأخير استجابة Paymob لـ 15 ثانية أو إرجاع خطأ فشل الشبكة.",
  expectedBehavior: "عرض شاشة توضح تعذر إتمام عملية الدفع الفوري مع توفير خيارات بديلة (الدفع البنكي/فودافون كاش) وحفظ الفاتورة لحين المراجعة.",
  rollbackPlan: "إعادة بوابة الدفع لحالة التشغيل المستقرة.",
  successCriteria: [
    "حفظ المحاولة محلياً لضمان عدم ضياع بيانات العميل المرفقة.",
    "توفير قنوات اتصال بديلة فورية للعملاء.",
    "تجنب حدوث أي استقطاع مالي مزدوج."
  ]
};

/**
 * قائمة التجارب الكاملة لتسهيل استدعائها في التقارير والاختبارات التلقائية
 */
export const CHAOS_EXPERIMENTS: ChaosExperiment[] = [
  SUPABASE_OUTAGE,
  DATABASE_LATENCY_SPIKE,
  ETA_API_DOWN,
  ETA_API_LATENCY_SPIKE,
  MEMORY_PRESSURE,
  RENDER_SERVICE_RESTART,
  LOCAL_STORAGE_CORRUPTION,
  WHATSAPP_API_DOWN,
  GEMINI_AI_OUTAGE,
  PAYMOB_GATEWAY_TIMEOUT
];

export default CHAOS_EXPERIMENTS;
