import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard, Crown, AlertTriangle, CheckCircle2, Clock, ArrowLeft,
  Zap, Users, Briefcase, TrendingUp, Calendar, XCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { PLANS } from "@/modules/subscriptions/subscriptionService";
import { formatDateEG } from "@/lib/formatEG";
import { InstapayCheckout } from "@/components/InstapayCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SubscriptionData {
  plan: string;
  status: string;
  current_period_end: string | null;
  billing_cycle: string;
  auto_renew: boolean;
  trial_ends_at: string | null;
}

interface UsageData {
  casesUsed: number;
  casesLimit: number;
  usersUsed: number;
  usersLimit: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string;
}

export default function Billing() {
  const currentUser = useAuthStore(state => state.currentUser);
  const orgId = currentUser?.orgId;

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData>({ casesUsed: 0, casesLimit: 5, usersUsed: 0, usersLimit: 1 });
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    plan: "basic" | "enterprise";
    amount: number;
    billingCycle: "monthly" | "yearly";
  } | null>(null);

  useEffect(() => {
    if (orgId) loadBillingData();
  }, [orgId]);

  async function loadBillingData() {
    setLoading(true);
    try {
      // 1. Get subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', orgId)
        .single();
      
      // 2. Get org plan if no subscription
      const { data: org } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', orgId)
        .single();

      const plan = sub?.plan || org?.plan || 'free';
      setSubscription(sub || { plan, status: 'active', current_period_end: null, billing_cycle: 'monthly', auto_renew: true, trial_ends_at: null });

      // 3. Get usage counts
      const { count: casesCount } = await supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null);

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      // 4. Get plan limits
      const { data: limits } = await supabase
        .from('plan_limits')
        .select('max_cases, max_users')
        .eq('plan_key', plan)
        .eq('is_active', true)
        .single();

      setUsage({
        casesUsed: casesCount ?? 0,
        casesLimit: limits?.max_cases ?? 5,
        usersUsed: usersCount ?? 0,
        usersLimit: limits?.max_users ?? 1,
      });

      // 5. Get payment history
      const { data: txns } = await supabase
        .from('payment_transactions')
        .select('id, amount, status, created_at, payment_method')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10);

      setPayments(txns || []);
    } catch (err) {
      console.error('Billing load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planKey: string) {
    setUpgrading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          planKey,
          billingCycle: subscription?.billing_cycle || 'monthly',
          buyerInfo: { email: currentUser?.email, name: currentUser?.name },
        }),
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.error || 'فشل في إنشاء رابط الدفع');
      }
    } catch {
      toast.error('حدث خطأ أثناء الاتصال ببوابة الدفع');
    } finally {
      setUpgrading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('هل أنت متأكد من إلغاء الاشتراك؟ ستفقد الوصول إلى الميزات المتقدمة عند انتهاء الفترة الحالية.')) return;
    try {
      await supabase
        .from('subscriptions')
        .update({ auto_renew: false, cancelled_at: new Date().toISOString() })
        .eq('organization_id', orgId);
      toast.success('تم إلغاء التجديد التلقائي. اشتراكك سيبقى فعالاً حتى نهاية الفترة الحالية.');
      loadBillingData();
    } catch {
      toast.error('تعذر إلغاء الاشتراك');
    }
  }

  // Derived values
  const currentPlan = subscription?.plan || 'free';
  const planConfig = Object.values(PLANS).find(p => p.tier === currentPlan) || PLANS.basic;
  const isFreePlan = currentPlan === 'free';
  const isTrial = subscription?.status === 'trial';
  const isExpired = subscription?.status === 'expired';
  const renewalDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const daysUntilRenewal = renewalDate ? Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const trialEnd = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">الفوترة والاشتراك</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">إدارة باقتك ومتابعة استهلاكك</p>
        </div>
      </div>

      {/* Trial / Expiry Warning */}
      {isTrial && trialDaysLeft !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-xl border-2 flex items-center gap-4",
            trialDaysLeft <= 3
              ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30"
              : trialDaysLeft <= 7
                ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30"
                : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30"
          )}
        >
          <Clock className={cn("w-6 h-6 shrink-0", trialDaysLeft <= 3 ? "text-red-500" : trialDaysLeft <= 7 ? "text-amber-500" : "text-blue-500")} />
          <div className="flex-1">
            <p className="font-bold text-navy-900 dark:text-white">
              {trialDaysLeft <= 0 ? 'انتهت الفترة التجريبية!' : `متبقي ${trialDaysLeft} يوم من الفترة التجريبية`}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {trialDaysLeft <= 0
                ? 'يرجى ترقية باقتك لاستمرار الوصول الكامل للمنصة.'
                : 'اشترك الآن لضمان استمرار عملك بدون انقطاع.'}
            </p>
          </div>
          <Button onClick={() => {
            setSelectedPlan({ plan: "basic", amount: PLANS.basic.priceMonthly, billingCycle: "monthly" });
            setCheckoutOpen(true);
          }} className="bg-primary-600 hover:bg-primary-700 text-white shrink-0">
            اشترك الآن
          </Button>
        </motion.div>
      )}

      {isExpired && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800/30 flex items-center gap-4">
          <XCircle className="w-6 h-6 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-red-700 dark:text-red-400">اشتراكك منتهي — الوضع الحالي: قراءة فقط</p>
            <p className="text-sm text-slate-500">لن تستطيع إضافة أو تعديل بيانات حتى تجدد اشتراكك.</p>
          </div>
          <Button onClick={() => {
            const planToRenew = currentPlan === 'free' ? 'basic' : currentPlan;
            const planConfig = Object.values(PLANS).find(p => p.tier === planToRenew) || PLANS.basic;
            setSelectedPlan({ plan: planToRenew as "basic"|"enterprise", amount: planConfig.priceMonthly, billingCycle: "monthly" });
            setCheckoutOpen(true);
          }} className="bg-red-600 hover:bg-red-700 text-white shrink-0">
            جدّد الآن
          </Button>
        </motion.div>
      )}

      {/* Current Plan Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-lg dark:bg-navy-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                الباقة الحالية
              </CardTitle>
              <Badge className={cn(
                "text-xs font-bold",
                subscription?.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                subscription?.status === 'trial' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {subscription?.status === 'active' ? 'فعّال' : subscription?.status === 'trial' ? 'تجريبي' : 'منتهي'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-navy-900 dark:text-white">{planConfig.nameAr}</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {isFreePlan ? 'مجاني' : `${planConfig.priceMonthly} ج.م / ${subscription?.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}`}
                </p>
              </div>
              {renewalDate && daysUntilRenewal !== null && (
                <div className="ms-auto text-end">
                  <p className="text-sm text-slate-400">تاريخ التجديد</p>
                  <p className="font-bold text-navy-900 dark:text-white">
                    {formatDateEG(renewalDate)}
                  </p>
                  <p className="text-xs text-slate-400">({daysUntilRenewal} يوم متبقي)</p>
                </div>
              )}
            </div>

            {/* Usage Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UsageMeter
                icon={Briefcase}
                label="القضايا"
                used={usage.casesUsed}
                limit={usage.casesLimit}
                color="primary"
              />
              <UsageMeter
                icon={Users}
                label="المستخدمون"
                used={usage.usersUsed}
                limit={usage.usersLimit}
                color="emerald"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {!isFreePlan && subscription?.auto_renew !== false && (
                <Button variant="outline" onClick={handleCancelSubscription} className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800/30 dark:hover:bg-red-900/10">
                  إلغاء التجديد التلقائي
                </Button>
              )}
              {subscription?.auto_renew === false && (
                <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5">
                  لن يتم التجديد — ينتهي {renewalDate ? formatDateEG(renewalDate) : ''}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Upgrade */}
        <Card className="border-none shadow-lg dark:bg-navy-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              ترقية الباقة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(PLANS).filter(p => {
              const tierOrder = { basic: 1, enterprise: 2 };
              const currentOrder = tierOrder[currentPlan as keyof typeof tierOrder] || 0;
              return (tierOrder[p.tier as keyof typeof tierOrder] || 0) > currentOrder;
            }).map(plan => (
              <button
                key={plan.tier}
                onClick={() => {
                  setSelectedPlan({ plan: plan.tier as "basic"|"enterprise", amount: plan.priceMonthly, billingCycle: "monthly" });
                  setCheckoutOpen(true);
                }}
                className="w-full p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:border-primary-200 dark:hover:border-primary-800/30 transition-all text-start group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-navy-900 dark:text-white group-hover:text-primary-600 transition-colors">{plan.nameAr}</span>
                  <span className="text-primary-600 font-bold">{plan.priceMonthly} ج.م</span>
                </div>
                <p className="text-xs text-slate-400">
                  {plan.maxUsers === -1 ? 'مستخدمين غير محدود' : `حتى ${plan.maxUsers} مستخدم`} · {plan.maxCases === -1 ? 'قضايا غير محدودة' : `${plan.maxCases} قضية`}
                </p>
              </button>
            ))}
            {Object.values(PLANS).filter(p => {
              const tierOrder = { basic: 1, enterprise: 2 };
              const currentOrder = tierOrder[currentPlan as keyof typeof tierOrder] || 0;
              return (tierOrder[p.tier as keyof typeof tierOrder] || 0) > currentOrder;
            }).length === 0 && (
              <div className="text-center py-6 text-slate-400">
                <Crown className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                <p className="text-sm font-bold">أنت على أعلى باقة! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="border-none shadow-lg dark:bg-navy-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-400" />
            سجل المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5">
                    <th className="text-start py-3 px-4 text-slate-400 font-medium">التاريخ</th>
                    <th className="text-start py-3 px-4 text-slate-400 font-medium">المبلغ</th>
                    <th className="text-start py-3 px-4 text-slate-400 font-medium">طريقة الدفع</th>
                    <th className="text-start py-3 px-4 text-slate-400 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(tx => (
                    <tr key={tx.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-navy-900 dark:text-white">
                        {formatDateEG(tx.created_at)}
                      </td>
                      <td className="py-3 px-4 font-bold text-navy-900 dark:text-white">{tx.amount} ج.م</td>
                      <td className="py-3 px-4 text-slate-500">{tx.payment_method || 'بطاقة'}</td>
                      <td className="py-3 px-4">
                        <Badge className={cn(
                          "text-[10px]",
                          tx.status === 'success' ? "bg-green-100 text-green-700" :
                          tx.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {tx.status === 'success' ? 'مدفوع' : tx.status === 'pending' ? 'قيد المعالجة' : 'فشل'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold mb-1">لا توجد مدفوعات بعد</p>
              <p className="text-xs">ستظهر هنا سجل مدفوعاتك بعد أول عملية دفع.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إتمام الاشتراك</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <InstapayCheckout
              {...selectedPlan}
              onSuccess={() => { setCheckoutOpen(false); loadBillingData(); }}
              onCancel={() => setCheckoutOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Usage Meter Component ───────────────────────────────────
function UsageMeter({ icon: Icon, label, used, limit, color }: {
  icon: any; label: string; used: number; limit: number; color: string;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 15 : Math.min(100, (used / limit) * 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-colors",
      isAtLimit ? "border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/5" :
      isNearLimit ? "border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/5" :
      "border-slate-100 dark:border-white/5"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", isAtLimit ? "text-red-500" : isNearLimit ? "text-amber-500" : `text-${color}-500`)} />
          <span className="text-sm font-bold text-navy-900 dark:text-white">{label}</span>
        </div>
        <span className={cn("text-sm font-bold", isAtLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-slate-600 dark:text-slate-400")}>
          {used} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <Progress value={percentage} dir="rtl" className={cn(
        "h-2",
        isAtLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-amber-500" : `[&>div]:bg-${color}-500`
      )} />
      {isAtLimit && (
        <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          تم الوصول للحد الأقصى — يرجى ترقية الباقة
        </p>
      )}
    </div>
  );
}
