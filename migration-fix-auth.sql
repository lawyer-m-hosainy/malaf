-- ═══════════════════════════════════════════════════════
-- Malaf: Fix Auth + RLS
-- ═══════════════════════════════════════════════════════

-- STEP 1: Add missing columns FIRST
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'محامي';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linked_client_id UUID;

-- STEP 2: Now create/update functions (columns exist now)
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'raw_user_meta_data' ->> 'org_id')::UUID;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'raw_user_meta_data' ->> 'role';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'super_admin';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_linked_client_id()
RETURNS UUID AS $$
  SELECT linked_client_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- STEP 3: Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Organizations policies
DROP POLICY IF EXISTS "org_insert" ON public.organizations;
CREATE POLICY "org_insert" ON public.organizations
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "org_select" ON public.organizations;
CREATE POLICY "org_select" ON public.organizations
FOR SELECT TO authenticated
USING (id = get_user_org_id() OR is_super_admin() OR id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "org_update" ON public.organizations;
CREATE POLICY "org_update" ON public.organizations
FOR UPDATE TO authenticated USING (id = get_user_org_id() OR is_super_admin());

-- STEP 5: Profiles policies
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR org_id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR org_id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR org_id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles
FOR DELETE TO authenticated
USING (org_id = get_user_org_id() OR is_super_admin());
