import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Clock, CheckCircle2, AlertCircle, User, ListTodo, Scale, ArrowUpCircle, Activity, Loader2, Eye, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTeamStore } from '@/store/useTeamStore';
import { useCasesStore } from '@/store/useCasesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateEG } from "@/lib/formatEG";
import type { Task } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'جديدة': { label: 'جديدة', color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-white/10', icon: AlertCircle },
  'قيد التنفيذ': { label: 'قيد التنفيذ', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20', icon: Loader2 },
  'مراجعة': { label: 'مراجعة', color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/20', icon: Eye },
  'مكتملة': { label: 'مكتملة', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20', icon: CheckCircle2 },
  'مؤجلة': { label: 'مؤجلة', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20', icon: Pause },
};

const WORKFLOW_STEPS: Task['status'][] = ['جديدة', 'قيد التنفيذ', 'مراجعة', 'مكتملة'];

const getProgressClass = (p: number) => {
  if (p >= 100) return 'w-full';
  if (p >= 95) return 'w-[95%]';
  if (p >= 90) return 'w-[90%]';
  if (p >= 85) return 'w-[85%]';
  if (p >= 80) return 'w-[80%]';
  if (p >= 75) return 'w-[75%]';
  if (p >= 70) return 'w-[70%]';
  if (p >= 65) return 'w-[65%]';
  if (p >= 60) return 'w-[60%]';
  if (p >= 55) return 'w-[55%]';
  if (p >= 50) return 'w-[50%]';
  if (p >= 45) return 'w-[45%]';
  if (p >= 40) return 'w-[40%]';
  if (p >= 35) return 'w-[35%]';
  if (p >= 30) return 'w-[30%]';
  if (p >= 25) return 'w-[25%]';
  if (p >= 20) return 'w-[20%]';
  if (p >= 15) return 'w-[15%]';
  if (p >= 10) return 'w-[10%]';
  if (p >= 5) return 'w-[5%]';
  return 'w-0';
};

export default function Tasks() {
  const tasks = useTeamStore((state) => state.tasks || []);
  const updateTaskStatus = useTeamStore((state) => state.updateTaskStatus);
  const updateTaskProgress = useTeamStore((state) => state.updateTaskProgress);
  const cases = useCasesStore((state) => state.cases || []);
  const teamMembers = useTeamStore((state) => state.teamMembers || []);
  const addTask = useTeamStore((state) => state.addTask);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateTaskId, setUpdateTaskId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<Task['status']>('قيد التنفيذ');
  const [updateNotes, setUpdateNotes] = useState("");
  const [newProgress, setNewProgress] = useState(0);

  const filteredTasks = tasks.filter((task: any) => {
    const title = String(task?.title ?? "");
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingTasks = tasks.filter((t: any) => t.status === 'جديدة' || t.status === 'قيد التنفيذ');
  const completedTasks = tasks.filter((t: any) => t.status === 'مكتملة');
  const overdueTasks = tasks.filter((t: any) => t.status !== 'مكتملة' && new Date(t.dueDate) < new Date());

  const stats = [
    { title: "مهام نشطة", value: pendingTasks.length, icon: Clock, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "مهام مكتملة", value: completedTasks.length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { title: "متأخرة", value: overdueTasks.length, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
    { title: "إجمالي", value: tasks.length, icon: ListTodo, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-900/20" },
  ];

  const openUpdateDialog = (task: Task) => {
    setUpdateTaskId(task.id);
    setNewStatus(task.status === 'مكتملة' ? 'مكتملة' : WORKFLOW_STEPS[Math.min(WORKFLOW_STEPS.indexOf(task.status) + 1, WORKFLOW_STEPS.length - 1)]);
    setNewProgress(task.progress || 0);
    setUpdateNotes("");
    setUpdateOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!updateTaskId) return;
    updateTaskStatus(
      updateTaskId,
      newStatus,
      currentUser?.id,
      currentUser?.name || 'المستخدم',
      updateNotes || undefined
    );
    if (newProgress > 0) {
      updateTaskProgress(updateTaskId, newProgress, currentUser?.id, currentUser?.name);
    }
    toast.success(`تم تحديث المهمة إلى: ${newStatus}`);
    setUpdateOpen(false);
  };

  const isOverdue = (task: Task) => task.status !== 'مكتملة' && new Date(task.dueDate) < new Date();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">الشغل الإداري</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">متابعة المهام الإدارية وتقييم أداء المحامين.</p>
        </div>
        <Button className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => setAddOpen(true)}>
          <Plus size={18} />
          إضافة مهمة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <p className="text-xl font-bold text-navy-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input placeholder="بحث بعنوان المهمة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ps-9 h-9 dark:bg-navy-900 dark:border-white/10" />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v || 'all')}>
              <SelectTrigger className="w-36 h-9 dark:bg-navy-900 dark:border-white/10"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent className="bg-white dark:bg-navy-900">
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="جديدة">جديدة</SelectItem>
                <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                <SelectItem value="مراجعة">مراجعة</SelectItem>
                <SelectItem value="مكتملة">مكتملة</SelectItem>
                <SelectItem value="مؤجلة">مؤجلة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={v => setPriorityFilter(v || 'all')}>
              <SelectTrigger className="w-36 h-9 dark:bg-navy-900 dark:border-white/10"><SelectValue placeholder="الأولوية" /></SelectTrigger>
              <SelectContent className="bg-white dark:bg-navy-900">
                <SelectItem value="all">كل الأولويات</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">عادية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {filteredTasks.length > 0 ? filteredTasks.map((task: any) => {
              const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG['جديدة'];
              const StatusIcon = statusCfg.icon;
              const member = teamMembers.find((m: any) => m.id === task.assignedTo);
              const overdue = isOverdue(task);

              return (
                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status icon */}
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", statusCfg.bg)}>
                      <StatusIcon size={16} className={statusCfg.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("text-sm font-bold truncate", task.status === 'مكتملة' ? "text-slate-400 line-through" : "text-navy-900 dark:text-white")}>
                          {task.title}
                        </p>
                        <Badge className={cn("text-[10px] py-0", statusCfg.bg, statusCfg.color)}>{statusCfg.label}</Badge>
                        <Badge variant="outline" className={cn(
                          "text-[10px] py-0",
                          task.priority === 'high' ? "text-red-500 border-red-200 bg-red-50" : 
                          task.priority === 'medium' ? "text-amber-500 border-amber-200 bg-amber-50" : 
                          "text-blue-500 border-blue-200 bg-blue-50"
                        )}>
                          {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
                        </Badge>
                        {overdue && <Badge className="bg-red-100 text-red-600 text-[9px] gap-0.5"><AlertCircle size={9} /> متأخرة</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={cn("text-[11px] flex items-center gap-1", overdue ? "text-red-500 font-bold" : "text-slate-400")}>
                          <Clock size={10} />
                          {task.dueDate}
                        </span>
                        <span className="text-[11px] text-primary-500 flex items-center gap-1 font-medium">
                          <User size={10} />
                          {member?.name || task.assignedToName || 'غير معين'}
                        </span>
                        {task.caseId && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Scale size={10} />
                            {task.caseId}
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      {task.status !== 'مكتملة' && (task.progress || 0) > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className={cn("h-full bg-primary-500 rounded-full transition-all", getProgressClass(task.progress || 0))} />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{task.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ms-2">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 gap-1" onClick={() => openUpdateDialog(task)}>
                      <ArrowUpCircle size={14} />
                      تحديث
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:bg-slate-100 gap-1" onClick={() => setDetailTask(task)}>
                      <Activity size={14} />
                      السجل
                    </Button>
                  </div>
                </div>
              );
            }) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <ListTodo className="h-12 w-12 opacity-10 mb-4" />
                <p className="text-sm">لا توجد مهام تطابق البحث</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-white dark:bg-navy-900 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold">إضافة مهمة جديدة</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 pt-2" onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const assignedTo = String(fd.get('assignedTo'));
            const member = teamMembers.find(m => m.id === assignedTo);
            addTask({
              id: `T-${Date.now()}`,
              caseId: String(fd.get('caseId')),
              title: String(fd.get('title')),
              description: String(fd.get('description') || ''),
              assignedTo,
              assignedToName: member?.name || '',
              dueDate: String(fd.get('dueDate')),
              status: 'جديدة',
              priority: String(fd.get('priority')) as any,
              progress: 0,
              createdAt: new Date().toISOString(),
            });
            toast.success("تم إضافة المهمة بنجاح");
            setAddOpen(false);
          }}>
            <div className="space-y-2">
              <Label>عنوان المهمة *</Label>
              <Input name="title" required placeholder="مثلاً: تجهيز اللائحة الاعتراضية" className="dark:bg-navy-800 dark:border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input name="description" placeholder="تفاصيل المهمة..." className="dark:bg-navy-800 dark:border-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>القضية</Label>
                <select name="caseId" title="القضية" className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm dark:bg-navy-800">
                  <option value="">— بدون قضية —</option>
                  {cases.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.caseNumber || c.id} - {c.plaintiff} ضد {c.defendant}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>المحامي المسؤول *</Label>
                <select name="assignedTo" title="المحامي" required className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm dark:bg-navy-800">
                  <option value="">— اختر محامي —</option>
                  {teamMembers.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق *</Label>
                <Input name="dueDate" type="date" required className="dark:bg-navy-800 dark:border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <select name="priority" title="الأولوية" className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm dark:bg-navy-800">
                  <option value="high">عالية 🔴</option>
                  <option value="medium">متوسطة 🟡</option>
                  <option value="low">عادية 🔵</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white gap-2">
              <Plus size={16} />
              حفظ المهمة
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white dark:bg-navy-900 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold flex items-center gap-2">
              <ArrowUpCircle size={18} className="text-primary-600" />
              تحديث حالة المهمة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الحالة الجديدة</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['جديدة', 'قيد التنفيذ', 'مراجعة', 'مكتملة', 'مؤجلة'] as Task['status'][]).map(s => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setNewStatus(s);
                        if (s === 'مكتملة') setNewProgress(100);
                        else if (s === 'مراجعة') setNewProgress(75);
                        else if (s === 'قيد التنفيذ') setNewProgress(50);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg border-2 text-sm font-bold transition-all text-center",
                        newStatus === s
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md"
                          : "border-slate-200 dark:border-white/10 hover:border-primary-300"
                      )}
                    >
                      <span className={cfg.color}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>نسبة الإنجاز: {newProgress}%</Label>
              <input type="range" title="نسبة الإنجاز" min={0} max={100} step={5} value={newProgress} onChange={e => setNewProgress(Number(e.target.value))} className="w-full accent-primary-500" />
              <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={cn("h-full bg-primary-500 rounded-full transition-all", getProgressClass(newProgress))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Input placeholder="مثلاً: تم مراجعة اللائحة مع الشريك" value={updateNotes} onChange={e => setUpdateNotes(e.target.value)} className="dark:bg-navy-800 dark:border-white/10" />
            </div>

            <Button onClick={handleUpdateStatus} className="w-full bg-primary-600 hover:bg-primary-700 text-white gap-2">
              <ArrowUpCircle size={16} />
              تحديث الحالة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={!!detailTask} onOpenChange={() => setDetailTask(null)}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-navy-900 border-none shadow-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold flex items-center gap-2">
              <Activity size={18} className="text-primary-600" />
              سجل نشاط المهمة
            </DialogTitle>
          </DialogHeader>
          {detailTask && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                <p className="font-bold text-sm text-navy-900 dark:text-white">{detailTask.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  المسؤول: {detailTask.assignedToName || teamMembers.find(m => m.id === detailTask.assignedTo)?.name || 'غير معين'}
                </p>
              </div>
              
              <div className="space-y-2 border-s-2 border-primary-200 dark:border-primary-800 ps-4">
                {(detailTask.activityLog || []).length === 0 ? (
                  <p className="text-sm text-slate-400">لا يوجد سجل نشاط بعد</p>
                ) : (
                  [...(detailTask.activityLog || [])].reverse().map(log => (
                    <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 relative">
                      <div className="absolute -start-[1.35rem] top-3 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white dark:border-navy-900" />
                      <p className="text-sm font-bold text-navy-900 dark:text-white">{log.action}</p>
                      {log.fromStatus && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          من <Badge className="text-[9px] mx-1">{log.fromStatus}</Badge> إلى <Badge className="text-[9px] mx-1 bg-primary-100 text-primary-700">{log.toStatus}</Badge>
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{formatDateEG(log.date)}</span>
                        <span className="text-[10px] text-primary-500 font-medium">بواسطة {log.performedByName}</span>
                      </div>
                      {log.notes && <p className="text-xs text-slate-500 mt-1 bg-white dark:bg-navy-800 p-1.5 rounded">{log.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
