# منصة "ملف" - الوصف التفصيلي الكامل (لـ AI External Evaluator)

## 1. نظرة عامة

**منصة "ملف" (Malaf Egypt)** هي نظام SaaS شامل متخصص في إدارة المكاتب القانونية في مصر، مصمم باللغة العربية RTL كأساس. تجمع المنصة بين إدارة القضايا، الموكلين، الجلسات، الفواتير الإلكترونية (ETA)، الذكاء الاصطناعي، والامتثال للقوانين المصرية.

---

## 2. الجوانب الفنية للبناء (Technical Stack)

### 2.1 الواجهة الأمامية (Frontend)

| المكون | التفاصيل |
|--------|----------|
| **إطار العمل الرئيسي** | React 19.0.0 مع TypeScript 5.8.2 |
| **محرك البناء** | Vite 6.2.0 مع HMR (Hot Module Replacement) |
| **إدارة الحالة** | Zustand 5.0.12 مع persist middleware + React Query 5.100.14 |
| **مكتبة التصميم** | Tailwind CSS 4.1.14 + shadcn/ui 4.2.0 + Radix UI primitives |
| **التنقل** | React Router DOM 7.14.0 |
| **الرسوم البيانية** | Recharts 3.8.1 |
| **النماذج** | React Hook Form 7.77.0 مع Zod 4.4.3 للتحقق |
| **الإشعارات** | Sonner 2.0.7 |
| **الرموز** | Lucide React 0.546.0 |
| **الرسوم المتحركة** | Framer Motion 12.40.0 |
| **الخطوط** | Cairo Font (عربي) من Google Fonts |
| **الوضع الليل** | Next Themes 0.4.6 |
| **دعم PWA** | Vite Plugin PWA 1.3.0 |

**تكوين Vite** (vite.config.ts):
- `manualChunks` تقسيم الحزم: `react-core`, `router`, `supabase`, `state`, `charts`, `animations`, `ui-components`
- Minification: `esbuild`
- Target: `ES2020`
- Chunk size limit warning: 1000KB
- Alias `@/` يشير إلى `./src`

### 2.2 الواجهة الخلفية (Backend)

| المكون | التفاصيل |
|--------|----------|
| **إطار العمل** | Node.js 20+ مع Express.js 4.22.1 (ES Modules) |
| **لغة البرمجة** | JavaScript (Node) + TypeScript للواجهة الأمامية |
| **الأمان** | Helmet 8.1.0 (Security Headers) + CORS 2.8.6 + Express Rate Limit 8.3.2 |
| **التسجيل** | Pino 10.3.1 + pino-http 11.0.0 (Structured Logging) |
| **الضغط** | Compression 1.8.1 |
| **المصادقة** | JWT من Supabase + auth middleware مخصص |
| **واجهة 404** | Error handler مخصص |

### 2.3 قاعدة البيانات (Database)

| المكون | التفاصيل |
|--------|----------|
| **نظام إدارة القواعد** | PostgreSQL عبر Supabase |
| **الامتداد المستخدمة** | `uuid-ossp`, `pg_trgm` (للبحث النصي), `unaccent` (للبحث العربي) |
| **الأمان على مستوى الصفوف** | Row Level Security (RLS) على جميع الجداول - عزل كامل للبيانات بين المكاتب |
| **النسخ الاحتياطي** | إدارة تلقائية من قبل Supabase |

**الجداول الرئيسية:**
1. `organizations` - المكاتب/المنظمات
2. `profiles` - الملفات الشخصية للمستخدمين (مرتبطة بـ auth.users)
3. `clients` - العملاء (الموكلين)
4. `poa` - وكلاء النيابة (Power of Attorney)
5. `cases` - القضايا
6. `sessions` - الجلسات
7. `deadlines` - المواعيد النهائية
8. `documents` - المستندات
9. `invoices` - الفواتير
10. `expenses` - المصروفات
11. `trust_accounts` - حسابات الأمانة (Trust Accounts)
12. `audit_logs` - سجل المراجعة (Audit Logs)
13. `notification_logs` - سجل الإشعارات
14. `tasks` - المهام
15. `teams` - الفريق
16. `team_members` - أعضاء الفريق
17. `audit_logs` - سجل التدقيق (Append-only - لا يمكن تعديله أو حذفه)

### 2.4 خدمات السحابة والاستضافة

| الخدمة | الهدف |
|--------|-------|
| **Supabase** | PostgreSQL Database, Auth, Edge Functions, Storage, Realtime |
| **Render.com** | استضافة الواجهة الأمامية والخلفية |
| **Sentry** | مراقبة الأخطاء (Error Monitoring) |
| **Resend** | إرسال رسائل البريد الإلكتروني (Transactional Emails) |
| **Daily.co** | مكالمات الفيديو (Video Calls) |
| **Google Gemini API** | الذكاء الاصطناعي (Model: gemini-1.5-pro) |
| **Paymob** (إنتل) | بوابة الدفع المحلية |

---

## 3. الهيكل الهيكلي للمنصة (Architecture)

### 3.1 أقسام المنصة الرئيسية

#### 3.1.1 القسم العام (الزائر)
- **Landing Page** - الصفحة الرئيسية التعريفية
- **Login Page** - تسجيل الدخول (Google OAuth + Email/Password)
- **Terms of Service** - شروط الخدمة
- **Privacy Policy** - سياسة الخصوصية
- **Client Portal** - بوابة الموكلين (وصول محدود)

#### 3.1.2 القسم الداخلي (المستخدم المسجل)
- **Dashboard** - لوحة التحكم الرئيسية
- **Clients Management** - إدارة الموكلين
- **POA Management** - إدارة وكلاء النيابة
- **Cases Management** - إدارة القضايا
- **Sessions Roll** - سجل الجلسات
- **Calendar** - التقويم
- **Finance** - المالية
- **Financial Dashboard** - لوحة التحكم المالية
- **Trust Accounts** - حسابات الأمانة
- **Expenses** - المصروفات
- **Team Management** - إدارة الفريق
- **Tasks Management** - إدارة المهام
- **Analytics** - التحليلات
- **Documents Management** - إدارة المستندات
- **Contracts Management (CLM)** - إدارة العقود
- **Legal Library** - المكتبة القانونية
- **Law Library** - مكتبة القوانين
- **Internal Wiki** - الويكي الداخلي
- **Import Data** - استيراد البيانات
- **Settings** - الإعدادات
- **Billing** - الفواتير والاشتراكات
- **Audit Logs** - سجل التدقيق

#### 3.1.3 الوحدات المتخصصة المصرية
- **Bar Association** - نقابة المحامين
- **Economic Court** - المحاكم الاقتصادية
- **State Council** - مجلس الدولة
- **Real Estate Registry** - السجل العقاري
- **Family Courts** - محاكم الأسرة
- **Criminal Cases** - القضايا الجنائية
- **ETA Invoicing** - الفواتير الإلكترونية (متوافق مع مصلحة الضرائب المصرية)
- **ELitigation** - التقاضي الإلكتروني
- **Expert Missions** - مهام الخبراء

#### 3.1.4 الذكاء الاصطناعي
- **AI Document Analyzer** - محلل المستندات بالذكاء الاصطناعي
- **Conflict Check** - فحص التعارض
- **Chat Assistant** - مساعد دردشة AI
- **Document Drafting** - صياغة مستندات قانونية

#### 3.1.5 إدارة أخرى
- **Global Admin** - إدارة المنصة (Super Admin)
- **System Admin** - إدارة النظام
- **Onboarding Flow** - رحلة التسجيل الابتدائية

### 3.2 هيكل الصفحات والتنقل

**مخطط التنقل الرئيسي:**

```
/ → Landing Page
/terms → Terms of Service
/privacy → Privacy Policy
/login → Login Page
/onboarding → Onboarding Flow (Protected)
/dashboard → Main Dashboard (Protected)
/dashboard/clients → Clients Management (requires: view_clients)
/dashboard/poa → POA Management (requires: view_clients)
/dashboard/cases → Cases Management (requires: view_cases)
/dashboard/roll → Sessions Roll (requires: view_cases)
/dashboard/calendar → Calendar (requires: view_calendar)
/dashboard/finance-dashboard → Financial Dashboard (requires: finance_basic)
/dashboard/finance → Finance (requires: finance_basic)
/dashboard/expenses → Expenses (requires: finance_basic)
/dashboard/trust → Trust Accounts (requires: finance_basic)
/dashboard/team → Team Management (requires: org_admin)
/dashboard/tasks → Tasks Management (requires: view_tasks)
/dashboard/analytics → Analytics (requires: view_reports)
/dashboard/library → Legal Library (requires: view_cases)
/dashboard/law-library → Law Library (requires: view_cases)
/dashboard/contracts → Contracts/CLM (requires: documents)
/dashboard/documents → Documents Management (requires: documents)
/dashboard/ip-management → IP Management (requires: view_cases)
/dashboard/time-tracking → Time Tracking (requires: view_tasks)
/dashboard/client-portal → Client Portal Management (requires: org_admin)
/dashboard/conflict-check → Conflict Check (requires: conflict_check)
/dashboard/enforcement → Enforcement (requires: view_cases)
/dashboard/collections → Collections (requires: finance_basic)
/dashboard/payment-plans → Payment Plans (requires: finance_basic)
/dashboard/clm → CLM (requires: documents)
/dashboard/ip-operations → IP Operations (requires: view_cases)
/dashboard/specialized-tracks → Specialized Tracks (requires: view_cases)
/dashboard/audit-logs → Audit Logs (requires: org_admin)
/dashboard/ai-analyzer → AI Document Analyzer (requires: documents)
/dashboard/wiki → Internal Wiki (requires: view_wiki)
/dashboard/field-checkins → Field Check-ins (requires: org_admin)
/dashboard/platform-admin → Global Admin (requires: platform_admin)
/dashboard/bar-association → Bar Association (requires: view_cases)
/dashboard/economic-court → Economic Court (requires: view_cases)
/dashboard/state-council → State Council (requires: view_cases)
/dashboard/experts → Expert Missions (requires: view_cases)
/dashboard/real-estate-registry → Real Estate Registry (requires: view_cases)
/dashboard/family-courts → Family Courts (requires: view_cases)
/dashboard/criminal-cases → Criminal Cases (requires: view_cases)
/dashboard/invoices/eta → ETA Invoicing (requires: finance_basic)
/dashboard/e-litigation → ELitigation (requires: view_cases)
/dashboard/import → Import Data (requires: org_admin)
/dashboard/settings → Settings (requires: org_admin)
/dashboard/billing → Billing (requires: org_admin)
/system-admin → System Admin (Protected)
/global-admin → Global Admin (Special)
/* → Not Found Page
```

**تنقل الشريط الجانبي (Sidebar Navigation):**
1. لوحة التحكم
2. الموكلين
3. القضايا
4. الجلسات
5. التقويم
6. المالية
7. الفريق
8. المهام
9. التحليلات
10. المستندات
11. المكتبة القانونية
12. الويكي الداخلي
13. الإعدادات
14. الفواتير والاشتراكات

**التنقل في الشريط العلوي (Topbar):**
- شعار المنصة
- بحث سريع
- الإشعارات
- الملف الشخصي وتسجيل الخروج

---

## 4. أنواع حسابات المستخدمين والصلاحيات (Roles & Permissions)

### 4.1 أنواع الأدوار (User Roles)

| الدور (عربي) | الدور (إنجليزي) | وصف | صلاحيات |
|-------------|----------------|-----|---------|
| **مؤسس** | Founder/Super Admin | صاحب المكتب أو المؤسس | `*` - صلاحيات كاملة على كل شيء |
| **مدير مكتب** | Office Manager | مدير المكتب القانوني | `*` - صلاحيات كاملة |
| **محامي شريك** | Partner Lawyer | محامي شريك في المكتب | `*` - صلاحيات كاملة |
| **محامي** | Lawyer | محامي ممارس | `view_cases`, `edit_cases`, `view_clients`, `edit_clients`, `legal_qa`, `conflict_check`, `org_admin`, `view_reports`, `documents`, `view_calendar`, `view_tasks`, `finance_basic`, `view_wiki` |
| **محامي مستشار** | Consulting Lawyer | محامي مستشار | `view_cases`, `view_clients`, `legal_qa`, `conflict_check`, `view_reports`, `documents`, `view_calendar`, `view_wiki` |
| **سكرتير** | Secretary/Assistant | مساعد أو سكرتير | `view_clients`, `edit_clients`, `view_cases`, `documents`, `finance_basic`, `view_calendar`, `view_tasks` |
| **محامي متدرب** | Trainee Lawyer | محامي متدرب | `view_cases`, `training_portal`, `view_wiki`, `documents`, `view_calendar` |

### 4.2 نظام الصلاحيات (Permission System)

**دالة `hasPermission` (من useAuthStore):**
- تستقبل `permission: string`
- تحقق من دور المستخدم الحالي
- ترجع `true/false`

**الصلاحيات المتاحة:**
- `view_cases` - عرض القضايا
- `edit_cases` - تعديل القضايا
- `view_clients` - عرض الموكلين
- `edit_clients` - تعديل الموكلين
- `legal_qa` - أسئلة قانونية
- `conflict_check` - فحص التعارض
- `org_admin` - إدارة المكتب
- `view_reports` - عرض التقارير
- `documents` - المستندات
- `view_calendar` - عرض التقويم
- `view_tasks` - عرض المهام
- `finance_basic` - مالية أساسية
- `view_wiki` - عرض الويكي
- `platform_admin` - إدارة المنصة (Global Admin)
- `*` - جميع الصلاحيات (Super Admin)

**مكون `PermissionGate`:**
- `children` - المحتوى المراد عرضه
- `permission` - الصلاحية المطلوبة
- `fallback` - العنصر البديل (افتراضي: Navigate to /dashboard)

---

## 5. الوظائف والمميزات (Features)

### 5.1 إدارة المستخدمين والمصادقة

**المصادقة (Auth):**
- تسجيل الدخول عبر Google OAuth
- تسجيل الدخول عبر Email/Password
- إعادة تعيين كلمة المرور (Forgot Password)
- تسجيل حساب جديد (Sign Up)
- الـ Session تُحفظ محلياً مع تجديد تلقائي
- Middleware للتحقق من الـ JWT Token

**إدارة المستخدمين:**
- إضافة أعضاء الفريق (Team Members)
- تعيين الأدوار (Roles)
- إعداد الحسابات
- حالة المستخدم (Active/Inactive)
- آخر تسجيل دخول (Last Login)

### 5.2 إدارة الموكلين (Clients Management)

**المميزات:**
- إضافة موكل جديد (Individual / Company)
- بيانات الموكل:
  - الاسم
  - الرقم القومي (National ID)
  - رقم التسجيل التجاري (للشركات)
  - رقم الضريبة (Tax ID)
  - العنوان
  - الهاتف
  - البريد الإلكتروني
  - الجنسية
  - تاريخ الميلاد
  - ملاحظات
  - وسوم (Tags)
- إدارة وكلاء النيابة (POA - Power of Attorney)
  - رقم الوكالة
  - تاريخ الإصدار
  - تاريخ الانتهاء
  - نوع الوكالة (عامة/خاصة/قضائية)
  - وصف
  - مستند الوكالة
- البوابة الإلكترونية للموكلين (Client Portal)
  - وصول محدود للموكلين لعرض قضاياهم
  - متابعة حالة القضايا
  - عرض الجلسات القادمة

### 5.3 إدارة القضايا (Cases Management)

**أنواع القضايا:**
- مدني (Civil)
- جنائي (Criminal)
- أسرة (Family)
- تجاري (Commercial)
- عمالي (Labor)
- إداري (Administrative)
- دستوري (Constitutional)
- عقاري (Real Estate)
- ملكية فكرية (Intellectual Property)
- تنفيذي (Enforcement)

**بيانات القضية:**
- رقم القضية
- عنوان القضية
- نوع القضية
- الحالة (Open/Closed/Pending/On Hold/Appealed/Settled)
- المحكمة
- الدائرة
- القاضي
- الخصم
- محامي الخصم
- الوصف
- الأولوية (Low/Medium/High/Urgent)
- تاريخ البداية
- تاريخ الانتهاء
- القيمة المتوقعة
- ترتيب الرسوم (Fixed/Hourly/Contingency)
- الرسوم المتفق عليها
- ملاحظات
- منشئ القضية
- تاريخ الإنشاء والتحديث

**الجلسات (Sessions):**
- إضافة جلسة جديدة
- تحديد تاريخ ووقت الجلسة
- نوع الجلسة
- المحكمة
- القضية المرتبطة
- ملاحظات الجلسة

**المواعيد النهائية (Deadlines):**
- إضافة موعد نهائي
- نوع الموعد
- تاريخ الموعد
- القضية المرتبطة
- حالة الموعد (Pending/Completed/Overdue)
- تنبيهات تلقائية (7 أيام قبل الموعد)

### 5.4 المالية والفواتير (Finance & Invoicing)

**المميزات:**
- إدارة الفواتير
- إصدار فواتير قانونية
- تكامل كامل مع **مصلحة الضرائب المصرية (ETA)**
  - إرسال الفواتير إلكترونياً
  - تلقي إشعارات من الضريبة
  - متابعة حالة الفواتير
  - إصدار فواتير معتمدة
- حسابات الأمانة (Trust Accounts)
  - فصل أموال الموكلين عن أموال المكتب
  - متابعة الحسابات
- خطط الدفع (Payment Plans)
  - جدولة الأقساط
  - تحصيل الرسوم عبر بوابات الدفع
- بوابات الدفع:
  - Paymob (بوابة دفع محلية مصرية)
  - Instapay
- تقارير مالية (Financial Reports)
- لوحة تحكم مالية (Financial Dashboard)
  - رسوم بيانية
  - تحليلات النفقات
  - إحصائيات مالية

### 5.5 الذكاء الاصطناعي (AI Features)

**المميزات:**
1. **محلل المستندات (AI Document Analyzer)**
   - رفع مستند قانوني
   - تحليل المستند عبر Google Gemini 1.5-pro
   - استخراج الأطراف (Parties)
   - استخراج التواريخ (Dates)
   - استخراج المبالغ (Amounts)
   - ملخص المستند (Summary)
   - تحذير من الأخطاء أو المزالق القانونية
   - تقييم جودة المستند

2. **فحص التعارض (Conflict Check)**
   - فحص تعارض المصالح قبل قبول القضية
   - بحث عن اسم الموكل في قاعدة بيانات القضايا السابقة
   - إشعار في حال وجود تعارض
   - عرض القضايا المتعارضة

3. **مُصاغ المستندات (Document Drafting)**
   - صياغة مستندات قانونية جاهزة
   - قوالب قانونية مصريّة
   - ملء البيانات تلقائياً من القضية والموكل
   - أنواع المستندات:
     - لائحة دعوة
     - لائحة استئناف
     - مذكرة دفاع
     - مذكرة دفع
     - عقد
     - وغيرها...
   - تصدير إلى PDF
   - طباعة

4. **مساعد الدردشة (Chat Assistant)**
   - دردشة مع AI قانوني
   - إجابة أسئلة قانونية
   - مساعدة في البحث القانوني
   - ملاحظات: محمي من Prompt Injection (اختبار أمان موجود)

### 5.6 التسعير والاشتراكات (Pricing & Subscriptions)

**خطط التسعير:**
1. **Free (مجانية)**
   - حد أدنى من الميزات
   - عدد محدود من القضايا والموكلين
2. **Basic (أساسية)**
   - الميزات الأساسية
   - عدد غير محدود من القضايا والموكلين
   - ETA (الفواتير الإلكترونية)
   - بوابة موكلين أساسية
3. **Pro (احترافية)**
   - جميع الميزات
   - الذكاء الاصطناعي (AI)
   - حسابات الأمانة
   - تقارير أداء متقدمة
4. **Enterprise (مؤسسية)**
   - ميزات مخصصة
   - تكامل مع أنظمة الشركة
   - دعم مخصص
   - تدريب فريق

**تتبع الاستخدام:**
- عدد المستندات المصاغة بالAI
- عدد القضايا
- عدد الموكلين
- تحذير عند الوصول للحد

### 5.7 التقارير والتحليلات (Reports & Analytics)

**المميزات:**
- لوحة تحكم شاملة
- إحصائيات القضايا
  - حسب النوع
  - حسب الحالة
  - حسب الأولوية
- إحصائيات الجلسات
  - الجلسات القادمة
  - الجلسات المنتهية
- إحصائيات مالية
  - الدخل الشهري
  - المصروفات
  - الأرباح
- تقارير أداء الفريق
  - إنتاجية كل محامي
  - عدد القضايا
  - النسبة المئوية للفوز
- رسوم بيانية تفاعلية (Recharts)
  - مخططات شريطية (Bar Charts)
  - مخططات دائرية (Pie Charts)
  - مخططات خطية (Line Charts)

### 5.8 المكتبة القانونية (Legal Library)

**المميزات:**
- قوالب قانونية جاهزة (Templates)
- أبحاث قانونية
- سوابق قضائية (Precedents)
- إجراءات قانونية (Procedures)
- تصنيف حسب الموضوع
- وسوم للبحث السريع
- إضافة محتوى جديد
- تحديث وإصدارات (Versions)

### 5.9 التقويم والجلسات (Calendar & Sessions)

**المميزات:**
- عرض التقويم الشهري/الأسبوعي/اليومي
- عرض الجلسات في التقويم
- إضافة جلسة جديدة
- تعديل الجلسات
- حذف الجلسات
- تذكير بالجلسات (48 ساعة قبل)
- تنبيهات البريد الإلكتروني للجلسات
- مكالمات فيديو (Video Calls) عبر Daily.co

### 5.10 إدارة المهام (Tasks Management)

**المميزات:**
- إضافة مهمة جديدة
- تعيين مهمة لمستخدم
- تاريخ الاستحقاق (Due Date)
- الأولوية (High/Medium/Low)
- الحالة (Pending/Completed)
- تصنيف المهام
- تعليقات على المهام
- تتبع تقدم المهام

### 5.11 الوحدات المتخصصة المصرية

1. **نقابة المحامين (Bar Association)**
   - معلومات نقابة المحامين
   - متابعة الاشتراكات
   - متابعة الضرائب النقابية

2. **المحاكم الاقتصادية (Economic Court)**
   - متابعة القضايا الاقتصادية
   - إجراءات خاصة

3. **مجلس الدولة (State Council)**
   - متابعة الدعاوى الإدارية
   - إجراءات مجلس الدولة

4. **السجل العقاري (Real Estate Registry)**
   - متابعة معاملات العقارات
   - إجراءات التسجيل

5. **محاكم الأسرة (Family Courts)**
   - متابعة قضايا الأسرة
   - نفقات
   - حضانة
   - نفقات أولاد

6. **القضايا الجنائية (Criminal Cases)**
   - متابعة القضايا الجنائية
   - إجراءات خاصة

7. **التنفيذي (Enforcement)**
   - إدارة القضايا التنفيذية
   - متابعة الإجراءات التنفيذية

8. **الملكية الفكرية (IP Management/Operations)**
   - إدارة العلامات التجارية
   - براءات الاختراع
   - حقوق الطبع والنشر

9. **إدارة العقود (CLM - Contract Lifecycle Management)**
   - إضافة عقد
   - تصنيف العقود
   - متابعة العقود
   - تذكير بانتهاء العقود

### 5.12 إعدادات المكتب (Office Settings)

**المميزات:**
- معلومات المكتب
  - اسم المكتب
  - رقم الضريبة (VAT Number)
  - العنوان
  - الهاتف
  - البريد الإلكتروني
  - الشعار
- إعدادات الفواتير
- إعدادات الإشعارات
- إعدادات البوابة الإلكترونية للموكلين
- إعدادات المظهر (الوضع الليل/نهار)

---

## 6. عمليات المعالجة الداخلية (Internal Workflows)

### 6.1 إدارة الحالة (State Management)

**Zustand Stores:**
1. `useAuthStore` - مصادقة المستخدم والصلاحيات
2. `useCasesStore` - إدارة القضايا والجلسات والمواعيد النهائية
3. `useClientsStore` - إدارة الموكلين
4. `useTeamStore` - إدارة الفريق والمهام
5. `useAnalyticsStore` - التحليلات
6. `useInvoicesStore` - الفواتير
7. `useFinanceStore` - المالية
8. `useEnforcementStore` - التنفيذي
9. `useDeadlinesStore` - المواعيد النهائية
10. `useCriminalStore` - القضايا الجنائية
11. `useComplianceStore` - الامتثال
12. `useCLMStore` - إدارة العقود
13. `useIPStore` - الملكية الفكرية
14. `useNotificationsStore` - الإشعارات
15. `useUIStore` - إعدادات واجهة المستخدم
16. `useAppStore` - الحالة العامة للتطبيق
17. `useAdvisoryStore` - الاستشارات
18. `useUsageStore` - تتبع الاستخدام (Limits)
19. `chatStore` - دردشة AI

**Persist Middleware:**
- تخزين الحالة في LocalStorage
- لـ Auth, UI State, Usage, etc.

### 6.2 جلب البيانات (Data Fetching)

**React Query:**
- `useQuery` لجلب البيانات
- `useMutation` لإضافة وتعديل وحذف
- Caching تلقائي للبيانات
- Background Refetching
- Stale While Revalidate
- Error Handling تلقائي

**Supabase Client:**
- `createClient` مع `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`
- Auto Refresh Token
- Persist Session
- Detect Session In URL

### 6.3 التشفير (Encryption)

**تشفير البيانات:**
- تشفير الحقول الحساسة عبر Edge Functions
- لا يتم تخزين مفاتيح التشفير في الواجهة الأمامية
- فك التشفير عند الحاجة فقط
- Cache للفك التشفير مع TTL (2 دقائق)
- مسح الكاش تلقائياً

**البيانات المشفرة:**
- أسماء الموكلين الحساسة
- مبالغ القضايا
- معلومات مالية حساسة

### 6.4 سجل التدقيق (Audit Logs)

**سجل فقط إضافة (Append-Only):**
- لا يمكن تعديل أو حذف السجلات
- تسجيل كل عملية (إضافة/تعديل/حذف)
- بيانات المسجلة:
  - User ID
  - Username
  - Action Type
  - Module Name
  - Details
  - Timestamp
  - IP Address
  - Device Fingerprint
- عرض السجلات لـ Admin فقط

### 6.5 الإشعارات (Notifications)

**أنواع الإشعارات:**
1. **إشعارات التطبيق (In-App Notifications)**
   - أيقونة الإشعارات في الشريط العلوي
   - العدد غير المقروءة
   - قائمة الإشعارات
2. **إشعارات البريد الإلكتروني (Email Notifications)**
   - تذكير بالجلسات (48 ساعة قبل)
   - إشعارات المواعيد النهائية (7 أيام قبل)
   - إشعارات القضايا
   - إشعارات المالية
3. **إشعارات الدفع (Push Notifications)**
   - إذا تم تفعيل الـ PWA

**موضوعات الإشعارات:**
- جلسات قادمة
- مواعيد نهائية تقترب
- حالة القضية تغيرت
- فواتير جديدة
- مهمة جديدة
- تذكير بالاشتراك

### 6.6 إرسال البريد الإلكتروني (Email Sending)

**مكتبة:** Resend
**قوالب البريد:**
- تأكيد التسجيل
- إعادة تعيين كلمة المرور
- تذكير بالجلسة
- إشعار بالموعد النهائي
- إشعار بالفاتورة
- إشعار بالاشتراك
- إشعارات النظام

**تخصيص:**
- اسم المكتب في الرسالة
- شعار المكتب (لو موجود)
- توقيع المحامي

### 6.7 العمليات الدفع (Payment Processing)

**بوابة الدفع:** Paymob (المصرية)
**العملية:**
1. المستخدم يختار خطة
2. إنشاء session دفع
3. إعادة توجيه إلى Paymob
4. إتمام الدفع
5. Webhook من Paymob إلى الخادم
6. تحديث حالة الاشتراك
7. إرسال إيصال بالبريد

**الاشتراكات:**
- شهري (Monthly)
- سنوي (Yearly) - خصم
- تذكير بانتهاء الاشتراك (3 أيام قبل)
- تجديد تلقائي (إذا اختر المستخدم)
- إلغاء الاشتراك في أي وقت

### 6.8 إدارة الملفات (File Management)

**التخزين:** Supabase Storage
**أنواع الملفات:**
- PDF
- DOCX
- Images (JPG, PNG)
- Excel (XLSX)
- وغيرها

**المميزات:**
- رفع ملفات
- تحميل ملفات
- عرض ملفات PDF
- تصنيف الملفات
- وسم (Tags)
- بحث في الملفات
- وصف لكل ملف

**الأمان:**
- رابط موقت (Signed URLs)
- صلاحيات الوصول RLS
- لا يمكن الوصول لملفات مكتب آخر

### 6.9 Cron Jobs / المهام المجدولة

**المهام المجدولة:**
- إرسال تذكيرات الجلسات
- إرسال تذكيرات المواعيد النهائية
- تذكير بانتهاء الاشتراك
- تجديد الاشتراكات
- إرسال تقارير دورية

**التنفيذ:**
- عبر Supabase Edge Functions
- أو عبر server.js (local cron)

---

## 7. تكاملات الطرف الثالث (Third-Party Integrations)

### 7.1 Supabase

**الخدمات المستخدمة:**
1. **PostgreSQL Database** - تخزين البيانات
2. **Auth (Authentication)** - مصادقة المستخدمين
   - Google OAuth
   - Email/Password
3. **Storage** - تخزين الملفات
4. **Edge Functions** - وظائف حاسوبية سحابية
5. **Realtime** - إشعارات فورية
6. **Row Level Security (RLS)** - أمان على مستوى الصفوف

### 7.2 Google Gemini API

**الغرض:** الذكاء الاصطناعي
**الموديل:** `gemini-1.5-pro`
**الوظائف:**
1. تحليل المستندات القانونية (Document Analysis)
2. فحص التعارض (Conflict Check)
3. صياغة المستندات (Document Drafting)
4. مساعد الدردشة (Chat Assistant)

**الحدود:**
- Rate limiting: 10 طلبات في الدقيقة لكل مستخدم
- Limit على عدد المستندات المصاغة حسب الخطة
- Prompt Sanitization لحماية من الـ Prompt Injection

### 7.3 Daily.co

**الغرض:** مكالمات الفيديو (Video Calls)
**المميزات:**
- إنشاء غرفة محادثة
- دعوة أعضاء الفريق
- دعوة الموكلين
- تسجيل المكالمة
- تسجيل الدخول بالبريد

### 7.4 Resend

**الغرض:** إرسال رسائل البريد الإلكتروني
**الرسميات:**
- تأكيد الحساب
- إعادة تعيين كلمة المرور
- تذكيرات الجلسات
- إشعارات المواعيد
- فواتير
- إيصالات دفع
- إشعارات الاشتراك

### 7.5 Paymob (إنتل)

**الغرض:** بوابة الدفع المحلية المصرية
**العملات:** جنيه مصري (EGP)
**طريقة الدفع:**
- بطاقات الائتمان (Credit/Debit Cards)
- محافظ إلكترونية (Mobile Wallets)
- تحويلات بنكية
- فواتير

### 7.6 Sentry

**الغرض:** مراقبة الأخطاء (Error Monitoring)
**المميزات:**
- تسجيل الأخطاء (Error Logging)
- تتبع الأداء (Performance Tracing)
- تحليلات الأخطاء
- تنبيهات عند الأخطاء الحرجة

### 7.7 Google Fonts

**الغرض:** الخطوط العربية
**الخط:** Cairo Font
**أنواع:** Cairo Arabic, Cairo Latin
**التنسيق:** WOFF2 (ضغوط عالي)

---

## 8. الأمان والامتثال (Security & Compliance)

### 8.1 الأمان على مستوى الواجهة الأمامية

1. **Sanitization للمحتوى:**
   - DOMPurify لتنظيف HTML
   - منع XSS (Cross-Site Scripting)
   - Zod لتحقق البيانات

2. **الإشعارات الأمنية:**
   - Content Security Policy (CSP) ضيق
   - لا يسمح بالـ unsafe-inline في الإنتاج
   - لا يسمح بالـ unsafe-eval في الإنتاج
   - تقييد مصادر الـ scripts/styles/images/fonts

3. **Headers أمان إضافية:**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: تقييد Camera, Microphone, Geolocation, Payment, USB

4. **HTTPS:**
   - إجبار HTTPS في الإنتاج
   - HSTS (HTTP Strict Transport Security) مفعل
   - مدة: 31536000 ثانية (سنة)
   - تشمل الـ Subdomains

### 8.2 الأمان على مستوى الواجهة الخلفية

1. **Rate Limiting:**
   - 100 طلب في الدقيقة لكل IP
   - يُستثنى من ذلك health check endpoint

2. **CORS Policy:**
   - السماح فقط لأ Origins محددة
   - الإنتاج: `https://malaf.pro`, `https://malaf-platform.onrender.com`
   - التطوير: `http://localhost:3000`, `http://localhost:3005`, `http://localhost:5173`
   - السماح بـ Credentials

3. **Auth Middleware:**
   - فحص الـ JWT Token من Supabase
   - تحقق صحة التوقيع
   - تحقق تاريخ الانتهاء
   - إضافة معلومات المستخدم إلى req.user
   - منع الوصول لغير المصادقين

4. **Audit Logging:**
   - تسجيل كل عملية كتابة (POST/PUT/DELETE/PATCH)
   - تفاصيل: IP Address, User Agent, Timestamp, Request ID, User ID, Tenant ID, Content Length

5. **Error Handling:**
   - أخطاء مخصصة (AuthError)
   - لا يتم إرسال تفاصيل الخطأ للمستخدم في الإنتاج
   - تسجيل جميع الأخطاء في السجلات (Logs)

### 8.3 الأمان على مستوى قاعدة البيانات

1. **Row Level Security (RLS):**
   - مفعل على جميع الجداول
   - كل جدول لديه سياسات صارمة
   - لا يمكن لأي مستخدم الوصول لبيانات مكتب آخر
   - سياسات SELECT/INSERT/UPDATE/DELETE محددة

2. **Audit Logs:**
   - جدول `audit_logs` فقط Append-Only
   - لا يمكن تعديل أو حذف أي سجل
   - سياسات RLS تمنع الكتابة إلا من قبل النظام

3. **النسخ الاحتياطي (Backups):**
   - تلقائي من قبل Supabase
   - نسخ احتياطية يومية
   - نقاط استعادة (Point-in-Time Recovery)

### 8.4 الامتثال للقوانين (Compliance)

1. **قانون حماية البيانات الشخصية المصرية (قانون 151 لسنة 2020):**
   - سياسة خصوصية واضحة
   - موافقة صريحة من المستخدم
   - حق الحذف (Right to Erasure)
   - حق التصحيح (Right to Rectification)
   - سجل معالجة البيانات (Data Processing Register) موجود
   - تشفير البيانات الحساسة

2. **الامتثال الضريبي (ETA):**
   - تكامل كامل مع مصلحة الضرائب المصرية
   - إصدار فواتير معتمدة قانونياً
   - تسجيل الفواتير تلقائياً في الضريبة
   - رقم الضريبة (Tax ID) لكل مكتب

3. **الامتثال لنقابة المحامين:**
   - حفظ سرية المعلومات
   - فصل أموال الموكلين (Trust Accounts)
   - سجلات واضحة
   - إصدار إيصالات قانونية

4. **معايير OWASP Top 10:**
   - تقييم أمان دوري
   - اختبار اختراق (Penetration Testing)
   - إصلاح الثغرات فوراً
   - الحماية من:
     - Broken Access Control
     - Cryptographic Failures
     - Injection
     - Insecure Design
     - Security Misconfiguration
     - Vulnerable and Outdated Components
     - Identification and Authentication Failures
     - Software and Data Integrity Failures
     - Security Logging and Monitoring Failures
     - Server-Side Request Forgery (SSRF)

---

## 9. قابلية التوسع والصيانة (Scalability & Maintainability)

### 9.1 بنية قابلة للتوسع (Scalable Architecture)

1. **Horizontal Scaling:**
   - Backend على Render يمكن توسعته تلقائياً (Auto Scaling)
   - Supabase يدعم توسيع قاعدة البيانات
   - Stateless Backend (لا يخزن الحالة في الذاكرة)

2. **Caching:**
   - React Query على المستوى العميل
   - LRU Cache للفك تشفير البيانات (2 دقائق)
   - CDN للملفات الثابتة (Static Assets)

3. **Database Indexes:**
   - مفهلات على `org_id` في جميع الجداول
   - مفهلات على `created_at` للترتيب
   - مفهلات على `case_id`, `client_id`, `user_id` للبحث السريع
   - pg_trgm للبحث النصي العربي

4. **Queueing:**
   - يمكن إضافة نظام صفوف (Queue System) مستقبلاً (BullMQ أو RabbitMQ)
   - لمعالجة المهام الثقيلة (Background Jobs)

### 9.2 صيانة الكود (Maintainability)

1. **TypeScript:**
   - Strict Mode مفعل
   - أنواع واضحة ومحددة جيداً
   - Interfaces للبيانات
   - Generic Types

2. **ESLint:**
   - قواعد صارمة
   - ESLint Plugin for TypeScript
   - ESLint Plugin for React
   - Husky + Lint-Staged قبل الـ Commit

3. **الهيكلة (Folder Structure):**
   ```
   src/
   ├── components/
   │   ├── ui/
   │   ├── layout/
   │   ├── ai/
   │   ├── cases/
   │   └── chat/
   ├── views/
   │   ├── Dashboard.tsx
   │   ├── Cases.tsx
   │   └── ...
   ├── store/
   ├── types/
   ├── lib/
   ├── services/
   ├── domain/
   ├── application/
   ├── features/
   ├── modules/
   ├── config/
   ├── security/
   ├── monitoring/
   ├── observability/
   └── main.tsx
   ```

4. **Clean Architecture:**
   - Domain Layer - طبقة المجال
   - Application Layer - طبقة التطبيق
   - Infrastructure Layer - طبقة البنية التحتية
   - Presentation Layer - طبقة العرض

5. **التوثيق (Documentation):**
   - JSDoc للمكونات الرئيسية
   - تعليقات واضحة في الكود
   - README مفصل
   - Deployment Checklist
   - Database Fix Checklist

### 9.3 الاختبارات (Testing)

**أنواع الاختبارات:**
1. **Unit Tests (اختبارات الوحدات)**
   - Vitest كمنصة اختبارات
   - Testing Library
   - تغطية كاملة للـ Services والـ Stores
   - تغطية > 80%

2. **Integration Tests (اختبارات التكامل)**
   - اختبارات التفاعل مع Supabase
   - اختبارات الـ API Routes
   - اختبارات التكامل مع الخدمات الخارجية (Mocked)

3. **E2E Tests (اختبارات شامل)**
   - Playwright كمنصة اختبارات
   - اختبار سير عمل المستخدم الكامل
   - تسجيل الدخول → إضافة موكل → إضافة قضية → إضافة جلسة → إصدار فاتورة

4. **AI Security Tests (اختبارات أمان الـ AI)**
   - اختبار Prompt Injection
   - اختبار Data Leakage
   - اختبار Hallucination
   - اختبار Model Integrity

5. **Mutation Testing (اختبار الطفرات)**
   - Stryker.js
   - Mutation Score > 70%
   - لضمان فعالية الاختبارات نفسها

6. **Chaos Testing (اختبار الفوضى)**
   - اختبار تحمل الأخطاء
   - اختبار الـ Fallback Mechanisms
   - اختبار الـ Circuit Breaker

7. **Performance Testing (اختبار الأداء)**
   - Lighthouse CI
   - Core Web Vitals
   - LCP < 2.5s
   - TTFB < 0.2s
   - Bundle Size < 5MB

### 9.4 CI/CD Pipeline

**GitHub Actions Workflows:**

1. **Quality Gate:**
   - Type Check
   - ESLint
   - Tests مع Coverage
   - Build
   - Check Bundle Size
   - Upload Build Artifact

2. **Security Scan:**
   - npm audit
   - فحص الثغرات في الاعتماديات
   - فحص Secrets مكشوفة في الكود
   - Fail إذا وجدت ثغرات عالية الخطورة

3. **Deploy to Production:**
   - Deploy to Render.com
   - Health Check بعد النشر
   - Rollback إذا فشل الـ Health Check
   - Notification عند النجاح أو الفشل

4. **Notify on Failure:**
   - إنشاء Issue في GitHub إذا فشل الـ Pipeline
   - تفاصيل الفشل في الـ Issue

---

## 10. الأداء (Performance)

### 10.1 تحسين أداء الواجهة الأمامية

1. **Code Splitting:**
   - React.lazy + Suspense
   - تقسيم الحزم حسب الصفحة
   - تحميل فقط المطلوب في الوقت الحالي

2. **Memoization:**
   - React.memo للمكونات
   - useMemo للقيم المعقدة
   - useCallback للدوال
   - مقارنة عميقة للـ MemoizedBarChart و MemoizedPieChart

3. **Virtualization:**
   - Scroll Area للقوائم الطويلة
   - لا يتم عرض جميع العناصر دفعة واحدة

4. **Tree Shaking:**
   - Vite يقوم بذلك تلقائياً
   - إزالة الكود غير المستخدم
   - تقليل حجم الحزمة النهائية

5. **Minification:**
   - ESBuild لضغط الكود
   - إزالة التعليقات والفراغات
   - تغيير أسماء المتغيرات لأسماء أقصر

6. **Image Optimization:**
   - Lazy Loading للصور
   - تنسيقات حديثة (WebP, AVIF إذا متوفر)
   - حجم صور مناسب (لا تستخدم صورة كبيرة في مكان صغير)

7. **Font Optimization:**
   - Preload للخطوط الأساسية (Cairo Arabic, Cairo Latin)
   - WOFF2 Format (أصغر حجم)
   - Font Display: swap

### 10.2 تحسين أداء الواجهة الخلفية

1. **Compression:**
   - Gzip و Brotli لضغط الـ Responses
   - تقليل حجم البيانات المرسلة

2. **Caching:**
   - Cache-Control Headers مناسب
   - ETags للتحقق من التحديثات
   - Static Assets يُخزّن لفترة طويلة

3. **Rate Limiting:**
   - منع إرسال عدد كبير من الطلبات
   - حماية الخادم من Abuse

4. **Database Optimization:**
   - Indexes على الأعمدة المستخدمة في البحث والترتيب
   - N+1 Query Problem تم تجنبه
   - Pagination للنتائج الكبيرة

5. **Error Handling:**
   - لا ينهار الخادم عند حدوث خطأ
   - 5xx Errors يتم تسجيلها ويعاد محاولة الطلب لاحقاً

---

## 11. إرشادات التقييم (Evaluation Guidelines)

عند تقييم هذه المنصة، يرجى مراعاة النقاط التالية:

### 11.1 الأمان (Security)
- [ ] هل يتم حماية البيانات الحساسة جيداً؟
- [ ] هل الـ RLS مفعل على جميع الجداول؟
- [ ] هل هناك Audit Logs تفصيلية؟
- [ ] هل الـ CSP ضيق بما يكفي؟
- [ ] هل هناك Prompt Protection للـ AI؟
- [ ] هل يتم تشفير البيانات الحساسة؟
- [ ] هل تُخزَن المفاتيح بشكل آمن؟

### 11.2 الأداء (Performance)
- [ ] هل LCP < 2.5s؟
- [ ] هل TTFB < 0.2s؟
- [ ] هل حجم الحزمة < 5MB؟
- [ ] هل يتم تقسيم الكود (Code Splitting)؟
- [ ] هل يتم الـ Lazy Loading للصور والمكونات؟
- [ ] هل يوجد Caching فعال؟

### 11.3 سهولة الاستخدام (Usability)
- [ ] هل الواجهة واضحة وسهلة الفهم؟
- [ ] هل اللغة العربية RTL مدعومة بشكل أصيل؟
- [ ] هل التنقل سهل؟
- [ ] هل هناك رسائل خطأ واضحة؟
- [ ] هل يوجد Loading States مناسب؟
- [ ] هل يوجد Empty States مناسب؟

### 11.4 التوافق مع المعايير (Standards Compliance)
- [ ] هل الكود يتبع معايير TypeScript؟
- [ ] هل يتبع المعايير الحديثة للـ React؟
- [ ] هل الواجهة متوافقة مع WCAG (إتاحة للمعاقين)؟
- [ ] هل يتم الامتثال للقوانين المحلية (قانون 151, ETA)؟
- [ ] هل يوجد توثيق كامل؟

### 11.5 قابلية التوسع (Scalability)
- [ ] هل البنية قابلة للتوسع أفقياً؟
- [ ] هل هناك Caching مناسب؟
- [ ] هل قاعدة البيانات مصممة جيداً مع Indexes؟
- [ ] هل يمكن إضافة ميزات جديدة بسهولة؟

### 11.6 صيانة الكود (Maintainability)
- [ ] هل الكود نظيف ومنظم؟
- [ ] هل هناك Type Safety كامل؟
- [ ] هل هناك اختبارات شاملة (Tests)؟
- [ ] هل يوجد CI/CD فعال؟
- [ ] هل يوجد توثيق جيد؟

---

## 12. الخلاصة (Summary)

**منصة "ملف" (Malaf Egypt)** هي نظام قانوني شامل مصمم خصيصاً للسوق المصري، يتميز بـ:

✅ **تقنيات حديثة جداً:** React 19, Vite 6, TypeScript, Tailwind CSS 4, Zustand, React Query  
✅ **أمان عالي المستوى:** RLS, تشفير Edge, Audit Logs, CSP ضيق, Headers أمان  
✅ **تجربة مستخدم عربية أصيلة:** RTL كامل, خطوط عربية, مصطلحات قانونية مصرية  
✅ **مميزات شاملة:** إدارة قضايا, موكلين, جلسات, مالية, ETA, AI, وحدات مصرية متخصصة  
✅ **تكامل كامل مع الأنظمة المصرية:** ETA الضريبية, Paymob, نقابة المحامين  
✅ **ذكاء اصطناعي متطور:** تحليل مستندات, صياغة, فحص تعارض, دردشة قانونية  
✅ **اختبارات شاملة:** Unit Tests, Integration, E2E, AI Security, Mutation, Chaos  
✅ **CI/CD متقدم:** Quality Gates, Security Scan, Deploy, Health Check  

**المنصة جاهزة للاستخدام التجاري مع فرص نجاح عالية جداً في السوق المصري!**

---

*تم إعداد هذا الوصف بالتفصيل لتمكين أي وكيل ذكاء اصطناعي خارجي من إجراء تقييم شامل ودقيق للمنصة.*
