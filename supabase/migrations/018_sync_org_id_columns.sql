-- ═══════════════════════════════════════════════════════════════════
-- مَلَف: مزامنة org_id ↔ organization_id (شغّل مرة واحدة في SQL Editor)
-- يحل فشل حفظ الموكلين عندما Trigger يكتب org_id و RLS يقرأ organization_id
-- ═══════════════════════════════════════════════════════════════════

-- 1) التأكد من وجود العمودين
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2) مزامنة البيانات القديمة
UPDATE public.profiles
SET organization_id = org_id
WHERE organization_id IS NULL AND org_id IS NOT NULL;

UPDATE public.profiles
SET org_id = organization_id
WHERE org_id IS NULL AND organization_id IS NOT NULL;

-- 3) دالة get_user_org_id تقرأ من المصدرين
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
DECLARE
  _org_id UUID;
BEGIN
  _org_id := (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'org_id')::UUID;
  IF _org_id IS NULL THEN
    _org_id := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id')::UUID;
  END IF;
  IF _org_id IS NULL THEN
    SELECT COALESCE(organization_id, org_id) INTO _org_id
    FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  END IF;
  RETURN _org_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4) Trigger التسجيل: يكتب العمودين معاً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'مكتب المحاماة'),
    'office-' || substr(NEW.id::TEXT, 1, 8)
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO new_org_id;

  INSERT INTO public.profiles (id, org_id, organization_id, full_name, email, role)
  VALUES (
    NEW.id,
    new_org_id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'المستخدم'),
    NEW.email,
    'محامي'
  )
  ON CONFLICT (id) DO UPDATE SET
    org_id = COALESCE(public.profiles.org_id, new_org_id),
    organization_id = COALESCE(public.profiles.organization_id, new_org_id),
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    email = COALESCE(NULLIF(public.profiles.email, ''), EXCLUDED.email);

  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('org_id', new_org_id, 'role', 'محامي')
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: % - %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5) السماح بإنشاء مكتب عند التسجيل (إن لم تكن السياسة موجودة)
DROP POLICY IF EXISTS "org_insert" ON public.organizations;
CREATE POLICY "org_insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 6) المستخدم ينشئ ملفه الشخصي
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
