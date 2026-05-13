-- ═══════════════════════════════════════════════════════
-- Migration 015: تحديث أسعار الباقات
-- منصة مَلَف (Malaf)
-- التاريخ: 14 مايو 2026
-- ═══════════════════════════════════════════════════════

-- 1. إضافة باقة أساسية (basic) بسعر 300 ج.م
INSERT INTO plan_limits (plan_key, display_name_ar, display_name_en, price_monthly, price_yearly, max_cases, max_clients, ai_requests_per_month, video_minutes_per_month, whatsapp_bot_enabled, whatsapp_messages_per_month, advanced_reports, custom_branding, priority_support, sort_order)
VALUES
  ('basic', 'الأساسية', 'Basic', 300, 3000, 50, 100, 10, 30, false, 100, false, false, false, 1)
ON CONFLICT (plan_key) DO UPDATE SET
  price_monthly = 300,
  price_yearly = 3000,
  display_name_ar = 'الأساسية',
  display_name_en = 'Basic',
  max_cases = 50,
  max_clients = 100,
  sort_order = 1,
  is_active = true,
  updated_at = NOW();

-- 2. تحديث الباقة المجانية (free) → sort_order = 0
UPDATE plan_limits SET sort_order = 0 WHERE plan_key = 'free';

-- 3. تحديث الباقة الأساسية (standard) → 600 ج.م (تأكيد)
UPDATE plan_limits SET
  price_monthly = 600,
  price_yearly = 6000,
  display_name_ar = 'المتقدمة',
  display_name_en = 'Standard',
  sort_order = 2,
  updated_at = NOW()
WHERE plan_key = 'standard';

-- 4. تحديث الباقة المتقدمة (premium) → 1300 ج.م (تأكيد)
UPDATE plan_limits SET
  price_monthly = 1300,
  price_yearly = 13000,
  display_name_ar = 'المؤسسات',
  display_name_en = 'Premium',
  sort_order = 3,
  updated_at = NOW()
WHERE plan_key = 'premium';
