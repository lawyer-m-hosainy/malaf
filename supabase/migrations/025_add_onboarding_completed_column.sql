-- ═══════════════════════════════════════════════════════════════════
-- إضافة عمود onboarding_completed لجدول organizations
-- يُحل مشكلة "حدث خطأ أثناء حفظ البيانات" في صفحة التسجيل
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
