import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Calendar as CalendarIcon, Save, AlertCircle, Info, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeadlinesStore, CalculatedDeadline } from '@/store/useDeadlinesStore';
import { CaseDeadlineType } from '@/lib/deadlines';

// The options from CaseDeadlineType
const DEADLINE_OPTIONS: { label: string, value: CaseDeadlineType }[] = [
  { label: 'استئناف مدني (40 يوم)', value: 'استئناف مدني' },
  { label: 'طعن بالنقض (60 يوم)', value: 'طعن بالنقض' },
  { label: 'معارضة جنائية (10 أيام)', value: 'معارضة جنائية' },
  { label: 'استئناف جنائي (10 أيام)', value: 'استئناف جنائي' },
  { label: 'طعن إداري (60 يوم)', value: 'طعن إداري' },
  { label: 'استئناف عمالي (30 يوم)', value: 'استئناف عمالي' },
  { label: 'طعن ضريبي (30 يوم)', value: 'طعن ضريبي' },
  { label: 'استئناف إيجارات (40 يوم)', value: 'استئناف إيجارات' },
  { label: 'التماس إعادة نظر (40 يوم)', value: 'التماس إعادة نظر' },
  { label: 'تظلم تأديبي (60 يوم)', value: 'تظلم تأديبي' },
];

interface LegalDeadlinesCalculatorProps {
  caseId?: string;
  caseTitle?: string;
}

export function LegalDeadlinesCalculator({ caseId, caseTitle }: LegalDeadlinesCalculatorProps) {
  const { 
    history, 
    calculateAndAdd, 
    saveToAgenda, 
    removeFromHistory,
    isOpen,
    setIsOpen
  } = useDeadlinesStore();

  const [type, setType] = useState<CaseDeadlineType>('استئناف مدني');
  const [judgmentDate, setJudgmentDate] = useState('');
  const [currentResult, setCurrentResult] = useState<CalculatedDeadline | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgmentDate) {
      toast.error('يرجى إدخال تاريخ الحكم أو الإعلان');
      return;
    }

    const title = caseTitle ? `موعد ${type} - ${caseTitle}` : `موعد ${type}`;
    const result = calculateAndAdd(type, judgmentDate, caseId, title);
    setCurrentResult(result);
    toast.success('تم الحساب بنجاح');
  };

  const handleSaveToAgenda = (calc: CalculatedDeadline) => {
    saveToAgenda(calc);
    // Optionally remove from screen after saving, or keep it.
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button size="sm" variant="outline" className="gap-2 border-slate-200 dark:border-white/10" onClick={() => setIsOpen(true)}>
        <Calculator size={16} />
        حاسبة المواعيد القانونية
      </Button>
      
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-bold flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <Calculator size={20} />
            حاسبة المواعيد القانونية (القانون المصري)
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <form onSubmit={handleCalculate} className="space-y-4 bg-slate-50 dark:bg-navy-800 p-4 rounded-xl border border-slate-100 dark:border-navy-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <span>نوع الإجراء القانوني</span>
                </label>
                <select 
                  title="نوع الإجراء القانوني"
                  aria-label="نوع الإجراء القانوني"
                  className="w-full h-10 rounded-md border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  value={type}
                  onChange={(e) => setType(e.target.value as CaseDeadlineType)}
                >
                  {DEADLINE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <CalendarIcon size={14} className="text-slate-500" />
                  <span>تاريخ الحكم / الإعلان</span>
                </label>
                <Input 
                  type="date" 
                  required 
                  value={judgmentDate}
                  onChange={(e) => setJudgmentDate(e.target.value)}
                  className="bg-white dark:bg-navy-900 border-slate-300 dark:border-navy-600"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white gap-2">
              <Calculator size={18} />
              احسب تاريخ السقوط
            </Button>
          </form>

          {currentResult && (
            <div className="bg-primary-50 dark:bg-primary-900/20 p-5 rounded-xl border border-primary-100 dark:border-primary-800/30 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-lg mb-4 text-primary-800 dark:text-primary-300 flex items-center gap-2">
                نتيجة الحساب: {currentResult.type}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white dark:bg-navy-800 p-3 rounded-lg border border-slate-200 dark:border-navy-700">
                  <p className="text-xs text-slate-500 mb-1">تاريخ السقوط (آخر موعد)</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400" dir="ltr">
                    {currentResult.deadlineDateStr}
                  </p>
                </div>
                <div className="bg-white dark:bg-navy-800 p-3 rounded-lg border border-slate-200 dark:border-navy-700">
                  <p className="text-xs text-slate-500 mb-1">الأيام المتبقية</p>
                  <p className={`text-xl font-bold ${currentResult.daysRemaining <= 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {currentResult.daysRemaining} يوم
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Info size={16} className="text-primary-500 mt-0.5 shrink-0" />
                  <p><span className="font-semibold">السند القانوني:</span> {currentResult.legalBasis}</p>
                </div>
                
                {currentResult.notes && (
                  <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800/30">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p>{currentResult.notes}</p>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => handleSaveToAgenda(currentResult)} 
                className="w-full gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-navy-900 text-white"
              >
                <Save size={18} />
                حفظ في الأجندة
              </Button>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-4 border-t border-slate-200 dark:border-navy-700 pt-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center justify-between">
                <span>سجل الحسابات السابقة</span>
                <span className="text-xs bg-slate-100 dark:bg-navy-800 px-2 py-1 rounded text-slate-500">{history.length}</span>
              </h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {history.map((calc) => (
                  <div key={calc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-100 dark:border-navy-700/50 text-sm hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{calc.type}</p>
                      <div className="flex gap-4 text-xs text-slate-500 mt-1">
                        <span>سقوط: <span dir="ltr">{calc.deadlineDateStr}</span></span>
                        <span className={calc.daysRemaining <= 5 ? 'text-red-500' : ''}>باقي: {calc.daysRemaining}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                        title="حفظ في الأجندة"
                        onClick={() => handleSaveToAgenda(calc)}
                      >
                        <Save size={14} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="حذف"
                        onClick={() => removeFromHistory(calc.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
