import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, X, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";

/**
 * بانر التنبيه للفترة التجريبية وانتهاء الاشتراك
 * يظهر في الداشبورد فقط عندما:
 * - المكتب في فترة تجريبية (trial)
 * - بقي أقل من 7 أيام على انتهاء الاشتراك
 * - الاشتراك منتهي بالفعل
 */
export function TrialBanner() {
  const orgId = useAuthStore(state => state.currentUser?.orgId);
  const [status, setStatus] = useState<{
    type: 'trial' | 'expiring' | 'expired' | null;
    daysLeft: number;
    planName: string;
  }>({ type: null, daysLeft: 0, planName: '' });
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!orgId) return;
    checkSubscriptionStatus();
  }, [orgId]);

  async function checkSubscriptionStatus() {
    try {
      const { data: sub } = await (supabase as any)
        .from('subscriptions')
        .select('status, current_period_end, trial_ends_at, plan')
        .eq('organization_id', orgId)
        .single();

      if (!sub) return;

      const now = Date.now();

      // Trial check
      if (sub.status === 'trial' && sub.trial_ends_at) {
        const trialEnd = new Date(sub.trial_ends_at).getTime();
        const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
        setStatus({ type: daysLeft <= 0 ? 'expired' : 'trial', daysLeft, planName: sub.plan });
        return;
      }

      // Expiry check
      if (sub.status === 'expired') {
        setStatus({ type: 'expired', daysLeft: 0, planName: sub.plan });
        return;
      }

      // Near-expiry check (7 days warning)
      if (sub.current_period_end) {
        const endDate = new Date(sub.current_period_end).getTime();
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 7 && daysLeft > 0) {
          setStatus({ type: 'expiring', daysLeft, planName: sub.plan });
        }
      }
    } catch {
      // Silently fail
    }
  }

  if (!status.type || dismissed) return null;

  const config = {
    trial: {
      bg: status.daysLeft <= 3
        ? "bg-gradient-to-l from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800/30"
        : "bg-gradient-to-l from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800/30",
      icon: Clock,
      iconColor: status.daysLeft <= 3 ? "text-red-500" : "text-blue-500",
      title: status.daysLeft <= 0
        ? "⏳ انتهت الفترة التجريبية!"
        : `⏳ متبقي ${status.daysLeft} يوم من الفترة التجريبية`,
      subtitle: status.daysLeft <= 3
        ? "اشترك الآن قبل فقدان الوصول لبياناتك."
        : "استمتع بكل الميزات مجاناً. اشترك قبل الانتهاء.",
      cta: "اختر باقتك",
    },
    expiring: {
      bg: "bg-gradient-to-l from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800/30",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      title: `⚠️ اشتراكك ينتهي خلال ${status.daysLeft} أيام`,
      subtitle: "جدّد اشتراكك لضمان استمرار عملك بدون انقطاع.",
      cta: "تجديد الاشتراك",
    },
    expired: {
      bg: "bg-gradient-to-l from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800/30",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      title: "🚫 اشتراكك منتهي — الوضع الحالي: قراءة فقط",
      subtitle: "لن تستطيع إضافة أو تعديل بيانات. جدّد الآن لاستعادة الوصول الكامل.",
      cta: "جدّد الآن",
    },
  };

  const c = config[status.type];
  const IconComp = c.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className={cn("border-2 rounded-xl p-4 mx-6 mt-4 flex items-center gap-4", c.bg)}
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", c.bg)}>
          <IconComp className={cn("w-5 h-5", c.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-navy-900 dark:text-white text-sm">{c.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => navigate('/dashboard/billing')}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            {c.cta}
          </Button>
          {status.type !== 'expired' && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
