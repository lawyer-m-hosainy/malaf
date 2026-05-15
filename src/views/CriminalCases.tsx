import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Siren, Shield, Scale, AlertTriangle, Search, Clock, 
  Calendar, FileText, X, CheckCircle, ChevronLeft, Info, BookOpen, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCasesStore } from "@/store/useCasesStore";
import { formatDateEG } from "@/lib/formatEG";

// Mock Priority Cases
const PRIORITY_CASES = [
  { id: 1, title: "جناية قتل عمد — ٢٠٢٤/٨٤٧", type: "جنايات", status: "استئناف — ٣ أيام", statusColor: "badge-danger", details: "محكمة جنايات القاهرة • موكل: عائلة أحمد سعيد" },
  { id: 2, title: "جنحة نصب واحتيال — ٢٠٢٤/١١٣٢", type: "جنح", status: "استئناف — ٥ أيام", statusColor: "badge-warning", details: "المحكمة الجزئية مصر الجديدة • موكل: شركة المصري" },
  { id: 3, title: "جناية رشوة — ٢٠٢٤/٦١٣", type: "جنايات", status: "حبس احتياطي", statusColor: "badge-orange", details: "النيابة العامة القاهرة • موكل: محمود فاروق" },
  { id: 4, title: "جنحة شيك بدون رصيد — ٢٠٢٤/٤٨٩", type: "جنح", status: "نقض — ٢٨ يوم", statusColor: "badge-blue", details: "محكمة جزئي الزيتون • موكل: كريم منصور" },
  { id: 5, title: "مخالفة مرور وبناء — ٢٠٢٤/٣١٧", type: "مخالفات", status: "جلسة — ٣٥ يوم", statusColor: "badge-green", details: "محكمة جزئي مدينة نصر • موكل: سامي جلال" },
];

const LEGAL_REFERENCE = [
  { action: "استئناف حكم الجنحة (حضوري)", duration: "١٠ أيام", law: "م٤٠٢ إجراءات جنائية", type: "جنح", typeColor: "bg-[#fefcbf] text-[#b7791f]" },
  { action: "معارضة في حكم الجنحة الغيابي", duration: "١٠ أيام من الإعلان", law: "م٤٠٢ إجراءات جنائية", type: "جنح", typeColor: "bg-[#fefcbf] text-[#b7791f]" },
  { action: "استئناف حكم الجناية — مُستحدث", duration: "٤٠ يوماً", law: "م٣٧٧ ق ١/٢٠٢٤", type: "جنايات", typeColor: "bg-[#fed7d7] text-[#c53030]" },
  { action: "الطعن بالنقض (جنح وجنايات)", duration: "٦٠ يوماً", law: "م٢٣٣ إجراءات جنائية", type: "الكل", typeColor: "bg-slate-100 text-slate-600" },
  { action: "الحبس الاحتياطي — جنح (أقصى)", duration: "٤٥ يوماً", law: "م٢٣ إجراءات جنائية", type: "جنح", typeColor: "bg-[#fefcbf] text-[#b7791f]" },
  { action: "الحبس الاحتياطي — جنايات (أقصى)", duration: "١٨ شهراً", law: "م٢٣ إجراءات جنائية", type: "جنايات", typeColor: "bg-[#fed7d7] text-[#c53030]" },
  { action: "تقادم الجناية (انقضاء الدعوى)", duration: "١٠ سنوات", law: "م١٥ إجراءات جنائية", type: "جنايات", typeColor: "bg-[#fed7d7] text-[#c53030]" },
  { action: "تقادم الجنحة (انقضاء الدعوى)", duration: "٣ سنوات", law: "م١٥ إجراءات جنائية", type: "جنح", typeColor: "bg-[#fefcbf] text-[#b7791f]" },
  { action: "تقادم المخالفة (انقضاء الدعوى)", duration: "سنة واحدة", law: "م١٥ إجراءات جنائية", type: "مخالفات", typeColor: "bg-[#bee3f8] text-[#2b6cb0]" },
  { action: "التقرير بالاستئناف من السجن", duration: "فور الحكم", law: "م٤٠٧ إجراءات جنائية", type: "الكل", typeColor: "bg-slate-100 text-slate-600" },
  { action: "سقوط العقوبة — جنحة غيابية", duration: "٥ سنوات", law: "م٥٢٩ إجراءات جنائية", type: "جنح", typeColor: "bg-[#fefcbf] text-[#b7791f]" },
  { action: "التماس إعادة النظر", duration: "لا ميعاد محدد", law: "م٤٤٤ إجراءات جنائية", type: "الكل", typeColor: "bg-slate-100 text-slate-600" },
];

export default function CriminalCases() {
  const [alerts, setAlerts] = useState({ red: true, yellow: true, blue: true, legislative: true });
  const [calcDate, setCalcDate] = useState("");
  const [calcType, setCalcType] = useState("جناية");
  const [calcResult, setCalcResult] = useState<{ date: string, remaining: number, warning: boolean } | null>(null);

  const calculateDeadline = () => {
    if (!calcDate) return;
    const start = new Date(calcDate);
    if (isNaN(start.getTime())) return;

    let daysToAdd = 0;
    if (calcType === "جناية") daysToAdd = 40;
    else if (calcType === "جنحة") daysToAdd = 10;
    else if (calcType === "نقض") daysToAdd = 60;
    else if (calcType === "معارضة") daysToAdd = 10;

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
      warning: diffDays < 7
    });
  };

  const currentDate = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="space-y-6 pb-20 font-sans" dir="rtl">
      
      <style dangerouslySetInnerHTML={{__html: `
        .badge-danger { background: #fed7d7; color: #c53030; border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: bold; }
        .badge-warning { background: #fefcbf; color: #b7791f; border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: bold; }
        .badge-orange { background: #feebc8; color: #c05621; border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: bold; }
        .badge-blue { background: #bee3f8; color: #2b6cb0; border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: bold; }
        .badge-green { background: #c6f6d5; color: #276749; border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: bold; }
      `}} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a2e]">الجنائي والنيابة العامة</h1>
          <p className="text-slate-500 mt-2 text-sm">تتبع دورة حياة القضايا الجنائية عبر مراحلها المختلفة</p>
          <div className="flex gap-2 mt-3 text-xs text-slate-400">
            <span>مخالفات</span> • <span>جنح</span> • <span>جنايات</span> — <span>عبر مراحلها</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm font-bold bg-white border border-[#e2d9c8] px-4 py-2 rounded-lg shadow-sm">
            {currentDate}
          </div>
          <div className="text-xs font-bold text-[#d69e2e] border border-[#d69e2e] bg-[#fefcbf]/30 px-3 py-1 rounded-full flex items-center gap-1">
            <BookOpen size={12} />
            ق ١٥٠/١٩٥٠ • ق ١/٢٠٢٤
          </div>
        </div>
      </div>

      {/* Legislative Banner */}
      <AnimatePresence>
        {alerts.legislative && (
          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="bg-[#faf5eb] border border-[#e2d9c8] p-4 rounded-xl shadow-sm flex items-start justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-[#d69e2e]"></div>
            <div>
              <h4 className="font-bold text-[#1a1a2e] text-base mb-1 flex items-center gap-2">
                <Shield className="text-[#d69e2e]" size={18} /> تحديث تشريعي هام — القانون رقم ١ لسنة ٢٠٢٤
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed pr-6">أنشأت محاكم جنايات مستأنفة لأول مرة في تاريخ القضاء المصري — أصبح الاستئناف في الجنايات حقاً مكفولاً خلال ٤٠ يوماً من تاريخ الحكم.</p>
            </div>
            <button onClick={() => setAlerts(a => ({...a, legislative: false}))} className="text-slate-400 hover:text-slate-600" title="إغلاق" aria-label="إغلاق"><X size={18}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Banners */}
      <div className="space-y-3">
        <AnimatePresence>
          {alerts.red && (
            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-start justify-between bg-[#ffe4e4] border border-[#fed7d7] p-4 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-[#e53e3e]"></div>
              <div className="flex gap-3">
                <Clock className="text-[#e53e3e] shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-[#c53030] mb-1">موعد حرج: استئناف جناية ينتهي خلال ٣ أيام</h4>
                  <p className="text-xs text-[#9b2c2c] mb-3">القضية رقم ٢٠٢٤/٨٤٧ جنايات — يجب تقديم تقرير الاستئناف بسجن طرة قبل انتهاء الـ٤٠ يوماً من تاريخ الحكم</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-[#e53e3e] text-[#e53e3e] hover:bg-[#e53e3e] hover:text-white bg-white">إجراءات الاستئناف <ChevronLeft size={12} className="ml-1" /></Button>
                </div>
              </div>
              <button onClick={() => setAlerts(a => ({...a, red: false}))} className="text-[#e53e3e]/50 hover:text-[#e53e3e]" title="إغلاق" aria-label="إغلاق"><X size={16}/></button>
            </motion.div>
          )}
          
          {alerts.yellow && (
            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-start justify-between bg-[#fff3cd] border border-[#fefcbf] p-4 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-[#d69e2e]"></div>
              <div className="flex gap-3">
                <Calendar className="text-[#d69e2e] shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-[#b7791f] mb-1">تذكير: استئناف جنحة — تبقى ٥ أيام</h4>
                  <p className="text-xs text-[#975a16] mb-3">القضية رقم ٢٠٢٤/١١٣٣ جنح — تبقى ١٠ أيام من تاريخ الحكم الحضوري (م٤٠٢ إجراءات جنائية)</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-[#d69e2e] text-[#d69e2e] hover:bg-[#d69e2e] hover:text-white bg-white">مواعيد الطعن <ChevronLeft size={12} className="ml-1" /></Button>
                </div>
              </div>
              <button onClick={() => setAlerts(a => ({...a, yellow: false}))} className="text-[#d69e2e]/50 hover:text-[#d69e2e]" title="إغلاق" aria-label="إغلاق"><X size={16}/></button>
            </motion.div>
          )}

          {alerts.blue && (
            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-start justify-between bg-[#e8f4fd] border border-[#bee3f8] p-4 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-[#3182ce]"></div>
              <div className="flex gap-3">
                <Info className="text-[#3182ce] shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-[#2b6cb0] mb-1">ملاحظة: قانون الإجراءات الجنائية الجديد رقم ١٧٤ لسنة ٢٠٢٥ — العمل به من ١ أكتوبر ٢٠٢٦</h4>
                  <p className="text-xs text-[#2c5282] mb-3">تابع التعديلات الجوهرية: حضور المحامي الاستجواب، ضوابط الحبس الاحتياطي، التفتيش عن بُعد، المنع من السفر</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-[#3182ce] text-[#3182ce] hover:bg-[#3182ce] hover:text-white bg-white">أبرز التعديلات <ChevronLeft size={12} className="ml-1" /></Button>
                </div>
              </div>
              <button onClick={() => setAlerts(a => ({...a, blue: false}))} className="text-[#3182ce]/50 hover:text-[#3182ce]" title="إغلاق" aria-label="إغلاق"><X size={16}/></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-[#e2d9c8] shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">إجمالي القضايا</span>
              <FileText size={16} className="text-slate-400" />
            </div>
            <p className="text-2xl font-black text-[#1a1a2e] mb-1">•</p>
            <p className="text-[10px] text-slate-400">أضف قضاياك لتفعيلها</p>
          </CardContent>
        </Card>
        <Card className="border border-[#e2d9c8] shadow-sm relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-[#e53e3e]"></div>
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">مواعيد حرجة</span>
              <AlertCircle size={16} className="text-[#e53e3e]" />
            </div>
            <p className="text-2xl font-black text-[#e53e3e] mb-1">٣</p>
            <p className="text-[10px] text-[#c53030]">تستوجب متابعة فورية</p>
          </CardContent>
        </Card>
        <Card className="border border-[#e2d9c8] shadow-sm relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-[#dd6b20]"></div>
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">موقوفون احتياطياً</span>
              <Shield size={16} className="text-[#dd6b20]" />
            </div>
            <p className="text-2xl font-black text-[#dd6b20] mb-1">١</p>
            <p className="text-[10px] text-[#c05621]">حبس احتياطي جارٍ</p>
          </CardContent>
        </Card>
        <Card className="border border-[#e2d9c8] shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500">جلسات الأسبوع</span>
              <Calendar size={16} className="text-slate-400" />
            </div>
            <p className="text-2xl font-black text-[#1a1a2e] mb-1">•</p>
            <p className="text-[10px] text-slate-400">لا جلسات مجدولة</p>
          </CardContent>
        </Card>
      </div>

      {/* Case Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* المخالفات */}
        <Card className="border border-[#bee3f8] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#3182ce] group-hover:w-2 transition-all"></div>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-[#2b6cb0]">مخالفات</h3>
              <Badge className="bg-[#e8f4fd] text-[#2b6cb0] border-none text-[10px] hover:bg-[#e8f4fd]">الأبسط إجراءً</Badge>
            </div>
            <p className="text-xs text-slate-600 mb-4 h-10">غرامة أو حبس حتى أسبوع — مخالفات مرور، بناء، صحة، تراخيص</p>
            <div className="bg-[#1a1a2e] text-white text-[10px] px-3 py-1.5 rounded inline-block">المحكمة الجزئية — قاضٍ منفرد</div>
          </CardContent>
        </Card>

        {/* الجنح */}
        <Card className="border border-[#fefcbf] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#d69e2e] group-hover:w-2 transition-all"></div>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-[#b7791f]">جنح</h3>
              <Badge className="bg-[#fff3cd] text-[#b7791f] border-none text-[10px] hover:bg-[#fff3cd]">العدد الأكبر</Badge>
            </div>
            <p className="text-xs text-slate-600 mb-4 h-10">حبس أكثر من أسبوع حتى ٣ سنوات أو غرامة — إهانة، نصب، إتلاف، شيك بدون رصيد</p>
            <div className="bg-[#1a1a2e] text-white text-[10px] px-3 py-1.5 rounded inline-block">المحكمة الجزئية — قاضٍ منفرد</div>
          </CardContent>
        </Card>

        {/* الجنايات */}
        <Card className="border border-[#fed7d7] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#e53e3e] group-hover:w-2 transition-all"></div>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-[#c53030]">جنايات</h3>
              <Badge className="bg-[#ffe4e4] text-[#c53030] border-none text-[10px] hover:bg-[#ffe4e4]">أشد العقوبات</Badge>
            </div>
            <p className="text-xs text-slate-600 mb-4 h-10">سجن +٣ سنوات أو إعدام أو مؤبد — قتل، سرقة بالإكراه، اغتصاب، مخدرات، رشوة</p>
            <div className="bg-[#c53030] text-white text-[10px] px-3 py-1.5 rounded inline-block">محكمة الجنايات — هيئة ثلاثية</div>
          </CardContent>
        </Card>
      </div>

      {/* Stepper (Timeline) */}
      <Card className="border border-[#e2d9c8] shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-[#e2d9c8] pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#1a1a2e]">مسار القضية الجنائية — من البلاغ إلى التنفيذ</CardTitle>
          <Button variant="link" className="text-[#3182ce] text-xs p-0 h-auto gap-1">شرح تفصيلي <ChevronLeft size={12} /></Button>
        </CardHeader>
        <CardContent className="p-8 overflow-x-auto">
          <div className="min-w-[800px] flex justify-between items-start relative pt-2">
            {/* Connecting Line */}
            <div className="absolute top-[20px] left-[5%] right-[5%] h-0.5 bg-slate-200 z-0"></div>
            
            {/* Steps */}
            {[
              { title: "البلاغ وجمع الاستدلالات", desc: "الشرطة / ٢٤س", status: "completed" },
              { title: "التحقيق بالنيابة العامة", desc: "جنح ١٠أش / جنايات ٣م", status: "completed" },
              { title: "الحبس الاحتياطي", desc: "جنح ٤٥ي / جنايات ١٨ش", status: "active" },
              { title: "إحالة للمحاكمة", desc: "جلسات المحاكمة", status: "pending" },
              { title: "المرافعة والحكم", desc: "جنح ٤٠ي / جنايات ٤٠ي", status: "pending" },
              { title: "الطعن بالاستئناف", desc: "جنح ٤٠ي / جنايات ٤٠ي", status: "pending" },
              { title: "النقض أو التنفيذ", desc: "٦٠ يوم للنقض", status: "pending" },
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center w-28 group">
                <div className={`flex items-center justify-center transition-all bg-white
                  ${step.status === 'active' ? 'w-10 h-10 rounded-full border-4 border-[#dd6b20] shadow-[0_0_15px_rgba(221,107,32,0.4)]' : 
                    step.status === 'completed' ? 'w-8 h-8 rounded-full border-2 border-slate-400 bg-slate-100' : 
                    'w-8 h-8 rounded-full border-2 border-slate-200'}`}
                >
                  {step.status === 'completed' && <CheckCircle size={16} className="text-slate-500" />}
                  {step.status === 'active' && <div className="w-3 h-3 bg-[#dd6b20] rounded-full"></div>}
                </div>
                <h4 className={`text-xs font-bold mt-3 ${step.status === 'active' ? 'text-[#dd6b20]' : step.status === 'completed' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {step.title}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority & Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Right Column: Priority Cases */}
        <Card className="border border-[#e2d9c8] shadow-sm h-full">
          <CardHeader className="border-b border-[#e2d9c8] pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#1a1a2e]">
              قضايا ذات أولوية
            </CardTitle>
            <Button variant="link" className="text-[#3182ce] text-xs p-0 h-auto gap-1">الحبس الاحتياطي <ChevronLeft size={12} /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#e2d9c8]/50">
              {PRIORITY_CASES.map((c) => (
                <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center group">
                  <div>
                    <h4 className="font-bold text-[#1a1a2e] text-sm mb-1 group-hover:text-[#3182ce] transition-colors">{c.title}</h4>
                    <p className="text-xs text-slate-500">{c.details}</p>
                  </div>
                  <span className={c.statusColor}>{c.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Left Column: Calculator */}
        <Card className="border border-[#e2d9c8] shadow-sm h-full bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#1a1a2e]"></div>
          <CardHeader className="border-b border-[#e2d9c8] pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#1a1a2e]">
              <Calendar size={20} className="text-[#1a1a2e]" /> حاسبة مواعيد الطعن الجنائي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">تاريخ صدور الحكم</Label>
              <Input type="date" value={calcDate} onChange={e => setCalcDate(e.target.value)} className="border-[#e2d9c8] focus-visible:ring-[#1a1a2e]" />
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">نوع القضية والطعن</Label>
              <Select value={calcType} onValueChange={(v) => setCalcType(v as string)}>
                <SelectTrigger className="border-[#e2d9c8] focus-visible:ring-[#1a1a2e]">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="جنحة">استئناف جنحة (١٠ أيام)</SelectItem>
                  <SelectItem value="جناية">استئناف جناية (٤٠ يوماً)</SelectItem>
                  <SelectItem value="معارضة">معارضة غيابي (١٠ أيام)</SelectItem>
                  <SelectItem value="نقض">نقض جنحة/جناية (٦٠ يوماً)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full bg-[#1a1a2e] hover:bg-[#2a2a4a] text-white font-bold gap-2 py-6"
              onClick={calculateDeadline}
            >
              احسب آخر موعد للطعن
            </Button>

            {calcResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl border ${calcResult.warning ? 'bg-[#ffe4e4] border-[#fed7d7]' : 'bg-slate-50 border-[#e2d9c8]'}`}>
                <p className="text-xs text-slate-600 font-bold mb-1">آخر موعد قانوني للطعن:</p>
                <p className={`text-2xl font-black ${calcResult.warning ? 'text-[#c53030]' : 'text-[#1a1a2e]'}`}>
                  {formatDateEG(calcResult.date)}
                </p>
                <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">الوقت المتبقي:</span>
                  <span className={calcResult.warning ? 'badge-danger' : 'badge-green'}>{calcResult.remaining} أيام</span>
                </div>
              </motion.div>
            )}

            <div className="bg-[#faf5eb] border border-[#e2d9c8] p-3 rounded-lg text-xs leading-relaxed text-slate-600 mt-4">
              <span className="font-bold text-[#d69e2e]">تنبيه هام:</span> استئناف الجنايات مُستحدث بق ١/٢٠٢٤ — يُقدَّم التقرير بالاستئناف من السجن أو القلم أو الكاتب. إذا وقع الميعاد في إجازة رسمية انتقل لأول يوم عمل تالٍ.
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Legal Reference Table */}
      <Card className="border border-[#e2d9c8] shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-[#e2d9c8] pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#1a1a2e] flex items-center gap-2">
            <BookOpen size={20} className="text-[#3182ce]" /> المرجع القانوني الجنائي الشامل
          </CardTitle>
          <Button variant="link" className="text-[#3182ce] text-xs p-0 h-auto gap-1">الكامل <ChevronLeft size={12} /></Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-[#e2d9c8]">
                <TableRow>
                  <TableHead className="font-bold text-[#1a1a2e]">الإجراء / الميعاد</TableHead>
                  <TableHead className="font-bold text-[#1a1a2e]">المدة</TableHead>
                  <TableHead className="font-bold text-[#1a1a2e]">المستند القانوني</TableHead>
                  <TableHead className="font-bold text-[#1a1a2e]">النوع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LEGAL_REFERENCE.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50 transition-colors border-b border-[#e2d9c8]/50">
                    <TableCell className="font-bold text-slate-800 text-xs">{item.action}</TableCell>
                    <TableCell className="font-bold text-[#c53030] text-xs">{item.duration}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{item.law}</TableCell>
                    <TableCell><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.typeColor}`}>{item.type}</span></TableCell>
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
