import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCasesStore } from '@/store/useCasesStore';
import { Case } from '@/types';
import { Gavel } from 'lucide-react';

interface AddTierDialogProps {
  caseData: Case;
}

export default function AddTierDialog({ caseData }: AddTierDialogProps) {
  const [open, setOpen] = useState(false);
  const updateCase = useCasesStore(state => state.updateCase);
  const [tierData, setTierData] = useState({
    tier: 'مستأنف' as 'مستأنف' | 'نقض',
    number: '',
    year: new Date().getFullYear().toString(),
    court: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierData.number || !tierData.year) {
      toast.error("يرجى إدخال رقم وسنة الطعن");
      return;
    }

    const updates: Partial<Case> = {
      currentTier: tierData.tier,
    };

    if (tierData.tier === 'مستأنف') {
      updates.appealNumber = tierData.number;
      updates.appealYear = tierData.year;
    } else {
      updates.cassationNumber = tierData.number;
      updates.cassationYear = tierData.year;
    }

    updateCase(caseData.id, updates);
    toast.success(`تم إضافة درجة ${tierData.tier} بنجاح`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" size="sm" className="h-7 text-xs border-primary-200 text-primary-700 hover:bg-primary-50">
            إضافة درجة طعن
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[400px] dark:bg-navy-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel size={18} className="text-primary-500" />
            إضافة درجة طعن جديدة
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>درجة الطعن</Label>
            <select 
              className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
              value={tierData.tier}
              onChange={e => setTierData(p => ({ ...p, tier: e.target.value as any }))}
            >
              <option value="مستأنف">استئناف</option>
              <option value="نقض">نقض / طعن</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم الطعن</Label>
              <Input 
                placeholder="مثلاً: 1234" 
                value={tierData.number}
                onChange={e => setTierData(p => ({ ...p, number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>السنة</Label>
              <Input 
                placeholder="2024" 
                value={tierData.year}
                onChange={e => setTierData(p => ({ ...p, year: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>المحكمة المختصة</Label>
            <Input 
              placeholder="مثلاً: استئناف القاهرة" 
              value={tierData.court}
              onChange={e => setTierData(p => ({ ...p, court: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white">
            حفظ درجة الطعن
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
