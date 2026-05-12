import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Siren, Shield, Scale, AlertTriangle, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCasesStore } from "@/store/useCasesStore";

export default function CriminalCases() {
  const cases = useCasesStore(state => state.cases);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');

  const criminalCases = useMemo(() => {
    return cases.filter(c => c.type === 'جنائي').filter(c => {
      const matchesSearch = `${c.plaintiff} ${c.defendant} ${c.prosecutionRef || ''} ${c.firstInstanceNumber || ''}`.includes(searchTerm);
      if (statusFilter === 'الكل') return matchesSearch;
      return matchesSearch && c.status === statusFilter;
    });
  }, [cases, searchTerm, statusFilter]);

  const stats = [
    { title: "جنايات", value: criminalCases.filter(c => c.criminalTier === 'جناية').length, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
    { title: "جنح", value: criminalCases.filter(c => c.criminalTier === 'جنحة').length, icon: Shield, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { title: "مخالفات", value: criminalCases.filter(c => c.criminalTier === 'مخالفة').length, icon: Scale, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">الجنائي والنيابة العامة</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تتبع دورة حياة القضايا الجنائية عبر مراحلها المختلفة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
              <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-400">{s.title}</p><p className="text-2xl font-bold text-navy-900 dark:text-white">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="بحث بأسماء الأطراف أو رقم المحضر..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
        {['الكل', 'متداولة', 'محكوم فيها', 'مستأنفة'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>{s}</Button>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Siren className="w-5 h-5 text-red-500" />
          ملفات القضايا الجنائية ({criminalCases.length})
        </h2>
        
        {criminalCases.length > 0 ? (
          <div className="grid gap-4">
            {criminalCases.map(c => (
              <Card key={c.id} className="border-none shadow-sm dark:bg-navy-800 hover:shadow-md transition-all">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-navy-900 dark:text-white text-lg">
                        {c.plaintiff} ضد {c.defendant}
                      </h3>
                      <Badge className={
                        c.criminalTier === 'جناية' ? "bg-red-50 text-red-700 hover:bg-red-100" :
                        c.criminalTier === 'جنحة' ? "bg-amber-50 text-amber-700 hover:bg-amber-100" :
                        "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }>{c.criminalTier || 'غير محدد'}</Badge>
                      <Badge variant="outline" className="text-xs">{c.status}</Badge>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                      <p><span className="font-medium text-slate-700 dark:text-slate-300">المحكمة:</span> {c.court} - الدائرة {c.circuit || '-'}</p>
                      <p><span className="font-medium text-slate-700 dark:text-slate-300">مرجع النيابة/المحضر:</span> {c.prosecutionRef || 'غير مدرج'}</p>
                      <p><span className="font-medium text-slate-700 dark:text-slate-300">المرحلة الحالية:</span> {c.criminalStage || c.currentTier}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-12 text-center text-slate-500 flex flex-col items-center">
              <Shield className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
              لا توجد قضايا جنائية حالياً — يمكن إضافتها من صفحة القضايا باختيار نوع "جنائي"
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
