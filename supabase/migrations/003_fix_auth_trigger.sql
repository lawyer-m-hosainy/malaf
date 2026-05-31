-- ═══════════════════════════════════════════════════════════════════
-- ملف إصلاحات مشغل إنشاء المستخدمين والمكاتب
-- يعالج مشاكل الصلاحيات وتعذر إنشاء المكتب
-- ═══════════════════════════════════════════════════════════════════

-- 1) تهيئة الأعمدة لضمان عدم فشل الاستعلام
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2) تحديث دالة معالجة المستخدمين الجدد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- إنشاء المكتب
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'مكتب جديد'),
    'office-' || substr(NEW.id::TEXT, 1, 8)
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO new_org_id;

  -- إنشاء الملف الشخصي (كتابة المعرف في العمودين للمزامنة)
  INSERT INTO public.profiles (id, org_id, organization_id, full_name, email, role)
  VALUES (
    NEW.id,
    new_org_id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'مستخدم جديد'),
    NEW.email,
    'محامي'
  )
  ON CONFLICT (id) DO UPDATE SET
    org_id = COALESCE(public.profiles.org_id, new_org_id),
    organization_id = COALESCE(public.profiles.organization_id, new_org_id);

  -- تحديث بيانات JWT ليعمل النظام فوراً دون تسجيل خروج
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('org_id', new_org_id, 'role', 'محامي')
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) إعادة ربط المشغل
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) منح الصلاحيات الشاملة (حل مشكلة Permission Denied)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
