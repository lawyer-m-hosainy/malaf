# Secrets Inventory — malaf.pro

سجل الجرد الشامل لكافة الأسرار والمفاتيح والمفاتيح البرمجية المستخدمة في منصة **ملف**، مع توضيح أماكن التخزين، دورية التدوير، والمسؤولية الإدارية عنها.

---

## 1. جدول جرد الأسرار (Secrets Matrix)

| السر البرمجي (Secret) | الخدمة المرتبطة | بيئة التخزين (Storage Location) | دورية التدوير (Rotation Cadence) | التدوير التالي | المسؤول |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase DB | Render Environment (Server-side) | كل 90 يوم | 2026-08-25 | مهندس الـ DevOps |
| `SUPABASE_ANON_KEY` | Supabase Client | Render Env & VITE_ Build | كل 6 أشهر | 2026-11-25 | مهندس الـ Frontend |
| `SUPABASE_JWT_SECRET` | Supabase JWT Auth | Render Env (Server-side) | عند الاختراق أو الحاجة | - | مهندس الأمن |
| `GEMINI_API_KEY` | Google Gemini AI | Render Environment (Server-side) | كل 90 يوم | 2026-08-25 | مهندس الـ AI |
| `PAYMOB_SECRET_KEY` | Paymob Integration | Render Environment (Server-side) | كل 90 يوم | 2026-08-25 | مهندس الـ Backend |
| `PAYMOB_HMAC_SECRET` | Paymob Webhooks | Render Environment (Server-side) | كل 90 يوم | 2026-08-25 | مهندس الـ Backend |
| `WHATSAPP_TOKEN` | Meta API (WhatsApp) | Render Environment (Server-side) | كل 60 يوم | 2026-07-25 | مهندس الـ Backend |
| `ETA_CLIENT_SECRET` | Egyptian Tax Authority | Render Environment (Server-side) | كل 12 شهر | 2027-05-25 | مهندس الـ Backend |
| `ENCRYPTION_KEY` | AES-256 (Data Encryption)| Render Environment (Server-side) | عند الشك أو الطوارئ | - | مدير الأمن |
| `JWT_SECRET` | Custom Session Auth | Render Environment (Server-side) | كل 6 أشهر | 2026-11-25 | مهندس الـ Backend |
| `SENTRY_DSN` | Sentry Error Tracking | VITE_ (مكشوف - آمن للاستخدام) | لا يحتاج | N/A | DevOps |

---

## 2. تقويم تدوير الأسرار السنوي (Annual Rotation Calendar)

لتنظيم عمليات التدوير السنوية وتفادي تراكم العمليات في وقت واحد، نلتزم بالتقويم الدوري التالي:

```
┌───────────┬────────────────────────────────────────────────────────┐
│ الشهر     │ الأسرار المطلوب تدويرها                                │
├───────────┼────────────────────────────────────────────────────────┤
│ يناير     │ WHATSAPP_TOKEN + مراجعة شاملة لجدول الأسرار            │
│ مارس      │ GEMINI_API_KEY + PAYMOB_SECRET_KEY                    │
│ أبريل     │ SUPABASE_SERVICE_ROLE_KEY                              │
│ يونيو     │ JWT_SECRET + SUPABASE_ANON_KEY                        │
│ سبتمبر    │ GEMINI_API_KEY + PAYMOB_SECRET_KEY                    │
│ أكتوبر    │ ETA_CLIENT_SECRET (دورية سنوية)                        │
│ ديسمبر    │ WHATSAPP_TOKEN + مراجعة نهاية العام وتأكيد السلامة     │
└───────────┴────────────────────────────────────────────────────────┘
```
