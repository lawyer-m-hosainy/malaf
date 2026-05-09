-- ═══════════════════════════════════════════════════════
-- Migration 006: نظام بوت المبيعات والاشتراكات
-- منصة مَلَف (Malaf)
-- ═══════════════════════════════════════════════════════

-- 1. جدول حالات المحادثة (تتبع سيناريو البيع)
CREATE TABLE IF NOT EXISTS conversation_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  source TEXT DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'facebook', 'web')),
  state TEXT DEFAULT 'new' CHECK (state IN ('new', 'greeted', 'asked_cases', 'interested', 'shown_plans', 'hesitant', 'paid', 'existing_client')),
  selected_plan TEXT,
  case_count_answer TEXT,
  follow_up_at TIMESTAMPTZ,
  follow_up_sent BOOLEAN DEFAULT FALSE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone, source)
);

-- 2. جدول صلاحيات وحدود الباقات (يُدار من لوحة التحكم)
CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_key TEXT UNIQUE NOT NULL, -- 'free', 'standard', 'premium'
  display_name_ar TEXT NOT NULL,
  display_name_en TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0, -- بالجنيه المصري
  price_yearly INTEGER DEFAULT 0,
  max_cases INTEGER DEFAULT 5,
  max_clients INTEGER DEFAULT 10,
  ai_requests_per_month INTEGER DEFAULT 0,
  video_minutes_per_month INTEGER DEFAULT 0,
  whatsapp_bot_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_messages_per_month INTEGER DEFAULT 0,
  advanced_reports BOOLEAN DEFAULT FALSE,
  custom_branding BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول تتبع الاستهلاك الشهري
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- '2026-05' format
  ai_requests_used INTEGER DEFAULT 0,
  video_minutes_used INTEGER DEFAULT 0,
  whatsapp_messages_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, period)
);

-- 4. جدول سجل المدفوعات (يستقبل callbacks من Paymob أو أي بوابة)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  gateway TEXT DEFAULT 'paymob', -- 'paymob', 'fawry', 'manual'
  gateway_transaction_id TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'EGP',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  payment_method TEXT, -- 'card', 'wallet', 'fawry'
  payer_phone TEXT,
  payer_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- تحديث جدول subscriptions الموجود
-- ═══════════════════════════════════════════════════════
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly'; -- 'monthly', 'yearly'
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ═══════════════════════════════════════════════════════
-- إدخال الباقات الافتراضية
-- ═══════════════════════════════════════════════════════
INSERT INTO plan_limits (plan_key, display_name_ar, display_name_en, price_monthly, price_yearly, max_cases, max_clients, ai_requests_per_month, video_minutes_per_month, whatsapp_bot_enabled, whatsapp_messages_per_month, advanced_reports, custom_branding, priority_support, sort_order)
VALUES
  ('free', 'تجريبية', 'Free', 0, 0, 5, 10, 0, 0, false, 0, false, false, false, 1),
  ('standard', 'الأساسية', 'Standard', 600, 5990, -1, -1, 30, 120, true, 500, false, false, false, 2),
  ('premium', 'المتقدمة', 'Premium', 1300, 12990, -1, -1, -1, -1, true, -1, true, true, true, 3)
ON CONFLICT (plan_key) DO NOTHING;
-- ملاحظة: -1 تعني "بلا حدود"

-- ═══════════════════════════════════════════════════════
-- Enable RLS
-- ═══════════════════════════════════════════════════════
ALTER TABLE conversation_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- conversation_states: الوصول عبر service_role فقط (البوت يستخدم service key)
CREATE POLICY "conv_states_service" ON conversation_states FOR ALL USING (true);

-- plan_limits: الجميع يقرأ، super_admin فقط يعدّل
CREATE POLICY "plan_limits_read" ON plan_limits FOR SELECT USING (true);
CREATE POLICY "plan_limits_admin" ON plan_limits FOR ALL USING (is_super_admin());

-- usage_tracking: كل مكتب يرى استهلاكه فقط
CREATE POLICY "usage_tracking_tenant" ON usage_tracking FOR ALL USING (org_id = get_user_org_id() OR is_super_admin());

-- payment_transactions: كل مكتب يرى مدفوعاته فقط
CREATE POLICY "payments_tenant" ON payment_transactions FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "payments_insert" ON payment_transactions FOR INSERT WITH CHECK (true); -- Service role inserts

-- ═══════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_conv_states_phone ON conversation_states(phone, source);
CREATE INDEX IF NOT EXISTS idx_conv_states_followup ON conversation_states(follow_up_at) WHERE follow_up_sent = false;
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_period ON usage_tracking(org_id, period);
CREATE INDEX IF NOT EXISTS idx_payment_tx_org ON payment_transactions(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_tx_gateway ON payment_transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(current_period_end) WHERE status = 'active';

-- Triggers
CREATE TRIGGER update_conv_states_modtime BEFORE UPDATE ON conversation_states FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_plan_limits_modtime BEFORE UPDATE ON plan_limits FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_usage_tracking_modtime BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE FUNCTION update_modified_column();
