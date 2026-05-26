import React from "react";
import { formatEGP } from "@/lib/formatEG";
import { cn } from "@/lib/utils";

export default function ReportPrintArea({ printData }: { printData: any }) {
  if (!printData) return null;

  const expenseGroups: Record<string, number> = {};
  if (printData.type === 'pnl') {
    printData.expenses.forEach((e: any) => {
      expenseGroups[e.category] = (expenseGroups[e.category] || 0) + e.amount;
    });
  }

  return (
    <div 
      id="pdf-report-print-area" 
      dir="rtl"
      className="bg-white text-slate-900 p-10 w-[800px] border shadow-md"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        fontFamily: 'Cairo, system-ui, -apple-system, sans-serif',
        lineHeight: '1.6'
      }}
    >
      <div className="border-b-4 border-emerald-600 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">مكتب المحاماة والخدمات القانونية</h2>
          <p className="text-xs text-slate-500 mt-1">نظام إدارة مكاتب المحاماة الذكي — مَلَف</p>
        </div>
        <div className="text-left font-bold text-xs text-slate-500 space-y-1">
          <p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
          <p>الفترة: من {new Date(printData.startDate).toLocaleDateString('ar-EG')} إلى {new Date(printData.endDate).toLocaleDateString('ar-EG')}</p>
        </div>
      </div>

      <h1 className="text-lg font-bold text-center text-navy-950 mb-8 bg-slate-100 py-3 rounded-lg border">
        {printData.title}
      </h1>

      {printData.type === 'pnl' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-bold text-emerald-800 border-b-2 border-emerald-100 pb-1.5 mb-3 flex justify-between">
              <span>أولاً: المقبوضات والإيرادات</span>
              <span className="font-mono">{formatEGP(printData.revenue * 1.14)}</span>
            </h3>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b">
                  <td className="py-2.5 text-slate-700">إجمالي الأتعاب المحصلة الفعلية من الفواتير</td>
                  <td className="py-2.5 text-left font-mono font-bold">{formatEGP(printData.revenue)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2.5 text-slate-500">ضريبة القيمة المضافة (14% تقديرية)</td>
                  <td className="py-2.5 text-left font-mono text-slate-500">{formatEGP(printData.revenue * 0.14)}</td>
                </tr>
                <tr className="font-bold bg-emerald-50 text-emerald-950">
                  <td className="py-2.5 px-2">إجمالي التدفقات الواردة (بالضريبة)</td>
                  <td className="py-2.5 px-2 text-left font-mono">{formatEGP(printData.revenue * 1.14)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-sm font-bold text-red-800 border-b-2 border-red-100 pb-1.5 mb-3 flex justify-between">
              <span>ثانياً: المصروفات والمدفوعات</span>
              <span className="font-mono">{formatEGP(printData.totalExpenses)}</span>
            </h3>
            <table className="w-full text-xs">
              <tbody>
                {Object.entries(expenseGroups).length > 0 ? (
                  Object.entries(expenseGroups).map(([cat, val]) => (
                    <tr key={cat} className="border-b">
                      <td className="py-2.5 text-slate-700">{cat}</td>
                      <td className="py-2.5 text-left font-mono font-bold">{formatEGP(val)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b">
                    <td className="py-2.5 text-slate-500 italic">لا توجد مصروفات مسجلة للفترة المحددة.</td>
                    <td className="py-2.5 text-left font-mono font-bold">{formatEGP(0)}</td>
                  </tr>
                )}
                <tr className="font-bold bg-red-50 text-red-950">
                  <td className="py-2.5 px-2">إجمالي المصروفات والمدفوعات التشغيلية</td>
                  <td className="py-2.5 px-2 text-left font-mono">{formatEGP(printData.totalExpenses)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border-2 border-navy-950 bg-navy-50/50 p-4 rounded-xl flex justify-between items-center mt-8">
            <span className="text-base font-extrabold text-navy-950">صافي الربح التشغيلي (P&L)</span>
            <span className={cn(
              "text-xl font-black font-mono px-4 py-2 rounded-lg bg-white border shadow-sm",
              (printData.revenue - printData.totalExpenses) >= 0 ? "text-emerald-700 border-emerald-200" : "text-red-700 border-red-200"
            )}>
              {formatEGP(printData.revenue - printData.totalExpenses)}
            </span>
          </div>
        </div>
      )}

      {printData.type === 'invoices' && (
        <div>
          <table className="w-full text-[11px] text-slate-700 border-collapse border">
            <thead>
              <tr className="bg-slate-100 border text-navy-950 font-bold">
                <th className="p-2 border text-right">رقم الفاتورة</th>
                <th className="p-2 border text-right">تاريخ الإصدار</th>
                <th className="p-2 border text-right">الموكل</th>
                <th className="p-2 border text-right">المبلغ الإجمالي</th>
                <th className="p-2 border text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {printData.invoices.length > 0 ? (
                printData.invoices.map((inv: any) => (
                  <tr key={inv.id} className="border hover:bg-slate-50">
                    <td className="p-2 border font-mono font-bold text-navy-900">{inv.id}</td>
                    <td className="p-2 border font-mono">{inv.date}</td>
                    <td className="p-2 border font-bold">{inv.clientName || 'غير محدد'}</td>
                    <td className="p-2 border font-mono font-bold text-left">{formatEGP(inv.total)}</td>
                    <td className="p-2 border font-bold text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold",
                        inv.status === 'مدفوعة' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      )}>{inv.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic">لا توجد فواتير صادرة في الفترة المحددة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {printData.type === 'expenses' && (
        <div>
          <table className="w-full text-[11px] text-slate-700 border-collapse border">
            <thead>
              <tr className="bg-slate-100 border text-navy-950 font-bold">
                <th className="p-2 border text-right">التاريخ</th>
                <th className="p-2 border text-right">الوصف / البند</th>
                <th className="p-2 border text-right">التصنيف</th>
                <th className="p-2 border text-right">حالة السداد</th>
                <th className="p-2 border text-right">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {printData.expenses.length > 0 ? (
                printData.expenses.map((exp: any) => (
                  <tr key={exp.id} className="border hover:bg-slate-50">
                    <td className="p-2 border font-mono">{exp.date}</td>
                    <td className="p-2 border font-bold">{exp.description || '—'}</td>
                    <td className="p-2 border">{exp.category}</td>
                    <td className="p-2 border font-bold">{exp.status}</td>
                    <td className="p-2 border font-mono font-bold text-left">{formatEGP(exp.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic">لا توجد مصروفات مسجلة في الفترة المحددة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {printData.type === 'trust' && (
        <div>
          <table className="w-full text-[11px] text-slate-700 border-collapse border">
            <thead>
              <tr className="bg-slate-100 border text-navy-950 font-bold">
                <th className="p-2 border text-right">التاريخ</th>
                <th className="p-2 border text-right">الموكل</th>
                <th className="p-2 border text-right">النوع</th>
                <th className="p-2 border text-right">الوصف / البند</th>
                <th className="p-2 border text-right">رقم الإيصال</th>
                <th className="p-2 border text-right">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {printData.trust.length > 0 ? (
                printData.trust.map((t: any) => (
                  <tr key={t.id} className="border hover:bg-slate-50">
                    <td className="p-2 border font-mono">{t.transactionDate ? t.transactionDate.split('T')[0] : ''}</td>
                    <td className="p-2 border font-bold">{t.clientName || '—'}</td>
                    <td className="p-2 border font-bold text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold",
                        t.transactionType === 'deposit' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                      )}>{t.transactionType === 'deposit' ? 'إيداع' : 'سحب'}</span>
                    </td>
                    <td className="p-2 border">{t.description || '—'}</td>
                    <td className="p-2 border font-mono font-bold">{t.receiptNumber || '—'}</td>
                    <td className="p-2 border font-mono font-bold text-left">{formatEGP(t.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic">لا توجد حركات أمانات مسجلة في الفترة المحددة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {printData.type === 'receivables' && (
        <div>
          <table className="w-full text-[11px] text-slate-700 border-collapse border">
            <thead>
              <tr className="bg-slate-100 border text-navy-950 font-bold">
                <th className="p-2 border text-right">الموكل</th>
                <th className="p-2 border text-right">رقم القضية</th>
                <th className="p-2 border text-right">المبلغ الإجمالي</th>
                <th className="p-2 border text-right">المحصل الفعلي</th>
                <th className="p-2 border text-right">الذمم المعلقة</th>
                <th className="p-2 border text-right">تاريخ الاستحقاق</th>
              </tr>
            </thead>
            <tbody>
              {printData.receivables.length > 0 ? (
                printData.receivables.map((r: any) => (
                  <tr key={r.id} className="border hover:bg-slate-50">
                    <td className="p-2 border font-bold">{r.clientName || '—'}</td>
                    <td className="p-2 border text-slate-500 font-mono">{r.caseId || '—'}</td>
                    <td className="p-2 border font-mono font-bold text-left">{formatEGP(r.totalAmount)}</td>
                    <td className="p-2 border font-mono font-bold text-emerald-600 text-left">{formatEGP(r.collectedAmount)}</td>
                    <td className="p-2 border font-mono font-bold text-red-600 text-left">{formatEGP(r.outstandingAmount)}</td>
                    <td className="p-2 border font-mono">{r.dueDate || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic">لا توجد مطالبات أو ذمم مالية متأخرة في الفترة المحددة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-200 mt-12 pt-4 text-center text-[10px] text-slate-400 font-bold">
        <p>هذا المستند تم استخراجه وحسابه آلياً وصالح لأغراض التدقيق والمراجعة الداخلية للمكتب.</p>
        <p className="mt-1">تم استخراج هذا التقرير آلياً عبر منصة مَلَف برو لإدارة المكاتب القانونية.</p>
      </div>
    </div>
  );
}
