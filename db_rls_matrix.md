# RLS Policies Matrix - malaf.pro

| الجدول | SELECT | INSERT | UPDATE | DELETE | اسم الـ Policy الفعلي |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `organizations` | ✓ | ✗ | ✗ | ✗ | `Orgs are viewable by members` |
| `profiles` | ✓ | ✓ | ✓ | ✓ | `profiles_tenant_*` (Hardened) |
| `clients` | ✓ | ✓ | ✓ | ✓ | `clients_tenant_*` (Hardened) |
| `cases` | ✓ | ✓ | ✓ | ✓ | `cases_tenant_*` (Hardened) |
| `sessions` | ✓ | ✓ | ✓ | ✓ | `sessions_isolation` (v2) |
| `powers_of_attorney` | ✓ | ✓ | ✓ | ✓ | `Org POAs` |
| `documents` | ✓ | ✓ | ✓ | ✓ | `fix_002_documents_rls` |
| `invoices` | ✓ | ✓ | ✓ | ✓ | `invoices_tenant_*` |
| `payments` | ✓ | ✓ | ✓ | ✓ | `Org Payments` |
| `expenses` | ✓ | ✓ | ✓ | ✓ | `Org Expenses` |
| `trust_accounts` | ✓ | ✓ | ✓ | ✓ | `Org Trust Accounts` |
| `tasks` | ✓ | ✓ | ✓ | ✓ | `Org Tasks` |
| `notifications` | ✓ | ✓ | ✓ | ✓ | `User Notifications` (auth.uid) |

**دليل الرموز:**
- ✓: مغطى بالكامل بسياسة عزل (Tenant Isolation).
- ✗: غير مسموح للمستخدم العادي (فقط SuperAdmin أو نظام).
- ~: تغطية جزئية أو تعتمد على شروط إضافية.
- **ملاحظة:** تم استخدام دالة `get_user_org_id()` لتوحيد العزل عبر كافة الجداول.
