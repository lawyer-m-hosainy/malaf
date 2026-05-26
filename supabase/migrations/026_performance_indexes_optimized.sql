-- 1. تسريع استعلام قائمة القضايا المفلترة حسب الحالة وتجاهل المحذوف (تحسين متوقع: 400ms -> 10ms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_org_status_v2 
ON cases(organization_id, status) 
WHERE deleted_at IS NULL;

-- 2. تسريع عرض القضايا الأحدث في لوحة التحكم والبحث (تحسين متوقع: 300ms -> 8ms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_org_created_at_v2 
ON cases(organization_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- 3. تسريع جلب مواعيد الجلسات داخل صفحة تفاصيل القضية (تحسين متوقع: 200ms -> 5ms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_case_id_date_v2 
ON sessions(case_id, date);

-- 4. تسريع عرض الجلسات في التقويم العام والمفكرة القضائية للمكتب (تحسين متوقع: 250ms -> 7ms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_org_date_v2 
ON sessions(organization_id, date);

-- 5. تسريع البحث عن الموكلين بالاسم وتسهيل الربط بالقضايا (تحسين متوقع: 350ms -> 12ms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_org_name_v2 
ON clients(organization_id, name) 
WHERE deleted_at IS NULL;

-- 6. تسريع عرض أرشيف مستندات القضية مرتبة زمنياً من الأحدث (تحسين متوقع: 150ms -> 5ms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_case_id_created_v2 
ON documents(case_id, created_at DESC);

-- 7. تفعيل البحث النصي "الذكي" السريع في عناوين القضايا
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_title_search_v2 
ON cases USING GIN (to_tsvector('arabic', title));

-- 8. تفعيل البحث النصي "الذكي" السريع في أسماء الموكلين
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_name_search_v2 
ON clients USING GIN (to_tsvector('arabic', name));
