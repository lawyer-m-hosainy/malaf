import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Receipt, FileText, CheckCircle2, Circle } from "lucide-react";
import { useFinanceStore } from '@/store/useFinanceStore';
import { useInvoicesStore } from '@/store/useInvoicesStore';
import { formatDateEG } from '@/lib/formatEG';
import { toast } from 'sonner';
import { Case } from '@/types';
import AddExpenseDialog from './AddExpenseDialog';
import { cn } from '@/lib/utils';

interface CaseExpensesProps {
  caseData: Case;
}

export default function CaseExpenses({ caseData }: CaseExpensesProps) {
  const expenses = useFinanceStore((state) => state.expenses.filter(e => e.caseId === caseData.id));
  const toggleExpenseCollected = useFinanceStore((state) => state.toggleExpenseCollected);
  const addInvoice = useInvoicesStore((state) => state.addInvoice);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const collectedExpenses = expenses.filter(e => e.isCollected).reduce((sum, e) => sum + e.amount, 0);
  const remainingExpenses = totalExpenses - collectedExpenses;

  const handleCreateInvoice = async () => {
    const uncollectedExpenses = expenses.filter(e => !e.isCollected);
    if (uncollectedExpenses.length === 0) {
      toast.info("لا توجد مصروفات غير محصلة لتحويلها لفاتورة");
      return;
    }

    try {
      const totalAmount = uncollectedExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      await addInvoice({
        id: `INV-EXP-${Date.now()}`,
        clientId: caseData.clientId,
        clientName: `${caseData.plaintiff}`, // Usually should fetch full client name
        base: totalAmount,
        status: 'غير مدفوعة',
        date: new Date().toISOString().split('T')[0],
      });

      // Mark these expenses as collected (optional, or wait for payment)
      // For now, let's keep them as is or show they are "invoiced"
      toast.success("تم إنشاء فاتورة بالمصروفات غير المحصلة بنجاح");
    } catch (error) {
      toast.error("فشل إنشاء الفاتورة");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-navy-900 dark:text-white flex items-center gap-2">
          <Wallet size={20} className="text-primary-600" />
          مصروفات القضية
        </h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-primary-200 text-primary-700 hover:bg-primary-50"
            onClick={handleCreateInvoice}
            disabled={remainingExpenses <= 0}
          >
            <Receipt size={16} />
            إصدار فاتورة بالمصروفات
          </Button>
          <AddExpenseDialog caseData={caseData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1">إجمالي المصروفات</p>
          <p className="text-xl font-bold text-navy-900 dark:text-white">{totalExpenses.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">تم تحصيله</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{collectedExpenses.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">متبقي (غير محصل)</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{remainingExpenses.toLocaleString()} ج.م</p>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 dark:border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-white/5">
            <TableRow>
              <TableHead className="font-bold">التاريخ</TableHead>
              <TableHead className="font-bold">البند / الفئة</TableHead>
              <TableHead className="font-bold">الوصف</TableHead>
              <TableHead className="font-bold">القيمة</TableHead>
              <TableHead className="font-bold">بواسطة</TableHead>
              <TableHead className="font-bold text-center">التحصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <TableCell className="text-sm">{formatDateEG(new Date(expense.date))}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white dark:bg-navy-900 font-medium">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-[200px] truncate" title={expense.description}>
                    {expense.description || '-'}
                  </TableCell>
                  <TableCell className="font-bold text-navy-900 dark:text-white">
                    {expense.amount.toLocaleString()} ج.م
                  </TableCell>
                  <TableCell className="text-sm">
                    {expense.paidBy || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <button 
                      onClick={() => {
                        toggleExpenseCollected(expense.id);
                        toast.success(expense.isCollected ? "تم التغيير لغير محصل" : "تم التغيير لمحصل");
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-colors",
                        expense.isCollected 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400 hover:bg-amber-100 hover:text-amber-700"
                      )}
                    >
                      {expense.isCollected ? (
                        <>
                          <CheckCircle2 size={12} />
                          تم التحصيل
                        </>
                      ) : (
                        <>
                          <Circle size={12} />
                          غير محصل
                        </>
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={32} className="opacity-20" />
                    <p>لا توجد مصروفات مسجلة لهذه القضية حتى الآن</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
