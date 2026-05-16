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
  priceMonthly: number; // EGP (Ø¬.Ù…)
  priceYearly: number; // EGP (Ø¬.Ù…)
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

// â”€â”€ Plan Definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const PLANS: Record<PlanTier, SubscriptionPlan> = {
  basic: {
    tier: 'basic',
    nameAr: 'Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©',
    nameEn: 'Basic',
    priceMonthly: 599,
    priceYearly: 5990,
    maxUsers: 5,
    maxCases: 50,
    maxStorage: '5GB',
    features: [
      'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ ÙˆØ§Ù„Ù‚Ø¶Ø§ÙŠØ§',
      'Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© Ø§Ù„Ù…ØµØ±ÙŠØ© (ETA)',
      'Ø§Ù„ØªÙ‚ÙˆÙŠÙ… ÙˆØ§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯',
      'Ù…Ø³Ø§Ø¹Ø¯ Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ (Ù…Ø­Ø¯ÙˆØ¯)',
    ]
  },
  advanced: {
    tier: 'advanced',
    nameAr: 'Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©',
    nameEn: 'Advanced',
    priceMonthly: 999,
    priceYearly: 9990,
    maxUsers: 20,
    maxCases: 500,
    maxStorage: '50GB',
    features: [
      'ÙƒÙ„ Ù…ÙŠØ²Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©',
      'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¹Ù‚ÙˆØ¯ (CLM)',
      'Ù†Ø¸Ø§Ù… Ø§Ù„ØªØ­ØµÙŠÙ„',
      'ÙØ­Øµ ØªØ¹Ø§Ø±Ø¶ Ø§Ù„Ù…ØµØ§Ù„Ø­',
      'ØªØªØ¨Ø¹ Ø§Ù„ÙˆÙ‚Øª ÙˆØ§Ù„ÙÙˆØªØ±Ø©',
      'ØªÙ‚Ø§Ø±ÙŠØ± Ù…ØªÙ‚Ø¯Ù…Ø©',
      'Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø¨Ø±ÙŠØ¯ÙŠØ©',
    ]
  },
  enterprise: {
    tier: 'enterprise',
    nameAr: 'Ø§Ù„Ù…Ø¤Ø³Ø³Ø§Øª',
    nameEn: 'Enterprise',
    priceMonthly: 1599,
    priceYearly: 15990,
    maxUsers: -1, // Unlimited
    maxCases: -1, // Unlimited
    maxStorage: '500GB',
    features: [
      'ÙƒÙ„ Ù…ÙŠØ²Ø§Øª Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©',
      'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„ (GRC)',
      'Ù„ÙˆØ­Ø© Ø§Ù„Ø´Ø±ÙŠÙƒ ÙˆØ§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©',
      'Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ø¹Ù…ÙŠÙ„',
      'Ø§Ù„Ù…Ù„ÙƒÙŠØ© Ø§Ù„ÙÙƒØ±ÙŠØ©',
      'Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„Ù…ØªØ®ØµØµØ©',
      'Ø§Ù„Ø¯Ø¹Ù… Ø§Ù„ÙÙ†ÙŠ Ø°Ùˆ Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©',
      'Ø¹Ø¯Ø¯ ØºÙŠØ± Ù…Ø­Ø¯ÙˆØ¯ Ù…Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† ÙˆØ§Ù„Ù‚Ø¶Ø§ÙŠØ§',
    ]
  }
};

// â”€â”€ Quota Enforcement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Arabic Quota Error Messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const QUOTA_MESSAGES = {
  cases: {
    title: 'ØªÙ… Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù…Ù† Ø§Ù„Ù‚Ø¶Ø§ÙŠØ§',
    description: (max: number) => `Ø¨Ø§Ù‚ØªÙƒ Ø§Ù„Ø­Ø§Ù„ÙŠØ© ØªØ³Ù…Ø­ Ø¨Ù€ ${max} Ù‚Ø¶ÙŠØ© ÙÙ‚Ø·. ÙŠØ±Ø¬Ù‰ ØªØ±Ù‚ÙŠØ© Ø¨Ø§Ù‚ØªÙƒ Ù„Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø²ÙŠØ¯.`,
  },
  users: {
    title: 'ØªÙ… Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù…Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†',
    description: (max: number) => `Ø¨Ø§Ù‚ØªÙƒ Ø§Ù„Ø­Ø§Ù„ÙŠØ© ØªØ³Ù…Ø­ Ø¨Ù€ ${max} Ù…Ø³ØªØ®Ø¯Ù… ÙÙ‚Ø·. ÙŠØ±Ø¬Ù‰ ØªØ±Ù‚ÙŠØ© Ø¨Ø§Ù‚ØªÙƒ Ù„Ø¥Ø¶Ø§ÙØ© Ø£Ø¹Ø¶Ø§Ø¡ Ø¬Ø¯Ø¯.`,
  },
  upgrade: {
    cta: 'ØªØ±Ù‚ÙŠØ© Ø§Ù„Ø¨Ø§Ù‚Ø©',
    dismiss: 'Ù„ÙŠØ³ Ø§Ù„Ø¢Ù†',
  }
};

// â”€â”€ Quota Check with Real DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // Fail open in case of DB error â€” trigger will enforce at DB level anyway
    return { allowed: true, current: 0, max: -1, planName: 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯' };
  }
}

