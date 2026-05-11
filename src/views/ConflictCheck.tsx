import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, ShieldAlert, CheckCircle2, AlertCircle, 
  History, Loader2, Network, FileText, 
  ChevronRight, ArrowLeftRight, Building2, 
  UserCircle, ExternalLink, Printer
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { useComplianceStore } from '@/store/useComplianceStore';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchConflictChecks, saveConflictCheck } from "@/services/legalDataService";

export default function ConflictCheck() {
  const [query, setQuery] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const executeConflictCheck = useAnalyticsStore((state) => state.executeConflictCheck);
  const addConflictRecord = useComplianceStore((state) => state.addConflictRecord);
  const conflictHistory = useComplianceStore((state) => state.conflictHistory);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isPartner = hasPermission('*');
  const [dbHistory, setDbHistory] = useState<any[]>([]);

  import("react").then((react) => {
    react.useEffect(() => {
      fetchConflictChecks().then(data => setDbHistory(data));
    }, []);
  });

  const handleCheck = () => {
    if (!query.trim()) return;
    setIsChecking(true);
    setCurrentResult(null);
    
    // Simulate deep scanning animation
    setTimeout(() => {
      const result = executeConflictCheck(query);
      setCurrentResult(result);
      addConflictRecord(result);
      
      saveConflictCheck({
        query: result.query || query,
        status: result.status,
        matches: result.matches || [],
        checked_at: result.checkedAt || new Date().toISOString()
      }).then(() => {
        fetchConflictChecks().then(data => setDbHistory(data));
      });
      
      setIsChecking(false);
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Clear': return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-none">لا يوجد تعارض</Badge>;
      case 'DirectConflict': return <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-none">تعارض مباشر</Badge>;
      case 'IndirectConflict': return <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-none">تعارض غير مباشر</Badge>;
      case 'Waived': return <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-none">تم التنازل</Badge>;
      default: return null;
    }
  };

  const handleGenerateCertificate = () => {
    if (!currentResult) {
      toast.error("نفّذ فحص التعارض أولاً قبل إصدار الشهادة");
      return;
    }

    const certificateText = [
      "شهادة فحص تعارض مصالح",
      "----------------------------------------",
      `الجهة المفحوصة: ${currentResult.query}`,
      `حالة الفحص: ${currentResult.status === "Clear" ? "لا يوجد تعارض" : "تم رصد تعارض محتمل"}`,
      `تاريخ الفحص: ${new Date(currentResult.checkedAt).toLocaleString("ar-EG")}`,
      `عدد الارتباطات المكتشفة: ${currentResult.matches.length}`,
      `المُصدر: ${currentUser?.name || "مستخدم النظام"}`,
      "----------------------------------------",
      "تم إصدار هذه الشهادة آلياً من نظام مَلَف.",
    ].join("\n");

    const blob = new Blob([certificateText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `certificate-${currentResult.query}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("تم إصدار الشهادة وتحميلها بنجاح");
  };

  const handleSaveProfessionalDecision = () => {
    if (!currentResult) {
      toast.error("لا يوجد فحص نشط لحفظ القرار عليه");
      return;
    }

    if (!isPartner) {
      toast.error("صلاحية الحفظ متاحة فقط للشريك المفوض");
      return;
    }

    if (!decisionNotes.trim()) {
      toast.error("يرجى كتابة ملاحظات القرار المهني قبل الحفظ");
      return;
    }

    const updatedRecord = {
      ...currentResult,
      id: `CCR-DEC-${Date.now()}`,
      resolutionNotes: decisionNotes.trim(),
      resolutionDate: new Date().toISOString(),
      resolvedBy: currentUser?.name || "محامي شريك",
      status: currentResult.status === "Clear" ? "Clear" : "Waived",
    };

    addConflictRecord(updatedRecord);
    setCurrentResult(updatedRecord);
    
    saveConflictCheck({
      query: updatedRecord.query || query,
      status: updatedRecord.status,
      matches: updatedRecord.matches || [],
      checked_at: updatedRecord.checkedAt || new Date().toISOString(),
      resolution_notes: updatedRecord.resolutionNotes,
      resolution_date: updatedRecord.resolutionDate,
      resolved_by: updatedRecord.resolvedBy
    }).then(() => {
       fetchConflictChecks().then(data => setDbHistory(data));
    });

    toast.success("تم حفظ القرار المهني بنجاح");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="text-primary-500" />
            محرك فحص التعارض المتقدم
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تكنولوجيا الربط الذكي للكشف عن تعارض المصالح عبر مستويات الشركات والمجموعات القابضة.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-slate-200 dark:border-white/10">
            <History size={16} />
            سجل الفحص
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800 bg-white/50 backdrop-blur-sm sticky top-4 z-10 border border-white/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input 
                placeholder="أدخل اسم المنشأة، الشريك، أو الرقم الضريبي للفحص العميق..." 
                className="ps-10 h-14 bg-slate-50 dark:bg-white/5 border-none text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              />
            </div>
            <Button 
              className="bg-primary-500 hover:bg-primary-600 text-white h-14 px-10 gap-2 shadow-xl shadow-primary-500/20 text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleCheck}
              disabled={isChecking}
            >
              {isChecking ? <Loader2 size={24} className="animate-spin" /> : <ShieldAlert size={24} />}
              {isChecking ? 'جاري الفحص العميق...' : 'بدء فحص العلاقات'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {isChecking && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 space-y-6"
          >
            <div className="relative w-24 h-24">
               <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full" />
               <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
               <Network className="absolute inset-0 m-auto text-primary-500 animate-pulse" size={32} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-bold text-lg animate-pulse">جاري تحليل الشبكة الكيانية...</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">نقوم بفحص السجلات التجارية، بيانات المساهمين، والخصوم في القضايا النشطة.</p>
            </div>
          </motion.div>
        )}

        {currentResult && !isChecking && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className={cn(
              "p-8 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6",
              currentResult.status === 'Clear' ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30" : 
              "bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30"
            )}>
              <div className="flex items-center gap-6">
                <div className={cn(
                  "p-5 rounded-2xl shadow-lg",
                  currentResult.status === 'Clear' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-rose-500 text-white shadow-rose-500/20"
                )}>
                  {currentResult.status === 'Clear' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {currentResult.status === 'Clear' ? 'النتيجة: لا يوجد تعارض' : 'تنبيه: تم رصد تعارض محتمل'}
                  </h2>
                  <p className="text-slate-500 dark:text-white/60">لفحص: <span className="font-bold text-navy-900 dark:text-white">"{currentResult.query}"</span> • بتاريخ {new Date(currentResult.checkedAt).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="gap-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm dark:bg-navy-800"
                  onClick={handleGenerateCertificate}
                >
                  <Printer size={16} />
                  إصدار شهادة
                </Button>
                {currentResult.status !== 'Clear' && isPartner && (
                  <Button className="bg-navy-900 text-white hover:bg-navy-800 gap-2 shadow-lg">
                    طلب إذن استثناء (Waiver)
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm dark:bg-navy-800 overflow-hidden">
                  <CardHeader className="border-b border-slate-50 dark:border-white/5 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <ArrowLeftRight className="text-primary-500 w-5 h-5" />
                       مسارات الارتباط المكتشفة
                    </CardTitle>
                    <Badge variant="outline">{currentResult.matches.length} ارتباطات</Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    {currentResult.matches.length > 0 ? (
                      <div className="divide-y divide-slate-50 dark:divide-white/5">
                        {currentResult.matches.map((match: any, idx: number) => (
                          <div key={idx} className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4">
                                <div className={cn(
                                  "p-3 rounded-xl",
                                  match.severity === 'High' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20" : "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                                )}>
                                  {match.relationshipType === 'Client' ? <Building2 size={24} /> : <UserCircle size={24} />}
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg">{match.entityName}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-[10px]">{match.relationshipType}</Badge>
                                    <span className="text-xs text-slate-500">{match.description}</span>
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="text-primary-600 gap-1 text-xs">
                                عرض الملف
                                <ExternalLink size={14} />
                              </Button>
                            </div>
                            
                            <div className="mt-4 flex items-center gap-3 ps-14">
                              <div className="flex-1 h-px bg-slate-100 dark:bg-white/10" />
                              <span className="text-[10px] uppercase font-bold text-slate-400">مسار الارتباط</span>
                              <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] flex items-center gap-1">
                                {query} <ChevronRight size={10} /> {match.relationshipType} <ChevronRight size={10} /> {match.entityName}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                         <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-500">
                           <CheckCircle2 size={40} />
                         </div>
                         <div>
                            <p className="font-bold text-lg">نظيف: لا يوجد مخاوف مهنية</p>
                            <p className="text-sm text-slate-500">تم فحص العلاقات المباشرة وغير المباشرة ولم يتم العثور على تقاطعات.</p>
                         </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-sm dark:bg-navy-800 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
                   <CardHeader>
                     <CardTitle className="text-white">المخاطرة الأخلاقية</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      {currentResult.status !== 'Clear' ? (
                        <div className="p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                          <p className="text-sm leading-relaxed">
                            <strong>تحذير مهني:</strong> قبول هذا العميل قد يضع المكتب في موقف حرج قانونياً وأخلاقياً نظراً لوجود علاقة تبعية مع العميل الحالي.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                          <p className="text-sm leading-relaxed">
                            <strong>توصية:</strong> المسار آمن للمضي قدماً في إجراءات التعاقد (KYC).
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold opacity-70">إقرار الشريك</p>
                        <textarea 
                          placeholder="ملاحظات الموافقة أو الرفض المهني..."
                          className="w-full h-24 bg-white/5 border border-white/20 rounded-lg p-3 text-xs focus:ring-1 focus:ring-white outline-none"
                          value={decisionNotes}
                          onChange={(e) => setDecisionNotes(e.target.value)}
                        />
                        <Button 
                          className="w-full bg-white dark:bg-navy-900 text-primary-700 hover:bg-white/90 font-bold"
                          onClick={handleSaveProfessionalDecision}
                        >
                          حفظ القرار المهني
                        </Button>
                      </div>
                   </CardContent>
                </Card>

                <Card className="border-none shadow-sm dark:bg-navy-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">عمليات مسجلة مؤخراً</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50 dark:divide-white/5">
                      {dbHistory.slice(0, 3).map((record: any) => (
                        <div key={record.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                           <div className="flex items-center justify-between mb-1">
                             <h5 className="text-xs font-bold truncate pr-2">{record.query}</h5>
                             {getStatusBadge(record.status)}
                           </div>
                           <p className="text-[10px] text-slate-400">{new Date(record.checked_at || record.created_at).toLocaleString('ar-EG')}</p>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full text-xs text-primary-600 font-bold h-12">عرض كافة السجلات ←</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
