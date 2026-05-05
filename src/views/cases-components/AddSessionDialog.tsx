import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Case } from "@/types";
import { useCasesStore } from '@/store/useCasesStore';

interface AddSessionDialogProps {
  caseData?: Case;
  triggerContext?: 'calendar' | 'case_details';
  onSessionAdded?: (date: Date) => void;
}

export default function AddSessionDialog({ caseData, triggerContext = 'case_details', onSessionAdded }: AddSessionDialogProps) {
  const addSession = useCasesStore((state) => state.addSession);
  const cases = useCasesStore((state) => state.cases);
  const [selectedCaseId, setSelectedCaseId] = useState(caseData?.id || "");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCaseId) {
      toast.error("يرجى اختيار قضية");
      return;
    }
    const currentCase = cases.find(c => c.id === selectedCaseId);
    if (!currentCase) return;

    const formData = new FormData(e.currentTarget);
    addSession({
      id: `S-${Date.now()}`,
      caseId: currentCase.id,
      caseName: `${currentCase.plaintiff} ضد ${currentCase.defendant}`,
      date: String(formData.get('date')),
      time: String(formData.get('time')),
      court: String(formData.get('court')),
      notes: String(formData.get('notes') || ''),
      status: 'قادمة'
    });
    
    const addedDate = new Date(String(formData.get('date')));
    onSessionAdded?.(addedDate);
    
    toast.success("تم جدولة الجلسة بنجاح");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerContext === 'calendar' ? (
        <Button type="button" className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => setIsOpen(true)}>
          <Plus size={18} />
          إضافة موعد جلسة
        </Button>
      ) : (
        <Button type="button" size="sm" variant="outline" className="text-[10px] h-8 gap-1.5 border-slate-200 dark:border-white/10" onClick={() => setIsOpen(true)}>
          <Calendar size={12} /> إضافة جلسة
        </Button>
      )}
      <DialogContent className="bg-white dark:bg-navy-900">
        <DialogHeader>
          <DialogTitle className="font-bold">إضافة موعد جلسة جديد</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 pt-4" onSubmit={handleSubmit}>
          {!caseData && (
            <div className="space-y-2">
              <Label>القضية المرتبطة</Label>
              <Select value={selectedCaseId} onValueChange={(v) => v && setSelectedCaseId(v)} required>
                <SelectTrigger className="dark:bg-white/5 dark:border-white/10">
                  <SelectValue placeholder="اختر قضية من القائمة" />
                </SelectTrigger>
                <SelectContent className="dark:bg-navy-800 dark:border-white/10">
                  {cases.map((c) => (
                     <SelectItem key={c.id} value={c.id}>{c.id} - {c.plaintiff} ضد {c.defendant}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label>الوقت</Label>
              <Input name="time" type="time" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>المحكمة</Label>
            <Input name="court" defaultValue={caseData?.court} required />
          </div>
          <div className="space-y-2">
            <Label>ملاحظات الجلسة</Label>
            <Input name="notes" placeholder="ملاحظات إضافية..." />
          </div>
          <Button type="submit" className="w-full bg-primary-500 text-white hover:bg-primary-600">حفظ الجلسة</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
