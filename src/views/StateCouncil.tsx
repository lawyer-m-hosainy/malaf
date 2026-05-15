import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatEGP, formatDateEG } from "@/lib/formatEG";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, Gavel, AlertCircle, Search, Plus, FileText, Calendar, 
  Clock, Scale, BookOpen, CheckCircle, Calculator, ChevronDown, ChevronUp, Copy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCasesStore } from "@/store/useCasesStore";
import { Case } from "@/types";

const councilBranches = [
  { name: "محكمة القضاء الإداري", desc: "الطعون على القرارات الإدارية والعقود الإدارية", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { name: "المحكمة الإدارية العليا", desc: "الطعن على أحكام القضاء الإداري", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { name: "المحاكم الإدارية والتأديبية", desc: "الطعون الانتخابية والدعاوى التأديبية", color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20" },
  { name: "هيئة مفوضي الدولة", desc: "إعداد التقارير والرأي القانوني", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
];

const LEGAL_PERIODS = [
  { type: "الطعن في القرار الإداري", period: "60 يوم", law: "م24 ق47/1972" },
  { type: "الطعن أمام الإدارية العليا", period: "60 يوم", law: "م23 ق47/1972" },
  { type: "الالتماس بإعادة النظر", period: "3 أشهر", law: "م49 ق47/1972" },
  { type: "الطعن بالتزوير", period: "8 أيام من الجلسة", law: "—" },
  { type: "وقف التنفيذ المستعجل", period: "مع رفع الدعوى", law: "م49 ق47/1972" },
  { type: "تقادم الدعاوى الإدارية", period: "5 سنوات", law: "م24 ق47/1972" },
];

const PRINCIPLES = [
  { title: "عدم اختصاص المحاكم العادية بنظر القرارات الإدارية", court: "الإدارية العليا", year: "الطعن 123 لسنة 60 ق", text: "القرارات الإدارية النهائية لا يجوز الطعن عليها إلا أمام قضاء مجلس الدولة صاحب الولاية العامة، وأي حكم يصدر من القضاء العادي يكون منعدماً لتعلقه بالنظام العام." },
  { title: "العيب في الشكل والإجراءات الجوهرية", court: "الإدارية العليا", year: "الطعن 456 لسنة 62 ق", text: "إذا أوجب القانون اتخاذ إجراء معين قبل إصدار القرار (كأخذ رأي جهة معينة)، فإن إغفال هذا الإجراء يُعد عيباً جوهرياً يبطل القرار الإداري برمته." },
  { title: "سقوط الحق في الطعن بعد 60 يوماً", court: "الإدارية العليا", year: "الطعن 789 لسنة 65 ق", text: "ميعاد رفع دعوى الإلغاء هو ستون يوماً من تاريخ النشر في الجريدة الرسمية أو إعلان صاحب الشأن، ويسقط الحق بعد هذا الميعاد لتعلقه بالنظام العام." }
];

export default function StateCouncil() {
  const cases = useCasesStore(state => state.cases);
  const [activeTab, setActiveTab] = useState("cases");
  
  // Cases Tab State
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('الكل');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Calculator State
  const [calcDate, setCalcDate] = useState("");
  const [calcType, setCalcType] = useState("decision");
  const [calcExcuse, setCalcExcuse] = useState(false);
  const [calcResult, setCalcResult] = useState<{ date: string, remaining: number, warning: boolean } | null>(null);

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
      count: cases.filter(c => c.type === 'إداري' && (c.court === b.name || (b.name === "المحاكم الإدارية والتأديبية" && c.court?.includes("تأديبية")))).length
    }));
  }, [cases]);

  const calculateDeadline = () => {
    if (!calcDate) {
      toast.error("برجاء إدخال تاريخ الإخطار أو العلم اليقيني");
      return;
    }
    const start = new Date(calcDate);
    if (isNaN(start.getTime())) return;

    let daysToAdd = calcType === 'reconsider' ? 90 : (calcType === 'forgery' ? 8 : 60);
    if (calcExcuse) daysToAdd += 15; // ميعاد مسافة افتراضي

    const deadline = new Date(start);
    deadline.setDate(deadline.getDate() + daysToAdd);

    // If deadline falls on Friday/Saturday, move to Sunday
    if (deadline.getDay() === 5) deadline.setDate(deadline.getDate() + 2);
    if (deadline.getDay() === 6) deadline.setDate(deadline.getDate() + 1);

    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setCalcResult({
      date: deadline.toISOString().split('T')[0],
      remaining: diffDays,
      warning: diffDays < 0
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ بنجاح");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2A4A] dark:text-white">القضاء الإداري ومجلس الدولة</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة الطعون الإدارية أمام محاكم مجلس الدولة والمواعيد القانونية.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-slate-200 dark:border-white/10 rounded-none h-auto p-0 bg-transparent gap-6">
          <TabsTrigger value="cases" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0F2A4A] data-[state=active]:text-[#0F2A4A] dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400 data-[state=active]:bg-transparent py-3 px-1 font-bold text-slate-500">القضايا الإدارية</TabsTrigger>
          <TabsTrigger value="deadlines" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0F2A4A] data-[state=active]:text-[#0F2A4A] dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400 data-[state=active]:bg-transparent py-3 px-1 font-bold text-slate-500">مواعيد الطعون</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0F2A4A] data-[state=active]:text-[#0F2A4A] dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400 data-[state=active]:bg-transparent py-3 px-1 font-bold text-slate-500">الصيغ والمكتبة</TabsTrigger>
          <TabsTrigger value="principles" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0F2A4A] data-[state=active]:text-[#0F2A4A] dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400 data-[state=active]:bg-transparent py-3 px-1 font-bold text-slate-500">المبادئ المستقرة</TabsTrigger>
        </TabsList>

        {/* Tab 1: Cases */}
        <TabsContent value="cases" className="pt-6 space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">تنبيه المواعد الحتمية</p>
              <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">تأكد دائماً من تاريخ الإخطار، رفع دعوى الإلغاء خارج ميعاد الـ 60 يوماً يؤدي لعدم القبول شكلاً لتعلقه بالنظام العام.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {branchesWithCounts.map((branch, i) => (
              <Card key={i} className="border-none shadow-sm dark:bg-navy-800 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStageFilter(branch.name)}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${branch.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Gavel className={`w-6 h-6 ${branch.color}`} />
                  </div>
                  <h3 className="font-bold text-navy-900 dark:text-white mb-1">{branch.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">{branch.desc}</p>
                  <p className="mt-3 text-2xl font-bold text-[#0F2A4A] dark:text-blue-400">{branch.count} <span className="text-xs font-normal text-slate-500">قضية</span></p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800">
            <CardHeader className="pb-4 border-b border-slate-50 dark:border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#0F2A4A] dark:text-blue-500" /> إدارة القضايا الإدارية
                </CardTitle>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input placeholder="بحث برقم القضية أو الأطراف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10 dark:bg-navy-900" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700">القضية والأطراف</TableHead>
                    <TableHead className="font-bold text-slate-700">المحكمة</TableHead>
                    <TableHead className="font-bold text-slate-700">رقم السنة / الدعوى</TableHead>
                    <TableHead className="font-bold text-slate-700">آخر إجراء</TableHead>
                    <TableHead className="font-bold text-slate-700">تفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminCases.map(c => (
                    <TableRow key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <TableCell>
                        <p className="font-bold text-navy-900 dark:text-white max-w-[200px] truncate">{c.title || c.plaintiff}</p>
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">ضد: {c.defendant}</p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                        <Badge variant="outline" className="font-normal">{c.court}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.stateCouncilYearQ || c.firstInstanceNumber || '—'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'متداولة' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>{c.status}</span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 text-[#0F2A4A] hover:bg-[#0F2A4A]/10 dark:text-blue-400" onClick={() => setSelectedCase(c)}>
                          تتبع المسار
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {adminCases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                        <Scale size={32} className="mx-auto mb-3 opacity-20" />
                        لا توجد قضايا إدارية مسجلة تلبي شروط البحث.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Deadlines Calculator */}
        <TabsContent value="deadlines" className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800">
              <CardHeader className="bg-[#0F2A4A] text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator size={20} /> حاسبة مواعيد الطعن الإداري
                </CardTitle>
                <CardDescription className="text-slate-300">احسب آخر موعد لرفع الدعوى بدقة لتجنب سقوط الحق.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 dark:text-slate-200">تاريخ الإخطار أو العلم اليقيني بالقرار</Label>
                  <Input type="date" value={calcDate} onChange={e => setCalcDate(e.target.value)} className="dark:bg-navy-900" />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 dark:text-slate-200">نوع الإجراء المُراد اتخاذه</Label>
                  <Select value={calcType} onValueChange={setCalcType}>
                    <SelectTrigger className="dark:bg-navy-900"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decision">دعوى إلغاء قرار إداري (60 يوم)</SelectItem>
                      <SelectItem value="appeal">طعن أمام الإدارية العليا (60 يوم)</SelectItem>
                      <SelectItem value="reconsider">التماس بإعادة النظر (3 أشهر)</SelectItem>
                      <SelectItem value="forgery">الطعن بالتزوير (8 أيام)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse bg-slate-50 dark:bg-white/5 p-3 rounded-lg border dark:border-white/10">
                  <Checkbox id="excuse" checked={calcExcuse} onCheckedChange={c => setCalcExcuse(!!c)} />
                  <Label htmlFor="excuse" className="text-sm cursor-pointer leading-relaxed">
                    إضافة ميعاد مسافة (يتم إضافة أيام إضافية حسب البعد الجغرافي)
                  </Label>
                </div>

                <Button className="w-full bg-[#C9A84C] hover:bg-[#b09038] text-[#0F2A4A] font-bold gap-2 text-md py-6" onClick={calculateDeadline}>
                  <Calculator size={20} /> احسب الميعاد النهائي
                </Button>

                {calcResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-lg border ${calcResult.warning ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-bold mb-1">تاريخ سقوط الحق في الطعن:</p>
                    <p className={`text-2xl font-black ${calcResult.warning ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {formatDateEG(calcResult.date)}
                    </p>
                    
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">الزمن المتبقي للتحرك:</span>
                      <Badge variant={calcResult.warning ? "destructive" : "default"} className={!calcResult.warning ? "bg-emerald-600" : ""}>
                        {calcResult.remaining < 0 ? 'انقضى الميعاد' : `${calcResult.remaining} يوم`}
                      </Badge>
                    </div>
                    {calcResult.remaining > 0 && (
                      <p className="text-[10px] text-slate-500 mt-2 font-mono text-center">
                        * تم مراعاة الإجازات الأسبوعية الرسمية (الجمعة والسبت) إذا وافقت اليوم الأخير.
                      </p>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800">
              <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
                <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0F2A4A] dark:text-blue-500" /> جدول المدد القانونية المرجعي
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                    <TableRow>
                      <TableHead className="font-bold text-slate-700">نوع الإجراء</TableHead>
                      <TableHead className="font-bold text-slate-700">الميعاد</TableHead>
                      <TableHead className="font-bold text-slate-700">السند القانوني</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {LEGAL_PERIODS.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-bold text-slate-800 dark:text-slate-200">{p.type}</TableCell>
                        <TableCell className="text-emerald-600 font-bold dark:text-emerald-400">{p.period}</TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">{p.law}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 bg-slate-50 dark:bg-white/5 text-xs text-slate-500 leading-relaxed rounded-b-lg border-t dark:border-white/10">
                  <span className="font-bold text-[#0F2A4A] dark:text-blue-400">تنويه قانوني:</span> وفقاً لأحكام قانون مجلس الدولة، يبدأ سريان ميعاد الطعن بالإلغاء من تاريخ نشر القرار الإداري المطعون فيه في الجريدة الرسمية أو في النشرات التي تصدرها المصالح العامة أو إعلان صاحب الشأن به، ولا يسري الميعاد إذا كان القرار منعدماً.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Templates */}
        <TabsContent value="templates" className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600">
                  <FileText size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-navy-900 dark:text-white">صحيفة دعوى إلغاء قرار إداري</h3>
                  <p className="text-sm text-slate-500 mt-2">مع شق مستعجل بوقف التنفيذ، طبقاً لقانون مجلس الدولة.</p>
                </div>
                <Button variant="outline" className="w-full border-[#0F2A4A] text-[#0F2A4A] hover:bg-[#0F2A4A] hover:text-white mt-2">تحميل النموذج (Word)</Button>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600">
                  <Scale size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-navy-900 dark:text-white">طعن أمام الإدارية العليا</h3>
                  <p className="text-sm text-slate-500 mt-2">صيغة الطعن على أحكام القضاء الإداري أو المحاكم التأديبية.</p>
                </div>
                <Button variant="outline" className="w-full border-[#0F2A4A] text-[#0F2A4A] hover:bg-[#0F2A4A] hover:text-white mt-2">تحميل النموذج (Word)</Button>
              </CardContent>
            </Card>
          </div>
          <div className="p-8 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed dark:border-white/10 text-slate-500">
            يمكنك استخدام خدمة "الصياغة الذكية" بالذكاء الاصطناعي من الرئيسية لإنشاء مذكرات الدفاع والطعون الإدارية أوتوماتيكياً.
          </div>
        </TabsContent>

        {/* Tab 4: Principles */}
        <TabsContent value="principles" className="pt-6 space-y-6">
          <div className="bg-[#0F2A4A] rounded-xl p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold mb-2">مكتبة المبادئ المستقرة</h2>
              <p className="text-blue-200 text-sm max-w-lg">استشهد بأهم المبادئ التي أرستها المحكمة الإدارية العليا لتقوية دفوعك ومذكراتك أمام قضاء مجلس الدولة.</p>
            </div>
            <BookOpen size={48} className="text-white/20 hidden md:block" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {PRINCIPLES.map((principle, idx) => (
              <Card key={idx} className="border border-slate-200 dark:border-white/10 shadow-sm dark:bg-navy-800 hover:border-[#C9A84C] transition-colors group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-[#0F2A4A] dark:text-blue-400">{principle.title}</h3>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(principle.text)} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-slate-500 hover:text-[#C9A84C]">
                      <Copy size={14} className="me-1" /> نسخ للمذكرة
                    </Button>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-loose text-sm font-serif border-r-2 border-[#C9A84C] pr-4 bg-slate-50 dark:bg-white/5 py-3 pl-3 rounded-l-lg">
                    {principle.text}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <Badge variant="outline" className="bg-white dark:bg-navy-900 border-slate-200 dark:border-white/10">{principle.court}</Badge>
                    <span>{principle.year}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Case Timeline Modal */}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-[700px] p-0 overflow-hidden dark:bg-navy-900 border-slate-200 dark:border-white/10 shadow-2xl rounded-xl">
          <div className="bg-[#0F2A4A] text-white p-6 pb-8">
            <DialogTitle className="text-xl font-bold mb-1 leading-relaxed">تتبع مسار الدعوى الإدارية</DialogTitle>
            <p className="text-blue-200 text-sm opacity-90">{selectedCase?.title || '—'} (ضد: {selectedCase?.defendant})</p>
            <div className="flex items-center gap-4 mt-4">
              <Badge className="bg-[#C9A84C] text-[#0F2A4A] hover:bg-[#b09038] border-none">{selectedCase?.court}</Badge>
              <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">رقم: {selectedCase?.firstInstanceNumber || 'لم يحدد'}</span>
            </div>
          </div>
          
          <div className="px-8 py-10 -mt-4 bg-white dark:bg-navy-900 rounded-t-2xl max-h-[60vh] overflow-y-auto">
            <div className="relative border-r-2 border-slate-200 dark:border-slate-700 space-y-8 pr-6 pb-4">
              
              <div className="relative">
                <div className="absolute w-4 h-4 bg-emerald-500 rounded-full -right-[31px] top-1 ring-4 ring-white dark:ring-navy-900"></div>
                <div className="space-y-1">
                  <h4 className="font-bold text-navy-900 dark:text-white">إيداع صحيفة الدعوى</h4>
                  <p className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 inline-block rounded">مكتمل</p>
                  <p className="text-sm text-slate-500 mt-2">تاريخ القيد: {formatDateEG(selectedCase?.createdAt || new Date().toISOString())}</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute w-4 h-4 bg-blue-500 rounded-full -right-[31px] top-1 ring-4 ring-white dark:ring-navy-900"></div>
                <div className="space-y-1">
                  <h4 className="font-bold text-navy-900 dark:text-white">الإحالة لهيئة مفوضي الدولة</h4>
                  <p className="text-xs text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 inline-block rounded">الإجراء الحالي</p>
                  <p className="text-sm text-slate-500 mt-2">تمت الإحالة لتحضير الدعوى وإعداد التقرير القانوني المسبب.</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full -right-[31px] top-1 ring-4 ring-white dark:ring-navy-900"></div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-400 dark:text-slate-500">إيداع تقرير المفوض</h4>
                  <p className="text-xs text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 inline-block rounded">قادم</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full -right-[31px] top-1 ring-4 ring-white dark:ring-navy-900"></div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-400 dark:text-slate-500">تحديد جلسات المرافعة</h4>
                  <p className="text-xs text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 inline-block rounded">قادم</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full -right-[31px] top-1 ring-4 ring-white dark:ring-navy-900"></div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-400 dark:text-slate-500">حجز الدعوى للحكم وإصدار الحكم</h4>
                  <p className="text-xs text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 inline-block rounded">قادم</p>
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
