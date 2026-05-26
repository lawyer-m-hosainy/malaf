/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  
  // ركّز Stryker على المنطق الحيوي فقط لتسريع التشغيل
  mutate: [
    'src/services/**/*.ts',       // طبقة الخدمات — الأعلى أهمية
    'src/application/**/*.ts',    // منطق التطبيق
    'src/domain/**/*.ts',         // منطق الدومين
    'src/hooks/**/*.ts',          // Custom Hooks
    'src/lib/**/*.ts',            // دوال المساعدة
    '!src/**/*.test.ts',          // استثنِ ملفات الاختبار نفسها
    '!src/**/*.spec.ts', 
    '!src/**/*.d.ts', 
    '!src/lib/supabase.ts',       // استثناء ملف الربط مع سوبابيز لتجنب مشاكل الشبكة
    '!src/types/**',
  ],

  // تجاهل تحويرات بلا معنى عملي
  ignorers: ['ObjectAssign'],
  
  vitest: {
    configFile: 'vite.config.ts',
  },
  
  reporters: ['html', 'clear-text', 'progress', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/results.json' },
  
  // حدود القبول الإلزامية
  thresholds: {
    high: 80,    // ✅ ممتاز
    low: 70,     // ⚠️ الحد الأدنى المقبول
    break: 60,   // ❌ يوقف الـ CI إذا انخفض عن هذا
  },

  timeoutMS: 15000, // زيادة المهلة لتناسب البيئة
  concurrency: 2,   // تقليل الـ concurrency لتجنب استهلاك موارد الجهاز بالكامل في بيئة Staging
};
