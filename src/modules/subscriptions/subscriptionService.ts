/**
 * Subscription Management Service
 * Defines 3 subscription tiers with quota limits.
 * Provides a Facade for future Paymob/Fawry integration.
 */

export type PlanTier = 'basic' | 'enterprise';

export interface SubscriptionPlan {
  tier: PlanTier;
  nameAr: string;
  nameEn: string;
  priceMonthly: number; // EGP (ج.م)
  priceYearly: number; // EGP (ج.م)
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

// ─── Plan Definitions ─────────────────────────────────────────────────────────
export const PLANS: Record<PlanTier, SubscriptionPlan> = {
  basic: {
    tier: 'basic',
    nameAr: 'Standard (الأساسية)',
    nameEn: 'Standard',
    priceMonthly: 599,
    priceYearly: 5990,
    maxUsers: 5,
    maxCases: 50,
    maxStorage: '10GB',
    features: [
      'إدارة الموكلين والقضايا والجلسات بالكامل',
      'تكامل الفاتورة الإلكترونية المصرية (ETA)',
      'التقويم والمواعيد التلقائية والتنبيهات القضائية',
      'مساعد الذكاء الاصطناعي لتحليل العقود والمستندات',
      'المالية وتتبع المصاريف والإيرادات بدقة',
      'تشفير كامل للبيانات الحساسة وأمان بنكي'
    ]
  },
  enterprise: {
    tier: 'enterprise',
    nameAr: 'White Label (منصة خاصة)',
    nameEn: 'White Label',
    priceMonthly: 1500, // 18000 / 12
    priceYearly: 18000,
    maxUsers: -1, // Unlimited
    maxCases: -1, // Unlimited
    maxStorage: '100GB',
    features: [
      'كل ميزات باقة Standard بالكامل',
      'نظام تشغيل كامل باسم مكتبك ودومينك الخاص',
      'تطبيق كامل بهويتك وألوانك وشعارك الخاص',
      'عدد غير محدود من المستخدمين والقضايا',
      'عزل تام للبيانات وامتثال للقانون 151 لسنة 2020',
      'صيانة وتحديثات مستمرة ودعم فني مخصص'
    ]
  }
};

// ─── Quota Enforcement ──────────────────────────────────────────────────────
export function checkQuota(
  subscription: TenantSubscription,
  resource: 'users' | 'cases'
): { allowed: boolean; current: number; max: number; reason?: string } {
  if (subscription.status === 'expired') {
    return { allowed: false, current: 0, max: 0, reason: 'expired' };
  }
  if (subscription.status === 'cancelled') {
    return { allowed: false, current: 0, max: 0, reason: 'cancelled' };
  }

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

// ─── Arabic Quota Error Messages ────────────────────────────────────────────
export const QUOTA_MESSAGES = {
  cases: {
    title: 'تم الوصول للحد الأقصى من القضايا',
    description: (max: number) => `باقتك الحالية تسمح بـ ${max} قضية فقط. يرجى ترقية باقتك لإضافة المزيد.`,
  },
  users: {
    title: 'تم الوصول للحد الأقصى من المستخدمين',
    description: (max: number) => `باقتك الحالية تسمح بـ ${max} مستخدم فقط. يرجى ترقية باقتك لإضافة أعضاء جدد.`,
  },
  upgrade: {
    cta: 'ترقية الباقة',
    dismiss: 'ليس الآن',
  }
};

// ─── Quota Check with Real DB ───────────────────────────────────────────────
export async function checkQuotaFromDB(
  supabase: any,
  orgId: string,
  resource: 'cases' | 'users'
): Promise<{ allowed: boolean; current: number; max: number; planName: string }> {
  try {
    // Get org plan
    const { data: org } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', orgId)
      .single();
    
    const planKey = org?.plan || 'free';

    // Get plan limits
    const { data: limits } = await supabase
      .from('plan_limits')
      .select('max_cases, max_users, display_name_ar')
      .eq('plan_key', planKey)
      .eq('is_active', true)
      .single();

    const max = resource === 'cases' 
      ? (limits?.max_cases ?? 5) 
      : (limits?.max_users ?? 1);
    
    // Count current usage
    let current = 0;
    if (resource === 'cases') {
      const { count } = await supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null);
      current = count ?? 0;
    } else {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true);
      current = count ?? 0;
    }

    // -1 means unlimited
    if (max === -1) return { allowed: true, current, max, planName: limits?.display_name_ar || planKey };

    return {
      allowed: current < max,
      current,
      max,
      planName: limits?.display_name_ar || planKey,
    };
  } catch {
    // Fail open in case of DB error — trigger will enforce at DB level anyway
    return { allowed: true, current: 0, max: -1, planName: 'غير محدد' };
  }
}
