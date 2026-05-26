# Database Performance & Indexing Strategy - malaf.pro

## 1. Optimized Index Creation Scripts

```sql
-- §1: تسريع استعلامات القضايا الرئيسية (Dashboard & Search)
-- يحسن استعلامات الفرز حسب التاريخ والتصفية حسب المكتب
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_org_created_v3 
ON public.cases(org_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- §2: تحسين البحث النصي الكامل باللغة العربية
-- يدعم البحث السريع في العناوين وأرقام القضايا
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_fulltext_v3 
ON public.cases USING GIN (
  to_tsvector('arabic', COALESCE(title, '') || ' ' || COALESCE(case_number, ''))
);

-- §3: تسريع التقارير المالية الشهرية
-- يحسن تجميع البيانات (GROUP BY) والتصفية حسب التاريخ (issued_at)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_date_v3 
ON public.invoices(org_id, issued_at DESC);

-- §4: تحسين البحث عن الجلسات القادمة
-- يحسن أداء التقويم وتنبيهات الجلسات
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_org_date_upcoming 
ON public.sessions(org_id, date) 
WHERE status = 'قادمة';
```

## 2. EXPLAIN ANALYZE Summary (Simulated for 10k+ rows)

### Query 1: Fetch Cases with Next Session
- **Before Index:** Seq Scan on `cases`, Join with `sessions`. Cost: ~4500. Time: ~320ms.
- **After Index:** Index Scan on `idx_cases_org_created_v3`. Cost: ~120. Time: ~12ms.
- **Improvement:** 96% reduction in execution time.

### Query 2: Full-Text Arabic Search
- **Before Index:** Filter with `to_tsvector` on the fly. Cost: ~8000. Time: ~1.2s.
- **After Index:** Bitmap Index Scan on `idx_cases_fulltext_v3`. Cost: ~400. Time: ~45ms.
- **Improvement:** 96% reduction in execution time.

## 3. Disaster Recovery Runbook (DR)

### RPO: 5 Minutes | RTO: 4 Hours

#### Step 1: Identification & Escalation
- Monitor `supabase.status` and `render.status`.
- If Data Loss is confirmed, escalate to "DR Mode".

#### Step 2: Restore Process (Supabase PITR)
1. Go to Supabase Dashboard -> Database -> Backups.
2. Select **Point-in-Time Recovery (PITR)**.
3. Choose the timestamp just before the corruption/incident.
4. Start the restore process (Estimated time: 30-60 mins depending on DB size).

#### Step 3: Verification
1. Run row count checks: `SELECT COUNT(*) FROM cases;`.
2. Verify latest 5 records in `audit_logs`.
3. Check RLS compliance: Test access with a non-admin user.

#### Step 4: Post-Recovery
1. Update DNS/API Keys if a new instance was created.
2. Notify users of the maintenance window completion.
3. Conduct Root Cause Analysis (RCA).

## 4. Monitoring Queries

```sql
-- 1. كشف الاستعلامات البطيئة (أكثر من 200ms)
SELECT query, calls, total_exec_time / calls as avg_time
FROM pg_stat_statements
WHERE total_exec_time / calls > 200
ORDER BY avg_time DESC
LIMIT 10;

-- 2. مراقبة حجم الجداول (Bloat Analysis)
SELECT relname, 100 * (relpages - (reltuples * 100 / 8192)) / relpages as bloat_pct
FROM pg_class
WHERE relpages > 10;
```
