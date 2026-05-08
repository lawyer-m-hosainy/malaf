import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, FileText, Users, CheckCircle2, ArrowLeft, ArrowRight, Plus, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PLANS, PlanTier } from "@/modules/subscriptions/subscriptionService";
import { isFeatureEnabled } from "@/config/features";

interface OnboardingData {
  officeName: string;
  vatNumber: string;
  logoUrl: string;
  selectedPlan: PlanTier;
  teamEmails: string[];
}

const STEPS = [
  { id: 1, title: "بيانات المكتب", icon: Building2 },
  { id: 2, title: "اختيار الخطة", icon: FileText },
  { id: 3, title: "دعوة الفريق", icon: Users },
  { id: 4, title: "الإعداد مكتمل", icon: CheckCircle2 },
];

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    officeName: "",
    vatNumber: "",
    logoUrl: "",
    selectedPlan: "basic",
    teamEmails: [""],
  });
  const [emailInput, setEmailInput] = useState("");

  if (!isFeatureEnabled("TENANT_ONBOARDING")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
        <p className="text-slate-500">هذه الميزة معطّلة حالياً.</p>
      </div>
    );
  }

  const handleNext = () => {
    if (step === 1 && (!data.officeName || !data.vatNumber)) {
      toast.error("يرجى تعبئة اسم المكتب والرقم الضريبي");
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const addEmail = () => {
    if (emailInput && emailInput.includes("@")) {
      setData({ ...data, teamEmails: [...data.teamEmails, emailInput] });
      setEmailInput("");
    }
  };

  const removeEmail = (index: number) => {
    setData({ ...data, teamEmails: data.teamEmails.filter((_, i) => i !== index) });
  };

  const handleComplete = () => {
    toast.success("تم إنشاء مكتبك بنجاح! مرحباً بك في مَلَف.");
    // In production: create organization in Supabase, send invite emails, etc.
    console.log("[Onboarding] Tenant created:", data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 dark:from-navy-900 dark:to-navy-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
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
              {/* Step 1: Office Info */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="officeName" className="text-navy-900 dark:text-white font-bold">اسم المكتب / المنشأة</Label>
                    <Input id="officeName" value={data.officeName} onChange={(e) => setData({ ...data, officeName: e.target.value })} placeholder="مكتب الدكتور أحمد للمحاماة" className="dark:bg-white/5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber" className="text-navy-900 dark:text-white font-bold">الرقم الضريبي (15 خانة)</Label>
                    <Input id="vatNumber" value={data.vatNumber} onChange={(e) => setData({ ...data, vatNumber: e.target.value })} placeholder="300012345600003" maxLength={15} className="dark:bg-white/5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo" className="text-navy-900 dark:text-white font-bold">رابط الشعار (اختياري)</Label>
                    <Input id="logo" value={data.logoUrl} onChange={(e) => setData({ ...data, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" className="dark:bg-white/5" />
                  </div>
                </motion.div>
              )}

              {/* Step 2: Plan Selection */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.values(PLANS)).map((plan) => (
                    <button
                      key={plan.tier}
                      onClick={() => setData({ ...data, selectedPlan: plan.tier })}
                      className={cn(
                        "p-5 rounded-xl border-2 text-start transition-all hover:shadow-lg",
                        data.selectedPlan === plan.tier
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg"
                          : "border-slate-200 dark:border-white/10 hover:border-primary-300"
                      )}
                    >
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
                </motion.div>
              )}

              {/* Step 3: Invite Team */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400">أضف عناوين البريد الإلكتروني لأعضاء فريقك ليتم دعوتهم تلقائياً.</p>
                  <div className="flex gap-2">
                    <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="lawyer@example.com" className="dark:bg-white/5" onKeyDown={(e) => e.key === 'Enter' && addEmail()} />
                    <Button onClick={addEmail} size="sm" className="bg-primary-500 hover:bg-primary-600 text-white shrink-0"><Plus size={16} /></Button>
                  </div>
                  <div className="space-y-2">
                    {data.teamEmails.filter(e => e).map((email, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-lg px-4 py-2">
                        <span className="text-sm text-navy-900 dark:text-white">{email}</span>
                        <button title="حذف" aria-label="حذف" onClick={() => removeEmail(i)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{data.officeName} — الخطة {PLANS[data.selectedPlan].nameAr}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary-600">{data.teamEmails.filter(e => e).length}</p>
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
                  <Button onClick={handleComplete} className="bg-primary-500 hover:bg-primary-600 text-white gap-2 px-8">
                    <Sparkles size={16} />
                    ابدأ استخدام مَلَف
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            {step < 4 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="gap-2 text-slate-500">
                  <ArrowRight size={16} /> السابق
                </Button>
                <Button onClick={handleNext} className="bg-primary-500 hover:bg-primary-600 text-white gap-2">
                  التالي <ArrowLeft size={16} />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
