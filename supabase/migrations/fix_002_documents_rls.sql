-- ═══════════════════════════════════════════════════════════════════════
-- Fix 002: Documents RLS Hardening — تأمين الوصول للمستندات
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 0. ضمان وجود عمود assigned_to في جدول cases لدعم تعيين المحامين
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON public.cases(assigned_to);

-- ضمان وجود عمود shared_with_client في جدول documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS shared_with_client BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_documents_shared_with_client ON public.documents(shared_with_client) WHERE shared_with_client = true;

-- 1. حذف السياسات القديمة والجديدة لضمان إمكانية إعادة التشغيل
DROP POLICY IF EXISTS "Org Documents" ON public.documents;
DROP POLICY IF EXISTS "documents_tenant_select" ON public.documents;
DROP POLICY IF EXISTS "documents_granular_select" ON public.documents;
DROP POLICY IF EXISTS "documents_granular_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_granular_update" ON public.documents;
DROP POLICY IF EXISTS "documents_granular_delete" ON public.documents;

-- 2. إنشاء سياسة SELECT مفصلة (Granular Access)
CREATE POLICY "documents_granular_select" ON public.documents
  FOR SELECT TO authenticated
  USING (
    -- CASE 1: سوبر أدمن أو مدير مكتب يرى كل مستندات مكتبه
    (get_user_role() IN ('super_admin', 'org_admin') AND organization_id = get_user_org_id())
    
    OR
    
    -- CASE 2: محامي أو مساعد يرى مستندات القضايا المسندة إليه
    (get_user_role() IN ('lawyer', 'senior_lawyer', 'assistant') AND (
      EXISTS (
        SELECT 1 FROM public.cases 
        WHERE cases.id = documents.case_id 
        AND cases.assigned_to = auth.uid() 
        AND cases.organization_id = get_user_org_id()
      )
    ))

    OR

    -- CASE 3: موكل يرى مستندات قضاياه المسموح له برؤيتها فقط
    (get_user_role() = 'client' AND (
      documents.shared_with_client = true 
      AND documents.case_id IN (
        SELECT id FROM public.cases 
        WHERE client_id = get_user_linked_client_id()
      )
    ))
  );

-- 3. سياسة INSERT (للموظفين فقط)
CREATE POLICY "documents_granular_insert" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() != 'client' 
    AND organization_id = get_user_org_id()
  );

-- 4. سياسة UPDATE (للمسؤولين أو صاحب القضية)
CREATE POLICY "documents_granular_update" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    (get_user_role() IN ('super_admin', 'org_admin') AND organization_id = get_user_org_id())
    OR
    (get_user_role() IN ('lawyer', 'senior_lawyer') AND EXISTS (
      SELECT 1 FROM public.cases WHERE id = documents.case_id AND assigned_to = auth.uid()
    ))
  );

-- 5. سياسة DELETE (للمسؤولين فقط)
CREATE POLICY "documents_granular_delete" ON public.documents
  FOR DELETE TO authenticated
  USING (
    get_user_role() IN ('super_admin', 'org_admin') 
    AND organization_id = get_user_org_id()
  );

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- 🧪 قسم الاختبار (SQL Testing)
-- ═══════════════════════════════════════════════════════════════════════
/*
-- 1. اختبار الموكل: يجب أن يرى فقط المستندات التي تحمل shared_with_client = true وقضيته هو
-- SET request.jwt.claims = '{"sub": "client_uuid", "app_metadata": {"role": "client", "org_id": "org_uuid"}}';
-- SELECT count(*) FROM documents; -- يجب أن تظهر مستندات قضاياه المشتركة فقط

-- 2. اختبار المحامي: يجب أن يرى مستندات قضاياه المسندة (أو كل المكتب حسب منطق الشركة)
-- SET request.jwt.claims = '{"sub": "lawyer_uuid", "app_metadata": {"role": "lawyer", "org_id": "org_uuid"}}';
-- SELECT count(*) FROM documents;

-- 3. اختبار مدير المكتب: يرى كل شيء في المكتب
-- SET request.jwt.claims = '{"sub": "admin_uuid", "app_metadata": {"role": "org_admin", "org_id": "org_uuid"}}';
-- SELECT count(*) FROM documents;
*/

-- ═══════════════════════════════════════════════════════════════════════
-- ⬅️ قسم التراجع (ROLLBACK)
-- ═══════════════════════════════════════════════════════════════════════
/*
BEGIN;
  DROP POLICY IF EXISTS "documents_granular_select" ON public.documents;
  DROP POLICY IF EXISTS "documents_granular_insert" ON public.documents;
  DROP POLICY IF EXISTS "documents_granular_update" ON public.documents;
  DROP POLICY IF EXISTS "documents_granular_delete" ON public.documents;
  
  -- إعادة السياسة الأصلية البسيطة
  CREATE POLICY "Org Documents" ON public.documents FOR ALL USING (organization_id = get_user_org_id());
  
  ALTER TABLE public.documents DROP COLUMN IF EXISTS shared_with_client;
COMMIT;
*/
