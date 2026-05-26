# React Performance Budget & Profiling — malaf.pro

دليل متكامل لتحديد الميزانية البرمجية لأداء المكونات (Performance Budget) وحماية المنصة من بطء الاستجابة وتسرب الذاكرة (Memory Leaks).

---

## 1. ميزانية أداء المكونات (Performance Budget Ceilings)

لضمان تفاعل سلس ومعدل إطارات مستقر (60 FPS)، نلتزم بالحدود القصوى للـ Render Time لكل مكون رئيسي:

| نوع المكون (Component Type) | الحد الأقصى لوقت الرسم (Max Initial Render) | الحد الأقصى لإعادة الرسم (Max Re-render) |
| :--- | :--- | :--- |
| **مكونات البطاقات البسيطة (Cards/Badges)** | `≤ 10ms` | `≤ 2ms` |
| **الجداول والقوائم (Tables/Lists)** | `≤ 50ms` (مع virtualizer لـ >50 عنصر) | `≤ 5ms` |
| **الصفحات الكاملة ولوحات القيادة (Pages/Dashboard)**| `≤ 100ms` | `≤ 10ms` |
| **المستندات والمحلل الذكي (Documents/AI)** | `≤ 150ms` | `≤ 15ms` |

---

## 2. قائمة المكونات الأكثر بطئاً وأسباب إعادة الرسم (Profiler Top 10 Slowest)

من خلال تحليل الأداء الافتراضي، تم رصد المكونات التالية كأولوية للتحسين والتأكد من عدم كسر ميزانية الأداء:

1. **Dashboard (لوحة القيادة)**: إعادة رسم الرسوم البيانية عند تحديث قائمة الإشعارات الجانبية.  
   * *الإصلاح*: فصل Context الإشعارات عن السياق العام واستخدام `useMemo` للرسوم البيانية.
2. **Cases (جدول القضايا)**: بطء الرسم الأولي مع زيادة عدد القضايا عن 100.  
   * *الإصلاح*: تطبيق pagination أو Virtualization باستخدام TanStack Virtual.
3. **AIDocumentAnalyzer (المحلل الذكي)**: تحديث مستمر لكائن الحالة أثناء معالجة المستند.  
   * *الإصلاح*: استخدام debounce لتحديث النص وتأجيل إعادة الرسم حتى انتهاء المهام الكبيرة.
4. **ClientPortal (بوابة الموكل)**: عمليات فك تشفير البيانات المتكررة عند كل رسم.  
   * *الإصلاح*: استخدام دالة فك التشفير الجماعي (Batch Decrypt) وحفظ النتائج في الـ Cache المحلي.
5. **Team (إدارة الموظفين)**: إعادة إنشاء دوال الحذف والتحرير عند كل رسم.  
   * *الإصلاح*: تغليف المعالجات بـ `useCallback`.

---

## 3. إرشادات منع تسرب الذاكرة (Memory Leak Prevention Checklist)

* **تنظيف مشغلات الأحداث (Event Listeners Cleanup)**:
  تأكد دائماً من إرجاع دالة تنظيف في `useEffect` عند استخدام `addEventListener`.
  ```typescript
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  ```
* **إلغاء الاشتراكات النشطة لـ Supabase Channels**:
  تأكد من إغلاق القنوات والاشتراكات عند مغادرة المكون لمنع تراكم اتصالات WebSockets.
  ```typescript
  useEffect(() => {
    const channel = supabase.channel("realtime-cases").subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  ```
* **تنظيف المؤقتات (Timers/Intervals)**:
  تنظيف `setInterval` أو `setTimeout` لمنع استمرار استدعاء الدوال بعد تدمير المكون.
  ```typescript
  useEffect(() => {
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);
  ```
