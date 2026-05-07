import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Users, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle, Sparkles, Loader2, ListTodo, Calendar as CalendarIcon, Download, DollarSign } from "lucide-react";
import { useCasesStore } from "@/store/useCasesStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { useInvoicesStore } from "@/store/useInvoicesStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useEnforcementStore } from "@/store/useEnforcementStore";
import { cn } from "@/lib/utils";
import React, { useState, useMemo, useEffect, Suspense, lazy } from "react";
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));
const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })));
const Pie = lazy(() => import('recharts').then(module => ({ default: module.Pie })));
const Cell = lazy(() => import('recharts').then(module => ({ default: module.Cell })));
import { draftLegalDocument } from "@/services/ai";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchCases, fetchClients, fetchEnforcement, fetchInvoices, fetchTasks, fetchTeam, fetchTrustAccounts } from "@/services/legalDataService";
import { EGYPTIAN_LEGAL_TEMPLATES } from "@/services/ai/templates";
import { useUsageStore } from "@/store/useUsageStore";

const CATEGORY_COLORS: Record<string, { color: string; bgClass: string }> = {
  'تجاري': { color: 'var(--color-primary-500)', bgClass: 'bg-primary-500' },
  'عمالي': { color: 'var(--color-accent-500)', bgClass: 'bg-accent-500' },
  'جنائي': { color: 'var(--color-navy-300)', bgClass: 'bg-navy-300' },
  'أحوال شخصية': { color: 'var(--color-primary-300)', bgClass: 'bg-primary-300' },
  'مدني': { color: '#6366f1', bgClass: 'bg-indigo-500' },
  'إداري': { color: '#f59e0b', bgClass: 'bg-amber-500' },
  'اقتصادي': { color: '#10b981', bgClass: 'bg-emerald-500' },
  'عقاري': { color: '#8b5cf6', bgClass: 'bg-violet-500' },
};

const MemoizedBarChart = React.memo(({ data }: { data: any[] }) => (
  <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" /></div>}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          cursor={{ fill: '#f1f5f9' }}
        />
        <Bar dataKey="value" fill="#006c35" radius={[4, 4, 0, 0]} barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  </Suspense>
));

const MemoizedPieChart = React.memo(({ data }: { data: any[] }) => (
  <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" /></div>}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </Suspense>
));

export default function Dashboard() {
  const navigate = useNavigate();
  const cases = useCasesStore((state) => state.cases);
  const clients = useClientsStore((state) => state.clients);
  const tasks = useTeamStore((state) => state.tasks);
  const updateTaskStatus = useTeamStore((state) => state.updateTaskStatus);
  const refreshCases = useCasesStore((state) => state.fetchCases);
  const refreshClients = useClientsStore((state) => state.fetchClients);
  const refreshTasks = useTeamStore((state) => state.fetchTasks);

  // BUG-011: Sync data on mount if counts are 0 to ensure stats are accurate
  useEffect(() => {
    if (cases.length === 0) refreshCases();
    if (clients.length === 0) refreshClients();
    if (tasks.length === 0) refreshTasks();
  }, [cases.length, clients.length, tasks.length]);
  
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState("");
  const [draftType, setDraftType] = useState(EGYPTIAN_LEGAL_TEMPLATES[0].id);
  const [facts, setFacts] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");

  const { incrementAiDocCount, getAiDocCount, getLimit } = useUsageStore();

  const handleDraft = async () => {
    if (!facts.trim()) return;
    
    // Check limits
    const currentCount = getAiDocCount();
    const limit = getLimit('free'); // Default to free for now
    if (currentCount >= limit) {
      toast.error(`لقد وصلت للحد الأقصى المسموح به (${limit} مستندات/شهر) في الخطة المجانية.`);
      return;
    }

    setIsDrafting(true);
    try {
      const selectedCase = cases.find(c => c.id === selectedCaseId);
      const selectedClient = clients.find(c => c.id === selectedCase?.clientId);
      const poas = useClientsStore.getState().poas || [];
      const selectedPOA = poas.find(p => p.clientId === selectedClient?.id);

      const context = {
        clientName: selectedClient?.name,
        clientNationalId: selectedClient?.nationalId,
        defendantName: selectedCase?.defendant,
        courtName: selectedCase?.court,
        caseNumber: selectedCase?.id,
        caseYear: selectedCase?.createdAt?.substring(0, 4),
        clientRole: selectedCase?.clientRole,
        poaRef: selectedPOA ? `${selectedPOA.poaNumber} / ${selectedPOA.poaLetter} لسنة ${selectedPOA.poaYear}` : undefined,
        opponentName: selectedCase?.defendant,
      };

      const result = await draftLegalDocument(draftType, facts, context);
      setDraftResult(result);
      incrementAiDocCount();
      toast.success("تم صياغة المستند بنجاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الصياغة.");
    } finally {
      setIsDrafting(false);
    }
  };

  const toIndicNumerals = (num: number | string) => {
    return String(num).replace(/[0-9]/g, w => "٠١٢٣٤٥٦٧٨٩"[+w]);
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("draft-result-content");
    if (!element) return;

    try {
      // Lazy load dependencies
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import("jspdf"),
        import("html2canvas")
      ]);
      
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`document-${draftType}-${Date.now()}.pdf`);
      toast.success("تم تحميل الملف بصيغة PDF");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("فشل تصدير ملف PDF");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const casesLoaded = useCasesStore.getState().hasLoaded;
      const clientsLoaded = useClientsStore.getState().hasLoaded;

      // Only fetch if data has not been loaded yet
      if (!casesLoaded || !clientsLoaded) {
        const [remoteClients, remoteCases, remoteTrust, remoteEnf, remoteTasks, remoteTeam] = await Promise.all([
          fetchClients(), 
          fetchCases(),
          fetchTrustAccounts(),
          fetchEnforcement(),
          fetchTasks(),
          fetchTeam()
        ]);
        
        if (remoteClients?.length > 0) useClientsStore.getState().setClients(remoteClients);
        if (remoteCases?.length > 0) useCasesStore.getState().setCases(remoteCases);
        if (remoteTrust?.length > 0) useFinanceStore.getState().setTrustAccounts(remoteTrust);
        if (remoteEnf?.length > 0) useEnforcementStore.getState().setEnforcementCases(remoteEnf);
        if (remoteTasks?.length > 0) useTeamStore.getState().setTasks(remoteTasks);
        if (remoteTeam?.length > 0) useTeamStore.getState().setTeamMembers(remoteTeam);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => [
    { title: "القضايا المتداولة", value: cases.filter(c => c.status === 'متداولة').length, icon: Scale, color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
    { title: "القضايا المحفوظة", value: cases.filter(c => c.status === 'محفوظة').length, icon: CheckCircle2, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800" },
    { title: "العملاء النشطون", value: clients.length, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "قضايا تحت الدراسة", value: cases.filter(c => c.status === 'تحت الدراسة').length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ], [cases, clients]);

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date === today);

  const upcomingDeadlines = deadlines.filter(d => {
    if (!d.type?.includes('استئناف') && !d.title.includes('استئناف') && !d.title.includes('تمييز')) return false;
    const diffTime = new Date(d.date).getTime() - new Date(today).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).map(d => {
    const diffTime = new Date(d.date).getTime() - new Date(today).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const relatedCase = cases.find(c => c.id === d.caseId);
    return { ...d, diffDays, caseTitle: relatedCase?.title || relatedCase?.plaintiff || d.caseId };
  }).sort((a, b) => a.diffDays - b.diffDays);

  const dynamicCategoryData = useMemo(() => {
    if (cases.length === 0) {
      return Object.entries(CATEGORY_COLORS).map(([name, c]) => ({
        name, value: 0, color: c.color, bgClass: c.bgClass,
      }));
    }
    const counts: Record<string, number> = {};
    cases.forEach(c => { counts[c.type] = (counts[c.type] || 0) + 1; });
    const total = cases.length;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: CATEGORY_COLORS[name]?.color || '#94a3b8',
      bgClass: CATEGORY_COLORS[name]?.bgClass || 'bg-slate-400',
    }));
  }, [cases]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">لوحة القيادة</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">نظرة عامة على أداء المكتب والعمليات الحالية.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" className="w-full sm:w-auto gap-2 border-primary-200 dark:border-white/10 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5" />}>
              <Sparkles size={18} />
              صياغة ذكية
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white dark:bg-navy-900">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-navy-900 dark:text-white">
                  <Sparkles className="text-primary-500" />
                  المساعد القانوني - صياغة الوثائق
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">نوع الوثيقة</label>
                    <select 
                      title="نوع الوثيقة"
                      aria-label="نوع الوثيقة"
                      className="w-full p-2 rounded-md border border-slate-200 dark:border-white/10 bg-transparent text-sm dark:text-white"
                      value={draftType}
                      onChange={(e) => setDraftType(e.target.value)}
                    >
                      {EGYPTIAN_LEGAL_TEMPLATES.map((t: any) => (
                        <option key={t.id} value={t.id} className="dark:bg-navy-900">{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">القضية المرتبطة (اختياري)</label>
                    <select 
                      title="القضية"
                      aria-label="القضية"
                      className="w-full p-2 rounded-md border border-slate-200 dark:border-white/10 bg-transparent text-sm dark:text-white"
                      value={selectedCaseId}
                      onChange={(e) => setSelectedCaseId(e.target.value)}
                    >
                      <option value="" className="dark:bg-navy-900">بدون قضية (صياغة حرة)</option>
                      {cases.map((c: any) => (
                        <option key={c.id} value={c.id} className="dark:bg-navy-900">{c.id} - {c.plaintiff}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">وقائع القضية / التفاصيل</label>
                    <Textarea 
                      placeholder="اكتب هنا وقائع القضية أو تفاصيل العقد المراد صياغته..."
                      className="h-48 resize-none dark:bg-white/5"
                      value={facts}
                      onChange={(e) => setFacts(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white gap-2"
                    onClick={handleDraft}
                    disabled={isDrafting || !facts.trim()}
                  >
                    {isDrafting ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    بدء الصياغة الآلية
                  </Button>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">المسودة الناتجة</label>
                      {draftResult && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary-600" onClick={handleExportPDF}>
                          <Download size={14} /> PDF
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="flex-1 bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-md p-6">
                      {draftResult ? (
                        <div id="draft-result-content" className="p-8 text-[12px] leading-relaxed whitespace-pre-wrap dark:text-slate-300 font-serif bg-white text-black min-h-[842px] w-[595px] mx-auto shadow-sm" dir="rtl">
                          {/* Letterhead */}
                          <div className="border-b-2 border-primary-800 pb-4 mb-8 flex justify-between items-start">
                            <div className="text-right">
                              <h2 className="text-xl font-bold text-primary-900">مكتب الأستاذ / _________</h2>
                              <p className="text-xs text-slate-500">للمحاماة والاستشارات القانونية</p>
                              <p className="text-[10px] text-slate-400 mt-1">القاهرة، جمهورية مصر العربية</p>
                            </div>
                            <div className="w-16 h-16 bg-primary-50 flex items-center justify-center rounded">
                              <Scale className="text-primary-600" size={32} />
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            {draftResult}
                          </div>

                          {/* Footer */}
                          <div className="mt-20 pt-4 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
                            <span>{toIndicNumerals(new Date().toLocaleDateString('ar-EG'))}</span>
                            <span>صفحة {toIndicNumerals(1)} من {toIndicNumerals(1)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20">
                          <FileText size={48} className="mb-2 opacity-20" />
                          <p className="text-xs">سيظهر النص المصاغ هنا بعد الضغط على زر البدء</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow dark:bg-navy-800">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color || "text-slate-600")} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{stat.title}</p>
                  <p className="text-2xl font-bold text-navy-900 dark:text-white">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary-500" />
              جلسات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {todaySessions.length > 0 ? todaySessions.map((session, idx) => {
                const c = cases.find(c => c.id === session.caseId);
                return (
                  <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <p className="font-bold text-navy-900 dark:text-white">{c?.title || session.caseName}</p>
                    <p className="text-sm text-slate-500 mt-1 font-mono">{c?.circulationCode || c?.archiveCode || session.caseId}</p>
                    <p className="text-xs text-slate-400 mt-1">{session.notes || session.time}</p>
                  </div>
                );
              }) : (
                <div className="p-8 text-center text-slate-500">لا توجد جلسات مجدولة اليوم</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              تنبيهات الاستئناف والتمييز (خلال 30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((d, idx) => (
                <div key={idx} className={cn("p-4 transition-colors", d.diffDays <= 7 ? "bg-red-50/50 dark:bg-red-900/10" : "hover:bg-slate-50 dark:hover:bg-white/5")}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={cn("font-bold", d.diffDays <= 7 ? "text-red-700 dark:text-red-400" : "text-navy-900 dark:text-white")}>{d.caseTitle}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{d.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{d.date}</p>
                    </div>
                    <div className={cn("px-2 py-1 rounded text-xs font-bold", d.diffDays <= 7 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                      المتبقي: {d.diffDays} يوم
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-500">لا توجد مواعيد استئناف قريبة</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary-500" />
              المهام الحالية
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-600"
              onClick={() => {
                navigate("/dashboard/tasks");
                toast.info("تم فتح صفحة المهام لإضافة مهمة جديدة");
              }}
            >
              إضافة مهمة
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {tasks.length > 0 ? tasks.map((task) => (
                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                      className={cn(
                        "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                        task.status === 'completed' ? "bg-primary-500 border-primary-500 text-white" : "border-slate-200 dark:border-white/20"
                      )}
                    >
                      {task.status === 'completed' && <CheckCircle2 size={12} />}
                    </button>
                    <div>
                      <p className={cn("text-sm font-bold", task.status === 'completed' ? "text-slate-400 line-through" : "text-navy-900 dark:text-white")}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {task.dueDate}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          task.priority === 'high' ? "bg-red-50 text-red-600" : 
                          task.priority === 'medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400"
                    onClick={() => toast.info(`تنبيه المهمة: ${task.title}`)}
                  >
                    <AlertCircle size={16} />
                  </Button>
                </div>
              )) : (
                <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                  <ListTodo className="h-12 w-12 opacity-10 mb-2" />
                  <p className="text-sm">لا توجد مهام حالية</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              توزيع القضايا حسب التخصص
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <MemoizedPieChart data={dynamicCategoryData} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-500" />
              إحصائيات الأداء المالي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <MemoizedBarChart data={dynamicCategoryData} />
          </CardContent>
        </Card>
      </div>

    </motion.div>
  );
}
