import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Briefcase, FileText, Search, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEnforcementStore } from "@/store/useEnforcementStore";
import { useCasesStore } from "@/store/useCasesStore";
import { useClientsStore } from "@/store/useClientsStore";
import type { Case } from "@/types";
import type { ExecutionDocType } from "@/types/enforcement";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected case for auto-linking from Cases page */
  preSelectedCase?: Case | null;
}

type Step = 'choose-source' | 'office-case' | 'external-judgment';

const EXECUTION_TYPES: ExecutionDocType[] = ['حكم قضائي', 'شيك', 'كمبيالة', 'عقد موثق', 'محضر صلح', 'أخرى'];

export default function NewEnforcementDialog({ open, onOpenChange, preSelectedCase }: Props) {
  const cases = useCasesStore((s) => s.cases);
  const clients = useClientsStore((s) => s.clients);
  const createFromCase = useEnforcementStore((s) => s.createEnforcementFromCase);
  const createManual = useEnforcementStore((s) => s.createEnforcementManual);
  const getNextFileNumber = useEnforcementStore((s) => s.getNextFileNumber);

  const [step, setStep] = useState<Step>('choose-source');
  const [nextFileNum, setNextFileNum] = useState('');

  // Office case flow
  const [caseSearch, setCaseSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [officeCaseData, setOfficeCaseData] = useState({
    amountClaimed: '',
    executionType: 'حكم قضائي' as ExecutionDocType,
    judgmentNumber: '',
    judgmentDate: '',
  });

  // External judgment flow
  const [extData, setExtData] = useState({
    clientId: '',
    clientName: '',
    debtorName: '',
    amountClaimed: '',
    executionType: 'حكم قضائي' as ExecutionDocType,
    judgmentNumber: '',
    judgmentDate: '',
    judgmentCourt: '',
  });

  useEffect(() => {
    if (open) {
      setNextFileNum(getNextFileNumber());
      if (preSelectedCase) {
        setStep('office-case');
        setSelectedCase(preSelectedCase);
        const client = clients.find(c => c.id === preSelectedCase.clientId);
        setOfficeCaseData(prev => ({ ...prev, amountClaimed: '' }));
        setCaseSearch(client?.name || '');
      } else {
        setStep('choose-source');
        setSelectedCase(null);
        setCaseSearch('');
      }
      setOfficeCaseData({ amountClaimed: '', executionType: 'حكم قضائي', judgmentNumber: '', judgmentDate: '' });
      setExtData({ clientId: '', clientName: '', debtorName: '', amountClaimed: '', executionType: 'حكم قضائي', judgmentNumber: '', judgmentDate: '', judgmentCourt: '' });
    }
  }, [open, preSelectedCase, getNextFileNumber, clients]);

  const filteredCases = cases.filter(c => {
    const q = caseSearch.trim().toLowerCase();
    if (!q) return true;
    return c.id.toLowerCase().includes(q) || c.plaintiff.toLowerCase().includes(q) || c.defendant.toLowerCase().includes(q) || c.court.toLowerCase().includes(q);
  }).slice(0, 8);

  const handleSubmitOfficeCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) { toast.error("يرجى اختيار قضية"); return; }
    if (!officeCaseData.amountClaimed) { toast.error("يرجى إدخال مبلغ المطالبة"); return; }
    const client = clients.find(c => c.id === selectedCase.clientId);
    createFromCase(
      selectedCase,
      client?.name || selectedCase.plaintiff,
      Number(officeCaseData.amountClaimed),
      officeCaseData.executionType,
      officeCaseData.judgmentNumber,
      officeCaseData.judgmentDate,
    );
    toast.success(`تم فتح ملف التنفيذ ${nextFileNum} بنجاح`);
    onOpenChange(false);
  };

  const handleSubmitExternal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extData.clientName || !extData.debtorName || !extData.amountClaimed) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    createManual({
      clientId: extData.clientId || `EXT-${Date.now()}`,
      clientName: extData.clientName,
      debtorName: extData.debtorName,
      amountClaimed: Number(extData.amountClaimed),
      executionType: extData.executionType,
      judgmentNumber: extData.judgmentNumber,
      judgmentDate: extData.judgmentDate,
      judgmentCourt: extData.judgmentCourt,
    });
    toast.success(`تم فتح ملف التنفيذ ${nextFileNum} بنجاح`);
    onOpenChange(false);
  };

  const selectStyles = "w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-navy-900 dark:text-white dark:bg-navy-800";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-none shadow-2xl dark:bg-navy-900 bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-navy-900 dark:text-white font-bold flex items-center gap-3">
            فتح ملف تنفيذ جديد
            <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-xs font-mono">
              {nextFileNum}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Choose Source */}
        {step === 'choose-source' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">اختر مصدر ملف التنفيذ:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStep('office-case')}
                className="group p-5 rounded-xl border-2 border-slate-200 dark:border-white/10 hover:border-primary-500 dark:hover:border-primary-400 transition-all duration-200 text-start hover:shadow-lg hover:shadow-primary-500/10"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-3 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                  <Briefcase className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
                <h3 className="font-bold text-navy-900 dark:text-white mb-1">من قضية مكتب</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  ربط تلقائي بقضية موجودة في المكتب صدر فيها حكم لصالح الموكل
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStep('external-judgment')}
                className="group p-5 rounded-xl border-2 border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400 transition-all duration-200 text-start hover:shadow-lg hover:shadow-amber-500/10"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-3 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                  <FileText className="text-amber-600 dark:text-amber-400" size={24} />
                </div>
                <h3 className="font-bold text-navy-900 dark:text-white mb-1">حكم خارجي</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  موكل جديد بحكم من مكتب آخر أو سند تنفيذي مستقل
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2A: Office Case */}
        {step === 'office-case' && (
          <form onSubmit={handleSubmitOfficeCase} className="space-y-4 py-2">
            <button type="button" onClick={() => { setStep('choose-source'); setSelectedCase(null); }} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline mb-1">
              <ArrowRight size={14} />
              رجوع لاختيار المصدر
            </button>

            {/* Case search */}
            <div className="space-y-2">
              <Label>البحث عن القضية</Label>
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="ابحث برقم القضية أو اسم الأطراف..."
                  className="ps-9 dark:bg-white/5 dark:border-white/10"
                  value={caseSearch}
                  onChange={(e) => { setCaseSearch(e.target.value); setSelectedCase(null); }}
                />
              </div>
              {!selectedCase && (
                <div className="max-h-[180px] overflow-auto space-y-1 border border-slate-100 dark:border-white/10 rounded-lg p-2">
                  {filteredCases.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">لا توجد قضايا مطابقة</p>
                  ) : filteredCases.map(c => {
                    const client = clients.find(cl => cl.id === c.clientId);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedCase(c); setCaseSearch(c.id); }}
                        className="w-full text-start p-2.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-primary-700 dark:text-primary-400">{c.id}</span>
                          <Badge className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">{c.court}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {c.plaintiff} <span className="text-slate-400">ضد</span> {c.defendant}
                          {client && <span className="text-slate-400"> • الموكل: {client.name}</span>}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedCase && (
                <div className="p-3 rounded-lg bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={16} className="text-primary-600 dark:text-primary-400" />
                    <span className="font-bold text-sm text-primary-700 dark:text-primary-300">{selectedCase.id}</span>
                    <Badge className="text-[10px] bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300">{selectedCase.court}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{selectedCase.plaintiff} ضد {selectedCase.defendant}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>مبلغ المطالبة (جنيه) *</Label>
                <Input type="number" placeholder="150000" value={officeCaseData.amountClaimed} onChange={e => setOfficeCaseData(p => ({ ...p, amountClaimed: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>نوع السند التنفيذي</Label>
                <select title="نوع السند" className={selectStyles} value={officeCaseData.executionType} onChange={e => setOfficeCaseData(p => ({ ...p, executionType: e.target.value as ExecutionDocType }))}>
                  {EXECUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>رقم الحكم</Label>
                <Input placeholder="44/2026" value={officeCaseData.judgmentNumber} onChange={e => setOfficeCaseData(p => ({ ...p, judgmentNumber: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الحكم</Label>
                <Input type="date" value={officeCaseData.judgmentDate} onChange={e => setOfficeCaseData(p => ({ ...p, judgmentDate: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white mt-2 gap-2">
              <ArrowLeft size={16} />
              فتح ملف التنفيذ
            </Button>
          </form>
        )}

        {/* Step 2B: External Judgment */}
        {step === 'external-judgment' && (
          <form onSubmit={handleSubmitExternal} className="space-y-4 py-2">
            <button type="button" onClick={() => setStep('choose-source')} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline mb-1">
              <ArrowRight size={14} />
              رجوع لاختيار المصدر
            </button>

            <div className="space-y-2">
              <Label>الموكل (طالب التنفيذ) *</Label>
              <select title="الموكل" className={selectStyles} value={extData.clientId} onChange={e => {
                const cl = clients.find(c => c.id === e.target.value);
                setExtData(p => ({ ...p, clientId: e.target.value, clientName: cl?.name || '' }));
              }}>
                <option value="">— اختر موكلاً حالياً أو أدخل الاسم —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
              {!extData.clientId && (
                <Input placeholder="أو أدخل اسم الموكل الجديد" value={extData.clientName} onChange={e => setExtData(p => ({ ...p, clientName: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>المنفذ ضده *</Label>
                <Input placeholder="اسم المنفذ ضده" value={extData.debtorName} onChange={e => setExtData(p => ({ ...p, debtorName: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>مبلغ المطالبة (جنيه) *</Label>
                <Input type="number" placeholder="500000" value={extData.amountClaimed} onChange={e => setExtData(p => ({ ...p, amountClaimed: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>نوع السند التنفيذي</Label>
                <select title="نوع السند" className={selectStyles} value={extData.executionType} onChange={e => setExtData(p => ({ ...p, executionType: e.target.value as ExecutionDocType }))}>
                  {EXECUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>المحكمة المُصدِرة</Label>
                <select title="المحكمة" className={selectStyles} value={extData.judgmentCourt} onChange={e => setExtData(p => ({ ...p, judgmentCourt: e.target.value }))}>
                  <option value="">— اختر —</option>
                  <option value="المحكمة التجارية">المحكمة التجارية</option>
                  <option value="المحكمة العامة">المحكمة العامة</option>
                  <option value="المحكمة العمالية">المحكمة العمالية</option>
                  <option value="المحكمة الجزائية">المحكمة الجزائية</option>
                  <option value="ديوان المظالم">ديوان المظالم</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>رقم الحكم</Label>
                <Input placeholder="112/2025" value={extData.judgmentNumber} onChange={e => setExtData(p => ({ ...p, judgmentNumber: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الحكم</Label>
                <Input type="date" value={extData.judgmentDate} onChange={e => setExtData(p => ({ ...p, judgmentDate: e.target.value }))} className="dark:bg-white/5 dark:border-white/10" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-2 gap-2">
              <ArrowLeft size={16} />
              فتح ملف التنفيذ
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
