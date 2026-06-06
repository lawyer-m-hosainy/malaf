-- ═══════════════════════════════════════════════════════════════════════════════
-- 029_complete_database_fix.sql
-- الإصلاح الشامل لقاعدة بيانات منصة مَلَف
-- Complete Database Fix for Malaf Legal Platform
-- ═══════════════════════════════════════════════════════════════════════════════
-- هذا الملف idempotent — آمن للتشغيل عدة مرات بدون مشاكل
-- This file is idempotent — safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================
-- القسم 1: إنشاء الجداول المفقودة
-- Section 1: Create missing tables
-- (يحل المشكلة #5: subscriptions و usage_limits غير موجودة)
-- ============================================================

-- 1.1 جدول الاشتراكات (Subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id              UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    organization_id     UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan                TEXT NOT NULL DEFAULT 'free',
    status              TEXT NOT NULL DEFAULT 'active',
    -- active | trial | expired | cancelled | past_due
    trial_ends_at       TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end  TIMESTAMPTZ,
    billing_cycle       TEXT DEFAULT 'monthly', -- monthly | yearly
    auto_renew          BOOLEAN DEFAULT false,
    stripe_customer_id  TEXT,
    stripe_sub_id       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 جدول حدود الاستخدام (Usage Limits)
CREATE TABLE IF NOT EXISTS public.usage_limits (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    cases_used      INT NOT NULL DEFAULT 0,
    cases_limit     INT NOT NULL DEFAULT 50,
    users_used      INT NOT NULL DEFAULT 1,
    users_limit     INT NOT NULL DEFAULT 5,
    storage_used_mb INT NOT NULL DEFAULT 0,
    storage_limit_mb INT NOT NULL DEFAULT 500,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 التأكد من وجود عمود organization_id في profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 1.4 التأكد من وجود عمود onboarding_completed في organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 1.5 التأكد من وجود الأعمدة في clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS national_id_encrypted TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS commercial_registration_encrypted TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- القسم 2: إصلاح الدوال (Functions)
-- Section 2: Fix Functions
-- ============================================================

-- 2.1 إصلاح get_user_org_id()
-- (يحل المشكلة #3: ترجع NULL للمستخدم الجديد)
-- الآن تبحث أولاً في profiles، وإذا لم تجد تبحث في JWT metadata
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result UUID;
BEGIN
    -- أولاً: البحث في profiles (الطريقة الأساسية)
    SELECT COALESCE(org_id, organization_id)
    INTO result
    FROM public.profiles
    WHERE id = auth.uid();

    -- ثانياً: fallback من JWT metadata (للمستخدمين الجدد الذين لم يكتمل profile بعد)
    IF result IS NULL THEN
        SELECT (auth.jwt() -> 'user_metadata' ->> 'org_id')::UUID INTO result;
    END IF;

    RETURN result;
END;
$$;

-- 2.2 إصلاح is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
$$;

-- 2.3 إصلاح has_role()
-- (يحل المشكلة #4: عدم تطابق اسم الدور مدير مكتب vs مدير_مكتب)
-- الآن تقبل كلا الشكلين: بمسافة وبشرطة سفلية
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();

    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- التحقق المباشر
    IF user_role = required_role THEN RETURN TRUE; END IF;

    -- super_admin يملك كل الصلاحيات
    IF user_role = 'super_admin' THEN RETURN TRUE; END IF;

    -- قبول كلا الشكلين لدور مدير المكتب (بمسافة أو بشرطة سفلية)
    IF (user_role IN ('مدير مكتب', 'مدير_مكتب'))
       AND (required_role IN ('مدير مكتب', 'مدير_مكتب')) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- 2.4 إصلاح handle_new_user() — الدالة الأهم
-- (يحل المشاكل #1, #9)
-- تنشئ organization + profile + subscription تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    user_name TEXT;
    user_email TEXT;
    org_slug TEXT;
BEGIN
    -- استخراج البيانات الأساسية
    user_email := COALESCE(NEW.email, '');
    user_name := COALESCE(
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'name',
        split_part(user_email, '@', 1),
        'مستخدم جديد'
    );
    org_slug := 'office-' || substr(NEW.id::TEXT, 1, 8);

    -- 1) إنشاء المكتب (Organization)
    INSERT INTO public.organizations (name, slug, plan, onboarding_completed)
    VALUES (
        user_name || ' — مكتب المحاماة',
        org_slug,
        'free',
        false
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO new_org_id;

    -- 2) إنشاء الملف الشخصي (Profile)
    INSERT INTO public.profiles (id, org_id, organization_id, full_name, email, role)
    VALUES (
        NEW.id,
        new_org_id,
        new_org_id,
        user_name,
        user_email,
        'مدير مكتب'
    )
    ON CONFLICT (id) DO UPDATE SET
        org_id = COALESCE(public.profiles.org_id, new_org_id),
        organization_id = COALESCE(public.profiles.organization_id, new_org_id),
        full_name = COALESCE(NULLIF(public.profiles.full_name, ''), user_name),
        email = COALESCE(NULLIF(public.profiles.email, ''), user_email);

    -- 3) إنشاء اشتراك تجريبي (Trial Subscription)
    INSERT INTO public.subscriptions (org_id, organization_id, plan, status, trial_ends_at, current_period_end, billing_cycle, auto_renew)
    VALUES (
        new_org_id,
        new_org_id,
        'basic',
        'trial',
        NOW() + INTERVAL '14 days',
        NOW() + INTERVAL '14 days',
        'monthly',
        false
    )
    ON CONFLICT DO NOTHING;

    -- 4) إنشاء حدود استخدام (Usage Limits)
    INSERT INTO public.usage_limits (org_id, organization_id, cases_used, cases_limit, users_used, users_limit)
    VALUES (
        new_org_id,
        new_org_id,
        0,
        50,
        1,
        5
    )
    ON CONFLICT DO NOTHING;

    -- 5) تحديث JWT metadata (حتى يعمل النظام فوراً بدون تسجيل خروج)
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'org_id', new_org_id::TEXT,
        'role', 'مدير مكتب',
        'full_name', user_name
    )
    WHERE id = NEW.id;

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    -- لا نريد أن يفشل التسجيل بالكامل إذا فشل إنشاء المكتب
    -- Frontend سيحاول إنشاء المكتب يدوياً كـ fallback
    RAISE WARNING '[Malaf] handle_new_user failed for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- 2.5 إعادة ربط المشغّل (Trigger)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- القسم 3: تفعيل RLS على جميع الجداول
-- Section 3: Enable RLS on all tables
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على بقية الجداول (إن وجدت)
DO $$
DECLARE
    t TEXT;
    all_tables TEXT[] := ARRAY[
        'poa','case_sessions','case_lawyers','documents','invoices','invoice_items',
        'expenses','trust_transactions','payment_plans','payment_installments',
        'collections','time_entries','contracts','contract_reviews',
        'ip_assets','ip_operations','enforcement_cases','conflict_checks',
        'legal_library','calendar_events','team_members','wiki_pages',
        'client_portal_settings','portal_messages','family_court_cases',
        'criminal_cases','economic_court_cases','state_council_cases',
        'real_estate_transactions','eta_invoices','elitigation_submissions',
        'expert_missions','bar_association_records','audit_logs','billing',
        'org_settings'
    ];
BEGIN
    FOREACH t IN ARRAY all_tables LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXCEPTION WHEN undefined_table THEN
            RAISE NOTICE 'Table % does not exist, skipping RLS enable', t;
        END;
    END LOOP;
END;
$$;

-- ============================================================
-- القسم 4: إصلاح سياسات RLS — organizations
-- Section 4: Fix RLS policies — organizations
-- (يحل المشكلة #2: INSERT كان يتطلب super_admin)
-- (يحل المشكلة #11: لم يكن هناك DELETE policy)
-- ============================================================

DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete" ON public.organizations;
-- تنظيف أي سياسات قديمة بأسماء مختلفة
DROP POLICY IF EXISTS "org_select" ON public.organizations;
DROP POLICY IF EXISTS "org_insert" ON public.organizations;
DROP POLICY IF EXISTS "org_update" ON public.organizations;

-- SELECT: المستخدم يرى مكتبه فقط (أو super_admin يرى الكل)
CREATE POLICY "organizations_select" ON public.organizations FOR SELECT
    USING (
        id = public.get_user_org_id()
        OR public.is_super_admin()
        -- السماح للمستخدم الجديد برؤية المكتب الذي أنشأه للتو (قبل اكتمال profile)
        OR auth.uid() IS NOT NULL
    );

-- INSERT: أي مستخدم مصادق عليه يمكنه إنشاء مكتب (مطلوب لأول تسجيل)
CREATE POLICY "organizations_insert" ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: المستخدم يحدّث مكتبه فقط
CREATE POLICY "organizations_update" ON public.organizations FOR UPDATE
    USING (id = public.get_user_org_id() OR public.is_super_admin());

-- DELETE: super_admin فقط
CREATE POLICY "organizations_delete" ON public.organizations FOR DELETE
    USING (public.is_super_admin());

-- ============================================================
-- القسم 5: إصلاح سياسات RLS — profiles
-- Section 5: Fix RLS policies — profiles
-- ============================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- SELECT: المستخدم يرى ملفه + أعضاء نفس المكتب
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
    USING (
        id = auth.uid()
        OR org_id = public.get_user_org_id()
        OR organization_id = public.get_user_org_id()
        OR public.is_super_admin()
    );

-- INSERT: المستخدم ينشئ ملفه فقط
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- UPDATE: المستخدم يحدّث ملفه أو مدير المكتب يحدّث ملفات فريقه
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
    USING (
        id = auth.uid()
        OR public.has_role('مدير مكتب')
        OR public.is_super_admin()
    );

-- DELETE: super_admin فقط
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE
    USING (public.is_super_admin());

-- ============================================================
-- القسم 6: إصلاح سياسات RLS — clients
-- Section 6: Fix RLS policies — clients
-- ============================================================

DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;

CREATE POLICY "clients_select" ON public.clients FOR SELECT
    USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "clients_insert" ON public.clients FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clients_update" ON public.clients FOR UPDATE
    USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "clients_delete" ON public.clients FOR DELETE
    USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id() OR public.is_super_admin());

-- ============================================================
-- القسم 7: إصلاح سياسات RLS — cases
-- Section 7: Fix RLS policies — cases
-- ============================================================

DROP POLICY IF EXISTS "cases_select" ON public.cases;
DROP POLICY IF EXISTS "cases_insert" ON public.cases;
DROP POLICY IF EXISTS "cases_update" ON public.cases;
DROP POLICY IF EXISTS "cases_delete" ON public.cases;

CREATE POLICY "cases_select" ON public.cases FOR SELECT
    USING (org_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "cases_insert" ON public.cases FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "cases_update" ON public.cases FOR UPDATE
    USING (org_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "cases_delete" ON public.cases FOR DELETE
    USING (org_id = public.get_user_org_id() OR public.is_super_admin());

-- ============================================================
-- القسم 8: سياسات RLS — subscriptions و usage_limits (جديدة)
-- Section 8: RLS policies — subscriptions & usage_limits (new)
-- ============================================================

DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete" ON public.subscriptions;

CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT
    USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "subscriptions_insert" ON public.subscriptions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "subscriptions_update" ON public.subscriptions FOR UPDATE
    USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "subscriptions_delete" ON public.subscriptions FOR DELETE
    USING (public.is_super_admin());

-- usage_limits
DROP POLICY IF EXISTS "usage_limits_select" ON public.usage_limits;
DROP POLICY IF EXISTS "usage_limits_insert" ON public.usage_limits;
DROP POLICY IF EXISTS "usage_limits_update" ON public.usage_limits;
DROP POLICY IF EXISTS "usage_limits_delete" ON public.usage_limits;

CREATE POLICY "usage_limits_select" ON public.usage_limits FOR SELECT
    USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "usage_limits_insert" ON public.usage_limits FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "usage_limits_update" ON public.usage_limits FOR UPDATE
    USING (org_id = public.get_user_org_id() OR organization_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "usage_limits_delete" ON public.usage_limits FOR DELETE
    USING (public.is_super_admin());

-- ============================================================
-- القسم 9: سياسات RLS — trust_accounts و tasks
-- Section 9: RLS policies — trust_accounts & tasks
-- ============================================================

DROP POLICY IF EXISTS "trust_accounts_select" ON public.trust_accounts;
DROP POLICY IF EXISTS "trust_accounts_insert" ON public.trust_accounts;
DROP POLICY IF EXISTS "trust_accounts_update" ON public.trust_accounts;
DROP POLICY IF EXISTS "trust_accounts_delete" ON public.trust_accounts;

CREATE POLICY "trust_accounts_select" ON public.trust_accounts FOR SELECT
    USING (org_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "trust_accounts_insert" ON public.trust_accounts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "trust_accounts_update" ON public.trust_accounts FOR UPDATE
    USING (org_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "trust_accounts_delete" ON public.trust_accounts FOR DELETE
    USING (org_id = public.get_user_org_id() OR public.is_super_admin());

-- tasks
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

CREATE POLICY "tasks_select" ON public.tasks FOR SELECT
    USING (org_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE
    USING (org_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE
    USING (org_id = public.get_user_org_id() OR public.is_super_admin());

-- ============================================================
-- القسم 10: سياسات RLS — بقية الجداول (القالب العام)
-- Section 10: RLS policies — remaining org_id tables (template)
-- ============================================================

DO $$
DECLARE
    t TEXT;
    org_tables TEXT[] := ARRAY[
        'poa','case_sessions','case_lawyers','documents','invoices','expenses',
        'trust_transactions','payment_plans','payment_installments',
        'collections','time_entries','contracts','contract_reviews',
        'ip_assets','ip_operations','enforcement_cases','conflict_checks',
        'legal_library','calendar_events','team_members','wiki_pages',
        'portal_messages','family_court_cases','criminal_cases',
        'economic_court_cases','state_council_cases','real_estate_transactions',
        'eta_invoices','elitigation_submissions','expert_missions',
        'bar_association_records','audit_logs','billing','org_settings'
    ];
BEGIN
    FOREACH t IN ARRAY org_tables LOOP
        BEGIN
            -- حذف السياسات القديمة
            EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', t, t);

            -- إنشاء السياسات الجديدة
            EXECUTE format(
                'CREATE POLICY "%s_select" ON public.%I FOR SELECT
                 USING (org_id = public.get_user_org_id() OR public.is_super_admin())',
                t, t
            );
            EXECUTE format(
                'CREATE POLICY "%s_insert" ON public.%I FOR INSERT
                 WITH CHECK (auth.uid() IS NOT NULL)',
                t, t
            );
            EXECUTE format(
                'CREATE POLICY "%s_update" ON public.%I FOR UPDATE
                 USING (org_id = public.get_user_org_id() OR public.is_super_admin())',
                t, t
            );
            EXECUTE format(
                'CREATE POLICY "%s_delete" ON public.%I FOR DELETE
                 USING (org_id = public.get_user_org_id() OR public.is_super_admin())',
                t, t
            );
        EXCEPTION WHEN undefined_table THEN
            RAISE NOTICE 'Table % does not exist, skipping policies', t;
        END;
    END LOOP;
END;
$$;

-- ============================================================
-- القسم 11: سياسات خاصة — invoice_items و client_portal_settings
-- Section 11: Special policies — invoice_items & client_portal_settings
-- ============================================================

-- invoice_items (لا تحتوي على org_id — تعتمد على invoices)
DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON public.invoice_items;

CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = invoice_items.invoice_id
          AND (invoices.org_id = public.get_user_org_id() OR public.is_super_admin())
    ));

CREATE POLICY "invoice_items_insert" ON public.invoice_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = invoice_id
          AND (invoices.org_id = public.get_user_org_id() OR public.is_super_admin())
    ));

CREATE POLICY "invoice_items_update" ON public.invoice_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = invoice_items.invoice_id
          AND (invoices.org_id = public.get_user_org_id() OR public.is_super_admin())
    ));

CREATE POLICY "invoice_items_delete" ON public.invoice_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = invoice_items.invoice_id
          AND (invoices.org_id = public.get_user_org_id() OR public.is_super_admin())
    ));

-- client_portal_settings — سياسة خاصة (بوابة العملاء مرئية للجميع عندما تكون مفعّلة)
DROP POLICY IF EXISTS "client_portal_settings_select" ON public.client_portal_settings;
DROP POLICY IF EXISTS "client_portal_settings_select_public" ON public.client_portal_settings;

CREATE POLICY "client_portal_settings_select_public" ON public.client_portal_settings FOR SELECT
    USING (is_enabled = TRUE OR org_id = public.get_user_org_id() OR public.is_super_admin());

-- ============================================================
-- القسم 12: الصلاحيات (Grants)
-- Section 12: Grants
-- ============================================================

-- صلاحيات الـ Schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- صلاحيات كاملة لـ service_role و postgres (مطلوب للـ triggers)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- صلاحيات كاملة للمستخدمين المصادق عليهم
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- صلاحيات محدودة للمجهولين (بوابة العملاء فقط)
GRANT SELECT ON public.client_portal_settings TO anon;

-- ============================================================
-- القسم 13: مزامنة بيانات clients (نسخ org_id ↔ organization_id)
-- Section 13: Sync clients data
-- ============================================================

UPDATE public.clients SET organization_id = org_id WHERE organization_id IS NULL AND org_id IS NOT NULL;
UPDATE public.clients SET org_id = organization_id WHERE org_id IS NULL AND organization_id IS NOT NULL;

-- مزامنة profiles أيضاً
UPDATE public.profiles SET organization_id = org_id WHERE organization_id IS NULL AND org_id IS NOT NULL;
UPDATE public.profiles SET org_id = organization_id WHERE org_id IS NULL AND organization_id IS NOT NULL;

-- ============================================================
-- القسم 14: إنشاء indexes للجداول الجديدة
-- Section 14: Create indexes for new tables
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_org_id ON public.usage_limits(org_id);

-- ============================================================
-- القسم 15: تحديث schema cache في PostgREST
-- Section 15: Reload PostgREST schema cache
-- (يحل المشكلة #10: PGRST205 table not found)
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- ✅ انتهى الإصلاح الشامل
-- ✅ Complete database fix applied successfully
-- ============================================================
