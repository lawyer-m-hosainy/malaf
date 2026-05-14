import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Plus, Calendar, User, Scale, Save } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useFinanceStore } from '@/store/useFinanceStore';
import { useCasesStore } from '@/store/useCasesStore';
import { useTeamStore } from '@/store/useTeamStore';
import { cn } from "@/lib/utils";
import { fetchTimeEntries, saveTimeEntry, deleteTimeEntryRecord } from "@/services/legalDataService";
import { formatDateEG } from "@/lib/formatEG";
export default function TimeTracking() {
  const timeEntries = useFinanceStore((state) => state.timeEntries);
  const setTimeEntries = useFinanceStore((state) => state.setTimeEntries);
  const addTimeEntryStore = useFinanceStore((state) => state.addTimeEntry);
  const updateTimeEntryStore = useFinanceStore((state) => state.updateTimeEntry);
  const deleteTimeEntryStore = useFinanceStore((state) => state.deleteTimeEntry);
  const toggleTimeEntryBilledStatusStore = useFinanceStore((state) => state.toggleTimeEntryBilledStatus);
  const cases = useCasesStore((state) => state.cases) ?? [];
  const teamMembers = useTeamStore((state) => state.teamMembers) ?? [];
  const [isTracking, setIsTracking] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCaseId, setManualCaseId] = useState("");
  const [manualLawyerId, setManualLawyerId] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualHours, setManualHours] = useState("1");
  const [manualMinutes, setManualMinutes] = useState("0");
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  
  const [timerSeconds, setTimerSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTracking]);

  useEffect(() => {
    loadTimeEntries();
  }, []);

  const loadTimeEntries = async () => {
    const data = await fetchTimeEntries();
    setTimeEntries(data.map((d: any) => ({
      id: d.id,
      caseId: d.case_id,
      lawyerId: d.lawyer_id,
      description: d.description,
      duration: d.duration_minutes,
      date: d.date,
      billable: d.billable,
      isBilled: d.is_billed
    })));
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalWeekMinutes = timeEntries.reduce((sum, e) => sum + e.duration, 0);
  const totalWeekHours = (totalWeekMinutes / 60).toLocaleString('ar-EG', { maximumFractionDigits: 1 });
  const billedWeekMinutes = timeEntries.filter(e => e.isBilled).reduce((sum, e) => sum + e.duration, 0);
  const billedWeekHours = (billedWeekMinutes / 60).toLocaleString('ar-EG', { maximumFractionDigits: 1 });
  const estimatedValue = billedWeekMinutes * 500; // 500 EGP/min rate
  const formatEGP = (n: number) => n.toLocaleString('ar-EG');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">تتبع الوقت</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تسجيل الساعات القابلة للفلترة والعمل على القضايا والاستشارات.</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="border-none shadow-sm dark:bg-navy-800 px-4 py-2 flex items-center gap-4">
            <div className="text-start">
              <p className="text-[10px] text-slate-500 uppercase font-bold">الوقت الفعلي</p>
              <p className="text-xl font-mono font-bold" dir="ltr">{formatTime(timerSeconds)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => {
                  if (!isTracking) {
                    toast.success("تم بدء المؤقت بنجاح");
                  } else {
                    toast.info("تم إيقاف المؤقت مؤقتاً");
                  }
                  setIsTracking(!isTracking);
                }}
                className={isTracking ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"}
                size="icon"
              >
                {isTracking ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsTracking(false);
                  setTimerSeconds(0);
                  toast.info("تمت إعادة ضبط المؤقت");
                }}
              >
                تصفير
              </Button>
              {timerSeconds > 0 && !isTracking && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    setEditEntryId(null);
                    setManualCaseId("");
                    setManualLawyerId("");
                    setManualDesc("");
                    setManualDate(new Date().toISOString().slice(0, 10));
                    setManualHours(Math.floor(timerSeconds / 3600).toString() || "0");
                    setManualMinutes((Math.floor(timerSeconds / 60) % 60).toString());
                    setManualOpen(true);
                  }}
                >
                  <Save size={14} />
                  حفظ
                </Button>
              )}
            </div>
          </Card>
            <Button type="button" className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => {
              setEditEntryId(null);
              setManualCaseId("");
              setManualLawyerId("");
              setManualDesc("");
              setManualDate(new Date().toISOString().slice(0, 10));
              setManualHours("1");
              setManualMinutes("0");
              setManualOpen(true);
            }}>
              <Plus size={18} />
              إضافة يدوية
            </Button>
          </div>
        </div>
  
        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
          <DialogContent className="sm:max-w-md border-none shadow-2xl dark:bg-navy-900 bg-white dark:bg-navy-900">
            <DialogHeader>
              <DialogTitle className="text-navy-900 dark:text-white">
                {editEntryId ? "تعديل سجل الوقت" : "إضافة وقت يدوياً"}
              </DialogTitle>
            </DialogHeader>
          <form
            className="space-y-4 py-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!manualCaseId || !manualLawyerId) {
                toast.error("اختر القضية والمحامي");
                return;
              }
              const h = Math.min(24, Math.max(0, parseInt(manualHours, 10) || 0));
              const m = Math.max(0, Math.min(59, parseInt(manualMinutes, 10) || 0));
              const durationMin = h * 60 + m;
              if (durationMin <= 0) {
                toast.error("أدخل مدة صحيحة");
                return;
              }
              
              const loadingToast = toast.loading("جاري الحفظ...");
              try {
                if (editEntryId) {
                  const updates = {
                    caseId: manualCaseId,
                    lawyerId: manualLawyerId,
                    description: manualDesc.trim() || "عمل يدوي",
                    duration: durationMin,
                    date: manualDate,
                  };
                  updateTimeEntryStore(editEntryId, updates);
                  await saveTimeEntry({
                    id: editEntryId,
                    case_id: updates.caseId,
                    lawyer_id: updates.lawyerId,
                    description: updates.description,
                    duration_minutes: updates.duration,
                    date: updates.date,
                  });
                  toast.success("تم تعديل السجل بنجاح", { id: loadingToast });
                } else {
                  const newEntry = {
                    id: `TE-${Date.now()}`,
                    caseId: manualCaseId,
                    lawyerId: manualLawyerId,
                    description: manualDesc.trim() || "عمل يدوي",
                    duration: durationMin,
                    date: manualDate,
                    billable: true,
                    isBilled: false,
                  };
                  addTimeEntryStore(newEntry);
                  await saveTimeEntry({
                    case_id: newEntry.caseId,
                    lawyer_id: newEntry.lawyerId,
                    description: newEntry.description,
                    duration_minutes: newEntry.duration,
                    date: newEntry.date,
                    billable: newEntry.billable,
                    is_billed: newEntry.isBilled
                  });
                  toast.success("تم تسجيل الوقت", { id: loadingToast });
                }
                
                setManualOpen(false);
                setManualDesc("");
                loadTimeEntries();
              } catch (err) {
                toast.error("فشل الحفظ", { id: loadingToast });
              }
            }}
          >
            <div className="space-y-2">
              <Label>القضية</Label>
              <Select value={manualCaseId} onValueChange={(v) => v && setManualCaseId(v)}>
                <SelectTrigger className="dark:bg-white/5 dark:border-white/10">
                  <SelectValue placeholder="اختر قضية" />
                </SelectTrigger>
                <SelectContent className="w-full min-w-[300px]" side="bottom" align="start">
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} — {c.plaintiff} ضد {c.defendant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المحامي</Label>
              <Select value={manualLawyerId} onValueChange={(v) => v && setManualLawyerId(v)}>
                <SelectTrigger className="dark:bg-white/5 dark:border-white/10">
                  <SelectValue placeholder="اختر عضو الفريق" />
                </SelectTrigger>
                <SelectContent className="w-full min-w-[200px]" side="bottom" align="start">
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-desc">الوصف</Label>
              <Input id="manual-desc" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} placeholder="مثال: مراجعة مذكرة" className="dark:bg-white/5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="manual-date">التاريخ</Label>
                <Input id="manual-date" type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>ساعات</Label>
                  <Input type="number" min={0} max={24} value={manualHours} onChange={(e) => setManualHours(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>دقائق</Label>
                  <Input type="number" min={0} max={59} value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white">
              حفظ
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">إجمالي ساعات الأسبوع</p>
            <h3 className="text-2xl font-bold">{totalWeekHours} ساعة</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">ساعات قابلة للفلترة</p>
            <h3 className="text-2xl font-bold text-emerald-600">{billedWeekHours} ساعة</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">القيمة المتوقعة</p>
            <h3 className="text-2xl font-bold text-primary-600">{formatEGP(estimatedValue)} ج.م</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader>
          <CardTitle className="text-lg font-bold">سجل الوقت</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-white/5">
              <TableRow>
                <TableHead className="text-start">المحامي</TableHead>
                <TableHead className="text-start">القضية</TableHead>
                <TableHead className="text-start">الوصف</TableHead>
                <TableHead className="text-start">التاريخ</TableHead>
                <TableHead className="text-start">المدة</TableHead>
                <TableHead className="text-start">الحالة</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    لا توجد سجلات وقت بعد
                  </TableCell>
                </TableRow>
              ) : timeEntries.map((entry) => {
                const lawyer = teamMembers.find(m => m.id === entry.lawyerId);
                const caseItem = cases.find(c => c.id === entry.caseId);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        {lawyer?.name || entry.lawyerId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Scale size={14} className="text-slate-400" />
                        {caseItem ? `${caseItem.plaintiff} ضد ${caseItem.defendant}` : entry.caseId}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={14} className="text-slate-400" />
                        {formatDateEG(new Date(entry.date))}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      {Math.floor(entry.duration / 60).toLocaleString('ar-EG')}س {(entry.duration % 60).toLocaleString('ar-EG')}د
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={entry.isBilled ? "secondary" : "outline"} 
                        className={cn("cursor-pointer select-none transition-colors", entry.isBilled ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40" : "hover:bg-slate-100 dark:hover:bg-white/10")}
                        onClick={async () => {
                          toggleTimeEntryBilledStatusStore(entry.id);
                          try {
                            if (!entry.id.startsWith("TE-")) {
                              await saveTimeEntry({ id: entry.id, is_billed: !entry.isBilled });
                            }
                            toast.success(!entry.isBilled ? 'تم تغيير الحالة إلى: تمت الفوترة' : 'تم تغيير الحالة إلى: بانتظار الفوترة');
                          } catch (e) {
                            toast.error("فشل التحديث");
                          }
                        }}
                      >
                        {entry.isBilled ? 'تمت الفوترة' : 'بانتظار الفوترة'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditEntryId(entry.id);
                            setManualCaseId(entry.caseId);
                            setManualLawyerId(entry.lawyerId);
                            setManualDesc(entry.description);
                            setManualDate(entry.date);
                            setManualHours(Math.floor(entry.duration / 60).toString());
                            setManualMinutes((entry.duration % 60).toString());
                            setManualOpen(true);
                          }}
                        >
                          تعديل
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={async () => {
                            if (window.confirm("هل أنت متأكد من حذف هذا السجل؟")) {
                              deleteTimeEntryStore(entry.id);
                              try {
                                if (!entry.id.startsWith("TE-")) {
                                  await deleteTimeEntryRecord(entry.id);
                                }
                                toast.success("تم حذف السجل بنجاح");
                              } catch (e) {
                                toast.error("فشل החذف");
                              }
                            }
                          }}
                        >
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
