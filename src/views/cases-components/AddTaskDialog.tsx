import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListTodo } from "lucide-react";
import { toast } from "sonner";
import { useTeamStore } from '@/store/useTeamStore';

interface AddTaskDialogProps {
  caseId: string;
}

export default function AddTaskDialog({ caseId }: AddTaskDialogProps) {
  const addTask = useTeamStore((state) => state.addTask);
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addTask({
      id: `T-${Date.now()}`,
      caseId: caseId,
      title: String(fd.get('title')),
      assignedTo: 'U-001',
      dueDate: String(fd.get('dueDate')),
      status: 'pending',
      priority: String(fd.get('priority')) as "high" | "medium" | "low",
    });
    toast.success("تم إضافة المهمة بنجاح");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant="outline" className="text-[10px] h-8 gap-1.5 border-slate-200 dark:border-white/10" onClick={() => setOpen(true)}>
        <ListTodo size={12} /> إضافة مهمة
      </Button>
      <DialogContent className="bg-white dark:bg-navy-900">
        <DialogHeader>
          <DialogTitle className="font-bold">إضافة مهمة جديدة</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 pt-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>عنوان المهمة</Label>
            <Input name="title" required placeholder="مثلاً: تجهيز اللائحة الاعتراضية" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ الاستحقاق</Label>
              <Input name="dueDate" type="date" required />
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
          <Button type="submit" className="w-full bg-primary-500 text-white hover:bg-primary-600">حفظ المهمة</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
