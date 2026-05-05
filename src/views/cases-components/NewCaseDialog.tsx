import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCasesStore } from '@/store/useCasesStore';
import { useClientsStore } from '@/store/useClientsStore';
import { caseSchema } from '@/lib/schemas';
import { getNextCounter, saveCases } from '@/services/legalDataService';
import { ZodError } from 'zod';

interface NewCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseToEdit?: any;
}

export default function NewCaseDialog({ open, onOpenChange, caseToEdit }: NewCaseDialogProps) {
  const addCase = useCasesStore((state) => state.addCase);
  const updateCase = useCasesStore((state) => state.updateCase);
  const clients = useClientsStore((state) => state.clients);
  const [newCaseData, setNewCaseData] = useState({
    id: "",
    clientId: "",
    court: "المحكمة التجارية" as any,
    circuit: "",
    title: "",
    automatedNumber: "",
    clientRole: "مدعي" as any,
    type: "تجاري" as any,
    plaintiff: "",
    defendant: "",
    powerOfAttorneyRef: "",
    status: "متداولة" as any,
    currentTier: "ابتدائي" as any,
    firstInstanceNumber: "",
    appealNumber: "",
    cassationNumber: "",
    criminalTier: "جنحة" as any,
    criminalStage: "مرحلة المحاكمة" as any,
    prosecutionRef: "",
    familyCaseType: "نفقة زوجية" as any,
    stateCouncilYearQ: "",
    commercialRegRef: "",
    taxIdRef: "",
  });

  useEffect(() => {
    if (open) {
      if (caseToEdit) {
        setNewCaseData({
          id: caseToEdit.id || "",
          clientId: caseToEdit.clientId || "",
          court: caseToEdit.court || "المحكمة التجارية",
          circuit: caseToEdit.circuit || "",
          title: caseToEdit.title || "",
          automatedNumber: caseToEdit.automatedNumber || "",
          clientRole: caseToEdit.clientRole || "مدعي",
          type: caseToEdit.type || "تجاري",
          plaintiff: caseToEdit.plaintiff || "",
          defendant: caseToEdit.defendant || "",
          powerOfAttorneyRef: caseToEdit.powerOfAttorneyRef || "",
          status: caseToEdit.status || "متداولة",
          currentTier: caseToEdit.currentTier || "ابتدائي",
          firstInstanceNumber: caseToEdit.firstInstanceNumber || "",
          appealNumber: caseToEdit.appealNumber || "",
          cassationNumber: caseToEdit.cassationNumber || "",
          criminalTier: caseToEdit.criminalTier || "جنحة",
          criminalStage: caseToEdit.criminalStage || "مرحلة المحاكمة",
          prosecutionRef: caseToEdit.prosecutionRef || "",
          familyCaseType: caseToEdit.familyCaseType || "نفقة زوجية",
          stateCouncilYearQ: caseToEdit.stateCouncilYearQ || "",
          commercialRegRef: caseToEdit.commercialRegRef || "",
          taxIdRef: caseToEdit.taxIdRef || "",
        });
      } else {
        setNewCaseData({
          id: "",
          clientId: "",
          court: "المحكمة التجارية",
          circuit: "",
          title: "",
          automatedNumber: "",
          clientRole: "مدعي",
          type: "تجاري",
          plaintiff: "",
          defendant: "",
          powerOfAttorneyRef: "",
          status: "متداولة",
          currentTier: "ابتدائي",
          firstInstanceNumber: "",
          appealNumber: "",
          cassationNumber: "",
          criminalTier: "جنحة",
          criminalStage: "مرحلة المحاكمة",
          prosecutionRef: "",
          familyCaseType: "نفقة زوجية",
          stateCouncilYearQ: "",
          commercialRegRef: "",
          taxIdRef: "",
        });
      }
    }
  }, [open, caseToEdit]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      caseSchema.parse(newCaseData);
      
      let finalCaseData = { ...newCaseData } as any;

      if (caseToEdit) {
        if (finalCaseData.status === "محفوظة" && !caseToEdit.archiveCode) {
           finalCaseData.archiveCode = await getNextCounter('archive');
        }
        updateCase(caseToEdit.id, finalCaseData);
        // Sync to backend if needed
        await saveCases([finalCaseData]);
        toast.success("تم تحديث القضية بنجاح");
      } else {
        const generatedCirculationCode = await getNextCounter('circulation');
        const newCaseObj = {
          ...finalCaseData,
          circulationCode: generatedCirculationCode,
          memorandums: [],
          eLitigationStatus: "غير مربوط",
          createdAt: new Date().toISOString(),
        };
        addCase(newCaseObj);
        await saveCases([newCaseObj]);
        
        // Auto conflict check
        const casesList = useCasesStore.getState().cases;
        const hasConflict = casesList.some(c => 
          (c.plaintiff === newCaseObj.defendant && c.defendant === newCaseObj.plaintiff) ||
          (c.plaintiff === newCaseObj.plaintiff && c.defendant === newCaseObj.defendant)
        );
        if (hasConflict) {
          toast.warning("تنبيه تعارض: تم رصد تعارض محتمل مع أطراف قضايا سابقة", { duration: 5000 });
        } else {
          toast.info("فحص التعارض: النظام لم يرصد أي تعارض", { duration: 3000 });
        }
        
        toast.success("تم إضافة القضية بنجاح");
      }

      onOpenChange(false);
      setNewCaseData({
        id: "",
        clientId: "",
        court: "المحكمة التجارية",
        circuit: "",
        title: "",
        automatedNumber: "",
        clientRole: "مدعي",
        type: "تجاري",
        plaintiff: "",
        defendant: "",
        powerOfAttorneyRef: "",
        status: "متداولة",
        currentTier: "ابتدائي",
        firstInstanceNumber: "",
        appealNumber: "",
        cassationNumber: "",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0]?.message || "خطأ في المدخلات");
      } else {
        toast.error("حدث خطأ غير متوقع");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-none shadow-2xl dark:bg-navy-900 bg-white">
        <DialogHeader>
          <DialogTitle className="text-navy-900 dark:text-white font-bold">
            {caseToEdit ? "تعديل بيانات القضية" : "إضافة قضية جديدة"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateCase} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>الموكل (إجباري)</Label>
            <select 
              title="الموكل"
              className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-navy-900 dark:text-white"
              value={newCaseData.clientId}
              onChange={e => setNewCaseData(p => ({ ...p, clientId: e.target.value }))}
            >
              <option value="" className="dark:bg-navy-900">— اختر موكلاً —</option>
              {clients.map(client => (
                <option key={client.id} value={client.id} className="dark:bg-navy-900">
                  {client.name} ({client.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم القضية / المرجع</Label>
              <Input 
                placeholder="مثلاً: 45-123-ت" 
                value={newCaseData.id}
                onChange={e => setNewCaseData(p => ({ ...p, id: e.target.value.replace(/\//g, '-') }))}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم التوكيل (بالشهر العقاري)</Label>
              <Input 
                placeholder="رقم / حرف / سنة" 
                value={newCaseData.powerOfAttorneyRef}
                onChange={e => setNewCaseData(p => ({ ...p, powerOfAttorneyRef: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>رقم الحصر (ابتدائي)</Label>
              <Input 
                placeholder="سنة/رقم" 
                value={newCaseData.firstInstanceNumber}
                onChange={e => setNewCaseData(p => ({ ...p, firstInstanceNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الاستئناف</Label>
              <Input 
                placeholder="سنة/رقم" 
                value={newCaseData.appealNumber}
                onChange={e => setNewCaseData(p => ({ ...p, appealNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم النقض</Label>
              <Input 
                placeholder="سنة/رقم" 
                value={newCaseData.cassationNumber}
                onChange={e => setNewCaseData(p => ({ ...p, cassationNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الدائرة</Label>
              <Input 
                placeholder="رقم أو اسم الدائرة" 
                value={newCaseData.circuit}
                onChange={e => setNewCaseData(p => ({ ...p, circuit: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>مسمى القضية</Label>
              <Input 
                placeholder="مثل: مطالبة مالية" 
                value={newCaseData.title}
                onChange={e => setNewCaseData(p => ({ ...p, title: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الرقم الآلي</Label>
              <Input 
                placeholder="الرقم الآلي للقضية" 
                value={newCaseData.automatedNumber}
                onChange={e => setNewCaseData(p => ({ ...p, automatedNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>صفة الموكل</Label>
              <select 
                title="صفة الموكل"
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                value={newCaseData.clientRole}
                onChange={e => setNewCaseData(p => ({ ...p, clientRole: e.target.value as any }))}
              >
                <option value="مدعي">مدعي</option>
                <option value="مدعى عليه">مدعى عليه</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المحكمة</Label>
              <select 
                title="المحكمة"
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                value={newCaseData.court}
                onChange={e => setNewCaseData(p => ({ ...p, court: e.target.value as any }))}
              >
                <option value="الجزئية">الجزئية</option>
                <option value="الابتدائية">الابتدائية</option>
                <option value="الاستئناف">الاستئناف</option>
                <option value="النقض">النقض</option>
                <option value="مجلس الدولة">مجلس الدولة</option>
                <option value="المحكمة الاقتصادية">المحكمة الاقتصادية</option>
                <option value="محكمة الأسرة">محكمة الأسرة</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>نوع القضية</Label>
              <select 
                title="نوع القضية"
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                value={newCaseData.type}
                onChange={e => setNewCaseData(p => ({ ...p, type: e.target.value as any }))}
              >
                <option value="مدني">مدني</option>
                <option value="تجاري">تجاري</option>
                <option value="عمالي">عمالي</option>
                <option value="جنائي">جنائي</option>
                <option value="أحوال شخصية">أحوال شخصية</option>
                <option value="إداري">إداري</option>
                <option value="اقتصادي">اقتصادي</option>
              </select>
            </div>
          </div>

          {/* Dynamic Fields based on Case Type */}
          {newCaseData.type === 'جنائي' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-md space-y-3 border border-red-100 dark:border-red-900/30">
              <Label className="text-red-800 dark:text-red-400 font-bold">بيانات القضية الجنائية</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">درجة الجريمة</Label>
                  <select 
                    className="w-full h-9 rounded-md border border-red-200 dark:border-red-900/50 bg-white dark:bg-black px-2 py-1 text-xs"
                    value={newCaseData.criminalTier}
                    onChange={e => setNewCaseData(p => ({ ...p, criminalTier: e.target.value as any }))}
                  >
                    <option value="جناية">جناية</option>
                    <option value="جنحة">جنحة</option>
                    <option value="مخالفة">مخالفة</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">المرحلة الحالية</Label>
                  <select 
                    className="w-full h-9 rounded-md border border-red-200 dark:border-red-900/50 bg-white dark:bg-black px-2 py-1 text-xs"
                    value={newCaseData.criminalStage}
                    onChange={e => setNewCaseData(p => ({ ...p, criminalStage: e.target.value as any }))}
                  >
                    <option value="مرحلة التحقيق">مرحلة التحقيق</option>
                    <option value="مرحلة المحاكمة">مرحلة المحاكمة</option>
                    <option value="الطعن بالاستئناف">الطعن بالاستئناف</option>
                    <option value="الطعن بالنقض">الطعن بالنقض</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">مرجع النيابة العامة</Label>
                <Input 
                  placeholder="مثلاً: رقم المحضر / سنة / نيابة..." 
                  className="h-9 text-xs"
                  value={newCaseData.prosecutionRef}
                  onChange={e => setNewCaseData(p => ({ ...p, prosecutionRef: e.target.value }))}
                />
              </div>
            </div>
          )}
          {newCaseData.type === 'أحوال شخصية' && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-md space-y-2 border border-purple-100 dark:border-purple-900/30">
              <Label className="text-purple-800 dark:text-purple-400 font-bold">نوع نزاع الأسرة</Label>
              <select 
                className="w-full h-10 rounded-md border border-purple-200 dark:border-purple-900/50 bg-white dark:bg-black px-3 py-2 text-sm"
                value={newCaseData.familyCaseType}
                onChange={e => setNewCaseData(p => ({ ...p, familyCaseType: e.target.value as any }))}
              >
                <option value="خلع">خلع</option>
                <option value="طلاق رجعي">طلاق رجعي</option>
                <option value="طلاق بائن">طلاق بائن</option>
                <option value="طلاق ثلاث">طلاق ثلاث</option>
                <option value="نفقة زوجية">نفقة زوجية</option>
                <option value="نفقة أولاد">نفقة أولاد</option>
                <option value="حضانة">حضانة</option>
                <option value="رؤية">رؤية</option>
                <option value="ولاية على النفس">ولاية على النفس</option>
                <option value="ولاية على المال">ولاية على المال</option>
                <option value="زواج عرفي - إثبات">زواج عرفي - إثبات</option>
                <option value="زواج عرفي - إنكار">زواج عرفي - إنكار</option>
                <option value="ميراث وتركات">ميراث وتركات</option>
                <option value="إثبات نسب">إثبات نسب</option>
              </select>
            </div>
          )}
          {newCaseData.type === 'إداري' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-md space-y-2 border border-blue-100 dark:border-blue-900/30">
              <Label className="text-blue-800 dark:text-blue-400 font-bold">رقم وسنة (ق) بمجلس الدولة</Label>
              <Input 
                placeholder="مثال: 75 لسنة 77 ق" 
                value={newCaseData.stateCouncilYearQ}
                onChange={e => setNewCaseData(p => ({ ...p, stateCouncilYearQ: e.target.value }))}
              />
            </div>
          )}
          {newCaseData.type === 'اقتصادي' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-md space-y-2 border border-amber-100 dark:border-amber-900/30">
              <Label className="text-amber-800 dark:text-amber-400 font-bold">بيانات الشركات</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">السجل التجاري</Label>
                  <Input 
                    placeholder="رقم السجل التجاري" 
                    className="h-9 text-xs"
                    value={newCaseData.commercialRegRef}
                    onChange={e => setNewCaseData(p => ({ ...p, commercialRegRef: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">الرقم الضريبي</Label>
                  <Input 
                    placeholder="الرقم الضريبي" 
                    className="h-9 text-xs"
                    value={newCaseData.taxIdRef}
                    onChange={e => setNewCaseData(p => ({ ...p, taxIdRef: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المدعي</Label>
              <Input 
                placeholder="اسم المدعي" 
                value={newCaseData.plaintiff}
                onChange={e => setNewCaseData(p => ({ ...p, plaintiff: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>المدعى عليه</Label>
              <Input 
                placeholder="اسم المدعى عليه" 
                value={newCaseData.defendant}
                onChange={e => setNewCaseData(p => ({ ...p, defendant: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الحالة الأولية</Label>
            <select 
              title="الحالة الأولية"
              className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
              value={newCaseData.status}
              onChange={e => setNewCaseData(p => ({ ...p, status: e.target.value as any }))}
            >
              <option value="متداولة">متداولة</option>
              <option value="تحت الدراسة">تحت الدراسة</option>
              {caseToEdit && <option value="محفوظة">محفوظة</option>}
              {caseToEdit && <option value="مغلقة">مغلقة</option>}
            </select>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white">
              {caseToEdit ? "حفظ التعديلات" : "حفظ القضية"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
