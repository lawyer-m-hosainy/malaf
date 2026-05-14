-- ═══════════════════════════════════════════════════════════════
-- Migration 017: UX Production Polish — Onboarding & Organization Profile
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bar_association_number TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- تحديث السجلات القديمة لتكون مكتملة حتى لا يظهر الـ Wizard للمكاتب الحالية
UPDATE organizations SET onboarding_completed = TRUE WHERE created_at < NOW() - INTERVAL '1 day';
