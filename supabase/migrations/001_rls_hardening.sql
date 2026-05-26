-- ═══════════════════════════════════════════════════════════════════════
-- Migration 001: RLS Hardening — تقوية عزل بيانات المكاتب
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- 🔴 الغرض: سدّ الثغرات الأمنية في سياسات الـ RLS الحالية
-- 
-- 📋 ملاحظة: اسم العمود في كل الجداول هو organization_id (وليس org_id)
--
-- ═══════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  الخطوة 1: إصلاح دالة الحصول على organization_id بشكل آمن  ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.get_user_org_id() 
 RETURNS UUID AS $$ 
 DECLARE 
   _org_id UUID; 
 BEGIN 
   -- 1) محاولة القراءة من user_metadata (Vite/Supabase Auth UI)
   _org_id := (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'org_id')::UUID; 
   
   -- 2) محاولة القراءة من app_metadata (Security Definer Triggers)
   IF _org_id IS NULL THEN 
     _org_id := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id')::UUID; 
   END IF; 
   
   -- 3) القراءة من جدول profiles (مصدر الحقيقة النهائي)
   IF _org_id IS NULL THEN 
     SELECT COALESCE(organization_id, org_id) INTO _org_id 
     FROM public.profiles WHERE id = auth.uid() LIMIT 1; 
   END IF; 
   
   RETURN _org_id; 
 END; 
 $$ LANGUAGE plpgsql STABLE SECURITY DEFINER; 

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  الخطوة 2: تأكيد تفعيل RLS على الجداول المطلوبة            ║
-- ╚═══════════════════════════════════════════════════════════════╝

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE enforcement_cases ENABLE ROW LEVEL SECURITY;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  الخطوة 3: إعادة بناء السياسات بشكل محكم                   ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- ── 3A. جدول profiles ──────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
DROP POLICY IF EXISTS "tenant_isolation_profiles" ON profiles;
DROP POLICY IF EXISTS "tenant_isolation_profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_select" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_update" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_delete" ON profiles;

CREATE POLICY "profiles_tenant_select" ON profiles
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id() OR is_super_admin());

CREATE POLICY "profiles_tenant_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('org_admin', 'super_admin')
  );

CREATE POLICY "profiles_tenant_update" ON profiles
  FOR UPDATE TO authenticated
  USING (
    (id = auth.uid())
    OR (organization_id = get_user_org_id() AND get_user_role() IN ('org_admin', 'super_admin'))
  )
  WITH CHECK (
    organization_id = get_user_org_id()
  );

CREATE POLICY "profiles_tenant_delete" ON profiles
  FOR DELETE TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('org_admin', 'super_admin')
  );

-- ── 3B. جدول clients ──────────────────────────────────────────

DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;
DROP POLICY IF EXISTS "tenant_isolation_clients" ON clients;
DROP POLICY IF EXISTS "clients_tenant_select" ON clients;
DROP POLICY IF EXISTS "clients_tenant_insert" ON clients;
DROP POLICY IF EXISTS "clients_tenant_update" ON clients;
DROP POLICY IF EXISTS "clients_tenant_delete" ON clients;

CREATE POLICY "clients_tenant_select" ON clients
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (organization_id = get_user_org_id() OR is_super_admin())
  );

CREATE POLICY "clients_tenant_insert" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id()
    AND get_user_role() != 'client'
  );

CREATE POLICY "clients_tenant_update" ON clients
  FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND deleted_at IS NULL
    AND get_user_role() != 'client'
  )
  WITH CHECK (
    organization_id = get_user_org_id()
  );

CREATE POLICY "clients_tenant_delete" ON clients
  FOR DELETE TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('org_admin', 'senior_lawyer', 'super_admin')
  );

-- ── 3C. جدول cases ────────────────────────────────────────────

DROP POLICY IF EXISTS "cases_select" ON cases;
DROP POLICY IF EXISTS "cases_insert" ON cases;
DROP POLICY IF EXISTS "cases_update" ON cases;
DROP POLICY IF EXISTS "cases_delete" ON cases;
DROP POLICY IF EXISTS "tenant_isolation_cases" ON cases;
DROP POLICY IF EXISTS "cases_tenant_select" ON cases;
DROP POLICY IF EXISTS "cases_tenant_insert" ON cases;
DROP POLICY IF EXISTS "cases_tenant_update" ON cases;
DROP POLICY IF EXISTS "cases_tenant_delete" ON cases;

CREATE POLICY "cases_tenant_select" ON cases
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      is_super_admin()
      OR (get_user_role() != 'client' AND organization_id = get_user_org_id())
      OR (get_user_role() = 'client' AND client_id = get_user_linked_client_id())
    )
  );

CREATE POLICY "cases_tenant_insert" ON cases
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id()
    AND get_user_role() != 'client'
  );

CREATE POLICY "cases_tenant_update" ON cases
  FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND deleted_at IS NULL
    AND get_user_role() != 'client'
  )
  WITH CHECK (
    organization_id = get_user_org_id()
  );

CREATE POLICY "cases_tenant_delete" ON cases
  FOR DELETE TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('org_admin', 'senior_lawyer', 'super_admin')
  );

-- ── 3D. جدول invoices ─────────────────────────────────────────

DROP POLICY IF EXISTS "invoices_select" ON invoices;
DROP POLICY IF EXISTS "invoices_insert" ON invoices;
DROP POLICY IF EXISTS "invoices_update" ON invoices;
DROP POLICY IF EXISTS "invoices_delete" ON invoices;
DROP POLICY IF EXISTS "tenant_isolation_invoices" ON invoices;
DROP POLICY IF EXISTS "invoices_tenant_select" ON invoices;
DROP POLICY IF EXISTS "invoices_tenant_insert" ON invoices;
DROP POLICY IF EXISTS "invoices_tenant_update" ON invoices;
DROP POLICY IF EXISTS "invoices_tenant_delete" ON invoices;

CREATE POLICY "invoices_tenant_select" ON invoices
  FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id() OR is_super_admin()
  );

CREATE POLICY "invoices_tenant_insert" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id()
    AND get_user_role() != 'client'
  );

CREATE POLICY "invoices_tenant_update" ON invoices
  FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() != 'client'
  )
  WITH CHECK (
    organization_id = get_user_org_id()
  );

CREATE POLICY "invoices_tenant_delete" ON invoices
  FOR DELETE TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('org_admin', 'super_admin')
  );

-- ── 3E. جدول enforcement_cases (التنفيذ القضائي) ──────────────

DROP POLICY IF EXISTS "enforcement_select" ON enforcement_cases;
DROP POLICY IF EXISTS "enforcement_insert" ON enforcement_cases;
DROP POLICY IF EXISTS "enforcement_update" ON enforcement_cases;
DROP POLICY IF EXISTS "enforcement_delete" ON enforcement_cases;
DROP POLICY IF EXISTS "tenant_isolation_enforcement" ON enforcement_cases;
DROP POLICY IF EXISTS "enforcement_tenant_select" ON enforcement_cases;
DROP POLICY IF EXISTS "enforcement_tenant_insert" ON enforcement_cases;
DROP POLICY IF EXISTS "enforcement_tenant_update" ON enforcement_cases;
DROP POLICY IF EXISTS "enforcement_tenant_delete" ON enforcement_cases;

CREATE POLICY "enforcement_tenant_select" ON enforcement_cases
  FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id() OR is_super_admin()
  );

CREATE POLICY "enforcement_tenant_insert" ON enforcement_cases
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id()
    AND get_user_role() != 'client'
  );

CREATE POLICY "enforcement_tenant_update" ON enforcement_cases
  FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() != 'client'
  )
  WITH CHECK (
    organization_id = get_user_org_id()
  );

CREATE POLICY "enforcement_tenant_delete" ON enforcement_cases
  FOR DELETE TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('org_admin', 'senior_lawyer', 'super_admin')
  );

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  الخطوة 4: فهارس مطلوبة لأداء RLS                          ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_cases_org_id ON enforcement_cases(organization_id);

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  الخطوة 5: Trigger لمزامنة org_id في JWT تلقائياً           ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION sync_org_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) 
    || jsonb_build_object('org_id', NEW.organization_id, 'role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_sync_metadata ON profiles;
CREATE TRIGGER on_profile_sync_metadata
  AFTER INSERT OR UPDATE OF organization_id, role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_org_to_auth_metadata();
