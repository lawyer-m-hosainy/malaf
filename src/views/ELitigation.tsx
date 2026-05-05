import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, ExternalLink, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useCasesStore } from "@/store/useCasesStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ELitigation() {
  const cases = useCasesStore(state => state.cases);
  const linked = cases.filter(c => c.eLitigationStatus === 'مربوط ببوابة التقاضي');
  const unlinked = cases.filter(c => c.eLitigationStatus === 'غير مربوط');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">بوابة التقاضي الإلكتروني</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">متابعة حالة القضايا على بوابة التقاضي الإلكتروني المصري.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20"><CheckCircle2 className="w-6 h-6 text-green-500" /></div>
            <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">قضايا مربوطة</p><p className="text-2xl font-bold text-navy-900 dark:text-white">{linked.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20"><XCircle className="w-6 h-6 text-red-500" /></div>
            <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">قضايا غير مربوطة</p><p className="text-2xl font-bold text-navy-900 dark:text-white">{unlinked.length}</p></div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2"><Monitor className="w-5 h-5 text-primary-500" /> حالة الربط بالبوابة</CardTitle>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info('جاري مزامنة البيانات مع البوابة...')}><RefreshCw size={14} /> مزامنة</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {cases.filter(c => c.eLitigationStatus).map(c => (
              <div key={c.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between">
                <div>
                  <p className="font-bold text-navy-900 dark:text-white">{c.plaintiff} ضد {c.defendant}</p>
                  <p className="text-sm text-slate-500 mt-1">{c.court}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  c.eLitigationStatus === 'مربوط ببوابة التقاضي' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {c.eLitigationStatus === 'مربوط ببوابة التقاضي' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {c.eLitigationStatus}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
