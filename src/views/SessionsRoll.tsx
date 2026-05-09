import React, { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useCasesStore } from "@/store/useCasesStore";
import { Calendar, AlertCircle, Printer, Filter } from "lucide-react";
import { toast } from "sonner";

// R8-FIX: Memoized row component — prevents 100+ rows from re-rendering on filter change
const SessionRollRow = memo(({ item }: { item: any }) => (
  <TableRow className={item.isRecess ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
    <TableCell className="font-bold whitespace-nowrap text-sm">
      {new Date(item.date).toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' })}
      {item.isRecess && <AlertCircle size={12} className="inline ms-1 text-amber-500" title="إجازة قضائية" />}
    </TableCell>
    <TableCell className="font-bold text-navy-900 dark:text-white whitespace-nowrap text-sm">{item.caseId}</TableCell>
    <TableCell className="text-sm">{item.court}</TableCell>
    <TableCell className="text-sm">{item.circuit}</TableCell>
    <TableCell className="text-sm font-medium">{item.opponent || '-'}</TableCell>
    <TableCell className="text-sm text-slate-500 dark:text-slate-400">{item.previousDecision}</TableCell>
    <TableCell className="text-sm text-slate-500 dark:text-slate-400">{item.postponementReason}</TableCell>
    <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.nextSessionDate}</TableCell>
    <TableCell className="text-sm font-medium text-primary-700 dark:text-primary-400">{item.responsibleLawyer}</TableCell>
    <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={item.notes}>{item.notes}</TableCell>
  </TableRow>
));

export default function SessionsRoll() {
  const cases = useCasesStore(state => state.cases);
  const sessions = useCasesStore(state => state.sessions);

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [courtFilter, setCourtFilter] = useState("");
  const [lawyerFilter, setLawyerFilter] = useState("");

  const handlePrint = () => {
    toast.success("تم إرسال أجندة اليوم للطباعة بصيغة PDF", {
      description: "سيتم طباعة الأجندة بالتنسيق الورقي المعتمد"
    });
  };

  const isSummerRecess = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    // July (7) to end of September (9)
    return month >= 7 && month <= 9;
  };

  const rollData = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    return sessions
      .filter(session => {
        const inDateRange = session.date >= startDate && session.date <= endDate;
        const matchesCourt = courtFilter ? session.court.includes(courtFilter) : true;
        const matchesLawyer = lawyerFilter && session.responsibleLawyer ? session.responsibleLawyer.includes(lawyerFilter) : true;
        return inDateRange && matchesCourt && matchesLawyer;
      })
      .map(session => {
        const relatedCase = cases.find(c => c.id === session.caseId);
        return {
          id: session.id,
          date: session.date,
          caseId: session.caseId,
          court: session.court,
          circuit: session.circuit || '-',
          opponent: relatedCase?.clientRole === 'مدعي' ? relatedCase?.defendant : relatedCase?.plaintiff,
          previousDecision: session.previousDecision || '-',
          postponementReason: session.postponementReason || '-',
          nextSessionDate: session.nextSessionDate || '-',
          responsibleLawyer: session.responsibleLawyer || '-',
          notes: session.notes || '-',
          isRecess: isSummerRecess(session.date)
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, cases, startDate, endDate, courtFilter, lawyerFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">أجندة المكتب</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">سجل الجلسات والمواعيد مطابقاً للأجندة الورقية (أجندة المحامين)</p>
        </div>
        <Button onClick={handlePrint} className="bg-primary-500 hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary-500/20">
          <Printer size={16} />
          طباعة أجندة اليوم
        </Button>
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 dark:text-white">من تاريخ</label>
            <input type="date" className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 px-3 bg-transparent text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 dark:text-white">إلى تاريخ</label>
            <input type="date" className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 px-3 bg-transparent text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 dark:text-white">المحكمة</label>
            <input type="text" placeholder="تصفية بالمحكمة..." className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 px-3 bg-transparent text-sm" value={courtFilter} onChange={e => setCourtFilter(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 dark:text-white">المحامي</label>
            <input type="text" placeholder="تصفية بالمحامي..." className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 px-3 bg-transparent text-sm" value={lawyerFilter} onChange={e => setLawyerFilter(e.target.value)} />
          </div>
        </div>

        <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">التاريخ</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">رقم الدعوى</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">المحكمة</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">الدائرة</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">اسم الخصم</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">القرار السابق</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">سبب التأجيل</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">الجلسة القادمة</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">المحامي المسؤول</TableHead>
                <TableHead className="font-bold text-navy-900 dark:text-white whitespace-nowrap">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rollData.length > 0 ? rollData.map((item) => (
                <SessionRollRow key={item.id} item={item} />
              )) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                    لا توجد جلسات مجدولة في هذه الفترة أو تطابق شروط البحث.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>* إجازة العطلة القضائية تمتد من 1 يوليو حتى 1 أكتوبر</span>
          <span>* أيام العمل الرسمية: السبت إلى الخميس</span>
        </div>
      </Card>
    </div>
  );
}
