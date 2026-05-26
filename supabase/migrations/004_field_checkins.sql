-- ═══════════════════════════════════════════════════════
-- Migration 004: Field Check-in System — مَلَف (Malaf)
-- ═══════════════════════════════════════════════════════
-- نظام تسجيل الحضور الميداني (المحاكم والمكاتب)
-- شغّل هذا الملف في: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── 1. المواقع المعروفة (محاكم + مكاتب) ──
CREATE TABLE IF NOT EXISTS known_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,                          -- "محكمة شمال القاهرة"
    type TEXT NOT NULL DEFAULT 'court',          -- court, office, registry, other
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 200,  -- نطاق التحقق (بالمتر)
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. سجل تسجيلات الحضور ──
CREATE TABLE IF NOT EXISTS field_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,                       -- Firebase UID
    user_name TEXT NOT NULL,                     -- اسم الموظف
    user_role TEXT DEFAULT 'lawyer',             -- lawyer, trainee, secretary, representative
    
    -- بيانات الموقع
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy_meters DOUBLE PRECISION,            -- دقة GPS
    
    -- التحقق من الموقع
    matched_location_id UUID REFERENCES known_locations(id),
    matched_location_name TEXT,                  -- "محكمة شمال القاهرة"
    distance_meters DOUBLE PRECISION,            -- المسافة من أقرب موقع معروف
    is_verified BOOLEAN DEFAULT false,           -- هل الموظف فعلاً في الموقع؟
    
    -- نوع التسجيل
    checkin_type TEXT NOT NULL DEFAULT 'arrival', -- arrival, departure, task_start, task_complete
    source TEXT NOT NULL DEFAULT 'app',          -- app, whatsapp, qr_code
    
    -- ربط بمهمة (اختياري)
    task_id TEXT,
    task_description TEXT,
    
    -- ملاحظات
    notes TEXT,
    photo_url TEXT,                              -- صورة إثبات (اختياري)
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_field_checkins_org_id ON field_checkins(org_id);
CREATE INDEX IF NOT EXISTS idx_field_checkins_user_id ON field_checkins(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_field_checkins_date ON field_checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_checkins_today ON field_checkins(org_id, created_at DESC) 
    WHERE created_at > now() - interval '24 hours';
CREATE INDEX IF NOT EXISTS idx_known_locations_org ON known_locations(org_id) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════
-- ✅ تم — شغّل مرة واحدة فقط في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════
