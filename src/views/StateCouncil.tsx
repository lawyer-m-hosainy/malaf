import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Gavel, AlertCircle, Search, Plus, X, Filter, Calendar, FileText } from "lucide-react";
import { useCasesStore } from "@/store/useCasesStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const councilBranches = [
  { name: "محكمة القضاء الإداري", desc: "الطعون على القرارات الإدارية والعقود الإدارية", count: 0, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { name: "المحكمة الإدارية العليا", desc: "الطعن على أحكام القضاء الإداري", count: 0, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { name: "هيئة مفوضي الدولة", desc: "إعداد التقارير والرأي القانوني للمحكمة", count: 0, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
];

export default function StateCouncil() {
  const cases = useCasesStore(state => state.cases);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('الكل');
  const [showAddNote, setShowAddNote] = useState<string | null>(null);

  const adminCases = useMemo(() => {
    return cases.filter(c => c.type === 'إداري').filter(c => {
      const matchesSearch = `${c.plaintiff} ${c.defendant} ${c.court}`.includes(searchTerm);
      if (stageFilter === 'الكل') return matchesSearch;
      return matchesSearch && c.court === stageFilter;
    });
  }, [cases, searchTerm, stageFilter]);

  const branchesWithCounts = useMemo(() => {
    return councilBranches.map(b => ({
      ...b,
      count: cases.filter(c => c.type === 'إداري' && c.court === b.name).length
    }));
  }, [cases]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">مجلس الدولة / القضاء الإداري</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة الطعون والقضايا الإدارية أمام مجلس الدولة المصري.</p>
      </div>

      {/* تنبيه المواعيد */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">تنبيه مواعيد الطعن</p>
          <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">ميعاد الطعن في القرارات الإدارية: 60 يوم من تاريخ الإخطار أو العلم اليقيني (مادة 24 قانون مجلس الدولة رقم 47 لسنة 1972).</p>
        </div>
      </div>

      {/* فروع مجلس الدولة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branchesWithCounts.map((branch, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStageFilter(branch.name)}>
            <CardContent className="p-6">
              <div className={`w-12 h-12 ${branch.bg} rounded-xl flex items-center justify-center mb-4`}>
                <Gavel className={`w-6 h-6 ${branch.color}`} />
              </div>
              <h3 className="font-bold text-navy-900 dark:text-white mb-1">{branch.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{branch.desc}</p>
              <p className="mt-3 text-2xl font-bold text-navy-900 dark:text-white">{branch.count} <span className="text-sm font-normal text-slate-500">قضية</span></p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="بحث في القضايا الإدارية..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
        {['الكل', ...councilBranches.map(b => b.name)].map(s => (
          <Button key={s} variant={stageFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStageFilter(s)} className="text-xs">{s === 'الكل' ? 'الكل' : s.replace('محكمة ', '').replace('المحكمة ', '')}</Button>
        ))}
      </div>

      {/* جدول القضايا */}
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
          <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary-500" /> القضايا الإدارية ({adminCases.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400">
                <th className="text-right p-4 font-medium">الأطراف</th>
                <th className="text-right p-4 font-medium">المحكمة</th>
                <th className="text-right p-4 font-medium">رقم السنة القضائية</th>
                <th className="text-right p-4 font-medium">الحالة</th>
                <th className="text-right p-4 font-medium">المرحلة</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {adminCases.length > 0 ? adminCases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-navy-900 dark:text-white">{c.plaintiff} ضد {c.defendant}</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{c.court}</td>
                    <td className="p-4 font-mono text-xs">{c.stateCouncilYearQ || '—'}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${c.status === 'متداولة' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>{c.status}</span></td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{c.currentTier || 'ابتدائي'}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">لا توجد قضايا إدارية حالياً — يمكن إضافتها من صفحة القضايا مع اختيار نوع "إداري"</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
