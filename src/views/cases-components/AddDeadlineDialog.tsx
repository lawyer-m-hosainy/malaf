import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { addDeadlineToCase } from "@/application/cases/useCases";
import { useCaseActions } from "./useCaseActions";

interface AddDeadlineDialogProps {
  caseId: string;
}

export default function AddDeadlineDialog({ caseId }: AddDeadlineDialogProps) {
  const { casesRepository } = useCaseActions();
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      addDeadlineToCase(casesRepository, {
        caseId,
        title: String(formData.get('title') || ''),
        date: String(formData.get('date') || ''),
        type: (formData.get('type') as "تقديم صحيفة" | "موعد جلسة" | "انتهاء مدة استئناف" | "أخرى" | "انتهاء مدة طعن بالنقض"),
        priority: (formData.get('priority') as "high" | "medium" | "low"),
      });
      toast.success("تم إضافة الموعد النهائي بنجاح");
      setOpen(false);
    } catch (error) {
      const msg =
        error instanceof Error && error.message === "PAST_DEADLINE_NOT_ALLOWED"
          ? "لا يمكن إضافة موعد نهائي بتاريخ سابق"
          : "تعذر حفظ الموعد النهائي";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant="outline" className="text-[10px] h-8 gap-1.5 border-slate-200 dark:border-white/10" onClick={() => setOpen(true)}>
        <Clock size={12} /> إضافة موعد نهائي
      </Button>
      <DialogContent className="bg-white dark:bg-navy-900">
        <DialogHeader>
          <DialogTitle className="font-bold">إضافة موعد نهائي جديد</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 pt-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-bold">العنوان</label>
            <Input name="title" required placeholder="مثلاً: تقديم اللائحة الاعتراضية" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">التاريخ</label>
              <Input name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">النوع</label>
              <select name="type" title="النوع" className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
                <option value="تقديم مذكرة">تقديم مذكرة</option>
                <option value="موعد جلسة">موعد جلسة</option>
                <option value="انتهاء مدة استئناف">انتهاء مدة استئناف</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold">الأولوية</label>
            <select name="priority" title="الأولوية" className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
          <Button type="submit" className="w-full bg-primary-500 text-white hover:bg-primary-600">حفظ الموعد النهائي</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
