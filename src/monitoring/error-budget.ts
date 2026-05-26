/**
 * Error Budget Calculator — malaf.pro
 * ═════════════════════════════════════
 * يحسب Error Budget لكل SLO شهرياً ويحدد الحالة والإجراء المطلوب.
 */

import {
  type SLO,
  SLO_DEFINITIONS,
  FAST_BURN_RATE,
  SLOW_BURN_RATE,
  MINUTES_PER_MONTH,
} from './slo-definitions';

// ─── Types ───────────────────────────────────────────────────

export type BudgetStatus = 'healthy' | 'warning' | 'critical' | 'exhausted';

export type PolicyAction =
  | 'normal_development'
  | 'reduce_deployments'
  | 'freeze_features'
  | 'emergency_freeze';

export interface ErrorBudgetStatus {
  /** تعريف الـ SLO */
  slo: SLO;
  /** معدل النجاح الحالي (0-1) */
  currentRate: number;
  /** إجمالي Error Budget المتاح (بالوحدة المناسبة) */
  budgetTotal: number;
  /** ما تم استهلاكه من الـ Budget */
  budgetConsumed: number;
  /** المتبقي من الـ Budget */
  budgetRemaining: number;
  /** نسبة الاستهلاك (0-1+) */
  consumptionRatio: number;
  /** معدل الحرق الحالي */
  burnRate: number;
  /** التاريخ المتوقع لنفاد الـ Budget */
  projectedExhaustion: Date | null;
  /** الحالة: healthy | warning | critical | exhausted */
  status: BudgetStatus;
  /** الإجراء المطلوب وفق السياسة */
  policyAction: PolicyAction;
  /** رسالة حالة بالعربية */
  statusMessage: string;
  /** الوقت المتبقي بالدقائق (للـ availability فقط) */
  remainingMinutes?: number;
}

export interface BurnRateAlert {
  type: 'fast_burn' | 'slow_burn';
  severity: 'critical' | 'warning';
  sloName: string;
  currentBurnRate: number;
  threshold: number;
  message: string;
  channels: string[];
}

export interface MonthlyReport {
  period: string;
  generatedAt: string;
  slos: ErrorBudgetStatus[];
  overallHealth: BudgetStatus;
  alerts: BurnRateAlert[];
  recommendation: string;
}

// ─── Core Calculator ─────────────────────────────────────────

/**
 * حساب حالة Error Budget لـ SLO واحد.
 *
 * @param slo - تعريف الـ SLO
 * @param totalRequests - إجمالي الطلبات في النافذة
 * @param failedRequests - الطلبات الفاشلة
 * @param elapsedDays - الأيام المنقضية من بداية النافذة (لحساب burn rate)
 */
export function calculateErrorBudget(
  slo: SLO,
  totalRequests: number,
  failedRequests: number,
  elapsedDays: number = 15
): ErrorBudgetStatus {
  // Prevent division by zero
  if (totalRequests <= 0) {
    return createEmptyBudget(slo);
  }

  const currentRate = (totalRequests - failedRequests) / totalRequests;
  const budgetTotal = (1 - slo.target) * totalRequests;
  const budgetConsumed = failedRequests;
  const budgetRemaining = Math.max(0, budgetTotal - budgetConsumed);
  const consumptionRatio = budgetTotal > 0 ? budgetConsumed / budgetTotal : 0;

  // Burn rate: how fast budget is being consumed relative to the window
  const elapsedFraction = Math.min(elapsedDays / slo.windowDays, 1);
  const burnRate = elapsedFraction > 0 ? consumptionRatio / elapsedFraction : 0;

  // Determine status
  const status = determineStatus(consumptionRatio, slo.alertThresholds);
  const policyAction = determinePolicyAction(consumptionRatio);

  // Projected exhaustion
  let projectedExhaustion: Date | null = null;
  if (burnRate > 0 && consumptionRatio < 1) {
    const remainingFraction = 1 - consumptionRatio;
    const daysToExhaustion = (remainingFraction / burnRate) * slo.windowDays;
    projectedExhaustion = new Date(Date.now() + daysToExhaustion * 24 * 60 * 60 * 1000);
  }

  // Remaining minutes (for availability SLO)
  const remainingMinutes =
    slo.category === 'availability'
      ? Math.round((budgetRemaining / totalRequests) * MINUTES_PER_MONTH)
      : undefined;

  return {
    slo,
    currentRate,
    budgetTotal,
    budgetConsumed,
    budgetRemaining,
    consumptionRatio,
    burnRate,
    projectedExhaustion,
    status,
    policyAction,
    statusMessage: getStatusMessage(status, slo, consumptionRatio),
    remainingMinutes,
  };
}

/**
 * حساب Error Budget لجميع SLOs دفعة واحدة.
 */
export function calculateAllBudgets(
  metrics: Record<string, { total: number; failed: number }>,
  elapsedDays: number = 15
): ErrorBudgetStatus[] {
  return Object.entries(SLO_DEFINITIONS).map(([key, slo]) => {
    const m = metrics[key] || { total: 0, failed: 0 };
    return calculateErrorBudget(slo, m.total, m.failed, elapsedDays);
  });
}

// ─── Burn Rate Alerts ────────────────────────────────────────

/**
 * فحص Burn Rate وإنتاج التنبيهات المطلوبة.
 */
export function checkBurnRateAlerts(budgets: ErrorBudgetStatus[]): BurnRateAlert[] {
  const alerts: BurnRateAlert[] = [];

  for (const budget of budgets) {
    if (budget.burnRate >= FAST_BURN_RATE) {
      alerts.push({
        type: 'fast_burn',
        severity: 'critical',
        sloName: budget.slo.name,
        currentBurnRate: budget.burnRate,
        threshold: FAST_BURN_RATE,
        message: `🚨 CRITICAL: ${budget.slo.name} — Fast Burn Rate ${budget.burnRate.toFixed(1)}x (threshold: ${FAST_BURN_RATE}x). Budget سينفد في أقل من ساعة بهذا المعدل!`,
        channels: ['whatsapp', 'email', 'discord'],
      });
    } else if (budget.burnRate >= SLOW_BURN_RATE) {
      alerts.push({
        type: 'slow_burn',
        severity: 'warning',
        sloName: budget.slo.name,
        currentBurnRate: budget.burnRate,
        threshold: SLOW_BURN_RATE,
        message: `⚠️ WARNING: ${budget.slo.name} — Slow Burn Rate ${budget.burnRate.toFixed(1)}x (threshold: ${SLOW_BURN_RATE}x). Budget سينفد قبل نهاية الشهر.`,
        channels: ['email', 'discord'],
      });
    }

    // Extra alert for legally-required SLOs
    if (budget.slo.legallyRequired && budget.status === 'critical') {
      alerts.push({
        type: 'slow_burn',
        severity: 'critical',
        sloName: budget.slo.name,
        currentBurnRate: budget.burnRate,
        threshold: 0,
        message: `🚨 قانوني: ${budget.slo.name} في حالة حرجة! هذا SLO مطلوب قانونياً — يجب التدخل فوراً.`,
        channels: ['whatsapp', 'email', 'discord'],
      });
    }
  }

  return alerts;
}

// ─── Monthly Report ──────────────────────────────────────────

/**
 * إنتاج تقرير شهري شامل لجميع SLOs.
 */
export function generateMonthlyReport(
  metrics: Record<string, { total: number; failed: number }>,
  elapsedDays: number = 30
): MonthlyReport {
  const budgets = calculateAllBudgets(metrics, elapsedDays);
  const alerts = checkBurnRateAlerts(budgets);

  // Determine overall health (worst status wins)
  const statusPriority: Record<BudgetStatus, number> = {
    healthy: 0,
    warning: 1,
    critical: 2,
    exhausted: 3,
  };

  const overallHealth = budgets.reduce<BudgetStatus>((worst, b) => {
    return statusPriority[b.status] > statusPriority[worst] ? b.status : worst;
  }, 'healthy');

  const now = new Date();
  const month = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });

  return {
    period: month,
    generatedAt: now.toISOString(),
    slos: budgets,
    overallHealth,
    alerts,
    recommendation: getMonthlyRecommendation(overallHealth, budgets),
  };
}

// ─── Deployment Gate ─────────────────────────────────────────

/**
 * هل يُسمح بالنشر؟ — يفحص كل SLO ويقرر.
 * يُستخدم في CI/CD pipeline لمنع النشر عند استنفاد Budget.
 */
export function canDeploy(budgets: ErrorBudgetStatus[]): {
  allowed: boolean;
  reason: string;
  blockers: string[];
} {
  const blockers: string[] = [];

  for (const budget of budgets) {
    if (budget.status === 'exhausted') {
      blockers.push(
        `🚨 ${budget.slo.name}: Error Budget مُستنفد (${(budget.consumptionRatio * 100).toFixed(1)}% consumed)`
      );
    }
    // Legally required SLOs are stricter
    if (budget.slo.legallyRequired && budget.status === 'critical') {
      blockers.push(
        `⚖️ ${budget.slo.name}: SLO قانوني في حالة حرجة (${(budget.consumptionRatio * 100).toFixed(1)}% consumed)`
      );
    }
  }

  return {
    allowed: blockers.length === 0,
    reason:
      blockers.length === 0
        ? '✅ جميع SLOs في حالة صحية — النشر مسموح'
        : `❌ النشر محظور — ${blockers.length} SLO(s) تحتاج اهتمام`,
    blockers,
  };
}

// ─── Helper Functions ────────────────────────────────────────

function determineStatus(
  consumptionRatio: number,
  thresholds: SLO['alertThresholds']
): BudgetStatus {
  if (consumptionRatio >= thresholds.exhausted) return 'exhausted';
  if (consumptionRatio >= thresholds.critical) return 'critical';
  if (consumptionRatio >= thresholds.warning) return 'warning';
  return 'healthy';
}

function determinePolicyAction(consumptionRatio: number): PolicyAction {
  if (consumptionRatio >= 1.0) return 'emergency_freeze';
  if (consumptionRatio >= 0.9) return 'freeze_features';
  if (consumptionRatio >= 0.5) return 'reduce_deployments';
  return 'normal_development';
}

function getStatusMessage(
  status: BudgetStatus,
  slo: SLO,
  consumptionRatio: number
): string {
  const pct = (consumptionRatio * 100).toFixed(1);

  switch (status) {
    case 'healthy':
      return `✅ ${slo.name}: سليم — ${pct}% من Budget مُستهلك`;
    case 'warning':
      return `⚠️ ${slo.name}: تحذير — ${pct}% من Budget مُستهلك. يجب تقليل وتيرة النشر.`;
    case 'critical':
      return `🔴 ${slo.name}: حرج — ${pct}% من Budget مُستهلك. يجب إيقاف الميزات الجديدة!`;
    case 'exhausted':
      return `🚨 ${slo.name}: مُستنفد — ${pct}% من Budget مُستهلك. Deployment Freeze فوري!`;
  }
}

function getMonthlyRecommendation(
  health: BudgetStatus,
  budgets: ErrorBudgetStatus[]
): string {
  const legalSlos = budgets.filter((b) => b.slo.legallyRequired);
  const legalIssue = legalSlos.some((b) => b.status !== 'healthy');

  if (legalIssue) {
    return '⚖️ يوجد SLO قانوني متأثر — يجب إعطاء أولوية قصوى للإصلاح قبل أي عمل آخر.';
  }

  switch (health) {
    case 'healthy':
      return '✅ استئناف التطوير الطبيعي — كل SLOs في حالة صحية.';
    case 'warning':
      return '⚠️ تقليل وتيرة الـ Deployments — أولوية لـ Bug Fixes على الميزات الجديدة.';
    case 'critical':
      return '🔴 Freeze كامل على الميزات الجديدة — التركيز على الموثوقية والإصلاحات.';
    case 'exhausted':
      return '🚨 Emergency Freeze — جلسة مراجعة طارئة في 4 ساعات. لا يُسمح بأي Deploy.';
  }
}

function createEmptyBudget(slo: SLO): ErrorBudgetStatus {
  return {
    slo,
    currentRate: 1,
    budgetTotal: 0,
    budgetConsumed: 0,
    budgetRemaining: 0,
    consumptionRatio: 0,
    burnRate: 0,
    projectedExhaustion: null,
    status: 'healthy',
    policyAction: 'normal_development',
    statusMessage: `✅ ${slo.name}: لا توجد بيانات كافية`,
  };
}
