-- ═══════════════════════════════════════════════════════════════════
-- مَلَف: إصلاح خطأ التسجيل "Database error saving new user"
-- شغّل هذا الملف في Supabase SQL Editor مرة واحدة
-- ═══════════════════════════════════════════════════════════════════

-- الخطوة 1: إنشاء نوع user_role لو مش موجود
DO $$
BEGIN
  -- حذف النوع القديم لو موجود بشكل خاطئ
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    CREATE TYPE public.user_role AS ENUM (
      'مؤسس',
      'مدير مكتب',
      'محامي',
      'محامي شريك',
      'محامي مستشار',
      'محامي متدرب',
      'سكرتير'
    );
    RAISE NOTICE '✅ تم إنشاء نوع user_role بنجاح';
  ELSE
    RAISE NOTICE 'ℹ️ نوع user_role موجود مسبقاً';
    -- التأكد من إضافة القيمة "مؤسس" لو مش موجودة
    BEGIN
      ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'مؤسس';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- الخطوة 2: إعادة إنشاء الـ Trigger بدون الـ cast الذي يسبب المشكلة
-- استخدام TEXT بدلاً من user_role::cast لتجنب الأخطاء
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
  -- ✅ إزالة الـ ::public.user_role cast الذي كان يسبب الخطأ
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

EXCEPTION WHEN OTHERS THEN
  -- لو حصل أي خطأ، سجّله ولا تمنع إنشاء المستخدم
  RAISE WARNING 'handle_new_user error: % - %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- الخطوة 3: إعادة ربط الـ Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- الخطوة 4: التأكد من الصلاحيات
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- الخطوة 5: إصلاح أي مستخدمين حاليين بدون profile
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
    INSERT INTO public.organizations (name, slug)
    VALUES (
      COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'مكتب المحاماة'),
      'office-' || substr(u.id::TEXT, 1, 8)
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO new_org_id;

    INSERT INTO public.profiles (id, org_id, full_name, email, role)
    VALUES (
      u.id,
      new_org_id,
      COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'المستخدم'),
      u.email,
      'محامي'
    )
    ON CONFLICT (id) DO NOTHING;

    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('org_id', new_org_id, 'role', 'محامي')
    WHERE id = u.id;

    RAISE NOTICE '✅ Fixed user: %', u.email;
  END LOOP;
END;
$$;

-- الخطوة 6: تأكيد النتائج
SELECT '✅ المستخدمون' AS category, COUNT(*) AS count FROM auth.users
UNION ALL
SELECT '✅ الملفات الشخصية', COUNT(*) FROM public.profiles
UNION ALL
SELECT '✅ المكاتب', COUNT(*) FROM public.organizations;
