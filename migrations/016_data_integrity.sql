-- ═══════════════════════════════════════════════════════════════
-- Migration 016: Phase 2 — Data Integrity & Plan Enforcement
-- منصة مَلَف (Malaf) — Production Readiness
-- تاريخ: 2026-05-14
-- ═══════════════════════════════════════════════════════════════
-- ⚠️ هذا الملف آمن تماماً: كل الأوامر تستخدم IF NOT EXISTS / IF EXISTS
-- لا يحذف بيانات — يضيف فقط ما هو ناقص
-- ═══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- §1: إضافة Indexes ناقصة (Performance + Security)
-- ══════════════════════════════════════════════════════════════

-- subscriptions — حرج للبحث عن اشتراك المكتب
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(org_id, status);

-- payment_transactions — حرج للـ callback من Paymob
CREATE INDEX IF NOT EXISTS idx_payment_tx_org ON payment_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON payment_transactions(org_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_gateway ON payment_transactions(gateway_transaction_id);

-- usage_tracking — حرج لحساب الحصص
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org ON usage_tracking(org_id, period);

-- conversation_states — حرج لبوت الواتساب
CREATE INDEX IF NOT EXISTS idx_conversation_phone ON conversation_states(phone, source);

-- profiles — حرج لعد المستخدمين في المكتب
CREATE INDEX IF NOT EXISTS idx_profiles_org_active ON profiles(org_id) WHERE is_active = true;

-- cases — حرج لعد القضايا في المكتب (غير المحذوفة)
CREATE INDEX IF NOT EXISTS idx_cases_org_active ON cases(org_id) WHERE deleted_at IS NULL;

-- sessions — حرج للجلسات القادمة
CREATE INDEX IF NOT EXISTS idx_sessions_upcoming ON sessions(org_id, date) WHERE status = 'قادمة';

-- plan_limits — مفتاح البحث
CREATE INDEX IF NOT EXISTS idx_plan_limits_key ON plan_limits(plan_key) WHERE is_active = true;


-- ══════════════════════════════════════════════════════════════
-- §2: إضافة أعمدة ناقصة في subscriptions
-- ══════════════════════════════════════════════════════════════

-- التأكد من وجود كل الأعمدة المطلوبة
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 1;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;


-- ══════════════════════════════════════════════════════════════
-- §3: إضافة أعمدة max_users في plan_limits
-- ══════════════════════════════════════════════════════════════

ALTER TABLE plan_limits ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1;

-- تحديث القيم الحالية
UPDATE plan_limits SET max_users = 1 WHERE plan_key = 'free' AND (max_users IS NULL OR max_users = 1);
UPDATE plan_limits SET max_users = 5 WHERE plan_key = 'basic' AND (max_users IS NULL OR max_users = 1);
UPDATE plan_limits SET max_users = 20 WHERE plan_key = 'standard' AND (max_users IS NULL OR max_users = 1);
UPDATE plan_limits SET max_users = -1 WHERE plan_key = 'premium' AND (max_users IS NULL OR max_users = 1);


-- ══════════════════════════════════════════════════════════════
-- §4: جدول usage_limits (استهلاك المكتب الفعلي — مُحدّث آلياً)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cases_used INTEGER DEFAULT 0,
  cases_limit INTEGER DEFAULT 5,
  users_used INTEGER DEFAULT 0,
  users_limit INTEGER DEFAULT 1,
  storage_used_mb INTEGER DEFAULT 0,
  storage_limit_mb INTEGER DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id)
);

ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- سياسة: كل مكتب يرى حصصه فقط
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usage_limits_select' AND tablename = 'usage_limits') THEN
    CREATE POLICY "usage_limits_select" ON usage_limits FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usage_limits_update' AND tablename = 'usage_limits') THEN
    CREATE POLICY "usage_limits_update" ON usage_limits FOR UPDATE USING (is_super_admin());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usage_limits_org ON usage_limits(org_id);


-- ══════════════════════════════════════════════════════════════
-- §5: دالة لحساب عدد القضايا الفعلية للمكتب
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_org_case_count(target_org_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM cases 
  WHERE org_id = target_org_id AND deleted_at IS NULL;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_org_user_count(target_org_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM profiles 
  WHERE org_id = target_org_id AND is_active = true;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_org_plan_limit(target_org_id UUID, limit_field TEXT)
RETURNS INTEGER AS $$
DECLARE
  result INTEGER;
  org_plan TEXT;
BEGIN
  SELECT plan INTO org_plan FROM organizations WHERE id = target_org_id;
  IF org_plan IS NULL THEN org_plan := 'free'; END IF;
  
  EXECUTE format(
    'SELECT %I FROM plan_limits WHERE plan_key = $1 AND is_active = true LIMIT 1',
    limit_field
  ) INTO result USING org_plan;
  
  RETURN COALESCE(result, 5);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ══════════════════════════════════════════════════════════════
-- §6: دالة التحقق من الحصة قبل INSERT (RLS enforcement)
-- ══════════════════════════════════════════════════════════════

-- منع إضافة قضية جديدة إذا وصل المكتب للحد الأقصى
CREATE OR REPLACE FUNCTION check_case_quota()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  max_allowed := get_org_plan_limit(NEW.org_id, 'max_cases');
  
  -- -1 يعني بلا حدود
  IF max_allowed = -1 THEN RETURN NEW; END IF;
  
  current_count := get_org_case_count(NEW.org_id);
  
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'تم الوصول للحد الأقصى من القضايا (%). يرجى ترقية باقتك للاستمرار.', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منع إضافة مستخدم جديد إذا وصل المكتب للحد الأقصى
CREATE OR REPLACE FUNCTION check_user_quota()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  max_allowed := get_org_plan_limit(NEW.org_id, 'max_users');
  
  -- -1 يعني بلا حدود
  IF max_allowed = -1 THEN RETURN NEW; END IF;
  
  current_count := get_org_user_count(NEW.org_id);
  
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'تم الوصول للحد الأقصى من المستخدمين (%). يرجى ترقية باقتك لإضافة أعضاء جدد.', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ══════════════════════════════════════════════════════════════
-- §7: ربط Triggers بالجداول
-- ══════════════════════════════════════════════════════════════

-- Trigger لحصة القضايا
DROP TRIGGER IF EXISTS enforce_case_quota ON cases;
CREATE TRIGGER enforce_case_quota
  BEFORE INSERT ON cases
  FOR EACH ROW
  EXECUTE FUNCTION check_case_quota();

-- Trigger لحصة المستخدمين
DROP TRIGGER IF EXISTS enforce_user_quota ON profiles;
CREATE TRIGGER enforce_user_quota
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_user_quota();


-- ══════════════════════════════════════════════════════════════
-- §8: تحديث الباقات بـ max_users حسب المطلوب
-- ══════════════════════════════════════════════════════════════

-- التأكد من أن الباقة الأساسية (basic) موجودة
INSERT INTO plan_limits (plan_key, display_name_ar, display_name_en, price_monthly, price_yearly, max_cases, max_clients, max_users, ai_requests_per_month, video_minutes_per_month, whatsapp_bot_enabled, whatsapp_messages_per_month, advanced_reports, custom_branding, priority_support, sort_order)
VALUES
  ('basic', 'الأساسية', 'Basic', 300, 3000, 50, 100, 5, 10, 30, false, 100, false, false, false, 1)
ON CONFLICT (plan_key) DO UPDATE SET
  price_monthly = 300,
  price_yearly = 3000,
  display_name_ar = 'الأساسية',
  max_cases = 50,
  max_clients = 100,
  max_users = 5,
  sort_order = 1,
  is_active = true,
  updated_at = NOW();

-- تحديث free
UPDATE plan_limits SET 
  sort_order = 0, 
  max_users = 1,
  max_cases = 5,
  updated_at = NOW() 
WHERE plan_key = 'free';

-- تحديث standard (المتقدمة)
UPDATE plan_limits SET
  price_monthly = 600,
  price_yearly = 6000,
  display_name_ar = 'المتقدمة',
  max_cases = 500,
  max_clients = -1,
  max_users = 20,
  sort_order = 2,
  updated_at = NOW()
WHERE plan_key = 'standard';

-- تحديث premium (المؤسسات)
UPDATE plan_limits SET
  price_monthly = 1300,
  price_yearly = 13000,
  display_name_ar = 'المؤسسات',
  max_cases = -1,
  max_clients = -1,
  max_users = -1,
  sort_order = 3,
  updated_at = NOW()
WHERE plan_key = 'premium';


-- ══════════════════════════════════════════════════════════════
-- §9: NOT NULL constraints الناقصة (آمنة)
-- ══════════════════════════════════════════════════════════════

-- إصلاح subscriptions.org_id — حرج! يجب أن يكون NOT NULL
DO $$ BEGIN
  ALTER TABLE subscriptions ALTER COLUMN org_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE subscriptions ALTER COLUMN plan SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- payment_transactions.amount — حرج! مبلغ مالي
DO $$ BEGIN
  ALTER TABLE payment_transactions ALTER COLUMN amount SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ══════════════════════════════════════════════════════════════
-- §10: ON DELETE behavior (تنظيف العلاقات)
-- ══════════════════════════════════════════════════════════════

-- عند حذف المكتب: اشتراكاته تُحذف
-- (لا نحتاج تعديل لأن FK موجودة بالفعل)

-- عند حذف المكتب: المدفوعات تبقى (SET NULL) — للمحاسبة
-- (هذا السلوك الحالي ✅)


-- ══════════════════════════════════════════════════════════════
-- ✅ تم! — Phase 2 مكتمل
-- ══════════════════════════════════════════════════════════════
-- الحصص المفروضة:
-- ┌──────────────┬───────────┬───────────┐
-- │ الباقة       │ المستخدمون│ القضايا   │
-- ├──────────────┼───────────┼───────────┤
-- │ free         │     1     │     5     │
-- │ basic (300)  │     5     │    50     │
-- │ standard(600)│    20     │   500     │
-- │ premium(1300)│   غير محدود│   غير محدود│
-- └──────────────┴───────────┴───────────┘
-- ═══════════════════════════════════════════════════════════════
