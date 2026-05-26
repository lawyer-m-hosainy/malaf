import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Scale, ArrowLeft } from "lucide-react";
import { useEnforcementStore } from "@/store/useEnforcementStore";
import { useClientsStore } from "@/store/useClientsStore";
import type { Case } from "@/types";
import type { ExecutionDocType } from "@/types/enforcement";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: Case | null;
}

const EXECUTION_TYPES: ExecutionDocType[] = ['حكم قضائي', 'شيك', 'كمبيالة', 'عقد موثق', 'محضر صلح', 'أخرى'];

export default function ReferToEnforcementDialog({ open, onOpenChange, caseData }: Props) {
  const createFromCase = useEnforcementStore((s) => s.createEnforcementFromCase);
  const getNextFileNumber = useEnforcementStore((s) => s.getNextFileNumber);
  const clients = useClientsStore((s) => s.clients);

  const [formData, setFormData] = useState({
    amountClaimed: '',
    executionType: 'حكم قضائي' as ExecutionDocType,
    judgmentNumber: '',
    judgmentDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;
    if (!formData.amountClaimed) {
      toast.error("يرجى إدخال مبلغ المطالبة");
      return;
    }
    const client = clients.find(c => c.id === caseData.clientId);
    const fileNum = getNextFileNumber();
    createFromCase(
      caseData,
      client?.name || caseData.plaintiff,
      Number(formData.amountClaimed),
      formData.executionType,
      formData.judgmentNumber,
      formData.judgmentDate,
    );
    toast.success(`تم إحالة القضية للتنفيذ بنجاح - ملف رقم ${fileNum}`);
    onOpenChange(false);
    setFormData({ amountClaimed: '', executionType: 'حكم قضائي', judgmentNumber: '', judgmentDate: '' });
  };

  if (!caseData) return null;

  const client = clients.find(c => c.id === caseData.clientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl dark:bg-navy-900 bg-white">
        <DialogHeader>
          <DialogTitle className="text-navy-900 dark:text-white font-bold flex items-center gap-2">
            <Scale size={20} className="text-primary-600" />
            إحالة القضية للتنفيذ
          </DialogTitle>
        </DialogHeader>

        {/* Case summary */}
        <div className="p-3 rounded-lg bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm text-primary-700 dark:text-primary-300">{caseData.id}</span>
            <Badge className="text-[10px] bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300">{caseData.court}</Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {caseData.plaintiff} <span className="text-slate-400">ضد</span> {caseData.defendant}
            {client && <span className="text-slate-400"> • الموكل: {client.name}</span>}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>مبلغ المطالبة (جنيه) *</Label>
              <Input type="number" placeholder="150000" value={formData.amountClaimed} onChange={e => setFormData(p => ({ ...p, amountClaimed: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>نوع السند التنفيذي</Label>
              <select title="نوع السند" className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-navy-900 dark:text-white dark:bg-navy-800" value={formData.executionType} onChange={e => setFormData(p => ({ ...p, executionType: e.target.value as ExecutionDocType }))}>
                {EXECUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>رقم الحكم</Label>
              <Input placeholder="44/2026" value={formData.judgmentNumber} onChange={e => setFormData(p => ({ ...p, judgmentNumber: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الحكم</Label>
              <Input type="date" value={formData.judgmentDate} onChange={e => setFormData(p => ({ ...p, judgmentDate: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white mt-2 gap-2">
            <ArrowLeft size={16} />
            تأكيد الإحالة للتنفيذ
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
