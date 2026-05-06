# ⚖️ تقرير المراجعة الشاملة — منصة مَلَف (الجزء ٢: R3–R5)

---

## المرحلة R3 — تدقيق الواجهة الوظيفية (Web Functional UI)

### M01 — المصادقة (Auth)

| الفحص | الحالة | التفاصيل |
|---|---|---|
| نموذج تسجيل الدخول بالبريد | ✅ | Firebase `signInWithEmailAndPassword` |
| تسجيل الدخول بـ Google | ✅ | `signInWithPopup` + fallback `signInWithRedirect` |
| إنشاء حساب جديد | ✅ | `createUserWithEmailAndPassword` + email verification |
| التحقق من البريد الإلكتروني | ✅ | يمنع الدخول بدون تفعيل (سطر 115-119) |
| كلمة مرور ≥ 8 أحرف | ✅ | تحقق في سطر 144 |
| رسائل خطأ بالعربي | ✅ | 12 حالة خطأ مترجمة |
| Loading state | ✅ | 3 states منفصلة لكل طريقة |
| وضع تجريبي (Demo) | ✅ | 30 دقيقة timeout + محدد بـ `VITE_ENABLE_DEMO` |
| Onboarding بعد أول تسجيل | ✅ | يتحقق من `localStorage.onboarding_completed` |
| Logout يمسح البيانات | ✅ | `resetAllStores()` — 16 store |

### M02 — الموكلون

| الفحص | الحالة | التفاصيل |
|---|---|---|
| قائمة الموكلين من Supabase | ✅ | `fetchClients()` مع pagination |
| إضافة موكل مع validation | ✅ | Zod `clientSchema` |
| تشفير الرقم القومي | ✅ | `encryptField(client.nationalId)` قبل الإرسال |
| تشفير السجل التجاري | ✅ | `encryptField(client.commercialRegistration)` |
| حذف ناعم (Soft Delete) | ✅ | `deleted_at` بدلاً من حذف فعلي |
| Audit log عند الحفظ/الحذف | ✅ | `logAuditAction()` |
| رقم هاتف مصري +201 | ✅ | regex `/^\+201[0-9]{9}$/` |
| الرقم القومي 14 رقم | ✅ | `EgyptNationalIdSchema` (يبدأ بـ 2 أو 3) |

### M03 — القضايا

| الفحص | الحالة | التفاصيل |
|---|---|---|
| قائمة القضايا | ✅ | `fetchCases()` مع فلترة |
| أنواع المحاكم المصرية | ✅ | 14 نوع محكمة في `CaseSchema` |
| حالات القضية | ✅ | متداولة / تحت الدراسة / مغلقة / محفوظة |
| نقل آلي للتنفيذ عند حكم نهائي | ✅ | `updateCase` → `createEnforcementFromCase` |
| حذف ناعم | ✅ | |
| ربط بالتقاضي الإلكتروني | ✅ | حقل `eLitigationStatus` |

### M04-M08 — الجلسات / المستندات / المالية / التقويم / التوكيلات

| الوحدة | الحالة | ملاحظات |
|---|---|---|
| M04 الجلسات | ✅ | تنبيه قبل 48 ساعة، ربط بالقضايا |
| M05 المستندات | ⚠️ | رفع عبر **Firebase Storage** (وليس Supabase) — يجب الترحيل |
| M06 المالية | ✅ | فواتير + مصروفات + أمانات + تنفيذ |
| M07 التقويم | ⚠️ | يعمل من Zustand — لا يوجد جدول `calendar_events` في Supabase |
| M08 التوكيلات | ✅ | تنبيه انتهاء 30 يوم، أنواع (عام/خاص/قضايا/عقاري) |

### M09 — بوابة الموكل

| الفحص | الحالة | التفاصيل |
|---|---|---|
| تسجيل دخول منفصل | ✅ | صفحة `/client-portal` |
| فحص role = "client" | ✅ | |
| عرض قضايا الموكل فقط | ✅ | فلترة بـ `linked_client_id` + `org_id` |
| إخفاء ملاحظات المحامي | ❌ | لا يوجد حقل `is_private` على الملاحظات |
| عرض الفواتير | ❌ | غير متاح في البوابة |
| عرض المستندات المشتركة | ❌ | غير متاح |

### M12-M14 — الذكاء الاصطناعي

| الفحص | الحالة | التفاصيل |
|---|---|---|
| Gemini عبر server.js فقط | ✅ | لا يوجد استدعاء مباشر من المتصفح |
| Fallback عند فشل الخادم | ✅ | ردود قانونية مصرية واقعية (ليست Lorem Ipsum) |
| Groq كبديل ثاني | ✅ | `callGroq()` قبل المرور للـ mock |
| Rate limiting | ✅ | 10 طلبات/دقيقة |
| Auth middleware على AI | ✅ | Firebase JWT verification |
| Input sanitization | ✅ | إزالة HTML tags + حد أقصى 5000/10000/50000 حرف |
| Disclaimer قانوني | ✅ | "استشارة مبدئية وليست رأياً قانونياً ملزماً" |
| قوالب عقود مصرية | ✅ | 80% قالب + 20% AI fill |

### M15-M18

| الوحدة | الحالة | ملاحظات |
|---|---|---|
| M15 ETA | ⚠️ | واجهة موجودة — VAT 14% محسوب — لكن لا ربط فعلي مع مصلحة الضرائب |
| M16 Audit Logs | ✅ | INSERT-only RLS — لا حذف أو تعديل |
| M17 Super Admin | ✅ | `GlobalAdmin.tsx` مع `PermissionGate("platform_admin")` |
| M18 الاشتراكات | ✅ | `subscriptionService.ts` + جدول `subscriptions` |

### جدول حالة الشاشات الرئيسية

| الشاشة | الحالة | الأولوية |
|---|---|---|
| Login | ✅ يعمل | — |
| Dashboard | ✅ يعمل | — |
| Clients | ✅ يعمل | — |
| Cases | ✅ يعمل | — |
| Finance | ✅ يعمل | — |
| Client Portal | ⚠️ ناقص | عالي |
| Calendar | ⚠️ لا Supabase | متوسط |
| Documents Upload | ⚠️ Firebase Storage | عالي |

```
╔═════════════════════════════════════════════════════════╗
║ [سوبر برومبت إصلاح R3 — الواجهة الويب]               ║
╚═════════════════════════════════════════════════════════╝
```

```text
Fix ALL broken web UI elements for Egyptian law firm SaaS مَلَف.
Stack: React 19 + Vite + Supabase + Firebase Auth.

Fix list:
1. Client Portal: Add invoices tab showing client's invoices only
2. Client Portal: Add documents tab showing shared documents only
3. Client Portal: Add is_private field to case_notes — hide from client
4. Calendar: Create calendar_events Supabase table and migrate
   from Zustand-only to Supabase persistence
5. Documents: Migrate file uploads from Firebase Storage to
   Supabase Storage with per-office folder isolation
6. All list views: Add loading skeletons (shadcn Skeleton component)
7. All forms: Show Arabic error messages from Zod validation
8. ETA Invoicing: Add disclaimer that ETA API integration is roadmap

Rules:
1. Incremental fixes — don't break working features
2. All UI text in Arabic RTL
3. All forms: Egyptian validation via Zod
4. All Supabase writes: encrypt sensitive fields first
5. All async actions: loading + error + success states
6. Gemini API: never call from browser directly
7. All fixes must not loosen Supabase RLS

Write your full response in Arabic.
```

---

## المرحلة R4 — تدقيق قاعدة البيانات Supabase

### ① اكتمال الجداول

| الجدول | موجود | org_id | soft delete | ملاحظات |
|---|---|---|---|---|
| organizations | ✅ | N/A (root) | ❌ | ينقصه `deleted_at` |
| profiles | ✅ | ✅ | ❌ | ينقصه `deleted_at` |
| clients | ✅ | ✅ | ✅ | ✅ كامل |
| cases | ✅ | ✅ | ✅ | ✅ يدعم استئناف + نقض |
| sessions | ✅ | ❌ (عبر case) | ✅ | ينقصه `org_id` مباشر |
| documents | ✅ | ✅ | ✅ | |
| invoices | ✅ | ✅ | ✅ | ينقصه: `vat_amount`, `invoice_number` |
| poas | ✅ | ✅ | ✅ | |
| tasks | ✅ | ✅ | ✅ | |
| expenses | ✅ | ✅ | ✅ | |
| trust_accounts | ✅ | ✅ | ✅ | |
| enforcement | ✅ | ✅ | ✅ | |
| audit_logs | ✅ | ✅ | N/A (immutable) | ✅ |
| expert_missions | ✅ | ❌ (عبر case) | ❌ | ينقصه `org_id` |
| notifications | ✅ | ❌ | ❌ | ينقصه `org_id` |
| subscriptions | ✅ | ✅ | ❌ | |
| ai_documents | ✅ | ✅ | ❌ | |
| timeline_events | ✅ | ✅ | ❌ | |
| **calendar_events** | ❌ مفقود | — | — | يجب إنشاؤه |
| **case_notes** | ❌ مفقود | — | — | مطلوب لعزل ملاحظات المحامي |
| **payments** | ❌ مفقود | — | — | مطلوب لتسجيل الدفعات |

### ② خطأ SQL في Schema

> [!WARNING]
> سطر 368 في `supabase-schema.sql`:
> ```sql
> );
> ```
> قوس إغلاق زائد بعد بلوك الـ indexes — سيمنع تنفيذ باقي السكريبت.

### ③ سياسات RLS مكررة

> [!WARNING]
> جدول `invoices` لديه **سياسات مكررة** (سطر 353-357 وسطر 385-389). هذا سيسبب خطأ SQL عند التنفيذ.

### ④ الفهارس (Indexes)

✅ **موجودة ومناسبة:** 18 فهرس تغطي:
- `clients(org_id)`, `cases(org_id, status)`, `cases(client_id)`
- `sessions(case_id, date)`, `invoices(org_id, status, due_date)`
- `audit_logs(org_id, created_at DESC)`
- `tasks(org_id)`, `tasks(assigned_to)`

⚠️ **مفقودة:**
- `documents(org_id)` — مطلوب للاستعلامات المباشرة
- `poas(org_id)` — عبر clients join حالياً

### ⑤ سلامة البيانات

| الفحص | الحالة |
|---|---|
| UUID Primary Keys | ✅ كل الجداول |
| created_at / updated_at | ✅ كل الجداول |
| updated_at triggers | ✅ 19 trigger |
| ON DELETE CASCADE | ⚠️ بعض FKs بدون policy |
| NOT NULL على الحقول المطلوبة | ⚠️ بعض الحقول اختيارية |
| CHECK constraints على enums | ❌ غير موجودة |

```
╔═════════════════════════════════════════════════════════╗
║ [سوبر برومبت إصلاح R4 — قاعدة البيانات]              ║
╚═════════════════════════════════════════════════════════╝
```

```text
Fix ALL Supabase database issues for Egyptian law firm SaaS مَلَف.

1. Fix SQL syntax error: remove stray ");" on line 368 of supabase-schema.sql
2. Remove duplicate invoices RLS policies (lines 353-357 duplicate of 385-389)
3. Create missing tables:
   - calendar_events (id, org_id, title, start_date, end_date, type, case_id, created_at)
   - case_notes (id, org_id, case_id, author_id, content, is_private, created_at)
   - payments (id, org_id, invoice_id, amount, method, date, created_at)
4. Add org_id to: sessions, expert_missions, notifications
5. Add missing columns to invoices: vat_amount DECIMAL, invoice_number TEXT
6. Add CHECK constraints for enum fields (case status, roles)
7. Add ON DELETE policies to all FK relationships
8. Create RLS policies for new tables
9. Add missing indexes: documents(org_id), calendar_events(org_id, start_date)

Output: SQL migration file. All changes must be additive (no data loss).

Write your full response in Arabic.
```

---

## المرحلة R5 — التدقيق الأمني العميق

### ① المصادقة (Firebase Auth)

| الفحص | الحالة |
|---|---|
| Firebase Auth مُعدّ | ✅ |
| التحقق من البريد الإلكتروني مطلوب | ✅ (سطر 115-119 في Login) |
| كلمة مرور ≥ 8 أحرف | ✅ |
| Rate limiting على المحاولات | ✅ (Firebase built-in) |
| Custom claims للأدوار | ❌ لم يُطبق — الأدوار من Supabase profiles |
| Auth state listener | ✅ `onAuthStateChanged` في AuthProvider |
| Session persistence | ✅ (Firebase default) |
| Logout شامل | ✅ Firebase signOut + resetAllStores |

### ② التفويض (Firebase → Supabase)

| الفحص | الحالة |
|---|---|
| Firebase JWT → Supabase | ❌ **غير مطبق** (أخطر ثغرة) |
| org_id من JWT فقط | ❌ يؤخذ من `getCurrentTenantId()` (في الذاكرة) |
| Role من JWT فقط | ❌ يؤخذ من Supabase profiles |
| Token refresh | ⚠️ Firebase يُحدث تلقائياً لكن Supabase لا يعرف |

### ③ التشفير (AES-256)

| الفحص | الحالة |
|---|---|
| مفتاح التشفير ليس VITE_ | ✅ ممتاز |
| Server-side encryption | ✅ ممتاز — `server.js` Node.js `crypto` |
| IV عشوائي لكل عملية | ✅ `crypto.randomBytes(16)` |
| مفتاح خاص لكل مستأجر | ✅ PBKDF2 بـ 100,000 iterations |
| المفتاح ليس في localStorage | ✅ |
| Auth middleware على التشفير | ✅ |
| CryptoJS في المتصفح | ✅ **أُزيل** — بقي `crypto-js` في package.json كـ dependency غير مستخدم |

### ④ حقن وثغرات XSS

| الفحص | الحالة |
|---|---|
| `dangerouslySetInnerHTML` | ✅ **غير مستخدم** |
| Input sanitization في AI | ✅ إزالة HTML tags |
| Zod validation | ✅ على كل النماذج الرئيسية |
| Supabase parameterized queries | ✅ (built-in) |
| `eval()` أو `Function()` | ✅ **غير موجود** |
| CSP header | ✅ في `server.js` Helmet + `index.html` meta |

### ⑤ أمان رفع الملفات

| الفحص | الحالة |
|---|---|
| تحقق من نوع الملف | ✅ PDF, DOC, DOCX, TXT فقط |
| حد حجم الملف | ✅ 10MB |
| منع الملفات التنفيذية | ✅ |
| Timeout على الرفع | ✅ 15 ثانية |
| Path traversal prevention | ✅ `sanitizeFileName()` |

### ⑥ أمان API والخادم

| الفحص | الحالة |
|---|---|
| Supabase anon key عام | ✅ آمن بالتصميم |
| Supabase service_role | ✅ **غير موجود** في الكود |
| Gemini API key server-only | ✅ |
| CORS مُقيّد | ✅ localhost + production URL |
| Rate limiting على AI | ✅ 10/دقيقة |
| Helmet security headers | ✅ |
| HSTS enabled | ✅ |
| X-Frame-Options: DENY | ✅ |

### ⑦ الاعتمادات

| الفحص | الحالة |
|---|---|
| crypto-js مثبت لكن غير مستخدم | ⚠️ يجب إزالته من dependencies |
| جميع الحزم حديثة | ✅ |

```
╔═════════════════════════════════════════════════════════╗
║ [سوبر برومبت إصلاح R5 — الأمان الشامل]               ║
╚═════════════════════════════════════════════════════════╝
```

```text
Fix ALL security vulnerabilities for Egyptian law firm SaaS مَلَف.
Stack: React 19 + Supabase + Firebase Auth + AES-256 (server-side).

CRITICAL (fix first):
1. Firebase JWT → Supabase integration is MISSING. Supabase client
   has no user identity. Fix by either:
   a) Migrating to Supabase Auth entirely, OR
   b) Configuring Supabase custom JWT with Firebase project secret
   
2. RLS policies reference get_user_org_id() which reads from
   raw_user_meta_data — this is NEVER populated. Fix the function
   after implementing the auth bridge.

HIGH:
3. Remove unused crypto-js from package.json (dead dependency)
4. Add CSP connect-src for Supabase domain in index.html meta tag
   (currently missing *.supabase.co — it's only in server.js Helmet)
5. Client portal: Add RLS policy for client role that restricts
   SELECT to only their own linked cases and hides private notes

Rules:
1. Encryption key must NEVER be VITE_ prefixed
2. Supabase service_role NEVER in frontend
3. Gemini API key NEVER in browser
4. AES IV must be randomized per operation
5. RLS must not be loosened to fix bugs
6. All fixes must preserve existing functionality

Write your full response in Arabic.
```
