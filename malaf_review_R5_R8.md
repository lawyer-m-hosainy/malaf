# 🏛️ تقرير المراجعة الشاملة — منصة مَلَف (الجزء الثاني: R5–R8)

---

## المرحلة R5 — مراجعة قاعدة البيانات Supabase

### الجداول الموجودة (30 جدول)

| # | الجدول | org_id | RLS | Indexes | Soft Delete | Trigger |
|---|--------|--------|-----|---------|-------------|---------|
| 1 | organizations | — (self) | ✅ | — | ❌ | ✅ |
| 2 | profiles | ✅ | ✅ | — | ❌ | ✅ |
| 3 | clients | ✅ | ✅ | ✅ org, name | ✅ | ✅ |
| 4 | cases | ✅ | ✅ | ✅ org, status, client, created_at | ✅ | ✅ |
| 5 | sessions | ❌ (via case) | ✅ | ✅ case, date, composite | ✅ | ✅ |
| 6 | documents | ✅ | ✅ | ✅ case, org | ✅ | ✅ |
| 7 | invoices | ✅ | ✅ | ✅ org, client, composite | ✅ | ✅ |
| 8 | poas | ✅ | ✅ | ✅ client | ✅ | ✅ |
| 9 | tasks | ✅ | ✅ | ✅ org, assigned | ✅ | ✅ |
| 10 | expenses | ✅ | ✅ | ✅ org, case, date | ✅ | ✅ |
| 11 | trust_accounts | ✅ | ✅ | — | ✅ | ✅ |
| 12 | enforcement | ✅ | ✅ | ✅ org | ✅ | ✅ |
| 13 | audit_logs | ✅ | ✅ | ✅ org, created_at (2x) | ❌ (immutable) | ❌ |
| 14 | expert_missions | ❌ (via case) | ✅ | ✅ case | ❌ | ✅ |
| 15 | real_estate_registry | ✅ | ✅ | ✅ org | ❌ | ✅ |
| 16 | specialized_tracks | ✅ | ✅ | — | ❌ | ✅ |
| 17 | notifications | ❌ (user_id) | ✅ | ✅ user | ❌ | ✅ |
| 18 | counters | — | ✅ | — | ❌ | ❌ |
| 19 | subscriptions | ✅ | ✅ | — | ❌ | ✅ |
| 20 | ai_documents | ✅ | ✅ | — | ❌ | ✅ |
| 21 | timeline_events | ✅ | ✅ | — | ❌ | ✅ |
| 22 | calendar_events | ✅ | ✅ | ✅ org, date | ✅ | ✅ |
| 23 | case_notes | ✅ | ✅ | ✅ case, org | ✅ | ✅ |
| 24 | payments | ✅ | ✅ | ✅ invoice, org | ❌ | ✅ |
| 25 | time_entries | ✅ | ✅ | ✅ org, lawyer, case | ✅ | ✅ |
| 26 | contracts | ✅ | ✅ | ✅ org, client | ✅ | ✅ |
| 27 | receivables | ✅ | ✅ | ✅ org, client | ✅ | ✅ |
| 28 | ip_records | ✅ | ✅ | ✅ org, client | ✅ | — |
| 29 | video_rooms | ✅ | ✅ | ✅ org, case | ❌ | ✅ |

### ❌ جداول مفقودة (مطلوبة من الكود)

| الجدول المفقود | مُستخدم في | التأثير |
|---------------|-----------|---------|
| `whatsapp_settings` | routes/whatsapp.js | ❌ واتساب لن يعمل |
| `whatsapp_messages` | routes/whatsapp.js | ❌ لا تسجيل للرسائل |
| `whatsapp_contacts` | routes/whatsapp.js | ❌ لا تعرّف على المرسل |
| `video_sessions` | routes/video.js | ❌ الفيديو لن يعمل (يستخدم video_sessions لكن الجدول اسمه video_rooms) |

### ⚠️ مشاكل في الـ Schema

1. **profiles تشير إلى clients قبل إنشائها** — `linked_client_id UUID REFERENCES clients(id)` في السطر 23 لكن clients مُعرّف في السطر 29 → سيفشل إذا نُفّذ بالترتيب

2. **sessions لا يحتوي على org_id مباشر** — العزل يتم عبر JOIN مع cases (صحيح لكن أبطأ)

3. **expert_missions لا يحتوي على org_id** — نفس المشكلة

4. **documents يشير إلى `is_shared`** في RLS policy لكن العمود يُضاف لاحقاً بـ `ALTER TABLE` — ترتيب التنفيذ مهم

5. **تكرار في الـ indexes**: `idx_invoices_composite` و `idx_invoices_org_status_due` — نفس المحتوى

### ✅ نقاط ممتازة
- `update_modified_column()` trigger على كل الجداول
- GENERATED ALWAYS AS في receivables (outstanding_amount) — ذكي
- Helper functions: `get_user_org_id()`, `get_user_role()`, `is_super_admin()`, `get_user_linked_client_id()`
- Client portal RLS: العملاء يرون فقط قضاياهم ومستنداتهم المشاركة

---

## المرحلة R6 — مراجعة الأمان الشامل

### المصادقة (Supabase Auth)

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| Email/Password login | ✅ | عبر Supabase Auth |
| Google OAuth | ✅ | مُعدّ في CSP (accounts.google.com) |
| Token في الـ headers | ✅ | Bearer token من Supabase session |
| Token refresh | ✅ | Supabase v2 يتولاه تلقائياً |
| Profile sync to JWT | ✅ | `updateUser({ data: { org_id, role } })` |
| Backend token verification | ❌ | **لا يتحقق من التوقيع — يقرأ payload فقط!** |

### التشفير AES-256

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| Algorithm | ✅ | AES-256-GCM (أفضل من CBC) |
| IV عشوائي | ✅ | `crypto.randomBytes(12)` لكل عملية |
| Auth Tag | ✅ | GCM authentication tag — يكشف التلاعب |
| Tenant Key Derivation | ✅ | PBKDF2 (100K iterations, SHA-512) — ممتاز |
| ENCRYPTION_KEY في client | ✅ آمن | Server-side فقط |
| البيانات المشفرة | ⚠️ جزئي | national_id و commercial_reg فقط — المبالغ المالية غير مشفرة |

### XSS Protection

| العنصر | الحالة |
|--------|--------|
| dangerouslySetInnerHTML | ✅ غير مُستخدم في أي مكان |
| Input sanitization (AI) | ✅ HTML tags تُزال في aiSecurity.js |
| Helmet CSP | ✅ لكن `unsafe-inline` و `unsafe-eval` مفتوحين |

### ⚠️ مشاكل أمان متوسطة

1. **CSP يسمح بـ `unsafe-inline` و `unsafe-eval`** — يضعف الحماية من XSS
2. **`SUPABASE_SERVICE_ROLE_KEY` في `.env` بالمشروع** — يجب أن يكون في `.env.local` فقط ولا يُرفع على Git
3. **لا يوجد CSRF protection** — لكن SPA مع JWT أقل عُرضة
4. **`npm audit`** غير واضح من الكود — يحتاج تشغيل فعلي

### ✅ نقاط أمان إيجابية
- Rate limiting على 3 مستويات: global (100/min), AI (10/min), crypto (30/min)
- Error messages في production مخفية (لا تكشف stack trace)
- Soft delete في كل مكان (لا حذف فعلي)
- Audit logging لكل عمليات CRUD

---

## المرحلة R7 — مراجعة سير العمل القانوني المصري

### أنواع القضايا

```typescript
// من الكود: cases table — type column
'مدني', 'جنائي', 'أسرة', 'إداري', 'تجاري'
```
✅ تغطية جيدة للأنواع الرئيسية.
⚠️ **ناقص**: عمالي، إيجارات، ضرائب، تأديبي

### حالات القضية

```typescript
// من domain/schemas.ts — StrictCaseSchema
status: z.enum(['متداولة', 'تحت الدراسة', 'مغلقة', 'محفوظة'])
```
⚠️ **ناقص**: "محكوم فيها"، "طعن"، "تنفيذ"، "مستأنفة"

### المحاكم المصرية

```typescript
// من domain/schemas.ts — EgyptCourtEnum
'محكمة النقض', 'محكمة الاستئناف', 'المحكمة الابتدائية',
'المحكمة الجنائية الابتدائية', 'المحكمة الاقتصادية', 'الدائرة العمالية',
'محاكم الأسرة', 'مجلس الدولة', 'محكمة القضاء الإداري',
'المحكمة الإدارية العليا', 'المحكمة الدستورية العليا',
'محكمة أمن الدولة العليا', 'محكمة الطفل', 'محكمة الجنايات',
'الجزئية', 'الابتدائية', 'الاستئناف', 'النقض', 'المحكمة التجارية'
```
✅ **شاملة جداً** — تغطي كل المحاكم المصرية تقريباً.

### التوكيلات

```typescript
// من lib/schemas.ts — poaSchema
type: z.enum(['عام', 'خاص', 'قضايا فقط', 'عقاري'])
```
✅ الأنواع الأساسية موجودة.
⚠️ **ناقص**: "إداري"، "بنكي"

### الفاتورة الإلكترونية (ETA)

```typescript
// من domain/schemas.ts — StrictInvoiceSchema
vatAmount: expectedVat = subtotal * 0.14 // 14% ضريبة القيمة المضافة
```
✅ ضريبة 14% صحيحة.
⚠️ **ناقص**: حقل الرقم الضريبي للمكتب، كود ETA، QR Code (مطلوب من الضرائب المصرية)

### AI Prompts للقانون المصري

```javascript
// من routes/ai.js — systemInstruction
'أنت مساعد قانوني ذكي متخصص في القانون المصري...'
'القانون المدني، قانون المرافعات، قانون العقوبات، قانون العمل المصري'
'صحيفة دعوى، جنحة، جناية، أمر على عريضة'
```
✅ **ممتاز** — المصطلحات القانونية المصرية دقيقة.

### Zod Validation للسياق المصري

- ✅ رقم قومي: 14 رقم يبدأ بـ 2 أو 3
- ✅ رقم جوال: `+201` أو `01` + 9 أرقام
- ✅ فئات المصروفات مصرية: دمغة محاماة، رسوم نقابة، أمانة خبير، رسم إعلان (محضر)
- ✅ أنواع التوكيلات مصرية
- ✅ عملة: ج.م

---

## المرحلة R8 — مراجعة الأداء

### Frontend Performance

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| Lazy Loading | ✅ | **كل الصفحات** تستخدم `React.lazy()` |
| Code Splitting | ✅ | `manualChunks` في vite.config: vendor-react, vendor-ui, vendor-utils |
| Bundle Warning | ✅ | `chunkSizeWarningLimit: 1000` |
| Sourcemap | ✅ | `sourcemap: false` في production |
| Font | ✅ | Cairo variable font (self-hosted, not CDN) |
| Suspense Fallback | ✅ | RouteLoadingFallback component |

### Zustand Performance

| العنصر | الحالة |
|--------|--------|
| عدد Stores | 19 — كثير لكن مقبول |
| Selective Subscription | ✅ `useStore(state => state.X)` — يمنع re-renders |
| Persist | ✅ فقط على auth-storage |
| Reset on Logout | ✅ 16 store يتم مسحها |

### Supabase Query Performance

| العنصر | الحالة |
|--------|--------|
| Select محدد (لا `*`) | ✅ كل الـ queries تحدد الأعمدة |
| Pagination | ✅ في fetchClientsPaginated و WhatsApp messages |
| Limits | ✅ `.limit(20)` أو `.limit(50)` على كل query |
| Batch Decrypt | ✅ `batchDecryptFields` بدلاً من decrypt فردي |

### ⚠️ مشاكل أداء

1. **Render.com Free Tier Cold Start** — Health check موجود في `/api/health` لكن لا يوجد UptimeRobot مُعدّ
2. **seedDemoData في كل تحميل** — `App.tsx` السطر 92: لو clients فارغ → seed → ممكن يسبب بطء
3. **sessions query مع JOIN**: `cases!inner(org_id)` — أبطأ من direct org_id filter
4. **N+1 محتمل**: `batchDecryptFields` يرسل طلب HTTP للـ server لكل batch — يحتاج تحسين لو البيانات كثيرة
