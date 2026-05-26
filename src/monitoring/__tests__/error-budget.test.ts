/**
 * Tests for Error Budget Calculator — malaf.pro
 */

import { describe, it, expect } from 'vitest';
import {
  calculateErrorBudget,
  calculateAllBudgets,
  checkBurnRateAlerts,
  generateMonthlyReport,
  canDeploy,
} from '../error-budget';
import { SLO_DEFINITIONS } from '../slo-definitions';

// ─── Test Helpers ────────────────────────────────────────────

const availabilitySLO = SLO_DEFINITIONS.availability;
const etaSLO = SLO_DEFINITIONS.eta_integration;

// ─── calculateErrorBudget ────────────────────────────────────

describe('calculateErrorBudget', () => {
  it('should return healthy status when no failures', () => {
    const result = calculateErrorBudget(availabilitySLO, 100000, 0, 15);
    expect(result.status).toBe('healthy');
    expect(result.currentRate).toBe(1);
    expect(result.budgetConsumed).toBe(0);
    expect(result.consumptionRatio).toBe(0);
    expect(result.policyAction).toBe('normal_development');
  });

  it('should return healthy status when within budget', () => {
    // 99.5% target → budget = 0.5% of 100,000 = 500 failures allowed
    // 100 failures = 20% of budget
    const result = calculateErrorBudget(availabilitySLO, 100000, 100, 15);
    expect(result.status).toBe('healthy');
    expect(result.consumptionRatio).toBeCloseTo(0.2, 5);
    expect(result.budgetRemaining).toBeCloseTo(400, 0);
  });

  it('should return warning when 50-90% budget consumed', () => {
    // 300 failures = 60% of 500 budget
    const result = calculateErrorBudget(availabilitySLO, 100000, 300, 15);
    expect(result.status).toBe('warning');
    expect(result.policyAction).toBe('reduce_deployments');
  });

  it('should return critical when 90-100% budget consumed', () => {
    // 470 failures = 94% of 500 budget
    const result = calculateErrorBudget(availabilitySLO, 100000, 470, 15);
    expect(result.status).toBe('critical');
    expect(result.policyAction).toBe('freeze_features');
  });

  it('should return exhausted when budget exceeded', () => {
    // 600 failures > 500 budget = 120% consumed
    const result = calculateErrorBudget(availabilitySLO, 100000, 600, 15);
    expect(result.status).toBe('exhausted');
    expect(result.policyAction).toBe('emergency_freeze');
    expect(result.consumptionRatio).toBeGreaterThan(1);
  });

  it('should handle zero total requests gracefully', () => {
    const result = calculateErrorBudget(availabilitySLO, 0, 0, 15);
    expect(result.status).toBe('healthy');
    expect(result.currentRate).toBe(1);
  });

  it('should calculate projected exhaustion date', () => {
    const result = calculateErrorBudget(availabilitySLO, 100000, 200, 15);
    expect(result.projectedExhaustion).toBeInstanceOf(Date);
    expect(result.projectedExhaustion!.getTime()).toBeGreaterThan(Date.now());
  });

  it('should have no projected exhaustion when no failures', () => {
    const result = calculateErrorBudget(availabilitySLO, 100000, 0, 15);
    expect(result.projectedExhaustion).toBeNull();
  });

  it('should include remaining minutes for availability SLO', () => {
    const result = calculateErrorBudget(availabilitySLO, 100000, 100, 15);
    expect(result.remainingMinutes).toBeDefined();
    expect(result.remainingMinutes).toBeGreaterThan(0);
  });
});

// ─── ETA Legal SLO ───────────────────────────────────────────

describe('ETA Integration SLO (legally required)', () => {
  it('should have stricter thresholds', () => {
    expect(etaSLO.legallyRequired).toBe(true);
    expect(etaSLO.alertThresholds.warning).toBe(0.3); // 30% vs 50%
    expect(etaSLO.alertThresholds.critical).toBe(0.7); // 70% vs 90%
  });

  it('should trigger warning at 30% for legal SLO', () => {
    // 99% target → budget = 1% of 10,000 = 100
    // 35 failures = 35% consumed → warning for ETA
    const result = calculateErrorBudget(etaSLO, 10000, 35, 15);
    expect(result.status).toBe('warning');
  });

  it('should trigger critical at 70% for legal SLO', () => {
    // 75 failures = 75% consumed → critical for ETA
    const result = calculateErrorBudget(etaSLO, 10000, 75, 15);
    expect(result.status).toBe('critical');
  });
});

// ─── checkBurnRateAlerts ─────────────────────────────────────

describe('checkBurnRateAlerts', () => {
  it('should not generate alerts for healthy budgets', () => {
    const budgets = [calculateErrorBudget(availabilitySLO, 100000, 10, 15)];
    const alerts = checkBurnRateAlerts(budgets);
    expect(alerts).toHaveLength(0);
  });

  it('should generate fast burn alert for very high burn rate', () => {
    // Burn rate > 14.4: consuming 1-month budget in ~1 hour
    // 480 failures in 1 day out of 30 = burn rate ≈ 28.8x
    const result = calculateErrorBudget(availabilitySLO, 100000, 480, 1);
    const alerts = checkBurnRateAlerts([result]);
    const fastBurn = alerts.find((a) => a.type === 'fast_burn');
    expect(fastBurn).toBeDefined();
    expect(fastBurn!.severity).toBe('critical');
    expect(fastBurn!.channels).toContain('whatsapp');
  });

  it('should generate extra alert for legal SLO in critical state', () => {
    const result = calculateErrorBudget(etaSLO, 10000, 80, 15);
    const alerts = checkBurnRateAlerts([result]);
    const legalAlert = alerts.find((a) => a.message.includes('قانوني'));
    expect(legalAlert).toBeDefined();
  });
});

// ─── canDeploy ───────────────────────────────────────────────

describe('canDeploy (Deployment Gate)', () => {
  it('should allow deployment when all SLOs are healthy', () => {
    const budgets = [
      calculateErrorBudget(availabilitySLO, 100000, 10, 15),
      calculateErrorBudget(etaSLO, 10000, 5, 15),
    ];
    const gate = canDeploy(budgets);
    expect(gate.allowed).toBe(true);
    expect(gate.blockers).toHaveLength(0);
  });

  it('should block deployment when any SLO is exhausted', () => {
    const budgets = [
      calculateErrorBudget(availabilitySLO, 100000, 600, 15), // exhausted
      calculateErrorBudget(etaSLO, 10000, 5, 15),
    ];
    const gate = canDeploy(budgets);
    expect(gate.allowed).toBe(false);
    expect(gate.blockers.length).toBeGreaterThan(0);
  });

  it('should block deployment when legal SLO is critical', () => {
    const budgets = [
      calculateErrorBudget(availabilitySLO, 100000, 10, 15), // healthy
      calculateErrorBudget(etaSLO, 10000, 80, 15),           // critical (legal)
    ];
    const gate = canDeploy(budgets);
    expect(gate.allowed).toBe(false);
    expect(gate.blockers.some((b) => b.includes('قانوني'))).toBe(true);
  });

  it('should allow deployment even when non-legal SLO is critical', () => {
    const budgets = [
      calculateErrorBudget(availabilitySLO, 100000, 470, 15), // critical (not legal)
    ];
    const gate = canDeploy(budgets);
    expect(gate.allowed).toBe(true); // critical doesn't block, only exhausted
  });
});

// ─── generateMonthlyReport ──────────────────────────────────

describe('generateMonthlyReport', () => {
  it('should generate a complete monthly report', () => {
    const metrics = {
      availability: { total: 100000, failed: 50 },
      latency_p95: { total: 100000, failed: 2000 },
      latency_p99: { total: 100000, failed: 500 },
      eta_integration: { total: 5000, failed: 10 },
    };

    const report = generateMonthlyReport(metrics, 30);

    expect(report.slos).toHaveLength(4);
    expect(report.generatedAt).toBeDefined();
    expect(report.overallHealth).toBeDefined();
    expect(report.recommendation).toBeDefined();
  });

  it('should report worst overall health', () => {
    const metrics = {
      availability: { total: 100000, failed: 0 },     // healthy
      latency_p95: { total: 100000, failed: 0 },      // healthy
      latency_p99: { total: 100000, failed: 0 },      // healthy
      eta_integration: { total: 5000, failed: 100 },   // exhausted (100 > 50 budget)
    };

    const report = generateMonthlyReport(metrics, 30);
    expect(report.overallHealth).toBe('exhausted');
  });
});
