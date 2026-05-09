import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Building2, Shield, Scale, Search, Filter, ExternalLink } from "lucide-react";
import { useCasesStore } from "@/store/useCasesStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

const caseCategories = [
  { title: "قضايا الشركات والإفلاس", desc: "قانون 11/2018 — إعادة هيكلة والإفلاس", icon: Building2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { title: "قضايا الملكية الفكرية", desc: "علامات تجارية وبراءات اختراع (ITPO)", icon: Shield, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { title: "المنافسة وحماية المستهلك", desc: "جهاز حماية المنافسة ومنع الاحتكار", icon: Scale, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
];

export default function EconomicCourt() {
  const cases = useCasesStore(state => state.cases);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');

  const economicCases = useMemo(() => {
    return cases.filter(c => c.court === 'المحكمة الاقتصادية' || c.type === 'اقتصادي' || c.type === 'تجاري').filter(c => {
      const matchesSearch = `${c.plaintiff} ${c.defendant} ${c.commercialRegRef || ''}`.includes(searchTerm);
      if (statusFilter === 'الكل') return matchesSearch;
      return matchesSearch && c.status === statusFilter;
    });
  }, [cases, searchTerm, statusFilter]);

  const categoryCounts = useMemo(() => {
    return caseCategories.map(cat => ({
      ...cat,
      count: economicCases.length > 0 ? Math.ceil(economicCases.length / caseCategories.length) : 0,
    }));
  }, [economicCases]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">المحكمة الاقتصادية</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة القضايا المنظورة أمام المحاكم الاقتصادية المصرية (قانون 120/2008).</p>
        </div>
      </div>

      {/* تنبيه */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 flex items-start gap-3">
        <Landmark className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-blue-800 dark:text-blue-300 text-sm">الاختصاص النوعي للمحكمة الاقتصادية</p>
          <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">تختص بنظر الدعاوى المتعلقة بقوانين: حماية المنافسة، حماية الملكية الفكرية، سوق المال، البنوك، الشركات، التجارة الإلكترونية، وحماية المستهلك.</p>
        </div>
      </div>

      {/* فئات القضايا */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categoryCounts.map((cat, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className={`w-12 h-12 ${cat.bg} rounded-xl flex items-center justify-center mb-4`}>
                <cat.icon className={`w-6 h-6 ${cat.color}`} />
              </div>
              <h3 className="font-bold text-navy-900 dark:text-white mb-1">{cat.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{cat.desc}</p>
              <p className="mt-3 text-2xl font-bold text-navy-900 dark:text-white">{cat.count} <span className="text-sm font-normal text-slate-500">قضية</span></p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="بحث بالاسم أو السجل التجاري..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
        {['الكل', 'متداولة', 'تحت الدراسة', 'مغلقة'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>{s}</Button>
        ))}
      </div>

      {/* الجدول */}
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
          <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary-500" /> القضايا الاقتصادية ({economicCases.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400">
                <th className="text-right p-4 font-medium">الأطراف</th>
                <th className="text-right p-4 font-medium">المحكمة</th>
                <th className="text-right p-4 font-medium">السجل التجاري</th>
                <th className="text-right p-4 font-medium">الرقم الضريبي</th>
                <th className="text-right p-4 font-medium">الحالة</th>
                <th className="text-right p-4 font-medium">النوع</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {economicCases.length > 0 ? economicCases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-navy-900 dark:text-white">{c.plaintiff} ضد {c.defendant}</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{c.court}</td>
                    <td className="p-4 font-mono text-xs">{c.commercialRegRef || '—'}</td>
                    <td className="p-4 font-mono text-xs">{c.taxIdRef || '—'}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${c.status === 'متداولة' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>{c.status}</span></td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{c.type}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">لا توجد قضايا اقتصادية حالياً — يمكن إضافتها من صفحة القضايا مع اختيار محكمة "المحكمة الاقتصادية"</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
