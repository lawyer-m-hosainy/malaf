import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gavel, AlertCircle } from "lucide-react";
import { useCasesStore } from "@/store/useCasesStore";

const councilBranches = [
  { name: "محكمة القضاء الإداري", desc: "الطعون على القرارات الإدارية" },
  { name: "المحكمة الإدارية العليا", desc: "الطعن على أحكام القضاء الإداري" },
  { name: "هيئة مفوضي الدولة", desc: "إعداد التقارير والرأي القانوني" },
];

export default function StateCouncil() {
  const cases = useCasesStore(state => state.cases);
  const adminCases = cases.filter(c => c.type === 'إداري');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">مجلس الدولة / القضاء الإداري</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة الطعون والقضايا الإدارية أمام مجلس الدولة المصري.</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">تنبيه مواعيد الطعن</p>
          <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">ميعاد الطعن في القرارات الإدارية: 60 يوم من تاريخ الإخطار أو العلم اليقيني.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {councilBranches.map((branch, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mb-4">
                <Gavel className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="font-bold text-navy-900 dark:text-white mb-1">{branch.name}</h3>
              <p className="text-sm text-slate-500">{branch.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
          <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary-500" /> القضايا الإدارية ({adminCases.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {adminCases.length > 0 ? adminCases.map(c => (
              <div key={c.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <p className="font-bold text-navy-900 dark:text-white">{c.plaintiff} ضد {c.defendant}</p>
                <p className="text-sm text-slate-500 mt-1">{c.court} — {c.status}</p>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-500">لا توجد قضايا إدارية حالياً</div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
