/**
 * SLO Metrics Recorder — malaf.pro
 * ══════════════════════════════════
 * يسجّل قياسات SLO في Supabase بشكل دوري.
 * يُستخدم من server.js أو كـ cron job.
 */

import { SLO_DEFINITIONS, type SLO } from './slo-definitions';
import {
  calculateErrorBudget,
  checkBurnRateAlerts,
  type ErrorBudgetStatus,
  type BurnRateAlert,
} from './error-budget';

// ─── Types ───────────────────────────────────────────────────

export interface SLOMetricRecord {
  slo_name: string;
  window_start: string;
  window_end: string;
  total_requests: number;
  successful_requests: number;
  slo_target: number;
  current_rate: number;
  budget_total: number;
  budget_consumed: number;
  budget_consumed_pct: number;
  burn_rate: number;
  status: string;
  policy_action: string;
}

export interface MetricsSnapshot {
  availability: { total: number; successful: number };
  latency_p95: { total: number; withinThreshold: number };
  latency_p99: { total: number; withinThreshold: number };
  eta_integration: { total: number; successful: number };
}

// ─── Recorder ────────────────────────────────────────────────

/**
 * تحويل snapshot إلى سجلات SLO لتخزينها في Supabase.
 */
export function createSLORecords(
  snapshot: MetricsSnapshot,
  windowStart: Date,
  windowEnd: Date,
  elapsedDays: number
): { records: SLOMetricRecord[]; budgets: ErrorBudgetStatus[]; alerts: BurnRateAlert[] } {
  const records: SLOMetricRecord[] = [];
  const budgets: ErrorBudgetStatus[] = [];

  // Map snapshot to SLO metrics
  const mappings: Record<string, { total: number; failed: number }> = {
    availability: {
      total: snapshot.availability.total,
      failed: snapshot.availability.total - snapshot.availability.successful,
    },
    latency_p95: {
      total: snapshot.latency_p95.total,
      failed: snapshot.latency_p95.total - snapshot.latency_p95.withinThreshold,
    },
    latency_p99: {
      total: snapshot.latency_p99.total,
      failed: snapshot.latency_p99.total - snapshot.latency_p99.withinThreshold,
    },
    eta_integration: {
      total: snapshot.eta_integration.total,
      failed: snapshot.eta_integration.total - snapshot.eta_integration.successful,
    },
  };

  for (const [key, slo] of Object.entries(SLO_DEFINITIONS)) {
    const m = mappings[key];
    if (!m || m.total === 0) continue;

    const budget = calculateErrorBudget(slo as SLO, m.total, m.failed, elapsedDays);
    budgets.push(budget);

    records.push({
      slo_name: key,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      total_requests: m.total,
      successful_requests: m.total - m.failed,
      slo_target: slo.target,
      current_rate: parseFloat(budget.currentRate.toFixed(5)),
      budget_total: parseFloat(budget.budgetTotal.toFixed(2)),
      budget_consumed: parseFloat(budget.budgetConsumed.toFixed(2)),
      budget_consumed_pct: parseFloat((budget.consumptionRatio * 100).toFixed(2)),
      burn_rate: parseFloat(budget.burnRate.toFixed(2)),
      status: budget.status,
      policy_action: budget.policyAction,
    });
  }

  const alerts = checkBurnRateAlerts(budgets);

  return { records, budgets, alerts };
}

/**
 * حفظ السجلات في Supabase.
 */
export async function saveSLOMetrics(
  supabaseClient: { from: (table: string) => { insert: (data: unknown[]) => { error: unknown } } },
  orgId: string,
  records: SLOMetricRecord[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const rows = records.map((r) => ({
      ...r,
      org_id: orgId,
    }));

    const { error } = await supabaseClient
      .from('slo_metrics')
      .insert(rows);

    if (error) {
      console.error('❌ Failed to save SLO metrics:', error);
      return { success: false, error: String(error) };
    }

    console.log(`✅ Saved ${records.length} SLO metric records`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Error saving SLO metrics:', message);
    return { success: false, error: message };
  }
}

/**
 * تسجيل حادثة SLO.
 */
export async function logSLOIncident(
  supabaseClient: { from: (table: string) => { insert: (data: unknown[]) => { error: unknown } } },
  orgId: string,
  alert: BurnRateAlert
): Promise<void> {
  try {
    await supabaseClient.from('slo_incidents').insert([
      {
        org_id: orgId,
        slo_name: alert.sloName,
        severity: alert.severity,
        title: `${alert.type === 'fast_burn' ? 'Fast' : 'Slow'} Burn Rate Alert — ${alert.sloName}`,
        description: alert.message,
        status: 'open',
      },
    ]);
  } catch (err) {
    console.error('❌ Error logging SLO incident:', err);
  }
}
