import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { useEnforcementStore } from "@/store/useEnforcementStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { EnforcementCase } from "@/types/enforcement";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enforcementCase: EnforcementCase | null;
}

const STAGE_NAMES: Record<number, string> = {
  1: "استلام الصيغة التنفيذية",
  2: "إعلان السند التنفيذي",
  3: "توكيل المحضر للتنفيذ",
  4: "الإشكال في التنفيذ",
  5: "انتهاء التنفيذ",
};

const STATUS_MAP: Record<number, EnforcementCase['status']> = {
  1: "استلام الصيغة",
  2: "إعلان السند",
  3: "توكيل المحضر",
  4: "إشكال في التنفيذ",
  5: "منفذ",
};

export default function UpdateStageDialog({ open, onOpenChange, enforcementCase }: Props) {
  const updateStage = useEnforcementStore((s) => s.updateEnforcementStage);
  const addAction = useEnforcementStore((s) => s.addEnforcementAction);
  const currentUser = useAuthStore((s) => s.currentUser);

  const currentStep = enforcementCase?.currentStep || 1;
  const [targetStep, setTargetStep] = useState(currentStep);

  // Step 2 fields
  const [bailiffName, setBailiffName] = useState("");
  const [announcementDate, setAnnouncementDate] = useState("");
  const [bailiffRecordNumber, setBailiffRecordNumber] = useState("");

  // Step 3 fields
  const [poaDate, setPoaDate] = useState("");

  // Step 4 fields
  const [hasObjection, setHasObjection] = useState(false);
  const [objectionType, setObjectionType] = useState("");
  const [objectionSessionDate, setObjectionSessionDate] = useState("");
  const [objectingParty, setObjectingParty] = useState("");

  // Step 5 fields
  const [executionResult, setExecutionResult] = useState("");
  const [amountCollected, setAmountCollected] = useState("");

  useEffect(() => {
    if (open && enforcementCase) {
      const next = Math.min(enforcementCase.currentStep + 1, 5);
      setTargetStep(next);
      setBailiffName(enforcementCase.bailiffName || "");
      setAnnouncementDate(enforcementCase.announcementDate || "");
      setBailiffRecordNumber(enforcementCase.bailiffRecordNumber || "");
      setPoaDate(enforcementCase.poaDate || "");
      setHasObjection(enforcementCase.hasObjection || false);
      setObjectionType(enforcementCase.objectionType || "");
      setObjectionSessionDate(enforcementCase.objectionSessionDate || "");
      setObjectingParty(enforcementCase.objectingParty || "");
      setExecutionResult(enforcementCase.executionResult || "");
      setAmountCollected(String(enforcementCase.amountCollected || ""));
    }
  }, [open, enforcementCase]);

  if (!enforcementCase) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Partial<EnforcementCase> = {
      currentStep: targetStep,
      status: STATUS_MAP[targetStep] || "مفتوح",
    };

    if (targetStep >= 2) {
      if (!bailiffName || !announcementDate) {
        toast.error("يرجى إدخال اسم المحضر وتاريخ الإعلان");
        return;
      }
      updates.bailiffName = bailiffName;
      updates.announcementDate = announcementDate;
      updates.bailiffRecordNumber = bailiffRecordNumber;
    }

    if (targetStep >= 3) {
      if (!poaDate) {
        toast.error("يرجى إدخال تاريخ الإيداع");
        return;
      }
      updates.poaDate = poaDate;
    }

    if (targetStep === 4) {
      updates.hasObjection = hasObjection;
      if (hasObjection) {
        updates.objectionType = objectionType;
        updates.objectionSessionDate = objectionSessionDate;
        updates.objectingParty = objectingParty;
      }
    }

    if (targetStep === 5) {
      updates.executionResult = executionResult;
      updates.amountCollected = Number(amountCollected) || 0;
      if (executionResult === "تم التنفيذ بالكامل") {
        updates.status = "منفذ";
      }
    }

    // Calculate deadline (7 days from now)
    updates.stageDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    updateStage(enforcementCase.id, updates);

    // Add timeline action
    addAction(enforcementCase.id, {
      id: `ACT-${Date.now()}`,
      enforcementCaseId: enforcementCase.id,
      title: `تحديث المرحلة: ${STAGE_NAMES[targetStep]}`,
      date: new Date().toISOString(),
      performedBy: currentUser?.name || "المستخدم",
      type: "إجراء قانوني",
    });

    toast.success(`تم تحديث المرحلة إلى: ${STAGE_NAMES[targetStep]}`, {
      description: `ملف ${enforcementCase.fileNumber}`,
    });
    onOpenChange(false);
  };

  const inputClass = "dark:bg-white/5 dark:border-white/10";
  const selectClass = "w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm dark:bg-navy-800";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] border-none shadow-2xl dark:bg-navy-900 bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-navy-900 dark:text-white font-bold flex items-center gap-3">
            <ArrowUp size={18} className="text-primary-600" />
            تحديث مرحلة التنفيذ
            <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-xs font-mono">
              {enforcementCase.fileNumber}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Stage selector */}
          <div className="space-y-2">
            <Label>المرحلة المستهدفة</Label>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setTargetStep(step)}
                  disabled={step < currentStep}
                  className={`p-2 rounded-lg text-center text-xs font-bold transition-all ${
                    step === targetStep
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                      : step < currentStep
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-not-allowed"
                      : step <= currentStep
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                      : "bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {step < currentStep && <CheckCircle2 size={12} className="mx-auto mb-0.5" />}
                  {step}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
              {STAGE_NAMES[targetStep]}
            </p>
          </div>

          {/* Step 2: إعلان السند */}
          {targetStep >= 2 && (
            <div className="space-y-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
              <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400">📋 بيانات الإعلان</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">اسم المحضر *</Label>
                  <Input placeholder="أحمد محمود" value={bailiffName} onChange={e => setBailiffName(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">تاريخ الإعلان *</Label>
                  <Input type="date" value={announcementDate} onChange={e => setAnnouncementDate(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">رقم المحضر</Label>
                <Input placeholder="محضر 44 لسنة 2026" value={bailiffRecordNumber} onChange={e => setBailiffRecordNumber(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}

          {/* Step 3: توكيل المحضر */}
          {targetStep >= 3 && (
            <div className="space-y-3 p-3 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10">
              <h4 className="text-sm font-bold text-violet-700 dark:text-violet-400">📑 بيانات التوكيل</h4>
              <div className="space-y-1">
                <Label className="text-xs">تاريخ إيداع التوكيل *</Label>
                <Input type="date" value={poaDate} onChange={e => setPoaDate(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}

          {/* Step 4: الإشكال */}
          {targetStep === 4 && (
            <div className="space-y-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle size={14} />
                الإشكال في التنفيذ
              </h4>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="hasObjection" checked={hasObjection} onChange={e => setHasObjection(e.target.checked)} className="rounded" />
                <Label htmlFor="hasObjection" className="text-xs cursor-pointer">يوجد إشكال مقدم</Label>
              </div>
              {hasObjection && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">نوع الإشكال</Label>
                    <select className={selectClass} value={objectionType} onChange={e => setObjectionType(e.target.value)}>
                      <option value="">— اختر —</option>
                      <option value="إشكال وقتي">إشكال وقتي</option>
                      <option value="إشكال موضوعي">إشكال موضوعي</option>
                      <option value="إشكال من الغير">إشكال من الغير</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الطرف المُشكِل</Label>
                    <select className={selectClass} value={objectingParty} onChange={e => setObjectingParty(e.target.value)}>
                      <option value="">— اختر —</option>
                      <option value="المنفذ ضده">المنفذ ضده</option>
                      <option value="طرف ثالث">طرف ثالث</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">جلسة الإشكال</Label>
                    <Input type="date" value={objectionSessionDate} onChange={e => setObjectionSessionDate(e.target.value)} className={inputClass} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: انتهاء التنفيذ */}
          {targetStep === 5 && (
            <div className="space-y-3 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">✅ نتيجة التنفيذ</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">نتيجة التنفيذ</Label>
                  <select className={selectClass} value={executionResult} onChange={e => setExecutionResult(e.target.value)}>
                    <option value="">— اختر —</option>
                    <option value="تم التنفيذ بالكامل">تم التنفيذ بالكامل</option>
                    <option value="تنفيذ جزئي">تنفيذ جزئي</option>
                    <option value="تعذر التنفيذ">تعذر التنفيذ</option>
                    <option value="صلح">صلح</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">المبلغ المحصل (ج.م)</Label>
                  <Input type="number" placeholder="0" value={amountCollected} onChange={e => setAmountCollected(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white mt-3 gap-2 shadow-lg shadow-primary-500/20">
            <ArrowUp size={16} />
            تحديث المرحلة إلى: {STAGE_NAMES[targetStep]}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
