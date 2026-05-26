import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, BriefcaseBusiness, Scale, Plus, FileText, Users, Building2, Landmark, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useComplianceStore } from '@/store/useComplianceStore';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TRACK_TYPES = [
  {
    id: "جنائي",
    name: "المسار الجنائي",
    description: "إدارة مواعيد المعارضات، الاستئناف، الكفالات، ومتابعة تحقيقات النيابة بدقة لتجنب سقوط الحقوق.",
    icon: Scale,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    defaultChecklist: [
      { id: "c1", title: "تصوير المحضر من القسم/النيابة", done: false },
      { id: "c2", title: "تجهيز التوكيل الخاص/العام", done: false },
      { id: "c3", title: "سداد الكفالة إن وجدت", done: false },
      { id: "c4", title: "عمل معارضة/استئناف في الميعاد", done: false }
    ],
    defaultSteps: [
      { id: "s1", name: "تحقيقات النيابة", completed: false },
      { id: "s2", name: "إحالة للمحاكمة", completed: false },
    ]
  },
  {
    id: "عمالي",
    name: "المسار العمالي",
    description: "تنظيم إجراءات شكاوى مكتب العمل، المحاكم العمالية، ومواعيد سقوط الدعوى العمالية.",
    icon: BriefcaseBusiness,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    defaultChecklist: [
      { id: "c1", title: "تقديم شكوى لمكتب العمل", done: false },
      { id: "c2", title: "حضور جلسة التسوية الودية", done: false },
      { id: "c3", title: "استلام إحالة المحكمة", done: false },
      { id: "c4", title: "إيداع صحيفة الدعوى العمالية", done: false }
    ],
    defaultSteps: [
      { id: "s1", name: "مكتب العمل", completed: false },
      { id: "s2", name: "المحكمة العمالية", completed: false },
    ]
  },
  {
    id: "مدني",
    name: "المسار المدني",
    description: "متابعة صحف الدعاوى، إعلانات الخصوم، ومواعيد ندب الخبراء والطعن بالاستئناف أو النقض.",
    icon: FileText,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    defaultChecklist: [
      { id: "c1", title: "قيد الصحيفة بالجدول", done: false },
      { id: "c2", title: "تسليم الإعلان للمحضرين", done: false },
      { id: "c3", title: "استلام الإعلان المنفذ", done: false },
      { id: "c4", title: "سداد أمانة الخبير", done: false }
    ],
    defaultSteps: [
      { id: "s1", name: "إيداع وإعلان الصحيفة", completed: false },
      { id: "s2", name: "المرافعة/الخبراء", completed: false },
    ]
  },
  {
    id: "أحوال شخصية",
    name: "مسار الأسرة",
    description: "ترتيب إجراءات لجان تسوية المنازعات، دعاوى النفقات والطلاق، وتقارير الخبراء النفسيين.",
    icon: Users,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-900/20",
    defaultChecklist: [
      { id: "c1", title: "تقديم طلب لمكتب التسوية", done: false },
      { id: "c2", title: "استخراج شهادة تحركات/مفردات مرتب", done: false },
      { id: "c3", title: "إعلان عرض الصلح", done: false },
      { id: "c4", title: "حضور الخبيرين النفسي والاجتماعي", done: false }
    ],
    defaultSteps: [
      { id: "s1", name: "مكتب التسوية", completed: false },
      { id: "s2", name: "المحكمة", completed: false },
    ]
  },
  {
    id: "شركات",
    name: "مسار الشركات",
    description: "إجراءات التأسيس، الجمعيات العمومية، السجل التجاري، والالتزامات الضريبية.",
    icon: Building2,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    defaultChecklist: [
      { id: "c1", title: "استخراج شهادة عدم التباس الاسم", done: false },
      { id: "c2", title: "توثيق عقد التأسيس بالشهر العقاري", done: false },
      { id: "c3", title: "القيد بالسجل التجاري", done: false },
      { id: "c4", title: "استخراج البطاقة الضريبية", done: false }
    ],
    defaultSteps: [
      { id: "s1", name: "التأسيس", completed: false },
      { id: "s2", name: "السجل والضرائب", completed: false },
    ]
  },
  {
    id: "إداري",
    name: "المسار الإداري",
    description: "إجراءات التظلم، دعاوى الإلغاء بمجلس الدولة، ومتابعة تقارير هيئة مفوضي الدولة.",
    icon: Landmark,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    defaultChecklist: [
      { id: "c1", title: "تقديم التظلم الإداري (خلال 60 يوم)", done: false },
      { id: "c2", title: "قيد صحيفة دعوى الإلغاء", done: false },
      { id: "c3", title: "إعلان هيئة قضايا الدولة", done: false },
      { id: "c4", title: "متابعة التقرير بهيئة المفوضين", done: false }
    ],
    defaultSteps: [
      { id: "s1", name: "التظلم", completed: false },
      { id: "s2", name: "هيئة المفوضين", completed: false },
      { id: "s3", name: "المرافعة", completed: false },
    ]
  }
];

function isSlaNear(date?: string) {
  if (!date) return false;
  const diff = new Date(date).getTime() - Date.now();
  return diff <= 24 * 60 * 60 * 1000;
}

export default function SpecializedTracks() {
  const specializedTracks = useComplianceStore((state) => state.specializedTracks);
  const toggleSpecializedChecklist = useComplianceStore((state) => state.toggleSpecializedChecklist);
  const updateSpecializedTrackStatus = useComplianceStore((state) => state.updateSpecializedTrackStatus);
  const addSpecializedTrack = useComplianceStore((state) => state.addSpecializedTrack);
  const addAuditLog = useUIStore((state) => state.addAuditLog);
  const currentUser = useAuthStore((state) => state.currentUser);

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTrackData, setNewTrackData] = useState({
    caseId: "",
    caseType: "جنائي",
  });

  const kpis = useMemo(() => {
    return TRACK_TYPES.map(trackType => {
      const tracks = specializedTracks.filter(t => t.caseType === trackType.id);
      const onTime = tracks.filter(t => t.status !== "متأخر").length;
      return {
        ...trackType,
        total: tracks.length,
        onTime: onTime,
        percentage: tracks.length ? Math.round((onTime / tracks.length) * 100) : 0
      };
    });
  }, [specializedTracks]);

  const log = (action: string, details: string) => {
    addAuditLog({
      id: `AL-SP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: currentUser?.id || "unknown",
      userName: currentUser?.name || "unknown",
      action,
      module: "specialized-tracks",
      details,
      timestamp: new Date().toISOString(),
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackData.caseId) {
      toast.error("يرجى إدخال رقم أو اسم الملف/القضية");
      return;
    }
    
    const trackConfig = TRACK_TYPES.find(t => t.id === newTrackData.caseType);
    if (!trackConfig) return;

    addSpecializedTrack({
      id: `ST-${Date.now().toString().slice(-4)}`,
      caseId: newTrackData.caseId,
      caseType: newTrackData.caseType as any,
      stage: trackConfig.defaultSteps[0]?.name || "البداية",
      slaDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "نشط",
      checklist: trackConfig.defaultChecklist,
      documentTemplates: [],
      steps: trackConfig.defaultSteps,
      createdAt: new Date().toISOString()
    });
    
    toast.success("تم إضافة المسار بنجاح");
    setIsAddOpen(false);
    setNewTrackData({ ...newTrackData, caseId: "" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">المسارات المتخصصة</h1>
          <p className="text-slate-500 mt-1 max-w-2xl">هيكلة كاملة لسير القضايا حسب نوعها، مع قوائم مهام إلزامية (Checklists) ومتابعة للمواعيد القانونية (SLA) لحماية المكتب من مخاطر المواعيد السقوطية.</p>
        </div>
        <div className="flex items-center shrink-0">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <Button onClick={() => setIsAddOpen(true)} className="bg-primary-500 hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary-500/20">
              <Plus size={18} />
              بدء مسار جديد
            </Button>
            <DialogContent className="sm:max-w-[500px] dark:bg-navy-900 dark:border-white/10">
              <DialogHeader>
                <DialogTitle>بدء مسار عمل جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">اختر نوع المسار (القسم)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TRACK_TYPES.map(type => (
                      <div 
                        key={type.id}
                        onClick={() => setNewTrackData(prev => ({...prev, caseType: type.id}))}
                        className={cn(
                          "cursor-pointer border rounded-lg p-3 text-center transition-colors flex flex-col items-center gap-2",
                          newTrackData.caseType === type.id 
                            ? "bg-primary-50 border-primary-500 dark:bg-primary-900/20 dark:border-primary-500" 
                            : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-navy-800 dark:border-white/10 dark:hover:bg-white/5"
                        )}
                      >
                        <type.icon size={20} className={cn(newTrackData.caseType === type.id ? "text-primary-600 dark:text-primary-400" : "text-slate-500")} />
                        <span className={cn("text-xs font-bold", newTrackData.caseType === type.id ? "text-primary-700 dark:text-primary-300" : "text-slate-600 dark:text-slate-400")}>
                          {type.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t dark:border-white/10">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">رقم / ملف القضية المرتبط</label>
                  <Input 
                    placeholder="مثال: دعوى رقم 123 لسنة 2024" 
                    value={newTrackData.caseId}
                    onChange={(e) => setNewTrackData(prev => ({...prev, caseId: e.target.value}))}
                    className="dark:bg-navy-800 dark:border-white/10"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white mt-4">
                  تأكيد وبدء المسار
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.id} className="border-none shadow-sm dark:bg-navy-800 overflow-hidden group hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", kpi.bg, kpi.color)}>
                    <kpi.icon size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-base text-navy-900 dark:text-white">{kpi.name}</CardTitle>
                  </div>
                </div>
                <div className="text-end">
                  <span className={cn("text-xl font-bold", kpi.percentage < 50 && kpi.total > 0 ? "text-red-500" : "text-navy-900 dark:text-white")}>{kpi.percentage}%</span>
                  <p className="text-[10px] text-slate-500">مؤشر الأداء</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 h-10 line-clamp-2">
                {kpi.description}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5">
                <span className="text-xs font-bold text-slate-500">إجمالي الملفات النشطة:</span>
                <Badge variant="secondary" className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                  {kpi.total} مسار
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-bold text-navy-900 dark:text-white pt-6 border-t border-slate-200 dark:border-white/10">المسارات قيد التنفيذ</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {specializedTracks.map((t) => {
          const config = TRACK_TYPES.find(type => type.id === t.caseType) || TRACK_TYPES[0];
          return (
            <Card key={t.id} className="border-none shadow-sm dark:bg-navy-800 flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-50 dark:border-white/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", config.bg, config.color)}>
                      <config.icon size={20} />
                    </div>
                    <div>
                      <Badge variant="secondary" className={cn("mb-1 text-[10px]", config.bg, config.color, "bg-opacity-50")}>{config.name}</Badge>
                      <CardTitle className="text-base text-navy-900 dark:text-white line-clamp-1">{t.caseId}</CardTitle>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={t.status === "متأخر" ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : t.status === "مغلق" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"}>
                      {t.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-4 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-slate-600 dark:text-slate-300">المرحلة: {t.stage}</Badge>
                  {isSlaNear(t.slaDueAt) && t.status !== "مغلق" && (
                    <Badge className="bg-amber-100 text-amber-800 border-none gap-1"><Bell size={12} /> تحذير موعد</Badge>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-3">تسلسل الخطوات (Workflow)</h3>
                  <div className="space-y-2">
                    {t.steps.map((s) => (
                      <div key={s.id} className="px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-md text-sm flex items-center justify-between">
                        <span className="text-slate-700 dark:text-slate-300">{s.name}</span>
                        {s.completed ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-none dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 size={12} className="me-1" /> مكتمل</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 bg-white dark:bg-navy-800 border-slate-200 dark:border-white/10">قيد التنفيذ</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary-500" />
                    المهام الإلزامية (Checklist)
                  </h3>
                  <div className="space-y-2">
                    {t.checklist.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          toggleSpecializedChecklist(t.id, c.id);
                          log("Toggle Specialized Checklist", `${t.id} -> ${c.id}`);
                        }}
                        className="w-full text-start px-3 py-2.5 border border-slate-100 dark:border-white/5 rounded-md text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-3"
                      >
                        <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", c.done ? "bg-primary-500 border-primary-500 text-white" : "border-slate-300 dark:border-slate-600")}>
                          {c.done && <CheckCircle2 size={12} />}
                        </div>
                        <span className={cn(c.done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-300")}>{c.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {t.documentTemplates && t.documentTemplates.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-2">قوالب مستندات</h3>
                    <div className="flex flex-wrap gap-2">
                      {t.documentTemplates.map((d) => (
                        <Badge key={d.id} variant="outline" className="bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300">{d.title}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex gap-2 mt-auto">
                <Button size="sm" variant="outline" className="flex-1 bg-white dark:bg-navy-800" onClick={() => { updateSpecializedTrackStatus(t.id, "نشط"); toast.success("تم تحديث الحالة"); }}>تنشيط</Button>
                <Button size="sm" variant="outline" className="flex-1 text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:bg-navy-800 dark:border-white/10" onClick={() => { updateSpecializedTrackStatus(t.id, "متأخر"); toast.warning("تم تعليم المسار كمتأخر"); }}>متأخر</Button>
                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { updateSpecializedTrackStatus(t.id, "مغلق"); toast.success("تم إغلاق المسار"); }}>إغلاق المسار</Button>
              </div>
            </Card>
          );
        })}
        {specializedTracks.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-white/5">
            <div className="w-16 h-16 bg-white dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <BriefcaseBusiness className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">لا توجد مسارات نشطة حالياً</h3>
            <p className="max-w-md mx-auto">قم بإضافة مسار عمل جديد من الأعلى لبدء تنظيم مهام القضايا ومتابعة المواعيد القانونية لمكتبك.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
