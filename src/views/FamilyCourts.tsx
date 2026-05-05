import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Baby, Coins, FileText } from "lucide-react";
import { useCasesStore } from "@/store/useCasesStore";

const familyCaseTypes = [
  { title: "خلع وطلاق", icon: Heart, count: 0 },
  { title: "نفقة زوجية وأولاد", icon: Coins, count: 0 },
  { title: "حضانة ورؤية", icon: Baby, count: 0 },
  { title: "ميراث وتركات", icon: FileText, count: 0 },
];

export default function FamilyCourts() {
  const cases = useCasesStore(state => state.cases);
  const familyCases = cases.filter(c => c.type === 'أحوال شخصية');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">محاكم الأسرة</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة قضايا الأحوال الشخصية أمام محاكم الأسرة المصرية.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {familyCaseTypes.map((cat, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800 text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <cat.icon className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="font-bold text-navy-900 dark:text-white text-sm">{cat.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="pb-4"><CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2"><Users className="w-5 h-5 text-pink-500" /> قضايا الأسرة ({familyCases.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {familyCases.length > 0 ? familyCases.map(c => (
              <div key={c.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <p className="font-bold text-navy-900 dark:text-white">{c.plaintiff} ضد {c.defendant}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  <span>{c.court}</span>
                  {c.familyCaseType && <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded text-xs font-bold">{c.familyCaseType}</span>}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-500">لا توجد قضايا أسرة حالياً</div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
