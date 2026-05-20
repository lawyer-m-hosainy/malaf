# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-registration.spec.js >> تسجيل مكتب جديد وتسجيل الدخول >> نموذج تسجيل مكتب يحتوي على الحقول المطلوبة
- Location: tests\02-registration.spec.js:26:3

# Error details

```
Error: حقل البريد غير موجود

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6] [cursor=pointer]:
          - img [ref=e8]
          - generic [ref=e12]: مَلَف
        - button "ابدأ مجاناً" [ref=e14]
    - generic [ref=e20]:
      - img [ref=e23]
      - generic [ref=e27]: أول نظام إدارة متكامل لمكاتب المحاماة في مصر
      - heading "حوّل مكتبك إلى مكتب ذكي" [level=1] [ref=e28]
      - paragraph [ref=e29]: ملف يجمع إدارة القضايا، الموكلين، الجلسات، العقود، والفواتير في منصة واحدة مصممة خصيصاً للمحامي المصري.
      - generic [ref=e30]:
        - button "ابدأ تجربتك المجانية لمدة أسبوع" [ref=e31]:
          - text: ابدأ تجربتك المجانية لمدة أسبوع
          - img
        - button "شاهد العرض التوضيحي" [ref=e32]
      - generic [ref=e33]:
        - generic [ref=e34]:
          - img [ref=e35]
          - text: خوادم سحابية آمنة
        - generic [ref=e38]:
          - img [ref=e39]
          - text: تشفير بيانات بنكي
        - generic [ref=e42]:
          - img [ref=e43]
          - text: نسخ احتياطي يومي
      - link "مقدمة منصة مَلَف القانونية انقر لمشاهدة العرض التوضيحي القصير وتعرف على مميزات النظام" [ref=e47]:
        - /url: https://app.heygen.com/videos/f2fd5c4f361a4036b3ce158cdb6291d3
        - generic [ref=e51]:
          - heading "مقدمة منصة مَلَف القانونية" [level=3] [ref=e54]
          - paragraph [ref=e55]: انقر لمشاهدة العرض التوضيحي القصير وتعرف على مميزات النظام
    - generic [ref=e58]:
      - generic [ref=e59]:
        - generic [ref=e60]: 60%
        - generic [ref=e61]: توفير في وقت الإدارة
      - generic [ref=e62]:
        - generic [ref=e63]: "+150"
        - generic [ref=e64]: نموذج قانوني جاهز
      - generic [ref=e65]:
        - generic [ref=e66]: 100%
        - generic [ref=e67]: تشفير وحماية للبيانات
      - generic [ref=e68]:
        - generic [ref=e69]: 24/7
        - generic [ref=e70]: دعم فني متواصل
    - generic [ref=e72]:
      - generic [ref=e73]:
        - generic [ref=e74]: +20 وحدة متكاملة
        - heading "كل ما يحتاجه مكتبك في منصة واحدة" [level=2] [ref=e75]
        - paragraph [ref=e76]: استبدل عشرات التطبيقات وملفات الإكسل بنظام ذكي مصمم خصيصاً للمحامي المصري.
      - generic [ref=e77]:
        - generic [ref=e78]:
          - img [ref=e80]
          - heading "الإدارة القانونية الأساسية" [level=3] [ref=e86]
        - generic [ref=e87]:
          - generic [ref=e88]:
            - img [ref=e90]
            - heading "إدارة القضايا" [level=4] [ref=e96]
            - paragraph [ref=e97]: ملف شامل لكل قضية بأطرافها ومحكمتها ودائرتها وحالتها مع ربط تلقائي بالموكلين والجلسات.
          - generic [ref=e98]:
            - img [ref=e100]
            - heading "أجندة الجلسات" [level=4] [ref=e102]
            - paragraph [ref=e103]: سجل مواعيد المحاكم مطابقاً للأجندة الورقية مع تنبيهات تلقائية وطباعة PDF احترافية.
          - generic [ref=e104]:
            - img [ref=e106]
            - heading "إدارة الموكلين" [level=4] [ref=e111]
            - paragraph [ref=e112]: "بطاقة شاملة لكل موكل: بياناته، قضاياه، عقوده، فواتيره، ومستنداته في مكان واحد."
          - generic [ref=e113]:
            - img [ref=e115]
            - heading "التنفيذ القضائي" [level=4] [ref=e119]
            - paragraph [ref=e120]: "متابعة 5 مراحل التنفيذ: استلام الصيغة → إعلان السند → توكيل المحضر → الإشكال → التحصيل."
      - generic [ref=e121]:
        - generic [ref=e122]:
          - img [ref=e124]
          - heading "المالية والتحصيل" [level=3] [ref=e127]
        - generic [ref=e128]:
          - generic [ref=e129]:
            - img [ref=e131]
            - heading "الفاتورة الإلكترونية" [level=4] [ref=e134]
            - paragraph [ref=e135]: إصدار فواتير متوافقة مع منظومة ETA المصرية مع حساب ضريبة القيمة المضافة تلقائياً.
          - generic [ref=e136]:
            - img [ref=e138]
            - heading "نظام التحصيل" [level=4] [ref=e141]
            - paragraph [ref=e142]: تتبع المستحقات والمدفوعات لكل موكل مع تنبيهات للمبالغ المتأخرة وإشعارات الدفع.
          - generic [ref=e143]:
            - img [ref=e145]
            - heading "تتبع الوقت" [level=4] [ref=e148]
            - paragraph [ref=e149]: تسجيل ساعات العمل لكل قضية تلقائياً مع تحويلها لفواتير بسعر الساعة المحدد.
          - generic [ref=e150]:
            - img [ref=e152]
            - heading "التقارير المالية" [level=4] [ref=e154]
            - paragraph [ref=e155]: "لوحة تحكم شاملة: إيرادات، مصروفات، أرباح صافية، وتحليل أداء مالي شهري."
      - generic [ref=e156]:
        - generic [ref=e157]:
          - img [ref=e159]
          - heading "المستندات والعقود" [level=3] [ref=e162]
        - generic [ref=e163]:
          - generic [ref=e164]:
            - img [ref=e166]
            - heading "إدارة العقود CLM" [level=4] [ref=e169]
            - paragraph [ref=e170]: إنشاء العقود من قوالب جاهزة، تتبع دورة حياة العقد، وتنبيهات قبل انتهاء الصلاحية.
          - generic [ref=e171]:
            - img [ref=e173]
            - heading "المستندات والأرشفة" [level=4] [ref=e176]
            - paragraph [ref=e177]: أرشفة إلكترونية آمنة لكل المرفقات والمستندات مع بحث سريع وتصنيف تلقائي.
          - generic [ref=e178]:
            - img [ref=e180]
            - heading "+150 نموذج قانوني" [level=4] [ref=e182]
            - paragraph [ref=e183]: "مكتبة قوالب قانونية جاهزة: عقود، توكيلات، إنذارات، مذكرات — بتنسيق احترافي."
          - generic [ref=e184]:
            - img [ref=e186]
            - heading "الملكية الفكرية" [level=4] [ref=e188]
            - paragraph [ref=e189]: تتبع العلامات التجارية وبراءات الاختراع مع تنبيهات التجديد والمواعيد الحرجة.
      - generic [ref=e190]:
        - generic [ref=e191]:
          - img [ref=e193]
          - heading "الخدمات الذكية وإدارة الفريق" [level=3] [ref=e196]
        - generic [ref=e197]:
          - generic [ref=e198]:
            - img [ref=e200]
            - heading "الذكاء الاصطناعي" [level=4] [ref=e208]
            - paragraph [ref=e209]: صياغة مذكرات، تلخيص مستندات، واستشارات قانونية فورية بتقنية Gemini وGroq.
          - generic [ref=e210]:
            - img [ref=e212]
            - heading "بوت واتساب الذكي" [level=4] [ref=e215]
            - paragraph [ref=e216]: رد تلقائي على استفسارات الموكلين عبر واتساب بذكاء اصطناعي مدرب على بياناتك.
          - generic [ref=e217]:
            - img [ref=e219]
            - heading "إدارة المهام" [level=4] [ref=e222]
            - paragraph [ref=e223]: توزيع المهام على المحامين مع 5 حالات عمل وتتبع إنجاز وسجل نشاط لكل مهمة.
          - generic [ref=e224]:
            - img [ref=e226]
            - heading "بوابة الموكلين" [level=4] [ref=e229]
            - paragraph [ref=e230]: بوابة خاصة يتابع منها الموكل قضاياه وجلساته ومستنداته — بدون إزعاجك بالاتصالات.
    - generic [ref=e232]:
      - generic [ref=e233]:
        - heading "ابدأ في 3 خطوات بسيطة" [level=2] [ref=e234]
        - paragraph [ref=e235]: من التسجيل للإنتاجية الكاملة في أقل من 10 دقائق.
      - generic [ref=e236]:
        - generic [ref=e237]:
          - generic [ref=e238]: "1"
          - heading "سجّل مكتبك" [level=3] [ref=e239]
          - paragraph [ref=e240]: أنشئ حسابك بالبريد أو Google في ثوانٍ — بدون بطاقة ائتمان.
        - generic [ref=e241]:
          - generic [ref=e242]: "2"
          - heading "أضف بياناتك" [level=3] [ref=e243]
          - paragraph [ref=e244]: أدخل موكليك وقضاياك يدوياً أو استوردهم بملف CSV دفعة واحدة.
        - generic [ref=e245]:
          - generic [ref=e246]: "3"
          - heading "أدِر مكتبك بذكاء" [level=3] [ref=e247]
          - paragraph [ref=e248]: تابع جلساتك، أصدر فواتيرك، ووزّع مهامك — كل شيء في مكان واحد.
    - generic [ref=e250]:
      - generic [ref=e251]:
        - heading "لمن صُمِّمت ملف؟" [level=2] [ref=e252]
        - paragraph [ref=e253]: منصة مرنة تتكيف مع حجم عملك وطبيعة مكتبك.
      - generic [ref=e254]:
        - generic [ref=e255]:
          - img [ref=e257]
          - heading "مكاتب المحاماة الفردية" [level=3] [ref=e262]
          - paragraph [ref=e263]: إدارة كل شيء لوحدك بدون فريق إداري. وفر وقتك للعمل القانوني الحقيقي بدلاً من الأعمال الإدارية.
        - generic [ref=e264]:
          - img [ref=e266]
          - heading "شركات المحاماة المتوسطة" [level=3] [ref=e269]
          - paragraph [ref=e270]: تنسيق فرق العمل، توزيع المهام، ومتابعة الأداء اليومي لكل محامٍ في فريقك.
        - generic [ref=e271]:
          - img [ref=e273]
          - heading "الشركات القانونية الكبرى" [level=3] [ref=e277]
          - paragraph [ref=e278]: حوكمة متكاملة، تقارير تنفيذية دقيقة، وإدارة صلاحيات معقدة للفروع المتعددة.
    - generic [ref=e281]:
      - generic [ref=e282]:
        - generic [ref=e283]: ميزة تنافسية لمكتبك
        - heading "بوابة موكلين متطورة تبقي عملاءك على اطلاع دائم" [level=2] [ref=e284]:
          - text: بوابة موكلين متطورة
          - text: تبقي عملاءك على اطلاع دائم
        - paragraph [ref=e285]: ارفع مستوى الشفافية والرضا لدى موكليك. من خلال بوابة الموكلين الخاصة بك، يمكن لعملائك متابعة سير قضاياهم، الاطلاع على الجلسات، وتحميل المستندات دون الحاجة لإزعاجك بالاتصالات المتكررة.
        - list [ref=e286]:
          - listitem [ref=e287]:
            - img [ref=e289]
            - text: تقليل اتصالات الاستفسار بنسبة 70%
          - listitem [ref=e292]:
            - img [ref=e294]
            - text: أرشفة إلكترونية آمنة لمستندات الموكل
          - listitem [ref=e297]:
            - img [ref=e299]
            - text: واجهة احترافية تحمل شعار مكتبك
          - listitem [ref=e302]:
            - img [ref=e304]
            - text: شفافية تامة تعزز ثقة العميل
        - button "تعرف على بوابة الموكلين" [ref=e307]
      - generic [ref=e311]:
        - img "واجهة بوابة الموكلين لمنصة مَلَف" [ref=e313]
        - generic [ref=e314]:
          - img [ref=e316]
          - generic [ref=e319]:
            - generic [ref=e320]: معدل الإنجاز
            - generic [ref=e321]: 98.5%
    - generic [ref=e323]:
      - generic [ref=e324]:
        - generic [ref=e325]: باقات الاشتراك
        - heading "ابدأ مجاناً — وكبّر مع نمو مكتبك" [level=2] [ref=e326]
        - paragraph [ref=e327]: أسعار شفافة بدون رسوم خفية. أقل من تكلفة كوب قهوة يومياً.
      - generic [ref=e328]:
        - generic [ref=e329]:
          - generic [ref=e330]:
            - heading "تجربة مجانية" [level=3] [ref=e331]
            - paragraph [ref=e332]: جرب المنصة بكامل ميزاتها لمدة أسبوع
            - generic [ref=e334]: مجاناً
          - list [ref=e335]:
            - listitem [ref=e336]:
              - img [ref=e337]
              - text: تجربة كاملة للباقة المتقدمة
            - listitem [ref=e340]:
              - img [ref=e341]
              - text: موكلون وقضايا غير محدودة
            - listitem [ref=e344]:
              - img [ref=e345]
              - text: الذكاء الاصطناعي وبوت واتساب
            - listitem [ref=e348]:
              - img [ref=e349]
              - text: إدارة العقود والفواتير
            - listitem [ref=e352]:
              - img [ref=e353]
              - text: بدون بطاقة ائتمان
          - button "ابدأ مجاناً" [ref=e356]
        - generic [ref=e357]:
          - generic [ref=e358]:
            - heading "الأساسية" [level=3] [ref=e359]
            - paragraph [ref=e360]: للمحامي الفردي والمكاتب الناشئة
            - generic [ref=e361]:
              - generic [ref=e362]: "599"
              - generic [ref=e363]: ج.م/شهر
            - paragraph [ref=e364]: = 20 ج.م/يوم فقط
          - list [ref=e365]:
            - listitem [ref=e366]:
              - img [ref=e367]
              - text: 50 قضية
            - listitem [ref=e370]:
              - img [ref=e371]
              - text: الفاتورة الإلكترونية (ETA)
            - listitem [ref=e374]:
              - img [ref=e375]
              - text: التقويم والمواعيد
            - listitem [ref=e378]:
              - img [ref=e379]
              - text: مساعد AI محدود
            - listitem [ref=e382]:
              - img [ref=e383]
              - text: حتى 5 مستخدمين
            - listitem [ref=e386]:
              - img [ref=e387]
              - text: دعم بالبريد
          - button "ابدأ الآن" [active] [ref=e390]
        - generic [ref=e391]:
          - generic [ref=e393]: الأكثر طلباً
          - generic [ref=e394]:
            - heading "المتقدمة" [level=3] [ref=e395]
            - paragraph [ref=e396]: الأنسب للمكاتب المتنامية
            - generic [ref=e397]:
              - generic [ref=e398]: "999"
              - generic [ref=e399]: ج.م/شهر
            - paragraph [ref=e400]: = 33 ج.م/يوم فقط
          - list [ref=e401]:
            - listitem [ref=e402]:
              - img [ref=e403]
              - text: 500 قضية
            - listitem [ref=e406]:
              - img [ref=e407]
              - text: إدارة العقود (CLM)
            - listitem [ref=e410]:
              - img [ref=e411]
              - text: التنفيذ القضائي
            - listitem [ref=e414]:
              - img [ref=e415]
              - text: نظام التحصيل الكامل
            - listitem [ref=e418]:
              - img [ref=e419]
              - text: AI غير محدود
            - listitem [ref=e422]:
              - img [ref=e423]
              - text: بوت واتساب الذكي
            - listitem [ref=e426]:
              - img [ref=e427]
              - text: حتى 20 مستخدم
            - listitem [ref=e430]:
              - img [ref=e431]
              - text: تقارير متقدمة
          - button "ابدأ الآن" [ref=e434]
        - generic [ref=e435]:
          - generic [ref=e436]:
            - heading "المؤسسات" [level=3] [ref=e437]
            - paragraph [ref=e438]: لشركات المحاماة والمكاتب الكبرى
            - generic [ref=e439]:
              - generic [ref=e440]: "1599"
              - generic [ref=e441]: ج.م/شهر
            - paragraph [ref=e442]: = 53 ج.م/يوم فقط
          - list [ref=e443]:
            - listitem [ref=e444]:
              - img [ref=e445]
              - text: قضايا غير محدودة
            - listitem [ref=e448]:
              - img [ref=e449]
              - text: كل ميزات المتقدمة
            - listitem [ref=e452]:
              - img [ref=e453]
              - text: بوابة الموكلين الخاصة
            - listitem [ref=e456]:
              - img [ref=e457]
              - text: الملكية الفكرية
            - listitem [ref=e460]:
              - img [ref=e461]
              - text: إدارة الامتثال
            - listitem [ref=e464]:
              - img [ref=e465]
              - text: مستخدمين غير محدود
            - listitem [ref=e468]:
              - img [ref=e469]
              - text: دعم فني ذو أولوية
            - listitem [ref=e472]:
              - img [ref=e473]
              - text: تقارير تنفيذية
          - button "ابدأ الآن" [ref=e476]
      - paragraph [ref=e477]: جميع الأسعار بالجنيه المصري وتشمل ضريبة القيمة المضافة. خصم 20% على الاشتراك السنوي.
    - generic [ref=e481]:
      - heading "مكتبك يستحق أكثر من Excel وواتساب" [level=2] [ref=e482]
      - paragraph [ref=e483]: جرّب مَلَف مجاناً لمدة أسبوع (7 أيام) واستمتع بإدارة ذكية ومتكاملة لمكتبك — بدون الحاجة لبطاقة ائتمان.
      - button "ابدأ الآن" [ref=e484]
    - contentinfo [ref=e485]:
      - generic [ref=e486]:
        - generic [ref=e487]:
          - generic [ref=e488]:
            - generic [ref=e489]:
              - img [ref=e491]
              - generic [ref=e495]: مَلَف
            - paragraph [ref=e496]: منصة SaaS متكاملة مصممة خصيصاً لرقمنة مكاتب المحاماة في مصر والوطن العربي، من خلال حلول ذكية وأتمتة شاملة.
          - generic [ref=e497]:
            - heading "روابط سريعة" [level=4] [ref=e498]
            - list [ref=e499]:
              - listitem [ref=e500]:
                - link "الرئيسية" [ref=e501]:
                  - /url: /
              - listitem [ref=e502]:
                - link "الميزات" [ref=e503]:
                  - /url: "#services"
              - listitem [ref=e504]:
                - link "الباقات والأسعار" [ref=e505]:
                  - /url: "#pricing"
              - listitem [ref=e506]:
                - link "من نحن" [ref=e507]:
                  - /url: "#about"
          - generic [ref=e508]:
            - heading "الخدمات" [level=4] [ref=e509]
            - list [ref=e510]:
              - listitem [ref=e511]:
                - link "بوابة الموكلين" [ref=e512]:
                  - /url: /client-portal
              - listitem [ref=e513]:
                - link "تطبيقات الهواتف" [ref=e514]:
                  - /url: "#"
              - listitem [ref=e515]:
                - link "مركز المساعدة" [ref=e516]:
                  - /url: "#"
              - listitem [ref=e517]:
                - link "API للمطورين" [ref=e518]:
                  - /url: "#"
          - generic [ref=e519]:
            - heading "تواصل معنا" [level=4] [ref=e520]
            - list [ref=e521]:
              - listitem [ref=e522]:
                - img [ref=e523]
                - generic [ref=e526]: المنصورة — توريل القديمة، شارع بوتاري، محافظة الدقهلية، جمهورية مصر العربية
              - listitem [ref=e527]:
                - img [ref=e528]
                - generic [ref=e530]: +20 114 197 3834
              - listitem [ref=e531]:
                - img [ref=e532]
                - generic [ref=e535]: info@aladala-law.eg
        - generic [ref=e536]:
          - generic [ref=e537]: © 2026 شركة ملف لتقنية المعلومات. جميع الحقوق محفوظة.
          - generic [ref=e538]:
            - link "الشروط والأحكام" [ref=e539]:
              - /url: /terms
            - link "سياسة الخصوصية" [ref=e540]:
              - /url: /privacy
    - link "تواصل معنا عبر واتساب" [ref=e541]:
      - /url: https://wa.me/201141973834
      - img [ref=e542]
```

# Test source

```ts
  1   | // tests/02-registration.spec.js
  2   | // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  3   | // الاختبار الثاني: تسجيل مكتب جديد وتسجيل الدخول
  4   | // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  5   | const { test, expect } = require('@playwright/test');
  6   | const {
  7   |   generateFakeOffice,
  8   |   waitForPageReady,
  9   |   attachConsoleMonitor,
  10  |   screenshotStep,
  11  | } = require('../helpers/test-helpers');
  12  | 
  13  | // حفظ بيانات الجلسة بين الاختبارات
  14  | let registeredOffice = null;
  15  | let sessionCookies = null;
  16  | 
  17  | test.describe('تسجيل مكتب جديد وتسجيل الدخول', () => {
  18  |   let consoleErrors = [];
  19  | 
  20  |   test.beforeEach(async ({ page }) => {
  21  |     consoleErrors = [];
  22  |     attachConsoleMonitor(page, consoleErrors);
  23  |   });
  24  | 
  25  |   // ─────────────────────────────────────────────
  26  |   test('نموذج تسجيل مكتب يحتوي على الحقول المطلوبة', async ({ page }) => {
  27  |     // الوصول لصفحة التسجيل
  28  |     await page.goto('https://malaf.pro');
  29  |     await waitForPageReady(page);
  30  | 
  31  |     // البحث عن رابط التسجيل
  32  |     const registerBtn = page.locator(
  33  |       'a[href*="register"], a[href*="signup"], a:has-text("تسجيل"), a:has-text("إنشاء حساب"), button:has-text("ابدأ الآن")'
  34  |     ).first();
  35  | 
  36  |     const hasRegBtn = await registerBtn.isVisible().catch(() => false);
  37  |     if (hasRegBtn) {
  38  |       await registerBtn.click();
  39  |       await waitForPageReady(page);
  40  |     } else {
  41  |       await page.goto('https://malaf.pro/register');
  42  |       await waitForPageReady(page);
  43  |     }
  44  | 
  45  |     await screenshotStep(page, '02-register-form');
  46  | 
  47  |     // تحقق من وجود حقول النموذج الأساسية
  48  |     const requiredSelectors = {
  49  |       'حقل البريد الإلكتروني': 'input[type="email"], input[name*="email"], input[placeholder*="بريد"]',
  50  |       'حقل كلمة المرور': 'input[type="password"]',
  51  |       'زر الإرسال': 'button[type="submit"], input[type="submit"], button:has-text("تسجيل"), button:has-text("إنشاء")',
  52  |     };
  53  | 
  54  |     const fieldReport = {};
  55  |     for (const [name, selector] of Object.entries(requiredSelectors)) {
  56  |       const el = page.locator(selector).first();
  57  |       const visible = await el.isVisible().catch(() => false);
  58  |       fieldReport[name] = visible;
  59  |       console.log(`  ${visible ? '✓' : '✗'} ${name}`);
  60  |     }
  61  | 
  62  |     // على الأقل البريد والكلمة السرية وزر الإرسال يجب أن يكونا موجودَين
> 63  |     expect(fieldReport['حقل البريد الإلكتروني'], 'حقل البريد غير موجود').toBe(true);
      |                                                                          ^ Error: حقل البريد غير موجود
  64  |     expect(fieldReport['حقل كلمة المرور'], 'حقل كلمة المرور غير موجود').toBe(true);
  65  |   });
  66  | 
  67  |   // ─────────────────────────────────────────────
  68  |   test('التحقق من النموذج - رسائل الخطأ عند البيانات الفارغة', async ({ page }) => {
  69  |     await page.goto('https://malaf.pro/register', { waitUntil: 'domcontentloaded' });
  70  |     await waitForPageReady(page);
  71  | 
  72  |     // إرسال النموذج فارغاً
  73  |     const submitBtn = page.locator(
  74  |       'button[type="submit"], input[type="submit"]'
  75  |     ).first();
  76  | 
  77  |     const hasSubmit = await submitBtn.isVisible().catch(() => false);
  78  |     if (!hasSubmit) {
  79  |       test.skip(true, 'لم يُعثر على زر الإرسال في صفحة التسجيل');
  80  |       return;
  81  |     }
  82  | 
  83  |     await submitBtn.click();
  84  |     await page.waitForTimeout(1000);
  85  |     await screenshotStep(page, '02-empty-form-validation');
  86  | 
  87  |     // تحقق من ظهور رسائل خطأ (HTML5 validation أو custom errors)
  88  |     const errorMessages = page.locator(
  89  |       '[class*="error"], [class*="invalid"], [class*="alert"], .text-red-500, .text-danger, [role="alert"]'
  90  |     );
  91  |     const errorCount = await errorMessages.count();
  92  |     console.log(`  ℹ️  عدد رسائل الخطأ الظاهرة: ${errorCount}`);
  93  | 
  94  |     // لا نفرض expect هنا - فقط نوثق الحالة
  95  |     test.info().annotations.push({
  96  |       type: 'validation-check',
  97  |       description: `رسائل خطأ عند الإرسال الفارغ: ${errorCount}`,
  98  |     });
  99  |   });
  100 | 
  101 |   // ─────────────────────────────────────────────
  102 |   test('تسجيل مكتب جديد ببيانات وهمية صحيحة', async ({ page }) => {
  103 |     const office = generateFakeOffice();
  104 |     registeredOffice = office;
  105 | 
  106 |     await page.goto('https://malaf.pro/register', { waitUntil: 'domcontentloaded' });
  107 |     await waitForPageReady(page);
  108 | 
  109 |     // ملء حقل الاسم
  110 |     const nameField = page.locator(
  111 |       'input[name*="name"], input[placeholder*="اسم"], input[placeholder*="المكتب"], input[id*="name"]'
  112 |     ).first();
  113 |     if (await nameField.isVisible().catch(() => false)) {
  114 |       await nameField.fill(office.name);
  115 |     }
  116 | 
  117 |     // ملء البريد الإلكتروني
  118 |     const emailField = page.locator('input[type="email"]').first();
  119 |     if (await emailField.isVisible().catch(() => false)) {
  120 |       await emailField.fill(office.email);
  121 |     }
  122 | 
  123 |     // ملء رقم الهاتف
  124 |     const phoneField = page.locator(
  125 |       'input[type="tel"], input[name*="phone"], input[placeholder*="هاتف"], input[placeholder*="جوال"]'
  126 |     ).first();
  127 |     if (await phoneField.isVisible().catch(() => false)) {
  128 |       await phoneField.fill(office.phone);
  129 |     }
  130 | 
  131 |     // ملء كلمة المرور
  132 |     const passwordFields = page.locator('input[type="password"]');
  133 |     const pwCount = await passwordFields.count();
  134 |     if (pwCount >= 1) await passwordFields.nth(0).fill(office.password);
  135 |     if (pwCount >= 2) await passwordFields.nth(1).fill(office.password); // confirm password
  136 | 
  137 |     await screenshotStep(page, '02-filled-register-form');
  138 | 
  139 |     // إرسال النموذج
  140 |     const submitBtn = page.locator(
  141 |       'button[type="submit"], input[type="submit"], button:has-text("تسجيل"), button:has-text("إنشاء")'
  142 |     ).first();
  143 | 
  144 |     if (await submitBtn.isVisible().catch(() => false)) {
  145 |       await submitBtn.click();
  146 | 
  147 |       // انتظار الاستجابة
  148 |       await page.waitForTimeout(3000);
  149 |       await waitForPageReady(page).catch(() => {});
  150 |       await screenshotStep(page, '02-after-register-submit');
  151 | 
  152 |       const currentUrl = page.url();
  153 |       const pageContent = await page.content();
  154 | 
  155 |       // تحقق من نجاح التسجيل أو وجود رسالة خطأ واضحة
  156 |       const successIndicators = [
  157 |         currentUrl.includes('dashboard'),
  158 |         currentUrl.includes('office'),
  159 |         currentUrl.includes('verify'),
  160 |         pageContent.includes('تم التسجيل'),
  161 |         pageContent.includes('مرحباً'),
  162 |         pageContent.includes('تحقق'),
  163 |         pageContent.includes('البريد'),
```