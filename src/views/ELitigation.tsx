import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, ExternalLink, CheckCircle2, XCircle, RefreshCw, Search, Link2, Unlink, Eye, Filter } from "lucide-react";
import { useCasesStore } from "@/store/useCasesStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useMemo } from "react";

export default function ELitigation() {
  const cases = useCasesStore(state => state.cases);
  const updateCase = useCasesStore(state => state.updateCase);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  const linked = cases.filter(c => c.eLitigationStatus === 'مربوط ببوابة التقاضي');
  const unlinked = cases.filter(c => !c.eLitigationStatus || c.eLitigationStatus === 'غير مربوط');

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch = `${c.plaintiff} ${c.defendant} ${c.court}`.includes(searchTerm);
      if (statusFilter === 'مربوط') return matchesSearch && c.eLitigationStatus === 'مربوط ببوابة التقاضي';
      if (statusFilter === 'غير مربوط') return matchesSearch && (!c.eLitigationStatus || c.eLitigationStatus === 'غير مربوط');
      return matchesSearch;
    });
  }, [cases, searchTerm, statusFilter]);

  const handleToggleLink = (caseId: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'مربوط ببوابة التقاضي' ? 'غير مربوط' : 'مربوط ببوابة التقاضي';
    updateCase(caseId, { eLitigationStatus: newStatus as any });
    toast.success(newStatus === 'مربوط ببوابة التقاضي' ? 'تم ربط القضية ببوابة التقاضي' : 'تم فك ربط القضية');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">بوابة التقاضي الإلكتروني</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">متابعة وربط القضايا ببوابة التقاضي الإلكتروني المصري.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast.info('جاري مزامنة البيانات مع بوابة التقاضي الإلكتروني...')}><RefreshCw size={16} /> مزامنة</Button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20"><CheckCircle2 className="w-6 h-6 text-green-500" /></div>
            <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">قضايا مربوطة</p><p className="text-2xl font-bold text-navy-900 dark:text-white">{linked.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20"><XCircle className="w-6 h-6 text-red-500" /></div>
            <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">غير مربوطة</p><p className="text-2xl font-bold text-navy-900 dark:text-white">{unlinked.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20"><Monitor className="w-6 h-6 text-primary-500" /></div>
            <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">إجمالي القضايا</p><p className="text-2xl font-bold text-navy-900 dark:text-white">{cases.length}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* التنبيه */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 flex items-start gap-3">
        <Monitor className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-blue-800 dark:text-blue-300 text-sm">بوابة التقاضي الإلكتروني — وزارة العدل المصرية</p>
          <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">يمكنك ربط القضايا لتتبع حالتها مباشرة من المنصة. الرابط: <a href="https://elitigation.moj.gov.eg" target="_blank" rel="noopener noreferrer" className="underline">elitigation.moj.gov.eg</a></p>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="بحث بالاسم أو المحكمة..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
        {['الكل', 'مربوط', 'غير مربوط'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>{s}</Button>
        ))}
      </div>

      {/* الجدول */}
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="pb-4"><CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2"><Monitor className="w-5 h-5 text-primary-500" /> حالة الربط بالبوابة ({filteredCases.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400">
                <th className="text-right p-4 font-medium">القضية</th>
                <th className="text-right p-4 font-medium">المحكمة</th>
                <th className="text-right p-4 font-medium">النوع</th>
                <th className="text-right p-4 font-medium">الحالة</th>
                <th className="text-right p-4 font-medium">الربط</th>
                <th className="text-right p-4 font-medium">إجراء</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {filteredCases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-navy-900 dark:text-white">{c.plaintiff} ضد {c.defendant}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.id}</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{c.court}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{c.type}</span></td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${c.status === 'متداولة' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{c.status}</span></td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                        c.eLitigationStatus === 'مربوط ببوابة التقاضي'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {c.eLitigationStatus === 'مربوط ببوابة التقاضي' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {c.eLitigationStatus === 'مربوط ببوابة التقاضي' ? 'مربوط' : 'غير مربوط'}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleToggleLink(c.id, c.eLitigationStatus)}>
                        {c.eLitigationStatus === 'مربوط ببوابة التقاضي' ? <><Unlink size={12} /> فك الربط</> : <><Link2 size={12} /> ربط</>}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredCases.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">لا توجد قضايا مطابقة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
