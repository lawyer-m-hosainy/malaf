-- ═══════════════════════════════════════════════════════════════════
-- مَلَف: إصلاح شامل لقاعدة البيانات والمصادقة
-- شغّل هذا الملف كاملاً في Supabase SQL Editor مرة واحدة
-- ═══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════
-- الخطوة 1: إنشاء الجداول الأساسية
-- ══════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (المكاتب)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (المستخدمون)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id),
  full_name TEXT,
  role TEXT DEFAULT 'محامي',
  email TEXT,
  linked_client_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════
-- الخطوة 2: التأكد من وجود كل الأعمدة
-- ══════════════════════════════════

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'محامي';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linked_client_id UUID;

-- ══════════════════════════════════
-- الخطوة 3: منح الصلاحيات الأساسية
-- هذا هو المفتاح - بدون هذا لا يعمل شيء
-- ══════════════════════════════════

-- صلاحيات service_role (للـ Admin APIs)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- صلاحيات authenticated (للمستخدمين العاديين)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- صلاحيات anon (للزوار)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- ══════════════════════════════════
-- الخطوة 4: الدوال المساعدة
-- ══════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'org_id')::UUID,
    (auth.jwt() -> 'raw_user_meta_data' ->> 'org_id')::UUID,
    (SELECT org_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'raw_user_meta_data' ->> 'role',
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    'محامي'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'super_admin';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_linked_client_id()
RETURNS UUID AS $$
  SELECT linked_client_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ══════════════════════════════════
-- الخطوة 5: تفعيل RLS
-- ══════════════════════════════════

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════
-- الخطوة 6: حذف كل السياسات القديمة وإعادة إنشائها
-- ══════════════════════════════════

-- مسح سياسات organizations
DROP POLICY IF EXISTS "org_select" ON public.organizations;
DROP POLICY IF EXISTS "org_insert" ON public.organizations;
DROP POLICY IF EXISTS "org_update" ON public.organizations;
DROP POLICY IF EXISTS "org_delete" ON public.organizations;
DROP POLICY IF EXISTS "org_all" ON public.organizations;

-- مسح سياسات profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "profiles_all" ON public.profiles;

-- ══════════════════════════════════════════════════════════
-- الخطوة 7: سياسات organizations
-- المفتاح: السماح لأي مستخدم مسجل بإنشاء مكتب جديد
-- ══════════════════════════════════════════════════════════

-- أي مستخدم مسجل يقدر ينشئ مكتب (ضروري للتسجيل لأول مرة)
CREATE POLICY "org_insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- المستخدم يشوف المكتب بتاعه بس
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    id = public.get_user_org_id()
    OR public.is_super_admin()
    OR id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

-- المستخدم يعدّل المكتب بتاعه بس
CREATE POLICY "org_update" ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    id = public.get_user_org_id()
    OR public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════
-- الخطوة 8: سياسات profiles
-- المفتاح: المستخدم يقدر ينشئ ملفه الشخصي (id = auth.uid())
-- ══════════════════════════════════════════════════════════

-- المستخدم ينشئ ملفه الشخصي أو ملف في نفس المكتب
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    OR org_id = public.get_user_org_id()
    OR public.is_super_admin()
  );

-- المستخدم يشوف ملفه أو ملفات زملائه في المكتب
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR org_id = public.get_user_org_id()
    OR public.is_super_admin()
  );

-- المستخدم يعدّل ملفه أو مدير المكتب يعدّل ملفات الزملاء
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR org_id = public.get_user_org_id()
    OR public.is_super_admin()
  );

-- الحذف للمدير فقط
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    org_id = public.get_user_org_id()
    OR public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════
-- الخطوة 9: دالة إنشاء البروفايل تلقائياً عند التسجيل
-- هذا يحل مشكلة "الدجاجة والبيضة" نهائياً
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- 1. أنشئ مكتب جديد للمستخدم
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'مكتب المحاماة'),
    'office-' || substr(NEW.id::TEXT, 1, 8)
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO new_org_id;

  -- 2. أنشئ ملف شخصي مرتبط بالمكتب
  INSERT INTO public.profiles (id, org_id, full_name, email, role)
  VALUES (
    NEW.id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'المستخدم'),
    NEW.email,
    'محامي'
  )
  ON CONFLICT (id) DO UPDATE SET
    org_id = COALESCE(public.profiles.org_id, new_org_id),
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    email = COALESCE(NULLIF(public.profiles.email, ''), EXCLUDED.email);

  -- 3. حدّث metadata في JWT عشان RLS يشتغل فوراً
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('org_id', new_org_id, 'role', 'محامي')
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف الـ trigger القديم لو موجود وإعادة إنشائه
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════════
-- الخطوة 10: إصلاح المستخدمين الحاليين اللي مالهمش profile
-- ══════════════════════════════════════════════════════════

DO $$
DECLARE
  u RECORD;
  new_org_id UUID;
BEGIN
  FOR u IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    -- أنشئ مكتب
    INSERT INTO public.organizations (name, slug)
    VALUES (
      COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'مكتب المحاماة'),
      'office-' || substr(u.id::TEXT, 1, 8)
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO new_org_id;

    -- أنشئ profile
    INSERT INTO public.profiles (id, org_id, full_name, email, role)
    VALUES (
      u.id,
      new_org_id,
      COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'المستخدم'),
      u.email,
      'محامي'
    )
    ON CONFLICT (id) DO NOTHING;

    -- حدّث metadata
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('org_id', new_org_id, 'role', 'محامي')
    WHERE id = u.id;

    RAISE NOTICE 'Fixed user: %', u.email;
  END LOOP;
END;
$$;

-- ══════════════════════════════════════════════════════════
-- الخطوة 11: تأكيد - عرض النتائج
-- ══════════════════════════════════════════════════════════

SELECT 'المستخدمون' AS category, COUNT(*) AS count FROM auth.users
UNION ALL
SELECT 'الملفات الشخصية', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'المكاتب', COUNT(*) FROM public.organizations;
