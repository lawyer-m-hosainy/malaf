import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Users, Scale, CheckCircle2, ArrowLeft, Loader2, UserPlus, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useCasesStore } from "@/store/useCasesStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "بيانات المكتب", icon: Building2 },
  { id: 2, title: "الفريق", icon: Users },
  { id: 3, title: "أول موكل", icon: UserPlus },
  { id: 4, title: "أول قضية", icon: Scale },
];

export function FirstLoginWizard() {
  const { currentUser } = useAuthStore();
  const orgId = currentUser?.orgId;
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1: Profile
  const [address, setAddress] = useState("");
  const [barNumber, setBarNumber] = useState("");

  // Step 2: Team Member
  const [teamEmail, setTeamEmail] = useState("");
  const [teamName, setTeamName] = useState("");

  // Step 3: Client
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Step 4: Case
  const [caseTitle, setCaseTitle] = useState("");
  const [caseType, setCaseType] = useState("مدني");

  useEffect(() => {
    if (!orgId) return;
    checkOnboardingStatus();
  }, [orgId]);

  async function checkOnboardingStatus() {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('onboarding_completed')
        .eq('id', orgId)
        .single();
      
      if (data && !data.onboarding_completed) {
        setIsOpen(true);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  async function completeOnboarding() {
    setSubmitting(true);
    try {
      // Step 1: Update org profile
      if (address || barNumber) {
        await supabase
          .from('organizations')
          .update({ address, bar_association_number: barNumber, onboarding_completed: true })
          .eq('id', orgId);
      } else {
        await supabase
          .from('organizations')
          .update({ onboarding_completed: true })
          .eq('id', orgId);
      }

      // Step 2: Add team member (if entered)
      if (teamEmail && teamName) {
        await supabase.from('team_invitations').insert({ org_id: orgId, email: teamEmail, role: 'محامي', status: 'pending' });
        // Actually we just mock it for UI as invitation
      }

      // Step 3 & 4: Add client and case
      if (clientName) {
        const { data: client } = await supabase.from('clients').insert({
          org_id: orgId,
          name: clientName,
          phone: clientPhone,
          type: 'فرد',
          status: 'نشط'
        }).select().single();

        if (client && caseTitle) {
          await supabase.from('cases').insert({
            org_id: orgId,
            client_id: client.id,
            title: caseTitle,
            type: caseType,
            status: 'متداولة',
            plaintiff: clientName,
            defendant: 'خصم افتراضي'
          });
        }
        
        // Refresh stores
        await useClientsStore.getState().fetchClients();
        await useCasesStore.getState().fetchCases();
      }

      toast.success("تم إعداد مكتبك بنجاح! 🎉");
      setIsOpen(false);
      window.dispatchEvent(new Event('onboarding_completed'));
    } catch (err) {
      toast.error("حدث خطأ أثناء الإعداد");
    } finally {
      setSubmitting(false);
    }
  }

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else completeOnboarding();
  };

  if (loading || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white dark:bg-navy-900 border-none rounded-2xl" hideCloseButton>
        <div className="flex h-[500px]">
          {/* Sidebar */}
          <div className="w-1/3 bg-slate-50 dark:bg-black/20 p-6 border-e border-slate-100 dark:border-white/5">
            <h2 className="text-xl font-bold text-primary-600 mb-8">إعداد المكتب</h2>
            <div className="space-y-6">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                    step === s.id ? "bg-primary-500 text-white shadow-md shadow-primary-500/30" : 
                    step > s.id ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-400"
                  )}>
                    {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                  </div>
                  <span className={cn(
                    "font-medium text-sm",
                    step >= s.id ? "text-navy-900 dark:text-white" : "text-slate-400"
                  )}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="w-2/3 p-8 flex flex-col">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                      <Building2 className="text-primary-500" />
                      بيانات المكتب الإضافية
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">أكمل بيانات مكتبك لتظهر في تقاريرك ومستنداتك.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>عنوان المكتب</Label>
                      <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="مثال: شارع التسعين، التجمع الخامس" className="dark:bg-white/5" />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم القيد في نقابة المحامين</Label>
                      <Input value={barNumber} onChange={e => setBarNumber(e.target.value)} placeholder="مثال: 12345" className="dark:bg-white/5" dir="ltr" />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                      <Users className="text-primary-500" />
                      إضافة أول زميل للفريق
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">العمل مع فريق يزيد من إنتاجيتك (يمكنك تخطي هذه الخطوة).</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>اسم المحامي</Label>
                      <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="مثال: أ. محمد محمود" className="dark:bg-white/5" />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input value={teamEmail} onChange={e => setTeamEmail(e.target.value)} placeholder="lawyer@example.com" className="dark:bg-white/5" dir="ltr" />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                      <UserPlus className="text-primary-500" />
                      إضافة أول موكل
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">دعنا نضيف أول موكل لك لتبدأ في إدارة قضاياه.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>اسم الموكل</Label>
                      <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="مثال: شركة النصر للتجارة" className="dark:bg-white/5" />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="01xxxxxxxxx" className="dark:bg-white/5" dir="ltr" />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                      <Scale className="text-primary-500" />
                      إضافة أول قضية
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">ابدأ بأول قضية مرتبطة بالموكل الذي قمت بإضافته.</p>
                  </div>
                  {clientName ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10 text-sm">
                        <span className="text-slate-500">الموكل المرتبط: </span>
                        <span className="font-bold text-navy-900 dark:text-white">{clientName}</span>
                      </div>
                      <div className="space-y-2">
                        <Label>عنوان القضية</Label>
                        <Input value={caseTitle} onChange={e => setCaseTitle(e.target.value)} placeholder="مثال: دعوى مطالبة مالية" className="dark:bg-white/5" />
                      </div>
                      <div className="space-y-2">
                        <Label>نوع القضية</Label>
                        <select 
                          title="نوع القضية"
                          aria-label="نوع القضية"
                          className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-transparent text-sm"
                          value={caseType}
                          onChange={e => setCaseType(e.target.value)}
                        >
                          {['مدني', 'تجاري', 'عمالي', 'جنائي', 'أحوال شخصية', 'إداري'].map(t => (
                            <option key={t} value={t} className="dark:bg-navy-900">{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                      <FileText className="w-12 h-12 mb-2 opacity-20" />
                      <p>لم تقم بإضافة موكل في الخطوة السابقة.</p>
                      <p className="text-xs">يمكنك تخطي هذه الخطوة والإضافة لاحقاً من لوحة التحكم.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer / Actions */}
            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <Button variant="ghost" onClick={handleNext} disabled={submitting} className="text-slate-500 hover:text-slate-700">
                تخطي الخطوة
              </Button>
              <Button onClick={handleNext} disabled={submitting} className="bg-primary-600 hover:bg-primary-700 text-white gap-2 px-6">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : step === 4 ? <CheckCircle2 size={16} /> : <ArrowLeft size={16} />}
                {submitting ? 'جاري الحفظ...' : step === 4 ? 'إنهاء الإعداد' : 'التالي'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
