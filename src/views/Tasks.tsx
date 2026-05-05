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
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">إدارة المهام</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تنظيم وتوزيع العمل على فريق المكتب ومتابعة الإنجاز.</p>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="بحث في المهام..." 
                  className="pr-10 w-64 dark:bg-navy-900 dark:border-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                <SelectTrigger className="w-40 dark:bg-navy-900 dark:border-white/10">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent className="dark:bg-navy-900">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="gap-2 dark:border-white/10" />}>
                <Filter size={16} />
                تصفية متقدمة {priorityFilter !== 'all' && `(${priorityFilter === 'high' ? 'عالية' : priorityFilter === 'medium' ? 'متوسطة' : 'عادية'})`}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-navy-800 dark:border-white/10 w-40">
                <div className="px-2 py-1.5 text-sm font-semibold text-slate-500">الأولوية</div>
                <DropdownMenuItem onClick={() => setPriorityFilter("all")} className="cursor-pointer dark:focus:bg-white/5">
                  الكل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("high")} className="cursor-pointer dark:focus:bg-white/5">
                  أولوية عالية
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("medium")} className="cursor-pointer dark:focus:bg-white/5">
                  أولوية متوسطة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("low")} className="cursor-pointer dark:focus:bg-white/5">
                  أولوية عادية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task: any) => {
                const caseInfo = cases.find((c: any) => c.id === task.caseId);
                const assignedMember = teamMembers.find((m: any) => m.id === task.assignedTo);
                const caseLabel = caseInfo
                  ? `${caseInfo.plaintiff} ضد ${caseInfo.defendant}`
                  : task.caseId
                    ? `قضية ${task.caseId} (غير موجودة في القائمة الحالية)`
                    : "بدون قضية";
                
                return (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <Checkbox 
                        checked={task.status === 'completed'}
                        onCheckedChange={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                        className="h-5 w-5 border-2 border-slate-300 dark:border-white/20 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500"
                      />
                      <div>
                        <p className={cn(
                          "font-bold transition-all",
                          task.status === 'completed' ? "text-slate-400 line-through" : "text-navy-900 dark:text-white"
                        )}>
                          {task.title || "(بدون عنوان)"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Scale size={12} className="text-primary-500" />
                            {caseLabel}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <CalendarIcon size={12} className="text-accent-500" />
                            تاريخ الاستحقاق: {task.dueDate}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <User size={12} className="text-blue-500" />
                            المسؤول: {assignedMember?.name || "غير محدد"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn(
                        "font-bold",
                        task.priority === 'high' ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" : 
                        task.priority === 'medium' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" : 
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                      )}>
                        {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => toast.info(`مهمة: ${task.title}`)}>
                        <AlertCircle size={16} className="text-slate-400" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-slate-400">
                <ListTodo size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium text-navy-900 dark:text-white">
                  {tasks.length === 0
                    ? "لا توجد مهام بعد. اضغط «إضافة مهمة جديدة»."
                    : searchQuery.trim() || statusFilter !== "all"
                      ? "لا توجد مهام تطابق البحث أو التصفية"
                      : "لا توجد مهام للعرض"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
