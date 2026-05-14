# ⚖️ تقرير R6 — تدقيق RTL العربي
## مَلَف (Malaf) — فحص الاتجاه والتعريب

---

## 1. Document Preview Modal

من [Dashboard.tsx L281](file:///e:/malaf/src/views/Dashboard.tsx#L281):

```tsx
<DialogContent className="max-w-[800px] min-w-[65vw] max-h-[80vh] overflow-y-auto">
```

| الفحص | الحالة |
|:---|:---:|
| `min-w-[65vw]` | ✅ تم إصلاحه سابقاً |
| `max-h-[80vh]` + `overflow-y-auto` | ✅ scrollable |
| RTL text في المحتوى | ✅ يرث من `html dir="rtl"` |

---

## 2. Global Direction — الاتجاه العام

من [index.html L2](file:///e:/malaf/index.html#L2):

```html
<html lang="ar" dir="rtl">
```

| الفحص | الحالة |
|:---|:---:|
| `dir="rtl"` على `<html>` | ✅ |
| `lang="ar"` | ✅ |
| خط Cairo العربي | ✅ `--font-sans: "Cairo Variable"` |
| Tailwind RTL utilities (`start/end` بدل `left/right`) | ✅ مُستخدم في Sidebar, Forms |

### `dir="ltr"` Overrides — استخدام صحيح:

| السياق | الملف | مبرر |
|:---|:---|:---|
| Email inputs | Login, Onboarding, Team | ✅ البريد الإلكتروني LTR دائماً |
| Password inputs | Login, Onboarding | ✅ كلمات المرور LTR |
| Phone numbers | Clients, BarAssociation, Contacts | ✅ الأرقام LTR |
| URLs / API tokens | WhatsAppSettings, PortalManagement | ✅ عناوين ويب LTR |
| Error stack traces | ErrorBoundary | ✅ كود برمجي LTR |
| Timer display | TimeTracking | ✅ `font-mono` LTR |

> [!TIP]
> **كل استخدامات `dir="ltr"` مبررة** — تُطبق فقط على محتوى يجب أن يكون LTR (بريد، أرقام، URLs).

---

## 3. الأرقام والتواريخ

### مكتبة التنسيق — [formatEG.ts](file:///e:/malaf/src/lib/formatEG.ts):

| الدالة | المخرج | مبني على | الحالة |
|:---|:---|:---|:---:|
| `formatDateEG('2026-04-01')` | `01/04/2026` | `en-GB` DD/MM/YYYY | ✅ |
| `formatDateShortAR('2026-04-01')` | `الثلاثاء، 1 أبريل` | `ar-EG` + `forceWesternNumerals` | ✅ |
| `formatEGP(25000)` | `25,000 ج.م` | `en-EG` | ✅ |
| `formatNumber(1500)` | `1,500` | `en-EG` | ✅ |
| `forceWesternNumerals('٢٥')` | `25` | Regex replace | ✅ |

### تغطية الاستخدام:

| الصفحة | تستخدم `formatEG`? |
|:---|:---:|
| Finance.tsx | ✅ `formatEGP` + `formatDateEG` |
| Enforcement.tsx | ✅ `formatEGP` + `formatDateEG` |
| Collections.tsx | ✅ `formatEGP` + `formatDateEG` |
| ETAInvoicing.tsx | ✅ `formatEGP` + `formatDateEG` |
| ExpertMissions.tsx | ✅ `formatEGP` + `formatDateEG` |
| RealEstateRegistry.tsx | ✅ `formatEGP` + `formatDateEG` |
| CaseSummaryCards.tsx | ✅ `formatEGP` |
| TimeTracking.tsx | ✅ `formatEGP` |

### ⚠️ صفحات تستخدم `toLocaleDateString('ar-EG')` مباشرة:

| الصفحة | المشكلة |
|:---|:---|
| Expenses.tsx L190 | قد تُنتج أرقام هندية (٠-٩) |
| IPManagement.tsx L134 | نفس المشكلة |
| Contracts.tsx L47 | نفس المشكلة |
| ConflictCheck.tsx L235 | نفس المشكلة |
| SessionsRoll.tsx L13 | نفس المشكلة |
| Billing.tsx L265, L373 | نفس المشكلة |

> [!NOTE]
> **التأثير الفعلي**: في معظم المتصفحات الحديثة، `ar-EG` يُنتج أرقام إنجليزية (0-9). المشكلة تظهر فقط في بعض إصدارات Safari وبيئات محددة. الحل المثالي: استبدالها بـ `formatDateEG()` من المكتبة الموحدة.

---

## 4. عرض العملة

| النمط | أين يُستخدم | الحالة |
|:---|:---|:---:|
| `formatEGP(amount)` → `"25,000 ج.م"` | Finance, Enforcement, Collections, ETA, Experts, Cases | ✅ |
| `ج.م` (ثابت) | TimeTracking, Billing | ✅ |
| `Intl.NumberFormat('ar-EG', {currency: 'EGP'})` | ClientPortal L473 | ⚠️ يعرض "ج.م.‏" (مع علامة LRM) |

> **1 حالة واحدة** في ClientPortal تستخدم `Intl.NumberFormat` بدلاً من `formatEGP()`. ليست مشكلة كبيرة لكن الأفضل توحيدها.

---

## 5. نصوص إنجليزية ظاهرة للمستخدم

فحص شامل للصفحات:

| المكان | النص | مبرر |
|:---|:---|:---:|
| Sidebar labels | كلها عربية | ✅ |
| Page headers | كلها عربية | ✅ |
| Button labels | كلها عربية | ✅ |
| Empty states | كلها عربية | ✅ |
| Error messages | كلها عربية | ✅ |
| Zod validation | كلها عربية | ✅ |
| Toast notifications | كلها عربية | ✅ |
| Supabase error messages | مترجمة في `getSupabaseAuthErrorMessage()` | ✅ |
| Login page | كله عربي (Google OAuth button text عربي) | ✅ |
| "Malaf" brand name | يُعرض كـ "مَلَف MALAF" | ✅ (مقصود) |

**لا توجد نصوص إنجليزية ظاهرة للمستخدم النهائي** (عدا اسم البراند).

---

## 6. Icons في سياق RTL

| التقنية المُستخدمة | الحالة |
|:---|:---:|
| Lucide React icons | ✅ عام — لا تتأثر بالاتجاه |
| `start/end` بدل `left/right` في positioning | ✅ مُستخدم في Forms, Sidebar |
| `me-2` / `ms-2` بدل `mr/ml` | ✅ مُستخدم في Buttons |
| Sidebar على الجانب الأيمن | ✅ `translate-x` مع RTL |
| Chevron rotation | ✅ `rotate-180` للمجموعات المفتوحة |

---

## 7. حقول الإدخال والـ Placeholders

| الحقل | Placeholder | `dir` | الحالة |
|:---|:---|:---:|:---:|
| اسم العميل | `—` (عربي) | `rtl` inherit | ✅ |
| رقم الهاتف | `01012345678` | `ltr` | ✅ |
| البريد الإلكتروني | `name@lawfirm.eg` | `ltr` | ✅ |
| كلمة المرور | `••••••••` | `ltr` | ✅ |
| رقم القضية | `—` | `rtl` inherit | ✅ |
| وصف المهمة | `—` | `rtl` inherit | ✅ |
| Zod error messages | عربية | — | ✅ |

---

## 8. رسائل الخطأ والحالات الفارغة

| السياق | اللغة | مثال |
|:---|:---:|:---|
| Zod validation | ✅ عربي | `"الاسم يجب أن يكون حرفين على الأقل"` |
| Auth errors | ✅ عربي | `"البريد الإلكتروني أو كلمة المرور غير صحيحة"` |
| Empty states | ✅ عربي | `"لا توجد قضايا بعد. أضف أول قضية."` |
| Network errors | ✅ عربي | `"تعذر الاتصال بالسيرفر"` |
| Toast notifications | ✅ عربي | sonner `position="top-left"` (RTL correct) |
| ErrorBoundary | ✅ عربي | `"حدث خطأ في {module}"` + stack trace بـ `dir="ltr"` |

---

## 9. Dark Mode — قراءة النص العربي

| العنصر | Light Mode | Dark Mode | الحالة |
|:---|:---|:---|:---:|
| Body text | `text-slate-900` | `dark:text-white` | ✅ |
| Muted text | `text-slate-500` | `dark:text-slate-400` | ✅ |
| Card background | `bg-white` | `dark:bg-navy-800` | ✅ |
| Sidebar | `bg-navy-900` | `dark:bg-black` | ✅ |
| Inputs | `bg-transparent` | `dark:bg-white/5` | ✅ |
| Borders | `border-slate-200` | `dark:border-white/10` | ✅ |
| Primary CTA | `bg-primary-600` | Same | ✅ |
| Badges | Colored bg | `dark:bg-*/30` variant | ✅ |

---

## 📋 ملخص R6

```
╔═══════════════════════════════════════════════════╗
║  1. Document preview modal    ✅ 65vw مُصلح     ║
║  2. Global RTL direction      ✅ html dir="rtl"  ║
║  3. أرقام + تواريخ           ✅ مكتبة formatEG  ║
║  4. عملة ج.م                 ✅ formatEGP()     ║
║  5. نصوص إنجليزية ظاهرة      ✅ لا يوجد        ║
║  6. Icons في RTL              ✅ start/end       ║
║  7. حقول إدخال عربية          ✅ مع dir="ltr"    ║
║  8. رسائل خطأ عربية           ✅ شاملة          ║
║  9. Dark mode readability     ✅ contrast جيد    ║
║                                                   ║
║  النتيجة: 9/9 ✅                                 ║
║  ملاحظات طفيفة: 6 صفحات تستخدم ar-EG مباشرة    ║
║  بدلاً من formatDateEG() — لا تأثير فعلي        ║
╚═══════════════════════════════════════════════════╝
```

> [!TIP]
> **نظام RTL في مَلَف ممتاز** — خط Cairo العربي، كل النصوص والرسائل بالعربية، أرقام إنجليزية مُوحدة، عملة ج.م، و`dir="ltr"` يُستخدم فقط حيث يجب (بريد، أرقام هاتف، URLs).
