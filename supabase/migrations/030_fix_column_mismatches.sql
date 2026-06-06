-- ============================================================
-- 030: إصلاح عدم تطابق أسماء الأعمدة بين الكود وقاعدة البيانات
-- ============================================================

-- 1. إضافة عمود deleted_at لجدول clients (للحذف الناعم)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. إضافة عمود deleted_at لجدول cases (للحذف الناعم)
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. إضافة عمود onboarding_completed لجدول organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 4. إضافة عمود title لجدول documents (الكود يحتاجه كـ alias)
-- لا نضيفه — بل الكود تم تصحيحه ليستخدم name

-- 5. تحديث دالة handle_new_user لضمان ربط org_id
-- (تمت في migration 029)

-- 6. إعادة تحميل مخطط PostgREST
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- ✅ انتهى إصلاح 030
-- ============================================================
