import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Baby, Coins, FileText, Search, AlertCircle, Calendar } from "lucide-react";
import { useCasesStore } from "@/store/useCasesStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

const familyCaseTypes = [
  { title: "خلع وطلاق", icon: Heart, filter: ['خلع', 'طلاق رجعي', 'طلاق بائن', 'طلاق ثلاث'], color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
  { title: "نفقة زوجية وأولاد", icon: Coins, filter: ['نفقة زوجية', 'نفقة أولاد'], color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { title: "حضانة ورؤية", icon: Baby, filter: ['حضانة', 'رؤية'], color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { title: "ميراث وتركات", icon: FileText, filter: ['ميراث وتركات', 'إثبات نسب'], color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
];

export default function FamilyCourts() {
  const cases = useCasesStore(state => state.cases);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('الكل');

  const familyCases = useMemo(() => {
    return cases.filter(c => c.type === 'أحوال شخصية' || c.court === 'محاكم الأسرة').filter(c => {
      const matchesSearch = `${c.plaintiff} ${c.defendant}`.includes(searchTerm);
      if (typeFilter === 'الكل') return matchesSearch;
      const catType = familyCaseTypes.find(t => t.title === typeFilter);
      if (!catType) return matchesSearch;
      return matchesSearch && catType.filter.includes(c.familyCaseType || '');
    });
  }, [cases, searchTerm, typeFilter]);

  const typesWithCounts = useMemo(() => {
    const allFamilyCases = cases.filter(c => c.type === 'أحوال شخصية' || c.court === 'محاكم الأسرة');
    return familyCaseTypes.map(cat => ({
      ...cat,
      count: allFamilyCases.filter(c => cat.filter.includes(c.familyCaseType || '')).length,
    }));
  }, [cases]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">محاكم الأسرة</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة قضايا الأحوال الشخصية أمام محاكم الأسرة المصرية (قانون 10/2004).</p>
      </div>

      {/* تنبيه */}
      <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/30 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-pink-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-pink-800 dark:text-pink-300 text-sm">ملاحظة هامة — مكتب تسوية المنازعات الأسرية</p>
          <p className="text-pink-700 dark:text-pink-400 text-xs mt-1">طبقاً للقانون 10/2004، يجب تقديم طلب تسوية لمكتب تسوية المنازعات الأسرية قبل رفع الدعوى (15 يوم مهلة التسوية).</p>
        </div>
      </div>

      {/* فئات القضايا */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {typesWithCounts.map((cat, i) => (
          <Card key={i} className={`border-none shadow-sm dark:bg-navy-800 text-center cursor-pointer transition-all hover:shadow-md ${typeFilter === cat.title ? 'ring-2 ring-primary-500' : ''}`} onClick={() => setTypeFilter(typeFilter === cat.title ? 'الكل' : cat.title)}>
            <CardContent className="p-6">
              <div className={`w-12 h-12 ${cat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <cat.icon className={`w-6 h-6 ${cat.color}`} />
              </div>
              <h3 className="font-bold text-navy-900 dark:text-white text-sm">{cat.title}</h3>
              <p className="mt-2 text-2xl font-bold text-navy-900 dark:text-white">{cat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="بحث بأسماء الأطراف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
        <Button variant={typeFilter === 'الكل' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('الكل')}>الكل</Button>
      </div>

      {/* الجدول */}
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-500" /> قضايا الأسرة ({familyCases.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400">
                <th className="text-right p-4 font-medium">الأطراف</th>
                <th className="text-right p-4 font-medium">المحكمة</th>
                <th className="text-right p-4 font-medium">نوع القضية</th>
                <th className="text-right p-4 font-medium">الحالة</th>
                <th className="text-right p-4 font-medium">المرحلة</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {familyCases.length > 0 ? familyCases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-navy-900 dark:text-white">{c.plaintiff} ضد {c.defendant}</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{c.court}</td>
                    <td className="p-4">
                      {c.familyCaseType ? (
                        <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded text-xs font-bold">{c.familyCaseType}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${c.status === 'متداولة' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>{c.status}</span></td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{c.currentTier || 'ابتدائي'}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">لا توجد قضايا أسرة حالياً — يمكن إضافتها من صفحة القضايا مع اختيار نوع "أحوال شخصية"</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
