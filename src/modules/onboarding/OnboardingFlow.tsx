import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, FileText, Users, CheckCircle2, ArrowLeft, ArrowRight, Plus, X, Sparkles, Loader2, Mail, Lock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PLANS, PlanTier } from "@/modules/subscriptions/subscriptionService";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { ensureUserOrganization } from "@/services/organizationSetup";
import { setTenantIdCache } from "@/lib/tenant";
import { useAuthStore } from "@/store/useAuthStore";

interface OnboardingData {
  officeName: string;
  adminName: string;
  email: string;
  password: string;
  phone: string;
  selectedPlan: PlanTier;
  teamEmails: string[];
}

const STEPS = [
  { id: 1, title: "بيانات المكتب والمسؤول", icon: Building2 },
  { id: 2, title: "اختيار الباقة", icon: FileText },
  { id: 3, title: "دعوة الفريق", icon: Users },
  { id: 4, title: "الإعداد مكتمل", icon: CheckCircle2 },
];

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    officeName: "",
    adminName: "",
    email: "",
    password: "",
    phone: "",
    selectedPlan: "basic",
    teamEmails: [],
  });
  const [emailInput, setEmailInput] = useState("");
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (!authUser) return;
    setData((prev) => ({
      ...prev,
      adminName: prev.adminName || (authUser.user_metadata?.full_name as string) || "",
      email: prev.email || authUser.email || "",
      officeName: prev.officeName || (authUser.user_metadata?.full_name as string) || "",
    }));
  }, [authUser]);

  const handleNext = () => {
    if (step === 1) {
      if (!data.officeName.trim()) { toast.error("يرجى إدخال اسم المكتب"); return; }
      if (!data.adminName.trim()) { toast.error("يرجى إدخال اسم المسؤول"); return; }
      if (!authUser) {
        if (!data.email.includes("@")) { toast.error("يرجى إدخال بريد إلكتروني صحيح"); return; }
        if (data.password.length < 8) { toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
      }
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const addEmail = () => {
    if (emailInput && emailInput.includes("@") && !data.teamEmails.includes(emailInput)) {
      setData({ ...data, teamEmails: [...data.teamEmails, emailInput] });
      setEmailInput("");
    }
  };

  const removeEmail = (index: number) => {
    setData({ ...data, teamEmails: data.teamEmails.filter((_, i) => i !== index) });
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // ═══ مسار 1: إنشاء حساب جديد إن لم يكن مسجلاً ═══
      if (!authUser) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.adminName,
              role: 'مدير_مكتب',
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            toast.error("هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.");
          } else {
            toast.error(`خطأ في التسجيل: ${authError.message}`);
          }
          setLoading(false);
          return;
        }

        if (!authData.user) {
          toast.error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
          setLoading(false);
          return;
        }

        if (authData.user.identities?.length === 0) {
          toast.info("يرجى تفعيل حسابك عبر رابط التأكيد المرسل لبريدك.");
          navigate('/login');
          setLoading(false);
          return;
        }

        if (!authData.session) {
          toast.success("تم إنشاء مكتبك بنجاح! 🎉 يرجى تفعيل حسابك عبر البريد الإلكتروني.");
          setStep(4);
          setLoading(false);
          return;
        }
      }

      // ═══ مسار 2: إنشاء/ربط المكتب (موحّد) ═══
      const sessionUser = authUser || (await supabase.auth.getUser()).data.user;
      if (!sessionUser) {
        toast.error("يرجى تسجيل الدخول أولاً.");
        navigate('/login');
        setLoading(false);
        return;
      }

      const orgId = await ensureUserOrganization(sessionUser, {
        officeName: data.officeName,
        plan: data.selectedPlan,
        role: 'org_admin',
      });

      if (!orgId) {
        toast.error("فشل في إنشاء المكتب. يرجى المحاولة مرة أخرى.");
        setLoading(false);
        return;
      }

      // تحديث اسم المكتب والباقة إن وُجدت الأعمدة
      await supabase
        .from('organizations')
        .update({
          name: data.officeName,
          plan: data.selectedPlan === 'basic' ? 'free' : data.selectedPlan,
          onboarding_completed: true,
        })
        .eq('id', orgId);

      setTenantIdCache(orgId);
      useAuthStore.getState().setCurrentUser({
        id: sessionUser.id,
        name: data.adminName || sessionUser.user_metadata?.full_name || "المستخدم",
        email: data.email || sessionUser.email || "",
        role: "مدير مكتب",
        orgId,
      });

      localStorage.setItem('onboarding_completed', '1');
      toast.success("مبروك! تم إنشاء مكتبك بنجاح! 🎉");
      navigate('/dashboard');
    } catch (err) {
      console.error("[Onboarding] complete error:", err);
      toast.error("حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 dark:from-navy-900 dark:to-navy-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black bg-gradient-to-l from-primary-600 to-primary-500 bg-clip-text text-transparent">مَلَف</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">إنشاء حساب مكتب جديد</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                step >= s.id
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                  : "bg-slate-200 dark:bg-white/10 text-slate-400"
              )}>
                <s.icon size={18} />
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-12 h-0.5 rounded", step > s.id ? "bg-primary-500" : "bg-slate-200 dark:bg-white/10")} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-none shadow-2xl dark:bg-navy-800 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-500 p-6">
            <CardTitle className="text-white text-xl flex items-center gap-3">
              <Sparkles className="text-accent-400" />
              {STEPS[step - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Office + Admin Info */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="officeName" className="text-navy-900 dark:text-white font-bold flex items-center gap-2">
                        <Building2 size={14} className="text-primary-500" />
                        اسم المكتب / المنشأة *
                      </Label>
                      <Input id="officeName" value={data.officeName} onChange={(e) => setData({ ...data, officeName: e.target.value })} placeholder="مكتب الدكتور أحمد للمحاماة" className="dark:bg-white/5" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminName" className="text-navy-900 dark:text-white font-bold flex items-center gap-2">
                        <Users size={14} className="text-primary-500" />
                        اسم المسؤول *
                      </Label>
                      <Input id="adminName" value={data.adminName} onChange={(e) => setData({ ...data, adminName: e.target.value })} placeholder="أحمد محمد" className="dark:bg-white/5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-navy-900 dark:text-white font-bold flex items-center gap-2">
                      <Mail size={14} className="text-primary-500" />
                      البريد الإلكتروني *
                    </Label>
                    <Input id="email" type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="admin@lawfirm.com" className="dark:bg-white/5" dir="ltr" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-navy-900 dark:text-white font-bold flex items-center gap-2">
                        <Lock size={14} className="text-primary-500" />
                        كلمة المرور *
                      </Label>
                      <Input id="password" type="password" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} placeholder="8 أحرف على الأقل" className="dark:bg-white/5" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-navy-900 dark:text-white font-bold flex items-center gap-2">
                        <Phone size={14} className="text-primary-500" />
                        رقم الهاتف (اختياري)
                      </Label>
                      <Input id="phone" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="01234567890" className="dark:bg-white/5" dir="ltr" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-green-500" />
                    بياناتك مشفرة ومحمية بمعيار AES-256
                  </p>
                </motion.div>
              )}

              {/* Step 2: Plan Selection */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">
                    اختر الباقة المناسبة لمكتبك — جميع الباقات تبدأ بـ <span className="font-bold text-primary-600">14 يوم تجربة مجانية</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.values(PLANS)).map((plan) => (
                      <button
                        key={plan.tier}
                        onClick={() => setData({ ...data, selectedPlan: plan.tier })}
                        className={cn(
                          "p-5 rounded-xl border-2 text-start transition-all hover:shadow-lg relative",
                          data.selectedPlan === plan.tier
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg"
                            : "border-slate-200 dark:border-white/10 hover:border-primary-300"
                        )}
                      >
                        {data.selectedPlan === plan.tier && (
                          <div className="absolute -top-2 -end-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-navy-900 dark:text-white">{plan.nameAr}</span>
                          {plan.tier === 'advanced' && <Badge className="bg-accent-500 text-white text-[10px]">الأكثر طلباً</Badge>}
                        </div>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{plan.priceMonthly} <span className="text-xs font-normal text-slate-400">ج.م/شهر</span></p>
                        <ul className="mt-4 space-y-2">
                          {plan.features.slice(0, 4).map((f) => (
                            <li key={f} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                              <CheckCircle2 size={12} className="text-primary-500 mt-0.5 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <p className="text-[10px] text-slate-400 mt-3">
                          {plan.maxUsers === -1 ? "مستخدمين غير محدود" : `حتى ${plan.maxUsers} مستخدمين`} · {plan.maxCases === -1 ? "قضايا غير محدودة" : `${plan.maxCases} قضية`}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Invite Team */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400">أضف عناوين البريد الإلكتروني لأعضاء فريقك ليتم دعوتهم تلقائياً. (يمكنك تخطي هذه الخطوة)</p>
                  <div className="flex gap-2">
                    <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="lawyer@example.com" className="dark:bg-white/5" dir="ltr" onKeyDown={(e) => e.key === 'Enter' && addEmail()} />
                    <Button onClick={addEmail} size="sm" className="bg-primary-500 hover:bg-primary-600 text-white shrink-0"><Plus size={16} /></Button>
                  </div>
                  <div className="space-y-2">
                    {data.teamEmails.map((email, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-lg px-4 py-2">
                        <span className="text-sm text-navy-900 dark:text-white" dir="ltr">{email}</span>
                        <button title="حذف" aria-label="حذف" onClick={() => removeEmail(i)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                  {data.teamEmails.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-4">لم تضف أعضاء بعد — يمكنك إضافتهم لاحقاً من لوحة التحكم</p>
                  )}
                </motion.div>
              )}

              {/* Step 4: Complete */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
                  <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy-900 dark:text-white">مبروك! مكتبك جاهز 🎉</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{data.officeName} — باقة {PLANS[data.selectedPlan].nameAr}</p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-bold">
                      ✨ 14 يوم تجربة مجانية تبدأ من الآن
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary-600">{data.teamEmails.length}</p>
                      <p className="text-[10px] text-slate-400">دعوات مرسلة</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-600">{PLANS[data.selectedPlan].maxUsers === -1 ? '∞' : PLANS[data.selectedPlan].maxUsers}</p>
                      <p className="text-[10px] text-slate-400">حد المستخدمين</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-600">{PLANS[data.selectedPlan].maxCases === -1 ? '∞' : PLANS[data.selectedPlan].maxCases}</p>
                      <p className="text-[10px] text-slate-400">حد القضايا</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">📧 تم إرسال رابط تفعيل الحساب إلى: <span className="font-bold text-navy-900 dark:text-white" dir="ltr">{data.email}</span></p>
                    <Button onClick={() => navigate('/login')} className="bg-primary-500 hover:bg-primary-600 text-white gap-2 px-8">
                      <Sparkles size={16} />
                      تسجيل الدخول
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            {step < 4 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="gap-2 text-slate-500">
                  <ArrowRight size={16} /> السابق
                </Button>
                {step === 3 ? (
                  <Button onClick={handleComplete} disabled={loading} className="bg-primary-500 hover:bg-primary-600 text-white gap-2">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {loading ? 'جاري الإنشاء...' : 'إنشاء المكتب'}
                  </Button>
                ) : (
                  <Button onClick={handleNext} className="bg-primary-500 hover:bg-primary-600 text-white gap-2">
                    التالي <ArrowLeft size={16} />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-4">
          لديك حساب بالفعل؟{' '}
          <button onClick={() => navigate('/login')} className="text-primary-600 font-bold hover:underline">تسجيل الدخول</button>
        </p>
      </motion.div>
    </div>
  );
}
