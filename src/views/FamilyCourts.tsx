import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { 
  HeartCrack, Baby, Coins, FileText, Search, AlertCircle, 
  Calendar, Building, Scale, Clock, ChevronLeft, Plus, X, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDateEG } from "@/lib/formatEG";

// Mock Data for specific Family Court requirements
const MOCK_FAMILY_CASES = [
  { id: "FC-001", plaintiff: "سمر خالد", defendant: "عمر أحمد", type: "نفقة ومؤخر صداق", status: "حرجة", stage: "منتهية مهلة التسوية", remainingDays: 0, priority: "red" },
  { id: "FC-002", plaintiff: "محمد رضا وهبة", defendant: "سعاد علي", type: "خلع وطلاق", status: "جاري", stage: "مكتب التسوية", remainingDays: 6, priority: "yellow" },
  { id: "FC-003", plaintiff: "هدى إبراهيم", defendant: "طارق سعيد", type: "حضانة ورؤية", status: "نشطة", stage: "تحديد الجلسة", remainingDays: 12, priority: "green" },
  { id: "FC-004", plaintiff: "ورثة المرحوم أحمد فتحي", defendant: "أقارب العصب", type: "ميراث وتركات", status: "مكتملة", stage: "الحكم", remainingDays: null, priority: "purple" },
];

const LEGAL_REFERENCE = [
  { action: "مهلة مكتب التسوية الإلزامية", duration: "١٥ يوم", law: "م ٣ ق ١٠/٢٠٠٤", desc: "يجب اللجوء لمكتب تسوية المنازعات الأسرية قبل رفع الدعوى، ولا تقبل الدعوى شكلاً إلا بعد انقضاء 15 يوماً من تقديم الطلب." },
  { action: "أقصى مدة لمكتب التسوية", duration: "٣٠ يوم", law: "م ٦ ق ١٠/٢٠٠٤", desc: "لا يجوز أن تزيد مدة التسوية عن 30 يوماً إلا باتفاق الخصوم." },
  { action: "استئناف أحكام الأسرة", duration: "٤٠ يوم", law: "ق المرافعات", desc: "ميعاد الاستئناف العادي 40 يوماً من تاريخ النطق بالحكم حضورياً أو الإعلان." },
  { action: "الطعن بالنقض", duration: "٦٠ يوم", law: "ق المرافعات", desc: "يكون الطعن بالنقض خلال 60 يوماً من تاريخ صدور الحكم الاستئنافي المطعون فيه." },
  { action: "تقادم دعوى النفقة", duration: "٣ سنوات", law: "م ٣٧٥ مدني", desc: "يسقط الحق في المطالبة بمتجمد النفقة بمضي ثلاث سنوات." },
  { action: "سن حضانة الأم (ولد)", duration: "حتى ١٥ سنة", law: "م ٢٠ ق الطفل", desc: "ينتهي سن الحضانة ببلوغ الصغير 15 عاماً، ويخير بعدها." },
  { action: "سن حضانة الأم (بنت)", duration: "حتى الزواج", law: "م ٢٠ ق الطفل", desc: "تستمر حضانة البنت حتى تتزوج وفقاً لبعض التعديلات والتطبيقات القضائية." },
  { action: "الحضانة المؤقتة (مستعجل)", duration: "فورية", law: "م ٤٥ مرافعات", desc: "يمكن استصدار أمر على عريضة بتسليم الصغير للأم بصفة مستعجلة." },
  { action: "تنفيذ أحكام النفقة", duration: "فوري — أمر أداء", law: "م ٢٢ ق ١/٢٠٠٠", desc: "أحكام النفقة مشمولة بالنفاذ المعجل بقوة القانون." }
];

export default function FamilyCourts() {
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [alerts, setAlerts] = useState({ red: true, yellow: true, blue: true });
  
  // Calculator State
  const [calcDate, setCalcDate] = useState("");
  const [calcType, setCalcType] = useState("تسوية");
  const [isUrgent, setIsUrgent] = useState(false);
  const [calcResult, setCalcResult] = useState<{ endSettlement: string, lastLawsuitDay: string, remaining: number } | null>(null);

  const calculateDeadlines = () => {
    if (!calcDate) {
      toast.error("الرجاء إدخال تاريخ تقديم الطلب");
      return;
    }
    const start = new Date(calcDate);
    if (isNaN(start.getTime())) return;

    if (isUrgent) {
      setCalcResult({
        endSettlement: "معفى (مستعجل)",
        lastLawsuitDay: "فوري",
        remaining: 0
      });
      return;
    }

    const endSettlementDate = new Date(start);
    endSettlementDate.setDate(endSettlementDate.getDate() + 15);
    
    // Check if falls on Friday/Saturday
    if (endSettlementDate.getDay() === 5) endSettlementDate.setDate(endSettlementDate.getDate() + 2);
    if (endSettlementDate.getDay() === 6) endSettlementDate.setDate(endSettlementDate.getDate() + 1);

    const maxLawsuitDate = new Date(start);
    maxLawsuitDate.setDate(maxLawsuitDate.getDate() + 30);

    const today = new Date();
    const remainingToSettle = Math.ceil((endSettlementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    setCalcResult({
      endSettlement: formatDateEG(endSettlementDate.toISOString()),
      lastLawsuitDay: formatDateEG(maxLawsuitDate.toISOString()),
      remaining: remainingToSettle
    });
  };

  const familyCaseTypes = [
    { title: "خلع وطلاق", icon: HeartCrack, color: "#8B2252", bgClass: "bg-[#8B2252]/10", textClass: "text-[#8B2252]", count: 1 },
    { title: "حضانة ورؤية", icon: Baby, color: "#2E7D6B", bgClass: "bg-[#2E7D6B]/10", textClass: "text-[#2E7D6B]", count: 1 },
    { title: "نفقة ومؤخر صداق", icon: Coins, color: "#C9963A", bgClass: "bg-[#C9963A]/10", textClass: "text-[#C9963A]", count: 1 },
    { title: "ميراث وتركات", icon: FileText, color: "#5B4FBE", bgClass: "bg-[#5B4FBE]/10", textClass: "text-[#5B4FBE]", count: 1 },
  ];

  const filteredCases = activeFilter === "الكل" 
    ? MOCK_FAMILY_CASES 
    : MOCK_FAMILY_CASES.filter(c => c.type === activeFilter);

  return (
    <div className="space-y-6 pb-20 font-sans" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#8B2252]">محاكم الأسرة / الأحوال الشخصية</h1>
          <p className="text-slate-500 mt-2 text-sm">إدارة قضايا الأسرة أمام محاكم الأحوال الشخصية المصرية (قانون ١٠ لسنة ٢٠٠٤)</p>
        </div>
        <div className="text-sm font-bold text-[#C9963A] bg-[#C9963A]/10 px-4 py-2 rounded-lg">
          {new Intl.DateTimeFormat('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
        </div>
      </div>

      {/* Smart Alerts */}
      <div className="space-y-3">
        {alerts.red && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-start justify-between bg-red-50 border-r-4 border-red-600 p-4 rounded-lg shadow-sm">
            <div className="flex gap-3">
              <AlertCircle className="text-red-600 shrink-0" />
              <div>
                <h4 className="font-bold text-red-800">تنبيه عاجل: موعد تسوية منتهٍ — قضية نفقة</h4>
                <p className="text-sm text-red-700 mt-1">القضية رقم ٢٠٢٤/١١٣٢ — لم يتقدم الطرفان — يجب رفع الدعوى فوراً</p>
                <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white">رفع الدعوى الآن</Button>
              </div>
            </div>
            <button onClick={() => setAlerts(a => ({...a, red: false}))} className="text-red-400 hover:text-red-600" title="إغلاق" aria-label="إغلاق"><X size={18} /></button>
          </motion.div>
        )}

        {alerts.yellow && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-start justify-between bg-amber-50 border-r-4 border-amber-500 p-4 rounded-lg shadow-sm">
            <div className="flex gap-3">
              <Clock className="text-amber-600 shrink-0" />
              <div>
                <h4 className="font-bold text-amber-800">تذكير: مهلة التسوية ١٥ يوم — قضية طلاق</h4>
                <p className="text-sm text-amber-700 mt-1">القضية ٢٠٢٤/٩٨٧ — تبقّى ٦ أيام قبل انتهاء فترة التسوية الإلزامية</p>
                <Button size="sm" variant="outline" className="mt-3 border-amber-600 text-amber-700 hover:bg-amber-100">عرض القضية</Button>
              </div>
            </div>
            <button onClick={() => setAlerts(a => ({...a, yellow: false}))} className="text-amber-400 hover:text-amber-600" title="إغلاق" aria-label="إغلاق"><X size={18} /></button>
          </motion.div>
        )}

        {alerts.blue && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-start justify-between bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg shadow-sm">
            <div className="flex gap-3">
              <Info className="text-blue-600 shrink-0" />
              <div>
                <h4 className="font-bold text-blue-800">ملاحظة قانونية: إلزامية مكتب تسوية المنازعات الأسرية</h4>
                <p className="text-sm text-blue-700 mt-1">وفقاً لقانون ١٠/٢٠٠٤ — مهلة ١٥ يوم إلزامية قبل رفع الدعوى. الاستثناءات: النفقة المستعجلة، الحضانة المؤقتة، المسائل الوقتية.</p>
              </div>
            </div>
            <button onClick={() => setAlerts(a => ({...a, blue: false}))} className="text-blue-400 hover:text-blue-600" title="إغلاق" aria-label="إغلاق"><X size={18} /></button>
          </motion.div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "إجمالي القضايا النشطة", value: "٤", icon: FileText, color: "text-slate-700" },
          { title: "مهل حرجة", value: "٢", icon: AlertCircle, color: "text-red-600" },
          { title: "في مكتب التسوية", value: "١", icon: Building, color: "text-[#C9963A]" },
          { title: "جلسات هذا الأسبوع", value: "٠", icon: Calendar, color: "text-emerald-600" },
        ].map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-bold">{stat.title}</p>
                <p className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-slate-50 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {familyCaseTypes.map((cat, idx) => (
          <Card 
            key={idx} 
            className={`border-2 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${activeFilter === cat.title ? 'border-[#8B2252] bg-white shadow-md' : 'border-transparent bg-white shadow-sm'}`}
            onClick={() => setActiveFilter(activeFilter === cat.title ? "الكل" : cat.title)}
          >
            <CardContent className="p-5 flex flex-col items-center text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${cat.bgClass}`}>
                <cat.icon className={cat.textClass} size={28} />
              </div>
              <h3 className="font-bold text-slate-800">{cat.title}</h3>
              <Badge variant="outline" className="mt-2 bg-slate-50">{cat.count} قضية</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Columns: Upcoming Deadlines & Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Deadlines List */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Clock className="text-[#8B2252]" size={20} /> مواعيد حرجة قادمة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {filteredCases.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                      c.priority === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                      c.priority === 'yellow' ? 'bg-amber-500' :
                      c.priority === 'green' ? 'bg-emerald-500' : 'bg-[#5B4FBE]'
                    }`} />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{c.plaintiff} <span className="text-slate-400 font-normal">ضد</span> {c.defendant}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] bg-white text-slate-600">{c.type}</Badge>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1"><Building size={10}/> {c.stage}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {c.remainingDays !== null && (
                      <Badge className={
                        c.remainingDays === 0 ? 'bg-red-100 text-red-700 hover:bg-red-200 border-none' :
                        c.remainingDays <= 7 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-none' :
                        'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none'
                      }>
                        {c.remainingDays === 0 ? 'اليوم الأخير' : `باقي ${c.remainingDays} أيام`}
                      </Badge>
                    )}
                    <ChevronLeft className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Calculator */}
        <Card className="border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#8B2252]"></div>
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#8B2252]">
              <Calendar size={20} /> حاسبة المواعيد القانونية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">تاريخ تقديم طلب التسوية</Label>
              <Input type="date" value={calcDate} onChange={e => setCalcDate(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">نوع الدعوى</Label>
              <Select value={calcType} onValueChange={(v) => setCalcType(v as string)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="تسوية">دعوى موضوعية (طلاق، خلع، نفقة، رؤية)</SelectItem>
                  <SelectItem value="استئناف">استئناف حكم أسرة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse bg-pink-50 p-3 rounded-lg border border-pink-100">
              <Checkbox id="urgent" checked={isUrgent} onCheckedChange={(c) => setIsUrgent(!!c)} />
              <Label htmlFor="urgent" className="text-sm cursor-pointer text-pink-900 font-bold">
                دعوى مستعجلة (نفقة مؤقتة، استلام صغير) — مستثناة من التسوية
              </Label>
            </div>

            <Button 
              className="w-full text-white font-bold gap-2 text-md py-6 hover:opacity-90 transition-opacity" 
              style={{ backgroundColor: "#8B2252" }}
              onClick={calculateDeadlines}
            >
              <Calendar size={20} /> احسب المواعيد
            </Button>

            {calcResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-lg border border-[#C9963A]/30 bg-[#C9963A]/5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">تاريخ انتهاء مهلة التسوية</p>
                    <p className="text-lg font-black text-[#8B2252] mt-1">{calcResult.endSettlement}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">آخر موعد لرفع الدعوى</p>
                    <p className="text-lg font-black text-[#8B2252] mt-1">{calcResult.lastLawsuitDay}</p>
                  </div>
                </div>
                {calcResult.remaining > 0 && (
                  <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">أيام متبقية للتحرك:</span>
                    <Badge style={{ backgroundColor: "#C9963A" }} className="text-white hover:bg-[#b58734]">{calcResult.remaining} يوم</Badge>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                  <AlertCircle size={10} /> تحذير: إذا وافق اليوم الأخير عطلة رسمية يمتد الميعاد لأول يوم عمل.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Case Timeline Visualizer (Static Example) */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800">مسار القضية — من التسوية إلى الحكم</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
            
            {[
              { label: "مكتب التسوية", status: "completed", icon: Building },
              { label: "رفع الدعوى", status: "completed", icon: FileText },
              { label: "تحديد الجلسة", status: "active", icon: Calendar },
              { label: "إعلان الخصوم", status: "pending", icon: Users },
              { label: "المرافعة والتحقيق", status: "pending", icon: Scale },
              { label: "الحكم", status: "pending", icon: Gavel }
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all
                  ${step.status === 'completed' ? 'bg-[#2E7D6B] text-white' : 
                    step.status === 'active' ? 'bg-[#8B2252] text-white ring-4 ring-[#8B2252]/20 animate-pulse' : 
                    'bg-slate-100 text-slate-400'}`}
                >
                  <step.icon size={20} />
                </div>
                <span className={`text-xs font-bold ${
                  step.status === 'completed' ? 'text-[#2E7D6B]' : 
                  step.status === 'active' ? 'text-[#8B2252]' : 
                  'text-slate-400'
                }`}>{step.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legal Reference Table */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <BookOpen className="text-[#5B4FBE]" size={20} /> المرجع القانوني السريع — قانون الأسرة المصري
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">الإجراء</TableHead>
                  <TableHead className="font-bold text-slate-700">المدة / الميعاد</TableHead>
                  <TableHead className="font-bold text-slate-700">المستند القانوني</TableHead>
                  <TableHead className="font-bold text-slate-700">تفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LEGAL_REFERENCE.map((item, idx) => (
                  <Dialog key={idx}>
                      <TableRow className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-bold text-slate-800">{item.action}</TableCell>
                        <TableCell className="font-bold text-[#8B2252]">{item.duration}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{item.law}</TableCell>
                        <TableCell>
                          <DialogTrigger className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
                            <Info size={14}/>
                          </DialogTrigger>
                        </TableCell>
                      </TableRow>
                    <DialogContent className="sm:max-w-[425px]" dir="rtl">
                      <DialogHeader>
                        <DialogTitle className="text-[#8B2252]">{item.action}</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg mb-4">
                          <span className="font-bold text-slate-700">المدة القانونية:</span>
                          <Badge style={{ backgroundColor: "#C9963A" }} className="text-white hover:bg-[#b58734]">{item.duration}</Badge>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-sm bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                          {item.desc}
                        </p>
                        <p className="text-xs text-slate-400 mt-4 font-mono">المرجع: {item.law}</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

// Temporary shim for BookOpen, Gavel, Users since they weren't imported at the top
import { BookOpen, Gavel, Users } from "lucide-react";
