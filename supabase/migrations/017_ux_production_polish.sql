-- ═══════════════════════════════════════════════════════════════ 
 -- Migration 017: UX Production Polish — Onboarding & Organization Profile 
 -- ═══════════════════════════════════════════════════════════════ 
 -- التاريخ: 2026-05-14 
 -- الوصف: إضافة أعمدة البروفايل وحالة الإعداد للمكتب 
 
 BEGIN; 
 
 ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT; 
 ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bar_association_number TEXT; 
 ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE; 
 
 -- تحديث السجلات القديمة لتكون مكتملة حتى لا يظهر الـ Wizard للمكاتب الحالية 
 UPDATE organizations SET onboarding_completed = TRUE WHERE created_at < NOW() - INTERVAL '1 day'; 
 
 COMMENT ON COLUMN organizations.address IS 'العنوان الفعلي للمكتب - يُستخدم في المراسلات والفواتير'; 
 COMMENT ON COLUMN organizations.bar_association_number IS 'رقم القيد بنقابة المحامين (اختياري)'; 
 COMMENT ON COLUMN organizations.onboarding_completed IS 'تحديد ما إذا كان المكتب قد أكمل خطوات الإعداد الأولى'; 
 
 COMMIT;
