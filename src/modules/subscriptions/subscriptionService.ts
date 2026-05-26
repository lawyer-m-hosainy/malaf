/**
 * Subscription Management Service
 * Defines 3 subscription tiers with quota limits.
 * Provides a Facade for future Paymob/Fawry integration.
 */

export type PlanTier = 'basic' | 'advanced' | 'enterprise';

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
    nameAr: 'الأساسية',
    nameEn: 'Basic',
    priceMonthly: 599,
    priceYearly: 5990,
    maxUsers: 5,
    maxCases: 50,
    maxStorage: '5GB',
    features: [
      'إدارة العملاء والقضايا',
      'الفاتورة الإلكترونية المصرية (ETA)',
      'التقويم والمواعيد',
      'مساعد الذكاء الاصطناعي (محدود)'
    ]
  },
  advanced: {
    tier: 'advanced',
    nameAr: 'المتقدمة',
    nameEn: 'Advanced',
    priceMonthly: 999,
    priceYearly: 9990,
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
      'الإشعارات البريدية'
    ]
  },
  enterprise: {
    tier: 'enterprise',
    nameAr: 'المؤسسات',
    nameEn: 'Enterprise',
    priceMonthly: 1599,
    priceYearly: 15990,
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
      'عدد غير محدود من المستخدمين والقضايا'
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
