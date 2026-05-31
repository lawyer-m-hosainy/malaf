-- ═══════════════════════════════════════════════════════════════════
-- إصلاح سياسات RLS لجدول organizations لتمكين المستخدمين من إنشاء مكتبات
-- هذا يُحل مشكلة "تعذر إنشاء المكتب: صلاحيات قاعدة البيانات" بشكل نهائي
-- ═══════════════════════════════════════════════════════════════════

-- 1. تعديل سياسات INSERT لجدول organizations للسماح للمستخدمين بإضافة مكتبات جديدة
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;

-- السماح لأي مستخدم (مصادق عليه) بإضافة مكتب جديد (لعملية التسجيل الأولى)
CREATE POLICY "organizations_insert"
    ON public.organizations FOR INSERT
    WITH CHECK (true);

-- 2. تحديث سياسات SELECT و UPDATE لتكون أكثر وضوحاً
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
CREATE POLICY "organizations_select"
    ON public.organizations FOR SELECT
    USING (
        id = public.get_user_org_id()
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
CREATE POLICY "organizations_update"
    ON public.organizations FOR UPDATE
    USING (
        id = public.get_user_org_id()
        OR public.is_super_admin()
    );

-- 3. التأكد من منح الصلاحيات على الجداول
GRANT ALL ON SEQUENCE public.payment_installments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payment_plans_id_seq TO authenticated;
