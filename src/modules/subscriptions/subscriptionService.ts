/**
 * Subscription Management Service
 * Defines 3 subscription tiers with quota limits.
 * Provides a Facade for future Moyasar/Stripe integration.
 */

export type PlanTier = 'basic' | 'advanced' | 'enterprise';

export interface SubscriptionPlan {
  tier: PlanTier;
  nameAr: string;
  nameEn: string;
  priceMonthly: number; // EGP
  priceYearly: number; // EGP
  maxUsers: number;
  maxCases: number;
  maxStorage: string; // e.g. "5GB"
  features: string[];
}

export interface TenantSubscription {
  tenantId: string;
  plan: PlanTier;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  currentUsers: number;
  currentCases: number;
}

// ── Plan Definitions ────────────────────────────────────────────────
export const PLANS: Record<PlanTier, SubscriptionPlan> = {
  basic: {
    tier: 'basic',
    nameAr: 'الأساسية',
    nameEn: 'Basic',
    priceMonthly: 299,
    priceYearly: 2990,
    maxUsers: 5,
    maxCases: 50,
    maxStorage: '5GB',
    features: [
      'إدارة العملاء والقضايا',
      'الفاتورة الإلكترونية المصرية (ETA)',
      'التقويم والمواعيد',
      'مساعد الذكاء الاصطناعي (محدود)',
    ]
  },
  advanced: {
    tier: 'advanced',
    nameAr: 'المتقدمة',
    nameEn: 'Advanced',
    priceMonthly: 699,
    priceYearly: 6990,
    maxUsers: 20,
    maxCases: 500,
    maxStorage: '50GB',
    features: [
      'كل ميزات الأساسية',
      'إدارة العقود (CLM)',
      'نظام التحصيل',
      'فحص تعارض المصالح',
      'تتبع الوقت والفوترة',
      'تقارير متقدمة',
      'الإشعارات البريدية',
    ]
  },
  enterprise: {
    tier: 'enterprise',
    nameAr: 'المؤسسات',
    nameEn: 'Enterprise',
    priceMonthly: 1499,
    priceYearly: 14990,
    maxUsers: -1, // Unlimited
    maxCases: -1, // Unlimited
    maxStorage: '500GB',
    features: [
      'كل ميزات المتقدمة',
      'إدارة الامتثال (GRC)',
      'لوحة الشريك والتقارير التنفيذية',
      'بوابة العميل',
      'الملكية الفكرية',
      'المسارات المتخصصة',
      'الدعم الفني ذو الأولوية',
      'عدد غير محدود من المستخدمين والقضايا',
    ]
  }
};

// ── Quota Enforcement ───────────────────────────────────────────────
export function checkQuota(
  subscription: TenantSubscription,
  resource: 'users' | 'cases'
): { allowed: boolean; current: number; max: number } {
  const plan = PLANS[subscription.plan];
  const max = resource === 'users' ? plan.maxUsers : plan.maxCases;
  const current = resource === 'users' ? subscription.currentUsers : subscription.currentCases;

  // -1 means unlimited
  if (max === -1) return { allowed: true, current, max };

  return {
    allowed: current < max,
    current,
    max
  };
}

// ── Moyasar Payment Facade (Mocked) ────────────────────────────────
// In production, replace with real Moyasar SDK calls.
export async function initializePayment(
  tenantId: string,
  plan: PlanTier,
  billing: 'monthly' | 'yearly'
): Promise<{ paymentUrl: string; sessionId: string }> {
  const selectedPlan = PLANS[plan];
  const amount = billing === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceYearly;

  // Mock: In production, call Egyptian Payment Gateway (e.g. Paymob/Fawry)
  console.log(`[Payment Mock] Initiating payment for tenant ${tenantId}, plan ${plan}, amount ${amount} EGP`);

  return {
    paymentUrl: `https://api.payment-gateway.com/v1/payments?amount=${amount * 100}&currency=EGP&description=Mizan+Egypt+${plan}`,
    sessionId: `MOCK-SESSION-${Date.now()}`
  };
}

export async function verifyPayment(sessionId: string): Promise<{ success: boolean; transactionId: string }> {
  // Mock: In production, verify with Gateway API
  console.log(`[Payment Mock] Verifying payment session ${sessionId}`);
  return {
    success: true,
    transactionId: `TXN-${Date.now()}`
  };
}
