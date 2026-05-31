-- ═══════════════════════════════════════════════════════════════════
-- الإصلاح النهائي والشامل لقاعدة البيانات (يجب تشغيله في SQL Editor)
-- ═══════════════════════════════════════════════════════════════════

-- 1. التأكد من وجود الأعمدة المطلوبة في جدول clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS national_id_encrypted TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS commercial_registration_encrypted TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. نسخ البيانات من الأعمدة القديمة إلى الجديدة
UPDATE public.clients SET organization_id = COALESCE(organization_id, org_id);
UPDATE public.clients SET org_id = COALESCE(org_id, organization_id);

-- 3. تمكين سياسات الوصول (RLS) لجميع الجداول
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. سياسات جدول clients
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT 
USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients FOR UPDATE 
USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients FOR DELETE 
USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

-- 5. سياسات جدول organizations
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
CREATE POLICY "organizations_select" ON public.organizations FOR SELECT 
USING (id = public.get_user_org_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
CREATE POLICY "organizations_insert" ON public.organizations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
CREATE POLICY "organizations_update" ON public.organizations FOR UPDATE 
USING (id = public.get_user_org_id() OR public.is_super_admin());

-- 6. سياسات جدول cases
DROP POLICY IF EXISTS "cases_select" ON public.cases;
CREATE POLICY "cases_select" ON public.cases FOR SELECT 
USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "cases_insert" ON public.cases;
CREATE POLICY "cases_insert" ON public.cases FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "cases_update" ON public.cases;
CREATE POLICY "cases_update" ON public.cases FOR UPDATE 
USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "cases_delete" ON public.cases;
CREATE POLICY "cases_delete" ON public.cases FOR DELETE 
USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

-- 7. سياسات جدول profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT 
USING (id = auth.uid() OR org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE 
USING (id = auth.uid() OR public.has_role('مدير مكتب') OR public.is_super_admin());

-- 8. تمكين جدول time_entries (لو لم يكن موجودًا)
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id),
    description TEXT,
    hours NUMERIC(5,2) DEFAULT 0,
    minutes NUMERIC(5,2) DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    invoice_id UUID,
    billing_rate NUMERIC(10,2)
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "time_entries_select" ON public.time_entries;
CREATE POLICY "time_entries_select" ON public.time_entries FOR SELECT 
USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "time_entries_insert" ON public.time_entries;
CREATE POLICY "time_entries_insert" ON public.time_entries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "time_entries_update" ON public.time_entries;
CREATE POLICY "time_entries_update" ON public.time_entries FOR UPDATE 
USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "time_entries_delete" ON public.time_entries;
CREATE POLICY "time_entries_delete" ON public.time_entries FOR DELETE 
USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

-- 9. تحديث جدول organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
