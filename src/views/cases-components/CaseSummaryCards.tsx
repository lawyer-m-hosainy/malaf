import React from 'react';
import { Expense, Session, Task, Deadline } from "@/types";
import { cn } from "@/lib/utils";
import { Calendar, Clock, DollarSign, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { enrichDeadlineStatuses } from "@/domain/legalWorkflow";
import { useFinanceStore } from "@/store/useFinanceStore";

interface CaseSummaryCardsProps {
  caseId: string;
  totalExpenses: number;
  caseSessions: Session[];
  caseTasks: Task[];
  memorandumsCount: number;
  deadlines: Deadline[];
}

function TrendingUp({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export default function CaseSummaryCards({ caseId, totalExpenses, caseSessions, caseTasks, memorandumsCount, deadlines }: CaseSummaryCardsProps) {
  const caseDeadlines = deadlines.filter(d => d.caseId === caseId);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-primary-500" />
        ملخص الحالة
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
          <p className="text-[10px] font-bold text-emerald-600 mb-1">المصروفات</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{totalExpenses.toLocaleString()} <span className="text-[10px]">ج.م</span></p>
        </div>
        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20">
          <p className="text-[10px] font-bold text-primary-600 mb-1">الجلسات</p>
          <p className="text-lg font-bold text-primary-700 dark:text-primary-400">{caseSessions.length} <span className="text-[10px]">جلسات</span></p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
          <p className="text-[10px] font-bold text-amber-600 mb-1">المهام المعلقة</p>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{caseTasks.filter((t) => t.status === 'pending').length} <span className="text-[10px]">مهام</span></p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
          <p className="text-[10px] font-bold text-blue-600 mb-1">المذكرات</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{memorandumsCount} <span className="text-[10px]">وثائق</span></p>
        </div>
      </div>
      
      {caseSessions.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
          <p className="text-[10px] font-bold text-slate-500 mb-2">الجلسة القادمة</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary-500" />
              <span className="text-xs font-bold">{caseSessions[0].date}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{caseSessions[0].time}</span>
          </div>
        </div>
      )}

      {/* ERP: Time Tracking & Cost Center */}
      <div className="mt-4 space-y-3">
        <h5 className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <DollarSign size={14} className="text-emerald-500" />
          مركز التكلفة والأرباح
        </h5>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-white/5 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">مقدم الأتعاب</span>
            <span className="font-bold text-navy-900 dark:text-white">10,000 ج.م</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">إجمالي المصروفات</span>
            <span className="font-bold text-red-600">-{totalExpenses.toLocaleString()} ج.م</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">قيمة ساعات العمل (مقدرة)</span>
            <span className="font-bold text-amber-600">-{totalExpenses > 0 ? 1500 : 0} ج.م</span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
            <span className="text-xs font-bold text-navy-900 dark:text-white">صافي الربح المتوقع</span>
            <span className="font-bold text-emerald-600">{(10000 - totalExpenses - (totalExpenses > 0 ? 1500 : 0)).toLocaleString()} ج.م</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-primary-500" />
          <div>
            <p className="text-xs font-bold">تسجيل الوقت</p>
            <p className="text-[10px] text-slate-500">الوقت المستغرق: {totalExpenses > 0 ? '12 ساعة و 30 دقيقة' : '0 ساعة'}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] cursor-pointer">إضافة وقت</Badge>
      </div>

      {/* Deadlines Section */}
      <div className="mt-4 space-y-3">
        <h5 className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Clock size={14} className="text-amber-500" />
          المواعيد النهائية القادمة
        </h5>
        <div className="space-y-2">
          {enrichDeadlineStatuses(caseDeadlines).map(deadline => (
            <div key={deadline.id} className="p-3 rounded-lg bg-white dark:bg-navy-900 border border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">{deadline.title}</p>
                <p className="text-[10px] text-slate-400">{deadline.type}</p>
              </div>
              <div className="text-end">
                <p className="text-xs font-bold text-primary-600">{deadline.date}</p>
                <Badge className={cn(
                  "text-[8px] px-1.5 py-0 mt-1",
                  deadline.status === 'overdue' ? "bg-destructive/10 text-destructive" :
                  deadline.priority === 'high' ? "bg-destructive/10 text-destructive" :
                  deadline.priority === 'medium' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                )}>
                  {deadline.status === 'overdue' ? 'متأخر' : deadline.priority === 'high' ? 'عالية' : deadline.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                </Badge>
              </div>
            </div>
          ))}
          {caseDeadlines.length === 0 && (
            <p className="text-[10px] text-slate-400 text-center py-2 italic">لا توجد مواعيد نهائية مسجلة</p>
          )}
        </div>
      </div>
    </div>
  );
}
