/**
 * SLO Definitions for malaf.pro
 * ═══════════════════════════════
 * مؤشرات مستوى الخدمة (SLIs) وأهداف مستوى الخدمة (SLOs)
 * لمنصة مَلَف القانونية SaaS.
 */

// ─── SLO Configuration Types ─────────────────────────────────

export interface SLO {
  /** معرّف فريد للـ SLO */
  id: string;
  /** اسم وصفي */
  name: string;
  /** وصف مُفصّل */
  description: string;
  /** الفئة: availability | latency | integration | correctness */
  category: 'availability' | 'latency' | 'integration' | 'correctness';
  /** النسبة المستهدفة: 0.995 = 99.5% */
  target: number;
  /** نافذة القياس بالأيام */
  windowDays: number;
  /** وحدة القياس */
  unit: 'percentage' | 'milliseconds' | 'requests';
  /** هل هو حرج قانونياً؟ */
  legallyRequired: boolean;
  /** عتبات التنبيه */
  alertThresholds: {
    warning: number;  // نسبة استهلاك الـ budget
    critical: number;
    exhausted: number;
  };
}

// ─── SLO Definitions ─────────────────────────────────────────

export const SLO_DEFINITIONS: Record<string, SLO> = {
  // ═══════════════════════════════════════════════════════════
  // أ. Availability SLO
  // ═══════════════════════════════════════════════════════════
  availability: {
    id: 'slo-availability',
    name: 'Availability SLO',
    description: 'نسبة الطلبات الناجحة (HTTP 2xx+3xx) من إجمالي الطلبات',
    category: 'availability',
    target: 0.995,       // 99.5%
    windowDays: 30,
    unit: 'percentage',
    legallyRequired: false,
    alertThresholds: {
      warning: 0.5,      // 50% budget consumed
      critical: 0.9,     // 90% budget consumed
      exhausted: 1.0,    // 100% budget consumed
    },
  },

  // ═══════════════════════════════════════════════════════════
  // ب. Latency SLO — P95
  // ═══════════════════════════════════════════════════════════
  latency_p95: {
    id: 'slo-latency-p95',
    name: 'Latency P95 SLO',
    description: 'نسبة الطلبات التي تستجيب في ≤ 500ms',
    category: 'latency',
    target: 0.95,        // 95%
    windowDays: 30,
    unit: 'milliseconds',
    legallyRequired: false,
    alertThresholds: {
      warning: 0.5,
      critical: 0.9,
      exhausted: 1.0,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // ب. Latency SLO — P99
  // ═══════════════════════════════════════════════════════════
  latency_p99: {
    id: 'slo-latency-p99',
    name: 'Latency P99 SLO',
    description: 'نسبة الطلبات التي تستجيب في ≤ 2000ms',
    category: 'latency',
    target: 0.99,        // 99%
    windowDays: 30,
    unit: 'milliseconds',
    legallyRequired: false,
    alertThresholds: {
      warning: 0.5,
      critical: 0.9,
      exhausted: 1.0,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // ج. ETA Integration SLO — حرج قانونياً
  // ═══════════════════════════════════════════════════════════
  eta_integration: {
    id: 'slo-eta-integration',
    name: 'ETA Invoice Submission SLO',
    description: 'نسبة الفواتير المُرسلة بنجاح لـ ETA من إجمالي المحاولات (3 retries)',
    category: 'integration',
    target: 0.99,        // 99%
    windowDays: 30,
    unit: 'requests',
    legallyRequired: true,
    alertThresholds: {
      warning: 0.3,      // أكثر حساسية لأنه حرج قانونياً
      critical: 0.7,
      exhausted: 1.0,
    },
  },
} as const;

// ─── Error Budget Constants ──────────────────────────────────

/** دقائق في الشهر (30 يوم) */
export const MINUTES_PER_MONTH = 30 * 24 * 60; // 43,200

/** Availability Error Budget بالدقائق: 0.5% × 43,200 = 216 دقيقة ≈ 3.6 ساعة */
export const AVAILABILITY_BUDGET_MINUTES = Math.round(
  (1 - SLO_DEFINITIONS.availability.target) * MINUTES_PER_MONTH
);

// ─── Burn Rate Thresholds ────────────────────────────────────

/** Fast burn: استهلاك budget شهر كامل في ساعة واحدة */
export const FAST_BURN_RATE = 14.4;

/** Slow burn: استهلاك budget شهر كامل في أسبوعين */
export const SLOW_BURN_RATE = 2.0;

/** Multi-window burn rate configurations for Google SRE approach */
export const BURN_RATE_WINDOWS = [
  { name: 'fast-burn',   longWindow: '1h',  shortWindow: '5m',  burnRate: 14.4, severity: 'critical' as const },
  { name: 'medium-burn', longWindow: '6h',  shortWindow: '30m', burnRate: 6.0,  severity: 'critical' as const },
  { name: 'slow-burn',   longWindow: '3d',  shortWindow: '6h',  burnRate: 2.0,  severity: 'warning' as const },
  { name: 'drift',       longWindow: '7d',  shortWindow: '1d',  burnRate: 1.0,  severity: 'info' as const },
];
