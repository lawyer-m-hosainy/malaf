import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Building2, Shield, Scale } from "lucide-react";
import { useCasesStore } from "@/store/useCasesStore";

const caseCategories = [
  { title: "قضايا الشركات والإفلاس", desc: "قانون 11/2018 — إعادة هيكلة والإفلاس", icon: Building2, count: 0 },
  { title: "قضايا الملكية الفكرية", desc: "علامات تجارية وبراءات اختراع (ITPO)", icon: Shield, count: 0 },
  { title: "قضايا المنافسة وحماية المستهلك", desc: "جهاز حماية المنافسة ومنع الاحتكار", icon: Scale, count: 0 },
];

export default function EconomicCourt() {
  const cases = useCasesStore(state => state.cases);
  const economicCases = cases.filter(c => c.court === 'المحكمة الاقتصادية');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">المحكمة الاقتصادية</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة القضايا المنظورة أمام المحاكم الاقتصادية المصرية.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {caseCategories.map((cat, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mb-4">
                <cat.icon className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="font-bold text-navy-900 dark:text-white mb-1">{cat.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{cat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
          <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary-500" />
            القضايا الاقتصادية ({economicCases.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {economicCases.length > 0 ? economicCases.map(c => (
              <div key={c.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <p className="font-bold text-navy-900 dark:text-white">{c.plaintiff} ضد {c.defendant}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  <span>{c.court}</span>
                  {c.commercialRegRef && <span>سجل تجاري: {c.commercialRegRef}</span>}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-500">لا توجد قضايا اقتصادية حالياً — يمكن إضافتها من صفحة القضايا</div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
