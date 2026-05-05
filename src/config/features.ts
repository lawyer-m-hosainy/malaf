/**
 * Feature Flags Configuration
 * Controls which enterprise features are enabled in the platform.
 * Toggle flags here to activate/deactivate features without code changes.
 */

export interface FeatureFlag {
  key: string;
  label: string;
  enabled: boolean;
  description: string;
}

const featureFlags: Record<string, FeatureFlag> = {
  TENANT_ONBOARDING: {
    key: 'TENANT_ONBOARDING',
    label: 'تسجيل المكاتب',
    enabled: true,
    description: 'تفعيل صفحة تسجيل مكتب جديد والإعداد الأولي'
  },
  SUBSCRIPTION_MANAGEMENT: {
    key: 'SUBSCRIPTION_MANAGEMENT',
    label: 'إدارة الاشتراكات',
    enabled: true,
    description: 'تفعيل نظام الخطط والاشتراكات'
  },
  GLOBAL_ADMIN: {
    key: 'GLOBAL_ADMIN',
    label: 'لوحة السوبر أدمن',
    enabled: true,
    description: 'تفعيل لوحة إدارة المنصة الشاملة لجميع المكاتب'
  },
  EMAIL_NOTIFICATIONS: {
    key: 'EMAIL_NOTIFICATIONS',
    label: 'الإشعارات البريدية',
    enabled: true,
    description: 'تفعيل إرسال إشعارات الجلسات والفواتير عبر البريد'
  },
  FAWRY_PAYMENTS: {
    key: 'FAWRY_PAYMENTS',
    label: 'بوابة الدفع فوري',
    enabled: false,
    description: 'تفعيل الدفع الإلكتروني عبر بوابة فوري المصرية (يتطلب مفاتيح API)'
  },
  ETA_INTEGRATION: {
    key: 'ETA_INTEGRATION',
    label: 'منظومة الفاتورة الإلكترونية (ETA)',
    enabled: true,
    description: 'تفعيل الربط مع منظومة الفاتورة الإلكترونية المصرية'
  },
  E_LITIGATION: {
    key: 'E_LITIGATION',
    label: 'بوابة التقاضي الإلكتروني',
    enabled: true,
    description: 'تفعيل الربط مع بوابة التقاضي الإلكتروني المصري'
  },
  BAR_ASSOCIATION: {
    key: 'BAR_ASSOCIATION',
    label: 'نقابة المحامين المصريين',
    enabled: true,
    description: 'تفعيل ربط بيانات القيد والاشتراك بنقابة المحامين'
  }
};

/**
 * Check if a feature flag is enabled.
 */
export function isFeatureEnabled(key: string): boolean {
  return featureFlags[key]?.enabled ?? false;
}

/**
 * Get all feature flags for rendering in admin UI.
 */
export function getAllFeatureFlags(): FeatureFlag[] {
  return Object.values(featureFlags);
}

/**
 * Toggle a feature flag at runtime (useful for Super Admin).
 */
export function setFeatureFlag(key: string, enabled: boolean): void {
  if (featureFlags[key]) {
    featureFlags[key].enabled = enabled;
  }
}
