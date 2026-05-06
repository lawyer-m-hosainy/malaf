import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Clock, CheckCircle2, AlertCircle, Calendar as CalendarIcon, User, ListTodo, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTeamStore } from '@/store/useTeamStore';
import { useCasesStore } from '@/store/useCasesStore';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Tasks() {
  const tasks = useTeamStore((state) => state.tasks || []) || [];
  const updateTaskStatus = useTeamStore((state) => state.updateTaskStatus);
  const cases = useCasesStore((state) => state.cases || []) || [];
  const teamMembers = useTeamStore((state) => state.teamMembers || []) || [];
  const addTask = useTeamStore((state) => state.addTask);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);

  const filteredTasks = tasks.filter((task: any) => {
    const title = String(task?.title ?? "");
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
  const completedTasks = tasks.filter((t: any) => t.status === 'completed');

  const stats = [
    { title: "مهام معلقة", value: pendingTasks.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { title: "مهام مكتملة", value: completedTasks.length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { title: "إجمالي المهام", value: tasks.length, icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">الشغل الإداري</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">متابعة المهام الإدارية التي ينفذها المحامون لخدمة القضايا.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <Button type="button" className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => setAddOpen(true)}>
            <Plus size={18} />
            إضافة مهمة جديدة
          </Button>
          <DialogContent className="bg-white dark:bg-navy-900">
            <DialogHeader>
              <DialogTitle className="font-bold">إضافة مهمة جديدة</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 pt-4" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              addTask({
                id: `T-${Date.now()}`,
                caseId: String(fd.get('caseId')),
                title: String(fd.get('title')),
                assignedTo: 'U-001',
                dueDate: String(fd.get('dueDate')),
                status: 'pending',
                priority: String(fd.get('priority')) as any,
              });
              toast.success("تم إضافة المهمة بنجاح");
              setAddOpen(false);
            }}>
              <div className="space-y-2">
                <Label>عنوان المهمة</Label>
                <Input name="title" required placeholder="مثلاً: تجهيز اللائحة الاعتراضية" className="dark:bg-navy-800" />
              </div>
              <div className="space-y-2">
                <Label>القضية</Label>
                <select name="caseId" title="القضية" required className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
                  <option value="">— اختر قضية —</option>
                  {cases.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.plaintiff} ضد {c.defendant}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ الاستحقاق</Label>
                  <Input name="dueDate" type="date" required className="dark:bg-navy-800" />
                </div>
                <div className="space-y-2">
                  <Label>الأولوية</Label>
                  <select name="priority" title="الأولوية" className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
                    <option value="high">عالية</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary-500 text-white">حفظ المهمة</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-navy-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="border-b border-slate-50 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400" size={16} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 dark:bg-navy-900 dark:border-white/10">
                <SelectValue placeholder="حالة المهمة" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-navy-900">
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="pending">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40 dark:bg-navy-900 dark:border-white/10">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-navy-900">
                <SelectItem value="all">كل الأولويات</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {filteredTasks.length > 0 ? filteredTasks.map((task: any) => (
              <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                    className={cn( 
                      "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                      task.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 dark:border-white/20"
                    )}
                  >
                    {task.status === 'completed' && <CheckCircle2 size={12} />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-bold", task.status === 'completed' ? "text-slate-400 line-through" : "text-navy-900 dark:text-white")}>
                        {task.title}
                      </p>
                      <Badge variant="outline" className={cn(
                        "text-[10px] py-0",
                        task.priority === 'high' ? "text-red-500 border-red-200 bg-red-50" : 
                        task.priority === 'medium' ? "text-amber-500 border-amber-200 bg-amber-50" : 
                        "text-blue-500 border-blue-200 bg-blue-50"
                      )}>
                        {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {task.dueDate}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <User size={10} />
                        {teamMembers.find((m: any) => m.id === task.assignedTo)?.name || 'غير معين'}
                      </span>
                      {task.caseId && (
                        <span className="text-[11px] text-primary-500 flex items-center gap-1 font-medium">
                          <Scale size={10} />
                          رقم القضية: {task.caseId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary-500">
                    <AlertCircle size={16} />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <ListTodo className="h-12 w-12 opacity-10 mb-4" />
                <p className="text-sm">لا توجد مهام تطابق البحث</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
