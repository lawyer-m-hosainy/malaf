# دليل النشر الآلي (CI/CD) لمنصة مَلَف

لقد تم إعداد **GitHub Actions** ليعمل كخط أنابيب (Pipeline) أوتوماتيكي لفحص وبناء الكود عند كل عملية `push` أو `pull request` على فرع `main`.

## 1. مسار الملف

يوجد الملف في مشروعك على المسار التالي: `.github/workflows/main.yml`

## 2. ما الذي يفعله الـ Pipeline؟

1. **تنزيل الاعتماديات (Dependencies):** يستخدم `npm ci` لضمان تثبيت النسخ الدقيقة المتطابقة مع `package-lock.json`.
2. **فحص الكود (Type Checking):** ينفذ `npm run lint` للتأكد من خلو الكود من أي أخطاء TypeScript.
3. **البناء (Build):** يقوم بعمل `npm run build` لتجهيز الحزمة النهائية للإنتاج (Production Bundle).
4. **الإشعارات (Notifications):** إذا نجحت العمليات السابقة (أو فشلت)، سيرسل النظام إشعاراً فورياً لغرفة فريقك على تطبيق Discord (عبر الـ Webhook).

## 3. متغيرات البيئة والأسرار (GitHub Secrets) المطلوبة

لكي ينجح البناء على سيرفرات GitHub، يجب إضافة المتغيرات التالية في:
`GitHub Repo -> Settings -> Secrets and variables -> Actions -> New repository secret`

- `VITE_SUPABASE_URL`: رابط مشروعك في Supabase.
- `VITE_SUPABASE_ANON_KEY`: المفتاح العام (Anon Key) لمشروع Supabase.
- `VITE_VAPID_PUBLIC_KEY`: المفتاح العام الخاص بإشعارات VAPID (الذي تم إنشاؤه مسبقاً).
- `DISCORD_WEBHOOK`: رابط الـ Webhook الخاص بقناة الـ Discord (لإرسال إشعارات نجاح أو فشل البناء). _(اختياري: إن لم تتم إضافته، ستفشل خطوة الإشعار فقط ولكن سيكتمل البناء)._

## 4. كيف يتم النشر التلقائي للخدمة؟ (Vercel / Render)

بما أنك تستخدم Vercel أو Render، **فإن منصات الاستضافة هذه تمتلك CI/CD مدمج خاص بها.**
لذلك، أفضل استراتيجية لك هي:

1. قم بربط مستودعك (GitHub Repository) بحساب Vercel أو Render.
2. عند إجراء `git push` لفرع `main`، سيقوم GitHub Actions بالتأكد من خلو الكود من الأخطاء كـ (حائط صد أولي).
3. في نفس الوقت، ستقوم Vercel بالتقاط هذا الـ Push، وبناء التطبيق مجدداً ونشره تلقائياً (Auto Deployment).

_ملاحظة احترافية:_ يمكنك تعطيل النشر التلقائي في Vercel، وربطه بدلاً من ذلك بـ GitHub Actions باستخدام أداة `vercel-cli` بحيث لا ينشر إلا إذا نجح الفحص في GitHub Actions بنسبة 100% لتجنب رفع كود معطوب.
