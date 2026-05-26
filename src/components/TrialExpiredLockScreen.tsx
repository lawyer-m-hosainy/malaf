import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock, CreditCard, Download, CheckCircle2, Scale,
  Loader2, LogOut, AlertTriangle
} from "lucide-react";
import { PLANS } from "@/modules/subscriptions/subscriptionService";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

interface TrialExpiredLockScreenProps {
  onUpgradeStart?: (planKey: string) => void;
}

export function TrialExpiredLockScreen({ onUpgradeStart }: TrialExpiredLockScreenProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const currentUser = useAuthStore(state => state.currentUser);
  const orgId = currentUser?.orgId;

  // Export personal data only (clients, cases names, basic info — NO sensitive data)
  async function handleExportData() {
    setExporting(true);
    try {
      const exportData: Record<string, any> = {
        exportDate: new Date().toISOString(),
        officeName: currentUser?.name || "غير محدد",
        email: currentUser?.email || "",
      };

      // Fetch clients (basic info only)
      if (orgId) {
        const { data: clients } = await supabase
          .from("clients")
          .select("name, phone, email, type")
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .limit(500);
        exportData.clients = clients || [];

        // Fetch cases (basic info only)
        const { data: cases } = await supabase
          .from("cases")
          .select("title, case_number, court, type, status")
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .limit(500);
        exportData.cases = cases || [];
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `malaf-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExported(true);
      toast.success("تم تصدير بياناتك بنجاح");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("فشل تصدير البيانات. حاول مرة أخرى.");
    } finally {
      setExporting(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 flex items-center justify-center p-4 font-sans" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/20">
            <Lock className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-navy-900 dark:text-white mb-3">
            انتهت فترة التجربة المجانية
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg mx-auto">
            لقد انتهت فترة التجربة المجانية (7 أيام). لديك خياران للمتابعة:
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 mb-8 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            لن تتمكن من الوصول إلى بيانات مكتبك أو استخدام أي ميزة حتى تختار أحد الخيارين أدناه.
          </p>
        </div>

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Upgrade */}
          <Card className="border-2 border-primary-200 dark:border-primary-800/30 bg-primary-50/30 dark:bg-primary-900/5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-emerald-500" />
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-navy-900 dark:text-white">الخيار الأول: اشترك الآن</h3>
                  <p className="text-xs text-slate-500">واصل عملك بدون انقطاع</p>
                </div>
              </div>

              <div className="space-y-3">
                {Object.values(PLANS).map(plan => (
                  <button
                    key={plan.tier}
                    onClick={() => onUpgradeStart?.(plan.tier)}
                    className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-white/5 hover:border-primary-300 dark:hover:border-primary-700 transition-all text-start group bg-white dark:bg-navy-800"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-navy-900 dark:text-white group-hover:text-primary-600 transition-colors">
                        {plan.nameAr}
                      </span>
                      <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-bold">
                        {plan.priceMonthly} ج.م/شهر
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      {plan.maxUsers === -1 ? "مستخدمين غير محدود" : `حتى ${plan.maxUsers} مستخدم`} · {plan.maxCases === -1 ? "قضايا غير محدودة" : `${plan.maxCases} قضية`}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Option 2: Export Data & Leave */}
          <Card className="border-2 border-slate-200 dark:border-white/10 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-navy-900 dark:text-white">الخيار الثاني: سحب بياناتك</h3>
                  <p className="text-xs text-slate-500">تصدير بياناتك الشخصية فقط</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-4 space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-3">
                  سيتم تصدير البيانات التالية فقط:
                </p>
                <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  {[
                    "أسماء وأرقام هواتف الموكلين",
                    "عناوين القضايا وأرقامها",
                    "معلومات المكتب الأساسية",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={handleExportData}
                disabled={exporting}
                className="w-full py-5 bg-slate-600 hover:bg-slate-700 text-white font-bold"
              >
                {exporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : exported ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 me-2" />
                    تم التصدير — حمّل مرة أخرى
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 me-2" />
                    تحميل بياناتي (ملف JSON)
                  </>
                )}
              </Button>

              {exported && (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full py-5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/30 dark:text-red-400 dark:hover:bg-red-900/10 font-bold"
                >
                  <LogOut className="w-5 h-5 me-2" />
                  تسجيل الخروج
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          إذا كنت بحاجة لمساعدة، تواصل معنا عبر واتساب على الرقم <span dir="ltr">+20 114 197 3834</span>
        </p>
      </motion.div>
    </div>
  );
}
