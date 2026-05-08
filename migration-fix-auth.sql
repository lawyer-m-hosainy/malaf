-- ═══════════════════════════════════════════════════════
-- Malaf: Clean Database Migration (Supabase Only)
-- Run this in Supabase SQL Editor to fix auth + RLS
-- ═══════════════════════════════════════════════════════

-- 1. Ensure profiles table has required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'محامي';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linked_client_id UUID;

-- 2. Allow new authenticated users to create their organization
DROP POLICY IF EXISTS "Allow authenticated users to create orgs" ON public.organizations;
CREATE POLICY "Allow authenticated users to create orgs"
ON public.organizations
FOR INSERT TO authenticated
WITH CHECK (true);

-- 3. Allow new users to read their own organization
DROP POLICY IF EXISTS "org_select" ON public.organizations;
CREATE POLICY "org_select"
ON public.organizations
FOR SELECT TO authenticated
USING (
  id = get_user_org_id()
  OR is_super_admin()
  OR id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
);

-- 4. Fix profiles insert policy — allow new users to create their own profile
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  id = auth.uid()
  OR org_id = get_user_org_id()
  OR is_super_admin()
);

-- 5. Fix profiles select — allow users to see their own profile even before org_id is set in JWT
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR org_id = get_user_org_id()
  OR is_super_admin()
);

-- 6. Fix profiles update
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR org_id = get_user_org_id()
  OR is_super_admin()
);

-- 7. Fix profiles delete
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete"
ON public.profiles
FOR DELETE TO authenticated
USING (
  org_id = get_user_org_id()
  OR is_super_admin()
);

-- Done! New users can now sign up with Google or Email and auto-create their org + profile.
