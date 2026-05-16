import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, X, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";

/**
 * Ø¨Ø§Ù†Ø± Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡ Ù„Ù„ÙØªØ±Ø© Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ© ÙˆØ§Ù†ØªÙ‡Ø§Ø¡ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ
 * ÙŠØ¸Ù‡Ø± ÙÙŠ Ø§Ù„Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯ ÙÙ‚Ø· Ø¹Ù†Ø¯Ù…Ø§:
 * - Ø§Ù„Ù…ÙƒØªØ¨ ÙÙŠ ÙØªØ±Ø© ØªØ¬Ø±ÙŠØ¨ÙŠØ© (trial)
 * - Ø¨Ù‚ÙŠ Ø£Ù‚Ù„ Ù…Ù† 7 Ø£ÙŠØ§Ù… Ø¹Ù„Ù‰ Ø§Ù†ØªÙ‡Ø§Ø¡ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ
 * - Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ Ù…Ù†ØªÙ‡ÙŠ Ø¨Ø§Ù„ÙØ¹Ù„
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
      const { data: sub } = await supabase
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
      // Silently fail â€” not critical
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
        ? "â° Ø§Ù†ØªÙ‡Øª Ø§Ù„ÙØªØ±Ø© Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©!"
        : `â³ Ù…ØªØ¨Ù‚ÙŠ ${status.daysLeft} ÙŠÙˆÙ… Ù…Ù† Ø§Ù„ÙØªØ±Ø© Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©`,
      subtitle: status.daysLeft <= 3
        ? "Ø§Ø´ØªØ±Ùƒ Ø§Ù„Ø¢Ù† Ù‚Ø¨Ù„ ÙÙ‚Ø¯Ø§Ù† Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ø¨ÙŠØ§Ù†Ø§ØªÙƒ."
        : "Ø§Ø³ØªÙ…ØªØ¹ Ø¨ÙƒÙ„ Ø§Ù„Ù…ÙŠØ²Ø§Øª Ù…Ø¬Ø§Ù†Ø§Ù‹. Ø§Ø´ØªØ±Ùƒ Ù‚Ø¨Ù„ Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡.",
      cta: "Ø§Ø®ØªØ± Ø¨Ø§Ù‚ØªÙƒ",
    },
    expiring: {
      bg: "bg-gradient-to-l from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800/30",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      title: `âš ï¸ Ø§Ø´ØªØ±Ø§ÙƒÙƒ ÙŠÙ†ØªÙ‡ÙŠ Ø®Ù„Ø§Ù„ ${status.daysLeft} Ø£ÙŠØ§Ù…`,
      subtitle: "Ø¬Ø¯Ù‘Ø¯ Ø§Ø´ØªØ±Ø§ÙƒÙƒ Ù„Ø¶Ù…Ø§Ù† Ø§Ø³ØªÙ…Ø±Ø§Ø± Ø¹Ù…Ù„Ùƒ Ø¨Ø¯ÙˆÙ† Ø§Ù†Ù‚Ø·Ø§Ø¹.",
      cta: "ØªØ¬Ø¯ÙŠØ¯ Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ",
    },
    expired: {
      bg: "bg-gradient-to-l from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800/30",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      title: "ðŸš« Ø§Ø´ØªØ±Ø§ÙƒÙƒ Ù…Ù†ØªÙ‡ÙŠ â€” Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„Ø­Ø§Ù„ÙŠ: Ù‚Ø±Ø§Ø¡Ø© ÙÙ‚Ø·",
      subtitle: "Ù„Ù† ØªØ³ØªØ·ÙŠØ¹ Ø¥Ø¶Ø§ÙØ© Ø£Ùˆ ØªØ¹Ø¯ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª. Ø¬Ø¯Ù‘Ø¯ Ø§Ù„Ø¢Ù† Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„ÙˆØµÙˆÙ„ Ø§Ù„ÙƒØ§Ù…Ù„.",
      cta: "Ø¬Ø¯Ù‘Ø¯ Ø§Ù„Ø¢Ù†",
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
              aria-label="Ø¥ØºÙ„Ø§Ù‚"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
