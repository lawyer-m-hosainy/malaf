import React from 'react';
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Info, Gavel, User, UserCheck, Hash, Clock, Briefcase, Scale, Building2, Users } from "lucide-react";
import { Case, Session, Expense, Task, Deadline } from "@/types";
import AddSessionDialog from "./AddSessionDialog";
import AddDeadlineDialog from "./AddDeadlineDialog";
import AddTaskDialog from "./AddTaskDialog";
import AddExpenseDialog from "./AddExpenseDialog";
import AddTierDialog from "./AddTierDialog";
import CaseTimeline from "./CaseTimeline";
import CaseSummaryCards from "./CaseSummaryCards";
import { useClientsStore } from "@/store/useClientsStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StartVideoButton from "@/components/cases/StartVideoButton";

interface CaseDetailsPanelProps {
  caseData: Case;
  sessions: Session[];
  expenses: Expense[];
  tasks: Task[];
  deadlines: Deadline[];
}

export default function CaseDetailsPanel({ caseData, sessions, expenses, tasks, deadlines }: CaseDetailsPanelProps) {
  const caseSessions = sessions.filter(s => s.caseId === caseData.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const caseExpenses = expenses.filter(e => e.caseId === caseData.id);
  const caseTasks = tasks.filter(t => t.caseId === caseData.id);
  const totalExpenses = caseExpenses.reduce((sum, e) => sum + e.amount, 0);

  const clients = useClientsStore(state => state.clients);
  const caseClient = clients.find(c => c.id === caseData.clientId);

  // ─── Dynamic Timeline Events ─────────────────────────────
  const timelineEvents = [
    { 
      date: format(new Date(caseData.createdAt), "yyyy-MM-dd"), 
      title: 'استلام القضية', 
      description: 'تم فتح ملف القضية وبدء الإجراءات الإدارية' 
    }
  ];

  if (caseData.circulationCode || caseData.automatedNumber) {
    timelineEvents.push({
      date: format(new Date(caseData.createdAt), "yyyy-MM-dd"),
      title: 'قيد الدعوى',
      description: `تم قيد الدعوى برقم آلي: ${caseData.automatedNumber || '-'}`
    });
  }

  // إضافة الجلسات السابقة
  caseSessions.filter(s => new Date(s.date) <= new Date()).forEach(session => {
    timelineEvents.push({
      date: session.date,
      title: `جلسة ${session.court || 'المحكمة'}`,
      description: session.notes || 'حضور الجلسة ومتابعة سير الدعوى'
    });
  });

  // إضافة المذكرات
  if (caseData.memorandums && caseData.memorandums.length > 0) {
    timelineEvents.push({
      date: format(new Date(), "yyyy-MM-dd"), // تقريبي
      title: 'تبادل المذكرات',
      description: `تم إيداع عدد ${caseData.memorandums.length} مذكرات قانونية`
    });
  }

  // ترتيب زمني
  timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Case Info Column */}
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Info size={16} className="text-primary-500" />
              تفاصيل القضية
              {caseData.currentTier && (
                <Badge variant="outline" className="text-[10px] bg-primary-50 text-primary-700 border-primary-100">
                  {caseData.currentTier}
                </Badge>
              )}
            </h4>
            <AddTierDialog caseData={caseData} />
          </div>
          <div className="space-y-3 bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
            {/* Primary Numbers Section */}
            <div className="pb-2 mb-2 border-b border-slate-50 dark:border-white/5 space-y-2">
              {caseData.firstInstanceNumber && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Hash size={12} /> ابتدائي
                  </span>
                  <span className="font-bold text-navy-900 dark:text-white">رقم {caseData.firstInstanceNumber} {caseData.firstInstanceYear && `لسنة ${caseData.firstInstanceYear}`}</span>
                </div>
              )}
              {caseData.appealNumber && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Hash size={12} /> استئناف
                  </span>
                  <span className="font-bold text-navy-900 dark:text-white">رقم {caseData.appealNumber} {caseData.appealYear && `لسنة ${caseData.appealYear}`}</span>
                </div>
              )}
              {caseData.cassationNumber && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Hash size={12} /> نقض
                  </span>
                  <span className="font-bold text-navy-900 dark:text-white">رقم {caseData.cassationNumber} {caseData.cassationYear && `لسنة ${caseData.cassationYear}`}</span>
                </div>
              )}
              {caseData.stateCouncilYearQ && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 size={12} /> مجلس الدولة
                  </span>
                  <span className="font-bold text-navy-900 dark:text-white">رقم {caseData.stateCouncilYearQ} ق</span>
                </div>
              )}
            </div>

            {/* Specialized Fields Section */}
            {caseData.type === 'جنائي' && (
              <div className="pb-2 mb-2 border-b border-red-50 dark:border-red-900/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-500 flex items-center gap-1.5">
                    <Scale size={12} /> درجة الجريمة
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-100">{caseData.criminalTier}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-500 flex items-center gap-1.5">
                    <Clock size={12} /> المرحلة
                  </span>
                  <span className="font-bold text-navy-900 dark:text-white">{caseData.criminalStage}</span>
                </div>
                {caseData.prosecutionRef && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-500 flex items-center gap-1.5">
                      <Hash size={12} /> مرجع النيابة
                    </span>
                    <span className="font-bold text-navy-900 dark:text-white">{caseData.prosecutionRef}</span>
                  </div>
                )}
              </div>
            )}

            {caseData.type === 'أحوال شخصية' && (
              <div className="pb-2 mb-2 border-b border-purple-50 dark:border-purple-900/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-500 flex items-center gap-1.5">
                    <Users size={12} /> نوع النزاع
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-100">{caseData.familyCaseType}</Badge>
                </div>
              </div>
            )}

            {caseData.type === 'اقتصادي' && (
              <div className="pb-2 mb-2 border-b border-amber-50 dark:border-amber-900/10 space-y-2">
                {caseData.commercialRegRef && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-600 flex items-center gap-1.5">
                      <Building2 size={12} /> السجل التجاري
                    </span>
                    <span className="font-bold text-navy-900 dark:text-white">{caseData.commercialRegRef}</span>
                  </div>
                )}
                {caseData.taxIdRef && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-600 flex items-center gap-1.5">
                      <Hash size={12} /> الرقم الضريبي
                    </span>
                    <span className="font-bold text-navy-900 dark:text-white">{caseData.taxIdRef}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Gavel size={12} /> المحكمة
              </span>
              <span className="font-bold text-navy-900 dark:text-white">{caseData.court}</span>
            </div>
            {caseClient && (
               <div className="flex items-center justify-between text-xs">
                 <span className="text-slate-400 flex items-center gap-1.5">
                   <User size={12} /> الموكل المرتبط
                 </span>
                 <span className="font-bold text-navy-900 dark:text-white">
                   {caseClient.name} <span className="text-slate-400 font-normal">({caseData.clientRole || 'مدعي'})</span>
                 </span>
               </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Hash size={12} /> كود التداول
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">{caseData.circulationCode || '-'}</span>
            </div>
            {caseData.archiveCode && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Hash size={12} /> كود الحفظ
                </span>
                <span className="font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{caseData.archiveCode}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Hash size={12} /> الرقم الآلي
              </span>
              <span className="font-mono font-bold text-navy-900 dark:text-white">{caseData.automatedNumber || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Info size={12} /> المسمى
              </span>
              <span className="font-bold text-navy-900 dark:text-white">{caseData.title || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Info size={12} /> الدائرة
              </span>
              <span className="font-bold text-navy-900 dark:text-white">{caseData.circuit || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User size={12} /> المدعي
              </span>
              <span className="font-bold text-navy-900 dark:text-white">{caseData.plaintiff}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <UserCheck size={12} /> المدعى عليه
              </span>
              <span className="font-bold text-navy-900 dark:text-white">{caseData.defendant}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Hash size={12} /> رقم الوكالة
              </span>
              <span className="font-mono font-bold text-primary-600">{caseData.powerOfAttorneyRef}</span>
            </div>
            {caseData.createdAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock size={12} /> تاريخ القيد
                </span>
                <span className="font-bold text-navy-900 dark:text-white">
                  {format(new Date(caseData.createdAt), "yyyy/MM/dd", { locale: ar })}
                </span>
              </div>
            )}
          </div>
        </div>

        {!['محفوظة', 'مغلقة'].includes(caseData.status) && (
          <div className="flex flex-wrap gap-2">
            <StartVideoButton caseId={caseData.id} caseName={caseData.title || ''} clientName={caseClient?.name || ''} />
            <AddSessionDialog caseData={caseData} />
            <AddDeadlineDialog caseId={caseData.id} />
            <AddTaskDialog caseId={caseData.id} />
            <AddExpenseDialog caseData={caseData} />
            <Button variant="outline" size="sm" className="h-8 dark:border-white/10 gap-1 bg-white dark:bg-navy-800" onClick={() => toast.success('تم فتح نافذة الإحالة لخبير (قيد التطوير)')}>
              <Briefcase size={14} /> إحالة للخبير
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
          <h4 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
            <Info size={16} className="text-primary-500" />
            المرفقات والمستندات
          </h4>
          <div className="space-y-3 bg-white dark:bg-navy-900 p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
            {!['محفوظة', 'مغلقة'].includes(caseData.status) && (
              <div className="flex items-center justify-center p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg border border-dashed border-slate-200 dark:border-white/20 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  إضافة مرفق جديد (مثل الوكالة)
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10">
              <span className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Info size={14} className="text-primary-500" /> وكالة الموكل.pdf
              </span>
              <span className="text-[10px] text-slate-400">1.2 MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Column */}
      <CaseTimeline events={timelineEvents} />

      {/* Summary Cards Column */}
      <CaseSummaryCards 
        caseId={caseData.id}
        totalExpenses={totalExpenses}
        caseSessions={caseSessions}
        caseTasks={caseTasks}
        memorandumsCount={caseData.memorandums?.length || 0}
        deadlines={deadlines}
      />
    </div>
  );
}
