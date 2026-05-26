-- ═══════════════════════════════════════════════════════════════
-- SLO Metrics Schema for malaf.pro
-- Migration: 027_slo_metrics.sql
-- Purpose: Store SLO measurements, Error Budget tracking, and incident logs
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. SLO Metrics Table ──────────────────────────────────────
-- تخزين قياسات SLO بشكل دوري (كل ساعة أو يومياً)
CREATE TABLE IF NOT EXISTS slo_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- SLO identification
  slo_name TEXT NOT NULL CHECK (slo_name IN (
    'availability',
    'latency_p95',
    'latency_p99',
    'eta_integration'
  )),
  
  -- Measurement window
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  -- Raw metrics
  total_requests BIGINT NOT NULL CHECK (total_requests >= 0),
  successful_requests BIGINT NOT NULL CHECK (successful_requests >= 0),
  failed_requests BIGINT GENERATED ALWAYS AS (total_requests - successful_requests) STORED,
  
  -- SLO calculations
  slo_target DECIMAL(6,5) NOT NULL CHECK (slo_target > 0 AND slo_target < 1),
  current_rate DECIMAL(6,5) NOT NULL CHECK (current_rate >= 0 AND current_rate <= 1),
  
  -- Error Budget
  budget_total DECIMAL(12,2) NOT NULL,
  budget_consumed DECIMAL(12,2) NOT NULL,
  budget_remaining DECIMAL(12,2) GENERATED ALWAYS AS (budget_total - budget_consumed) STORED,
  budget_consumed_pct DECIMAL(6,2) NOT NULL CHECK (budget_consumed_pct >= 0),
  
  -- Burn rate
  burn_rate DECIMAL(8,2) DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'exhausted')),
  
  -- Policy action
  policy_action TEXT CHECK (policy_action IN (
    'normal_development',
    'reduce_deployments',
    'freeze_features',
    'emergency_freeze'
  )),
  
  -- Constraints
  CONSTRAINT valid_window CHECK (window_end > window_start),
  CONSTRAINT valid_requests CHECK (successful_requests <= total_requests)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_slo_metrics_org_name 
  ON slo_metrics(org_id, slo_name);
CREATE INDEX IF NOT EXISTS idx_slo_metrics_recorded_at 
  ON slo_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_slo_metrics_status 
  ON slo_metrics(status) WHERE status IN ('critical', 'exhausted');
CREATE INDEX IF NOT EXISTS idx_slo_metrics_window 
  ON slo_metrics(slo_name, window_start, window_end);

-- ─── 2. SLO Incidents Table ───────────────────────────────────
-- تسجيل الحوادث المرتبطة بانتهاك SLO
CREATE TABLE IF NOT EXISTS slo_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Incident details
  slo_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical', 'exhausted')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Impact
  duration_minutes INTEGER,
  budget_impact_pct DECIMAL(6,2),
  affected_requests BIGINT DEFAULT 0,
  
  -- Resolution
  root_cause TEXT,
  resolution TEXT,
  post_mortem_url TEXT,
  
  -- Who handled it
  assigned_to UUID REFERENCES profiles(id),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mitigated', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_slo_incidents_org 
  ON slo_incidents(org_id, slo_name);
CREATE INDEX IF NOT EXISTS idx_slo_incidents_status 
  ON slo_incidents(status) WHERE status != 'resolved';

-- ─── 3. Deployment Gate Log ───────────────────────────────────
-- تسجيل قرارات بوابة النشر
CREATE TABLE IF NOT EXISTS deployment_gate_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Decision
  allowed BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  blockers JSONB DEFAULT '[]'::jsonb,
  
  -- Context
  commit_sha TEXT,
  branch TEXT,
  requested_by UUID REFERENCES profiles(id),
  
  -- SLO snapshot at time of check
  slo_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_deployment_gate_checked_at 
  ON deployment_gate_log(checked_at DESC);

-- ─── 4. Monthly SLO Reviews ──────────────────────────────────
-- تخزين المراجعات الشهرية
CREATE TABLE IF NOT EXISTS slo_monthly_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Period
  review_month DATE NOT NULL, -- أول يوم في الشهر
  
  -- Summary
  overall_health TEXT NOT NULL CHECK (overall_health IN ('healthy', 'warning', 'critical', 'exhausted')),
  recommendation TEXT NOT NULL,
  
  -- SLO details as JSON
  slo_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  incidents JSONB DEFAULT '[]'::jsonb,
  
  -- Decision
  decision TEXT CHECK (decision IN (
    'resume_normal',
    'reduce_deployments',
    'feature_freeze',
    'emergency_review'
  )),
  decision_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  
  -- Unique per org per month
  UNIQUE(org_id, review_month)
);

-- ─── 5. RLS Policies ─────────────────────────────────────────
ALTER TABLE slo_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE slo_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_gate_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE slo_monthly_reviews ENABLE ROW LEVEL SECURITY;

-- SLO Metrics: Read by org members, write by system/admin
CREATE POLICY "slo_metrics_org_read" ON slo_metrics
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "slo_metrics_system_write" ON slo_metrics
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- SLO Incidents: Full access for org members
CREATE POLICY "slo_incidents_org_access" ON slo_incidents
  FOR ALL USING (org_id = get_user_org_id());

-- Deployment Gate: Read by org, write by system
CREATE POLICY "deployment_gate_org_read" ON deployment_gate_log
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "deployment_gate_system_write" ON deployment_gate_log
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- Monthly Reviews: Full access for org members
CREATE POLICY "slo_reviews_org_access" ON slo_monthly_reviews
  FOR ALL USING (org_id = get_user_org_id());

-- ─── 6. Helper Function: Get Latest SLO Status ───────────────
CREATE OR REPLACE FUNCTION get_latest_slo_status(p_org_id UUID)
RETURNS TABLE (
  slo_name TEXT,
  current_rate DECIMAL,
  budget_consumed_pct DECIMAL,
  status TEXT,
  burn_rate DECIMAL,
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (sm.slo_name)
    sm.slo_name,
    sm.current_rate,
    sm.budget_consumed_pct,
    sm.status,
    sm.burn_rate,
    sm.recorded_at
  FROM slo_metrics sm
  WHERE sm.org_id = p_org_id
  ORDER BY sm.slo_name, sm.recorded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 7. Helper Function: Check Deployment Allowed ────────────
CREATE OR REPLACE FUNCTION is_deployment_allowed(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_blocked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM slo_metrics
    WHERE org_id = p_org_id
      AND recorded_at > NOW() - INTERVAL '1 hour'
      AND status IN ('exhausted')
  ) INTO v_blocked;
  
  RETURN NOT v_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
