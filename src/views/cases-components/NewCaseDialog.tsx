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
import { CourtSelector } from '@/components/cases/CourtSelector';

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
    type: "" as any,
    court_category: "",
    court_sub_type: "",
    court_location: "",
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
          type: caseToEdit.type || caseToEdit.court_category || "",
          court_category: caseToEdit.court_category || caseToEdit.type || "",
          court_sub_type: caseToEdit.court_sub_type || "",
          court_location: caseToEdit.court_location || caseToEdit.court || "",
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
          type: "",
          court_category: "",
          court_sub_type: "",
          court_location: "",
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
      if (!newCaseData.court_category || !newCaseData.court_sub_type || !newCaseData.court_location) {
        toast.error("يرجى اختيار نوع القضية والتصنيف والمحكمة");
        return;
      }
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
        // === Duplicate Detection ===
        const existingCases = useCasesStore.getState().cases;
        
        // 1. Check for exact same case ID (number)
        const duplicateById = existingCases.find(c => c.id === finalCaseData.id);
        if (duplicateById) {
          toast.error(`قضية مكررة: يوجد بالفعل قضية بنفس الرقم (${finalCaseData.id})`, { duration: 5000 });
          return;
        }
        
        // 2. Check for same court + plaintiff + defendant combination
        const duplicateByParties = existingCases.find(c => 
          c.court === finalCaseData.court &&
          c.plaintiff === finalCaseData.plaintiff &&
          c.defendant === finalCaseData.defendant &&
          c.type === finalCaseData.type
        );
        if (duplicateByParties) {
          toast.error(
            `قضية مكررة: يوجد بالفعل قضية بنفس المحكمة والأطراف (رقم ${duplicateByParties.id}) — إذا كانت قضية مختلفة، غيّر رقم القضية أو نوعها`,
            { duration: 7000 }
          );
          return;
        }

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
        
        // Auto conflict check (reversed parties — warning only, not blocked)
        const hasConflict = existingCases.some(c => 
          c.plaintiff === newCaseObj.defendant && c.defendant === newCaseObj.plaintiff
        );
        if (hasConflict) {
          toast.warning("تنبيه تعارض: تم رصد تعارض محتمل — الموكل مدعى عليه في قضية أخرى من نفس الأطراف", { duration: 5000 });
        } else {
          toast.info("فحص التعارض: النظام لم يرصد أي تعارض", { duration: 3000 });
        }
        
        toast.success("تم إضافة القضية بنجاح");
      }

      onOpenChange(false);
      setNewCaseData({
        id: "",
        clientId: "",
        court: "",
        circuit: "",
        title: "",
        automatedNumber: "",
        clientRole: "مدعي",
        type: "",
        court_category: "",
        court_sub_type: "",
        court_location: "",
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الموكل الأساسي (إجباري)</Label>
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
            <div className="space-y-2">
              <Label>صفة الموكل</Label>
              <select 
                title="صفة الموكل"
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-navy-900 dark:text-white"
                value={newCaseData.clientRole}
                onChange={e => setNewCaseData(p => ({ ...p, clientRole: e.target.value as any }))}
              >
                <option value="مدعي" className="dark:bg-navy-900">مدعي</option>
                <option value="مدعى عليه" className="dark:bg-navy-900">مدعى عليه</option>
                <option value="مدعي ومدعى عليه فرعياً" className="dark:bg-navy-900">مدعي ومدعى عليه فرعياً (طلب عارض)</option>
                <option value="متدخل هجومي" className="dark:bg-navy-900">متدخل هجومي (خصم ثالث)</option>
                <option value="متدخل انضمامي" className="dark:bg-navy-900">متدخل انضمامي (مع أحد الأطراف)</option>
                <option value="مستأنف" className="dark:bg-navy-900">مستأنف</option>
                <option value="مستأنف ضده" className="dark:bg-navy-900">مستأنف ضده</option>
                <option value="طاعن" className="dark:bg-navy-900">طاعن (بالنقض)</option>
                <option value="مطعون ضده" className="dark:bg-navy-900">مطعون ضده</option>
              </select>
            </div>
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
              <div className="flex gap-2">
                <Input 
                  placeholder="رقم" 
                  className="w-1/3 text-center"
                  value={newCaseData.powerOfAttorneyRef?.includes(' / ') ? newCaseData.powerOfAttorneyRef.split(' / ')[0] : newCaseData.powerOfAttorneyRef || ''}
                  onChange={e => {
                    const parts = newCaseData.powerOfAttorneyRef?.includes(' / ') ? newCaseData.powerOfAttorneyRef.split(' / ') : [newCaseData.powerOfAttorneyRef || '', '', ''];
                    parts[0] = e.target.value;
                    setNewCaseData(p => ({ ...p, powerOfAttorneyRef: parts.every(x => !x) ? "" : parts.join(' / ') }));
                  }}
                />
                <select 
                  title="حرف التوكيل"
                  className="w-1/3 h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-2 py-2 text-sm text-center"
                  value={newCaseData.powerOfAttorneyRef?.includes(' / ') ? newCaseData.powerOfAttorneyRef.split(' / ')[1] : ''}
                  onChange={e => {
                    const parts = newCaseData.powerOfAttorneyRef?.includes(' / ') ? newCaseData.powerOfAttorneyRef.split(' / ') : [newCaseData.powerOfAttorneyRef || '', '', ''];
                    parts[1] = e.target.value;
                    setNewCaseData(p => ({ ...p, powerOfAttorneyRef: parts.every(x => !x) ? "" : parts.join(' / ') }));
                  }}
                >
                  <option value="">حرف</option>
                  {['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'].map(letter => (
                    <option key={letter} value={letter}>{letter}</option>
                  ))}
                </select>
                <Input 
                  placeholder="سنة" 
                  className="w-1/3 text-center"
                  value={newCaseData.powerOfAttorneyRef?.includes(' / ') ? newCaseData.powerOfAttorneyRef.split(' / ')[2] : ''}
                  onChange={e => {
                    const parts = newCaseData.powerOfAttorneyRef?.includes(' / ') ? newCaseData.powerOfAttorneyRef.split(' / ') : [newCaseData.powerOfAttorneyRef || '', '', ''];
                    parts[2] = e.target.value;
                    setNewCaseData(p => ({ ...p, powerOfAttorneyRef: parts.every(x => !x) ? "" : parts.join(' / ') }));
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>رقم اول درجة</Label>
              <Input 
                placeholder="سنة/رقم" 
                value={newCaseData.firstInstanceNumber}
                onChange={e => setNewCaseData(p => ({ ...p, firstInstanceNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم ثاني درجة</Label>
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
              <Label>موضوع القضية</Label>
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
              <Label>درجة التقاضي</Label>
              <select 
                title="درجة التقاضي"
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-navy-900 dark:text-white"
                value={newCaseData.currentTier}
                onChange={e => setNewCaseData(p => ({ ...p, currentTier: e.target.value as any }))}
              >
                <option value="جزئية" className="dark:bg-navy-900">جزئية (أول درجة)</option>
                <option value="ابتدائي" className="dark:bg-navy-900">ابتدائية (كلي)</option>
                <option value="استئناف" className="dark:bg-navy-900">استئناف</option>
                <option value="نقض" className="dark:bg-navy-900">نقض / إدارية عليا</option>
                <option value="دستورية عليا" className="dark:bg-navy-900">دستورية عليا</option>
              </select>
            </div>
          </div>

          <CourtSelector 
            value={{
              category: newCaseData.court_category || "",
              subType: newCaseData.court_sub_type || "",
              location: newCaseData.court_location || ""
            }}
            onChange={(val) => setNewCaseData(p => ({
              ...p,
              court_category: val.category,
              court_sub_type: val.subType,
              court_location: val.location,
              type: val.category as any,
              court: val.location as any
            }))}
          />

          {/* Dynamic Fields based on Case Type */}
          {newCaseData.type === 'جنائي' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-md space-y-3 border border-red-100 dark:border-red-900/30">
              <Label className="text-red-800 dark:text-red-400 font-bold">بيانات القضية الجنائية</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">درجة الجريمة</Label>
                  <select 
                    title="درجة الجريمة"
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
                    title="المرحلة الحالية"
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
          {(newCaseData.type === 'أحوال شخصية' || newCaseData.type === 'أسرة') && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-md space-y-2 border border-purple-100 dark:border-purple-900/30">
              <Label className="text-purple-800 dark:text-purple-400 font-bold">نوع نزاع الأسرة</Label>
              <select 
                title="نوع نزاع الأسرة"
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
            {['مدعي', 'مدعي ومدعى عليه فرعياً', 'مستأنف', 'طاعن', 'متدخل هجومي', 'متدخل انضمامي'].includes(newCaseData.clientRole) ? (
              <>
                <div className="space-y-2">
                  <Label>
                    {newCaseData.clientRole === 'مستأنف' ? 'باقي المستأنفين (معك)' : 
                     newCaseData.clientRole === 'طاعن' ? 'باقي الطاعنين (معك)' : 
                     'باقي المدعين (موكلين آخرين معك)'}
                  </Label>
                  <Input 
                    placeholder="أسماء الموكلين الإضافيين (إن وجد)" 
                    value={newCaseData.plaintiff}
                    onChange={e => setNewCaseData(p => ({ ...p, plaintiff: e.target.value }))}
                  />
                  <p className="text-[10px] text-slate-400">يمكنك كتابة أكثر من اسم مفصولين بفاصلة</p>
                </div>
                <div className="space-y-2">
                  <Label>
                    {newCaseData.clientRole === 'مستأنف' ? 'الخصوم (المستأنف ضدهم)' : 
                     newCaseData.clientRole === 'طاعن' ? 'الخصوم (المطعون ضدهم)' : 
                     'الخصوم (المدعى عليهم)'}
                  </Label>
                  <Input 
                    placeholder="أسماء الخصوم" 
                    value={newCaseData.defendant}
                    onChange={e => setNewCaseData(p => ({ ...p, defendant: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>
                    {newCaseData.clientRole === 'مستأنف ضده' ? 'الخصوم (المستأنفون)' : 
                     newCaseData.clientRole === 'مطعون ضده' ? 'الخصوم (الطاعنون)' : 
                     'الخصوم (المدعون)'}
                  </Label>
                  <Input 
                    placeholder="أسماء الخصوم" 
                    value={newCaseData.plaintiff}
                    onChange={e => setNewCaseData(p => ({ ...p, plaintiff: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {newCaseData.clientRole === 'مستأنف ضده' ? 'باقي المستأنف ضدهم (معك)' : 
                     newCaseData.clientRole === 'مطعون ضده' ? 'باقي المطعون ضدهم (معك)' : 
                     'باقي المدعى عليهم (موكلين آخرين معك)'}
                  </Label>
                  <Input 
                    placeholder="أسماء الموكلين الإضافيين (إن وجد)" 
                    value={newCaseData.defendant}
                    onChange={e => setNewCaseData(p => ({ ...p, defendant: e.target.value }))}
                  />
                  <p className="text-[10px] text-slate-400">يمكنك كتابة أكثر من اسم مفصولين بفاصلة</p>
                </div>
              </>
            )}
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
              {caseToEdit && <option value="حكم نهائي">حكم نهائي (نقل للتنفيذ)</option>}
              {caseToEdit && <option value="محكوم فيها">محكوم فيها</option>}
              {caseToEdit && <option value="مستأنفة">مستأنفة</option>}
              {caseToEdit && <option value="طعن">طعن بالنقض</option>}
              {caseToEdit && <option value="تنفيذ">تحت التنفيذ</option>}
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
