import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Landmark, Building2, Shield, Scale, Calendar, AlertTriangle, 
  Search, X, FileText, Briefcase, Calculator, ChevronLeft, Info, CheckCircle, BookOpen, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateEG } from "@/lib/formatEG";

const MOCK_ECONOMIC_CASES = [
  { id: 1, title: "نزاع مساهمين — ٢٠٢٤/اقتصادية/١١٢", type: "شركات", status: "إيداع مستندات — ٥ أيام", statusColor: "badge-critical", details: "شركة النيل للاستثمار ضد بنك القاهرة", value: 23000000, court: "الاقتصادية القاهرة — دائرة الشركات" },
  { id: 2, title: "علامة تجارية — ٢٠٢٤/اقتصادية/٨٩", type: "ملكية فكرية", status: "جلسة مرافعة — ٧ أيام", statusColor: "badge-warning", details: "شركة أديداس مصر ضد مصنع الجيزة", value: 4500000, court: "الاقتصادية الإسكندرية — دائرة الملكية الفكرية" },
  { id: 3, title: "إفلاس — ٢٠٢٤/اقتصادية/٥٦", type: "إفلاس", status: "إعادة هيكلة — جارية", statusColor: "badge-orange", details: "شركة الدلتا للمقاولات (طالبة الإفلاس)", value: 87000000, court: "الاقتصادية القاهرة — دائرة الإفلاس" },
  { id: 4, title: "احتكار — ٢٠٢٣/اقتصادية/٢٣١", type: "منافسة", status: "نقض — ٤٥ يوم", statusColor: "badge-info", details: "جهاز المنافسة ضد شركة الاتصالات الكبرى", value: 500000000, court: "محكمة النقض — دائرة تجارية" },
];

const LEGAL_REFERENCE = [
  { action: "الاستئناف أمام المحكمة الاقتصادية الاستئنافية", duration: "٤٠ يوماً", law: "م١٢ ق١٢٠/٢٠٠٨", type: "كل القضايا", note: "من تاريخ الحكم الابتدائي", typeColor: "bg-slate-100 text-[#14532d]" },
  { action: "الطعن بالنقض من أحكام الاستئناف", duration: "٦٠ يوماً", law: "م٢٤٩ مرافعات", type: "كل القضايا", note: "—", typeColor: "bg-slate-100 text-[#14532d]" },
  { action: "معارضة في حكم غيابي", duration: "١٠ أيام من الإعلان", law: "م٢٤٠ مرافعات", type: "كل القضايا", note: "—", typeColor: "bg-slate-100 text-[#14532d]" },
  { action: "الإيداع الابتدائي لصحيفة الدعوى", duration: "فور التحضير", law: "م٦٣ مرافعات", type: "كل القضايا", note: "مصحوبة بالرسوم", typeColor: "bg-slate-100 text-[#14532d]" },
  { action: "رد الخبير / إيداع التقرير", duration: "٣٠-٦٠ يوماً", law: "أمر المحكمة", type: "دعاوى محاسبية", note: "قابل للتمديد", typeColor: "bg-slate-100 text-[#14532d]" },
  { action: "تقادم دعاوى التجار", duration: "٧ سنوات", law: "م٦٥٧ مدني", type: "تجاري", note: "من تاريخ نشوء الحق", typeColor: "bg-slate-100 text-[#14532d]" },
  { action: "تقادم دعاوى سوق المال", duration: "٥ سنوات", law: "ق٩٥/٢٠١٩", type: "سوق مال", note: "من تاريخ العلم", typeColor: "bg-[#bfdbfe] text-[#1d4ed8]" },
  { action: "تقادم دعاوى الملكية الفكرية", duration: "٣ سنوات", law: "ق٨٢/٢٠٠٢ ITPO", type: "ملكية فكرية", note: "من تاريخ العلم بالتعدي", typeColor: "bg-[#f3e8ff] text-[#6b21a8]" },
  { action: "الطعن في قرار جهاز المنافسة", duration: "٦٠ يوماً", law: "م٢٢ ق٣/٢٠٠٥", type: "منافسة", note: "أمام المحكمة الاقتصادية", typeColor: "bg-[#cffafe] text-[#0e7490]" },
  { action: "فترة إعادة هيكلة الإفلاس", duration: "١٨ شهراً", law: "م٥٣ ق١١/٢٠١٨", type: "إفلاس", note: "قابلة للتمديد بإشراف أمين الإفلاس", typeColor: "bg-[#fecaca] text-[#dc2626]" },
  { action: "التماس إعادة نظر", duration: "لا ميعاد", law: "م٢٤١ مرافعات", type: "كل القضايا", note: "بشروط محددة", typeColor: "bg-slate-100 text-[#14532d]" },
  { action: "طلب وقف التنفيذ", duration: "مع الاستئناف", law: "م٢٩٢ مرافعات", type: "كل القضايا", note: "بكفالة أو تأمين", typeColor: "bg-slate-100 text-[#14532d]" },
];

const MoneyBadge = ({ amount }: { amount: number }) => (
  <span className="money-badge">
    {amount.toLocaleString('ar-EG')} جنيه
  </span>
);

export default function EconomicCourt() {
  const [alerts, setAlerts] = useState({ critical: true, warning: true, info: true });
  const [activeFilter, setActiveFilter] = useState("الكل");

  // Calculator States
  const [feeValue, setFeeValue] = useState("");
  const [feeTier, setFeeTier] = useState("ابتدائي");
  const [feeResult, setFeeResult] = useState<{ base: number, registration: number, expert: number, total: number } | null>(null);

  const [dateCalcStart, setDateCalcStart] = useState("");
  const [dateCalcType, setDateCalcType] = useState("استئناف");
  const [dateResult, setDateResult] = useState<{ date: string, warning: boolean } | null>(null);

  const calculateFees = () => {
    const value = parseFloat(feeValue);
    if (isNaN(value) || value <= 0) return;

    let base = value * 0.01;
    if (base > 40000) base = 40000;
    
    if (feeTier === "استئناف") base = base * 2;
    
    const registration = base * 0.1;
    const expert = value > 1000000 ? 5000 : 2000; // تقديري
    
    setFeeResult({ base, registration, expert, total: base + registration + expert });
  };

  const calculateDeadlines = () => {
    if (!dateCalcStart) return;
    const start = new Date(dateCalcStart);
    if (isNaN(start.getTime())) return;

    let daysToAdd = 40;
    if (dateCalcType === "نقض") daysToAdd = 60;
    else if (dateCalcType === "معارضة") daysToAdd = 10;

    const deadline = new Date(start);
    deadline.setDate(deadline.getDate() + daysToAdd);

    if (deadline.getDay() === 5) deadline.setDate(deadline.getDate() + 2);
    if (deadline.getDay() === 6) deadline.setDate(deadline.getDate() + 1);

    const diffDays = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    setDateResult({
      date: formatDateEG(deadline.toISOString().split('T')[0]),
      warning: diffDays < 10
    });
  };

  const currentDate = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  const filteredCases = activeFilter === "الكل" 
    ? MOCK_ECONOMIC_CASES 
    : MOCK_ECONOMIC_CASES.filter(c => c.type === activeFilter);

  return (
    <div className="space-y-6 pb-20 font-sans" dir="rtl">
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --color-primary: #14532d;
          --color-primary-light: #166534;
          --color-bg: #f8fafc;
        }
        .case-type-card {
          border-radius: 16px;
          border: 1px solid #d1fae5;
          padding: 24px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .case-type-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 24px rgba(0,0,0,0.1);
        }
        .card-company { border-top: 4px solid #166534; }
        .card-ip { border-top: 4px solid #6b21a8; }
        .card-competition { border-top: 4px solid #0e7490; }

        .badge-critical { background: #fecaca; color: #991b1b; border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 600; }
        .badge-warning  { background: #fef08a; color: #854d0e; border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 600; }
        .badge-info     { background: #bfdbfe; color: #1e40af; border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 600; }
        .badge-orange   { background: #fed7aa; color: #9a3412; border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 600; }
        
        .money-badge {
          font-family: 'Tajawal', monospace;
          font-weight: 700;
          font-size: 13px;
          color: #166534;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          padding: 2px 8px;
          direction: ltr;
          display: inline-block;
        }
      `}} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#14532d]">المحكمة الاقتصادية</h1>
          <p className="text-slate-500 mt-2 text-sm">إدارة القضايا المنظورة أمام المحاكم الاقتصادية المصرية (قانون ١٢٠/٢٠٠٨)</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm font-bold bg-white border border-[#d1fae5] text-[#14532d] px-4 py-2 rounded-lg shadow-sm">
            {currentDate}
          </div>
          <div className="text-xs font-bold text-[#14532d] border border-[#14532d] bg-[#f0fdf4] px-3 py-1 rounded-full flex items-center gap-1">
            <Landmark size={12} />
            ق ١٢٠/٢٠٠٨
          </div>
        </div>
      </div>

      {/* Jurisdiction Banner */}
      <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-4 rounded-xl flex items-start gap-3">
        <Landmark className="text-[#166534] mt-0.5 shrink-0" size={20} />
        <div className="w-full">
          <div className="flex justify-between items-center cursor-pointer">
            <h4 className="font-bold text-[#14532d]">الاختصاص النوعي للمحكمة الاقتصادية</h4>
          </div>
          <p className="text-sm text-[#166534] mt-1">تختص بنظر الدعاوى المتعلقة بقوانين: حماية المنافسة، حماية الملكية الفكرية، سوق المال، البنوك، الشركات، التجارة الإلكترونية، وحماية المستهلك.</p>
          <div className="mt-3 pt-3 border-t border-[#bbf7d0]/50 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-[#14532d]">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#166534]"></div> الدائرة الابتدائية: نزاعات تجارية بقيمة +٥ مليون جنيه</div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#166534]"></div> الدائرة الاستئنافية: أحكام المحاكم الابتدائية</div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#166534]"></div> دوائر متخصصة: ملكية فكرية، منافسة، إفلاس</div>
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      <div className="space-y-3">
        <AnimatePresence>
          {alerts.critical && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-start justify-between bg-[#fef2f2] border border-[#fecaca] p-4 rounded-xl shadow-sm">
              <div className="flex gap-3">
                <AlertTriangle className="text-[#dc2626] shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-[#991b1b] mb-1">موعد حرج: انتهاء مهلة إيداع مستندات الدفاع — خلال ٥ أيام</h4>
                  <p className="text-xs text-[#7f1d1d] mb-3">القضية رقم ٢٠٢٤/اقتصادية/١١٢ — شركة النيل للاستثمار ضد بنك القاهرة. يجب إيداع حافظة المستندات ومذكرة الدفاع قبل جلسة ٢٠/٥/٢٠٢٤</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white bg-white">إدارة المستندات <ChevronLeft size={12} className="ml-1" /></Button>
                </div>
              </div>
              <button onClick={() => setAlerts(a => ({...a, critical: false}))} className="text-[#dc2626]/50 hover:text-[#dc2626]" title="إغلاق" aria-label="إغلاق"><X size={16}/></button>
            </motion.div>
          )}

          {alerts.warning && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-start justify-between bg-[#fefce8] border border-[#fef08a] p-4 rounded-xl shadow-sm">
              <div className="flex gap-3">
                <Calendar className="text-[#ca8a04] shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-[#854d0e] mb-1">تذكير: جلسة مرافعة ختامية — بعد ٧ أيام</h4>
                  <p className="text-xs text-[#713f12] mb-3">القضية رقم ٢٠٢٤/اقتصادية/٨٩ — نزاع ملكية فكرية — علامة تجارية (أديداس مصر). دائرة الملكية الفكرية بالمحكمة الاقتصادية بالقاهرة — الدور الثالث</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-[#ca8a04] text-[#ca8a04] hover:bg-[#ca8a04] hover:text-white bg-white">مواعيد الجلسات <ChevronLeft size={12} className="ml-1" /></Button>
                </div>
              </div>
              <button onClick={() => setAlerts(a => ({...a, warning: false}))} className="text-[#ca8a04]/50 hover:text-[#ca8a04]" title="إغلاق" aria-label="إغلاق"><X size={16}/></button>
            </motion.div>
          )}

          {alerts.info && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-start justify-between bg-[#eff6ff] border border-[#bfdbfe] p-4 rounded-xl shadow-sm">
              <div className="flex gap-3">
                <Info className="text-[#2563eb] shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-[#1e40af] mb-1">تحديث: لائحة المحاكم الاقتصادية الجديدة — تطبيقاً من يناير ٢٠٢٥</h4>
                  <p className="text-xs text-[#1e3a8a] mb-3">تابع التعديلات: رسوم الدعوى، قواعد إيداع المستندات إلكترونياً، التقاضي عن بُعد في النزاعات التجارية</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb] hover:text-white bg-white">أبرز التعديلات <ChevronLeft size={12} className="ml-1" /></Button>
                </div>
              </div>
              <button onClick={() => setAlerts(a => ({...a, info: false}))} className="text-[#2563eb]/50 hover:text-[#2563eb]" title="إغلاق" aria-label="إغلاق"><X size={16}/></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">إجمالي القضايا</span>
              <Briefcase size={16} className="text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-700 mb-1">•</p>
            <p className="text-[10px] text-slate-400">أضف قضاياك لتفعيلها</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-[#166534]"></div>
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">قيمة النزاعات</span>
              <Landmark size={16} className="text-[#166534]" />
            </div>
            <p className="text-xl font-black text-[#166534] mb-1 font-mono tracking-tighter" dir="ltr">614.5M EGP</p>
            <p className="text-[10px] text-[#166534]">إجمالي قيمة القضايا النشطة (جنيه)</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-[#ea580c]"></div>
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">مواعيد قادمة</span>
              <Calendar size={16} className="text-[#ea580c]" />
            </div>
            <p className="text-2xl font-black text-[#ea580c] mb-1">٢</p>
            <p className="text-[10px] text-[#ea580c]">جلسات وإيداعات هذا الأسبوع</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-[#dc2626]"></div>
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">قضايا إفلاس</span>
              <AlertTriangle size={16} className="text-[#dc2626]" />
            </div>
            <p className="text-2xl font-black text-[#dc2626] mb-1">١</p>
            <p className="text-[10px] text-[#dc2626]">تستوجب متابعة فورية</p>
          </CardContent>
        </Card>
      </div>

      {/* Case Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* قضايا الشركات والإفلاس */}
        <div className="case-type-card card-company">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-[#f0fdf4] rounded-lg flex items-center justify-center">
              <Building2 className="text-[#166534]" size={24} />
            </div>
            <Badge variant="outline" className="text-[10px] text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]">الأعلى قيمة</Badge>
          </div>
          <h3 className="font-bold text-lg text-[#0f172a] mb-1">قضايا الشركات والإفلاس</h3>
          <p className="text-xs text-slate-500 mb-4 font-mono">قانون ١١/٢٠١٨ — إعادة الهيكلة والإفلاس</p>
          <ul className="text-xs text-slate-600 space-y-1.5 mb-5 list-disc list-inside">
            <li>نزاعات المساهمين والشركاء</li>
            <li>الطعن في قرارات الجمعية العمومية</li>
            <li>إشهار الإفلاس وإعادة الهيكلة</li>
            <li>التصفية القضائية للشركات</li>
          </ul>
          <div className="flex justify-between items-end border-t border-slate-100 pt-3">
            <div>
              <p className="text-[10px] text-slate-400 mb-1">دائرة الشركات — المحكمة الاقتصادية</p>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> <span className="text-[10px] font-bold">عالية (قيمة مالية ضخمة)</span></div>
            </div>
            <p className="text-2xl font-bold text-slate-300">٠</p>
          </div>
        </div>

        {/* قضايا الملكية الفكرية */}
        <div className="case-type-card card-ip">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-[#f3e8ff] rounded-lg flex items-center justify-center">
              <Shield className="text-[#6b21a8]" size={24} />
            </div>
            <Badge variant="outline" className="text-[10px] text-[#6b21a8] border-[#e9d5ff] bg-[#f3e8ff]">الأكثر تخصصاً</Badge>
          </div>
          <h3 className="font-bold text-lg text-[#0f172a] mb-1">قضايا الملكية الفكرية</h3>
          <p className="text-xs text-slate-500 mb-4 font-mono">قانون ITPO — علامات تجارية وبراءات اختراع</p>
          <ul className="text-xs text-slate-600 space-y-1.5 mb-5 list-disc list-inside">
            <li>تسجيل وحماية العلامات التجارية</li>
            <li>براءات الاختراع والنماذج الصناعية</li>
            <li>حقوق المؤلف والبرامج</li>
            <li>قضايا القرصنة التجارية</li>
          </ul>
          <div className="flex justify-between items-end border-t border-slate-100 pt-3">
            <div>
              <p className="text-[10px] text-slate-400 mb-1">دائرة الملكية الفكرية — المحكمة الاقتصادية</p>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> <span className="text-[10px] font-bold">متوسطة</span></div>
            </div>
            <p className="text-2xl font-bold text-slate-300">٠</p>
          </div>
        </div>

        {/* المنافسة وحماية المستهلك */}
        <div className="case-type-card card-competition">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-[#cffafe] rounded-lg flex items-center justify-center">
              <Scale className="text-[#0e7490]" size={24} />
            </div>
            <Badge variant="outline" className="text-[10px] text-[#0e7490] border-[#a5f3fc] bg-[#cffafe]">الأوسع اختصاصاً</Badge>
          </div>
          <h3 className="font-bold text-lg text-[#0f172a] mb-1">المنافسة وحماية المستهلك</h3>
          <p className="text-xs text-slate-500 mb-4 font-mono">قانون ٣/٢٠٠٥ — حماية المنافسة ومنع الاحتكار</p>
          <ul className="text-xs text-slate-600 space-y-1.5 mb-5 list-disc list-inside">
            <li>دعاوى الاحتكار وإساءة السوق السائدة</li>
            <li>الممارسات التجارية المضللة</li>
            <li>الغش التجاري وخداع المستهلك</li>
            <li>نزاعات التجارة الإلكترونية</li>
          </ul>
          <div className="flex justify-between items-end border-t border-slate-100 pt-3">
            <div>
              <p className="text-[10px] text-slate-400 mb-1">جهاز حماية المنافسة / الاقتصادية</p>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span className="text-[10px] font-bold">منخفضة-متوسطة</span></div>
            </div>
            <p className="text-2xl font-bold text-slate-300">٠</p>
          </div>
        </div>
      </div>

      {/* Stepper (Timeline) */}
      <Card className="border border-[#d1fae5] shadow-sm overflow-hidden bg-[#f0fdf4]">
        <CardHeader className="border-b border-[#bbf7d0] pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#14532d]">مسار القضية الاقتصادية — من الإيداع حتى التنفيذ</CardTitle>
          <Button variant="link" className="text-[#166534] text-xs p-0 h-auto gap-1">شرح تفصيلي <ChevronLeft size={12} /></Button>
        </CardHeader>
        <CardContent className="p-8 overflow-x-auto">
          <div className="min-w-[900px] flex justify-between items-start relative pt-2">
            {/* Connecting Line */}
            <div className="absolute top-[22px] left-[5%] right-[5%] h-1 bg-gradient-to-l from-[#166534] via-[#166534]/30 to-slate-200 z-0 rounded-full"></div>
            
            {/* Steps */}
            {[
              { title: "تقييم الاختصاص", desc: "قبل الإيداع", status: "completed" },
              { title: "إيداع صحيفة الدعوى", desc: "قلم كتاب + رسوم", status: "completed" },
              { title: "التبادل والإعلان", desc: "إيداع المستندات", status: "completed" },
              { title: "الجلسات والمرافعة", desc: "خبراء وشهود", status: "active" },
              { title: "الحكم الابتدائي", desc: "دائرة ابتدائية", status: "pending" },
              { title: "الاستئناف", desc: "٤٠ يوماً من الحكم", status: "pending" },
              { title: "النقض / التنفيذ", desc: "٦٠ يوماً للنقض", status: "pending" },
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center w-32 group cursor-help">
                <div className={`flex items-center justify-center transition-all bg-white shadow-sm
                  ${step.status === 'active' ? 'w-11 h-11 rounded-full border-[5px] border-[#166534] shadow-[0_0_15px_rgba(22,101,52,0.3)]' : 
                    step.status === 'completed' ? 'w-8 h-8 rounded-full border-2 border-[#166534] bg-[#f0fdf4]' : 
                    'w-8 h-8 rounded-full border-2 border-slate-300'}`}
                >
                  {step.status === 'completed' && <CheckCircle size={14} className="text-[#166534]" />}
                  {step.status === 'active' && <div className="w-3 h-3 bg-[#166534] rounded-full"></div>}
                </div>
                <h4 className={`text-xs font-bold mt-3 ${step.status === 'active' ? 'text-[#166534] text-[13px]' : step.status === 'completed' ? 'text-[#14532d]' : 'text-slate-500'}`}>
                  {step.title}
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{step.desc}</p>
                
                {/* Visual arrow for current stage */}
                {step.status === 'active' && <div className="absolute -top-8 text-[10px] font-bold text-[#166534] animate-bounce">المرحلة الحالية ↓</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority & Calculator Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Right Column: Priority Cases */}
        <Card className="border border-slate-200 shadow-sm h-full">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg font-bold text-[#0f172a]">قضايا ذات أولوية</CardTitle>
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {['الكل', 'إفلاس', 'ملكية فكرية', 'منافسة'].map(f => (
                  <Button key={f} variant={activeFilter === f ? "default" : "outline"} size="sm" className={`h-7 text-[10px] ${activeFilter === f ? 'bg-[#14532d] hover:bg-[#166534]' : ''}`} onClick={() => setActiveFilter(f)}>{f}</Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {filteredCases.map((c) => (
                <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-3">
                  <div>
                    <h4 className="font-bold text-[#0f172a] text-sm mb-1">{c.title}</h4>
                    <p className="text-[11px] text-slate-500">{c.details}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1"><Landmark size={10} /> {c.court}</p>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 md:gap-1.5">
                    <span className={c.statusColor}>{c.status}</span>
                    <MoneyBadge amount={c.value} />
                  </div>
                </div>
              ))}
              {filteredCases.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">لا توجد قضايا تطابق الفلتر المحدد</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Left Column: Calculator */}
        <Card className="border border-slate-200 shadow-sm h-full bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#14532d]"></div>
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#0f172a]">
              <Calculator size={20} className="text-[#166534]" /> حاسبة الرسوم ومواعيد الطعن
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="fees" className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none bg-slate-50 h-12 border-b border-slate-100 p-0">
                <TabsTrigger value="fees" className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-[#166534] font-bold">حساب الرسوم</TabsTrigger>
                <TabsTrigger value="deadlines" className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-[#166534] font-bold">مواعيد الطعن</TabsTrigger>
              </TabsList>
              
              <TabsContent value="fees" className="p-6 m-0 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 text-xs">قيمة النزاع (جنيه)</Label>
                    <Input type="number" placeholder="أدخل القيمة بالجنيه..." value={feeValue} onChange={e => setFeeValue(e.target.value)} className="font-mono focus-visible:ring-[#166534]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700 text-xs">نوع الدعوى</Label>
                      <Select defaultValue="شركات">
                        <SelectTrigger className="focus-visible:ring-[#166534] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="شركات">دعوى شركات</SelectItem>
                          <SelectItem value="ملكية">ملكية فكرية</SelectItem>
                          <SelectItem value="إفلاس">إفلاس</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700 text-xs">درجة التقاضي</Label>
                      <Select value={feeTier} onValueChange={(v) => setFeeTier(v as string)}>
                        <SelectTrigger className="focus-visible:ring-[#166534] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ابتدائي">ابتدائي</SelectItem>
                          <SelectItem value="استئناف">استئناف</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full bg-[#166534] hover:bg-[#14532d] text-white font-bold h-10" onClick={calculateFees}>احسب الرسوم التقديرية</Button>
                </div>

                {feeResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4 font-mono text-sm space-y-2">
                    <div className="flex justify-between items-center text-[#14532d]"><span>رسوم الدعوى:</span> <span className="font-bold">{feeResult.base.toLocaleString('ar-EG')} جنيه</span></div>
                    <div className="flex justify-between items-center text-[#14532d]"><span>رسوم التسجيل:</span> <span className="font-bold">{feeResult.registration.toLocaleString('ar-EG')} جنيه</span></div>
                    <div className="flex justify-between items-center text-[#14532d]"><span>رسوم الخبير (تقديري):</span> <span className="font-bold">{feeResult.expert.toLocaleString('ar-EG')} جنيه</span></div>
                    <div className="border-t border-[#bbf7d0] my-2 pt-2 flex justify-between items-center text-[#166534] font-black text-base">
                      <span>الإجمالي التقديري:</span> <span>{feeResult.total.toLocaleString('ar-EG')} جنيه</span>
                    </div>
                    <p className="text-[9px] text-[#166534] mt-2 font-sans text-center">الرسوم تُحسب بـ ١٪ من قيمة النزاع بحد أقصى ٤٠,٠٠٠ جنيه وفق اللائحة.</p>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="deadlines" className="p-6 m-0 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 text-xs">تاريخ صدور الحكم</Label>
                    <Input type="date" value={dateCalcStart} onChange={e => setDateCalcStart(e.target.value)} className="focus-visible:ring-[#166534]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 text-xs">نوع الطعن</Label>
                    <Select value={dateCalcType} onValueChange={(v) => setDateCalcType(v as string)}>
                      <SelectTrigger className="focus-visible:ring-[#166534] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="استئناف">استئناف (٤٠ يوماً)</SelectItem>
                        <SelectItem value="نقض">نقض (٦٠ يوماً)</SelectItem>
                        <SelectItem value="معارضة">معارضة غيابي (١٠ أيام)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-[#166534] hover:bg-[#14532d] text-white font-bold h-10" onClick={calculateDeadlines}>احسب الموعد</Button>
                </div>

                {dateResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 border rounded-lg p-4 text-center ${dateResult.warning ? 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]' : 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'}`}>
                    <p className="text-xs font-bold mb-1">آخر موعد للطعن:</p>
                    <p className="text-xl font-black">{dateResult.date}</p>
                  </motion.div>
                )}

                <div className="bg-[#fefce8] border border-[#fef08a] p-3 rounded-lg text-[10px] leading-relaxed text-[#854d0e] mt-4 font-bold">
                  تنبيه: رسوم الاستئناف = ٢ × رسوم الدرجة الأولى. رسوم النقض ثابتة بغض النظر عن قيمة النزاع.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Legal Reference Table */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
            <BookOpen size={20} className="text-[#166534]" /> المرجع القانوني الشامل — المحكمة الاقتصادية
          </CardTitle>
          <Button variant="link" className="text-[#166534] text-xs p-0 h-auto gap-1">الكامل <ChevronLeft size={12} /></Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="font-bold text-[#0f172a]">الإجراء / الميعاد</TableHead>
                  <TableHead className="font-bold text-[#0f172a]">المدة</TableHead>
                  <TableHead className="font-bold text-[#0f172a]">المستند القانوني</TableHead>
                  <TableHead className="font-bold text-[#0f172a]">النوع</TableHead>
                  <TableHead className="font-bold text-[#0f172a]">الملاحظة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LEGAL_REFERENCE.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <TableCell className="font-bold text-slate-800 text-xs">{item.action}</TableCell>
                    <TableCell className="font-bold text-[#166534] text-xs">{item.duration}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{item.law}</TableCell>
                    <TableCell><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.typeColor}`}>{item.type}</span></TableCell>
                    <TableCell className="text-xs text-slate-500">{item.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
