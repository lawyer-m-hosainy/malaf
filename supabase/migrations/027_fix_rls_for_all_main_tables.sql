-- ═══════════════════════════════════════════════════════════════════
-- إصلاح سياسات الوصول (RLS) لأهم الجداول (clients, cases, etc.)
-- يُحل الأخطاء 400/403 عند جلب البيانات
-- ═══════════════════════════════════════════════════════════════════

-- 1. تمكين RLS على جدول clients (لو لم يكن مفعلاً)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 2. سياسات جدول clients
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (true); -- السماح لإنشاء موكلين جدد

DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id());

-- 3. تمكين RLS على جدول cases (لو لم يكن مفعلاً)
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- 4. سياسات جدول cases
DROP POLICY IF EXISTS "cases_select" ON public.cases;
CREATE POLICY "cases_select" ON public.cases FOR SELECT USING (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "cases_insert" ON public.cases;
CREATE POLICY "cases_insert" ON public.cases FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "cases_update" ON public.cases;
CREATE POLICY "cases_update" ON public.cases FOR UPDATE USING (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "cases_delete" ON public.cases;
CREATE POLICY "cases_delete" ON public.cases FOR DELETE USING (org_id = public.get_user_org_id());

-- 5. تمكين RLS على جدول trust_accounts
ALTER TABLE public.trust_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trust_accounts_select" ON public.trust_accounts;
CREATE POLICY "trust_accounts_select" ON public.trust_accounts FOR SELECT USING (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "trust_accounts_insert" ON public.trust_accounts;
CREATE POLICY "trust_accounts_insert" ON public.trust_accounts FOR INSERT WITH CHECK (true);

-- 6. تمكين RLS على جدول tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (true);
