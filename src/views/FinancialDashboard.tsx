import { motion } from "motion/react";
import { useState, useMemo, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, Scale, 
  Loader2, Calendar, FileText, AlertTriangle, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchExpenses, fetchReceivables, fetchInvoices, fetchTrustTransactions } from "@/services/legalDataService";
import { formatEGP } from "@/lib/formatEG";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { FINANCES_KEY, queryConfig } from "@/lib/queryConfig";

// Lazy load heavy components
const CashFlowChart = lazy(() => import("./finance-components/FinancialCharts").then(m => ({ default: m.CashFlowChart })));
const ExpensePieChart = lazy(() => import("./finance-components/FinancialCharts").then(m => ({ default: m.ExpensePieChart })));
const AgingBarChart = lazy(() => import("./finance-components/FinancialCharts").then(m => ({ default: m.AgingBarChart })));
const ReportPrintArea = lazy(() => import("./finance-components/ReportPrintArea"));

// Harmonic colors for Pie Chart
const COLORS = [
  "#16a34a", // Green (Primary)
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#64748b"  // Slate
];

// Helper to get Arabic Month Name
const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", 
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

function daysPastDue(dueDate: string) {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function agingBucket(days: number) {
  if (days <= 0) return "حالي";
  if (days <= 30) return "1-30 يوم";
  if (days <= 60) return "31-60 يوم";
  if (days <= 90) return "61-90 يوم";
  return "+90 يوم";
}

interface Receivable {
  id: string;
  client_id: string;
  client_name: string;
  case_id: string;
  total_amount: number;
  collected_amount: number;
  outstanding_amount: number;
  due_date: string;
  status: string;
  is_reconciled: boolean;
  created_at: string;
}

export default function FinancialDashboard() {
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: [FINANCES_KEY, "invoices"],
    queryFn: () => fetchInvoices(),
    staleTime: queryConfig.finances.staleTime,
  });

  const { data: expensesData = [], isLoading: expensesLoading } = useQuery({
    queryKey: [FINANCES_KEY, "expenses"],
    queryFn: () => fetchExpenses(),
    staleTime: queryConfig.finances.staleTime,
  });

  const { data: receivablesData = [], isLoading: receivablesLoading } = useQuery<Receivable[]>({
    queryKey: [FINANCES_KEY, "receivables"],
    queryFn: () => fetchReceivables() as Promise<Receivable[]>,
    staleTime: queryConfig.finances.staleTime,
  });

  const { data: trustTransactions = [], isLoading: trustLoading } = useQuery({
    queryKey: [FINANCES_KEY, "trust"],
    queryFn: () => fetchTrustTransactions(),
    staleTime: queryConfig.finances.staleTime,
  });

  const [timePeriod, setTimePeriod] = useState<string>("6_months");

  const isLoading = invoicesLoading || expensesLoading || receivablesLoading || trustLoading;

  const expenses = useMemo(() => expensesData || [], [expensesData]);
  const receivables = useMemo(() => {
    return (receivablesData || []).map((d: any) => ({
      id: d.id,
      clientId: d.client_id,
      clientName: d.client_name,
      caseId: d.case_id,
      totalAmount: d.total_amount,
      collectedAmount: d.collected_amount,
      outstandingAmount: d.outstanding_amount,
      dueDate: d.due_date,
      status: d.status,
      isReconciled: d.is_reconciled,
      createdAt: d.created_at,
      actions: []
    }));
  }, [receivablesData]);

  // Filter items based on selected period
  const filterByPeriod = <T extends { date: string }>(items: T[]) => {
    const now = new Date();
    return items.filter(item => {
      const itemDate = new Date(item.date);
      if (isNaN(itemDate.getTime())) return false;
      
      if (timePeriod === "month") {
        // Current Month
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      } else if (timePeriod === "year") {
        // Current Year
        return itemDate.getFullYear() === now.getFullYear();
      }
      // 6 Months (default)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      return itemDate >= sixMonthsAgo;
    });
  };

  const filteredInvoices = useMemo(() => filterByPeriod(invoices), [invoices, timePeriod]);
  const filteredExpenses = useMemo(() => filterByPeriod(expenses), [expenses, timePeriod]);

  // Global calculations
  const totalRevenue = useMemo(() => {
    return filteredInvoices
      .filter(i => i.status === "مدفوعة")
      .reduce((sum, i) => sum + i.total, 0);
  }, [filteredInvoices]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const netProfit = totalRevenue - totalExpenses;

  const collectionRate = useMemo(() => {
    const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + i.total, 0);
    const paidInvoiced = filteredInvoices
      .filter(i => i.status === "مدفوعة")
      .reduce((sum, i) => sum + i.total, 0);
    
    return totalInvoiced > 0 ? Math.round((paidInvoiced / totalInvoiced) * 100) : 0;
  }, [filteredInvoices]);

  // Cash Flow History (Last 6 Months)
  const cashFlowHistoryData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = `${ARABIC_MONTHS[month]} ${year}`;

      // Invoices in this month
      const monthRev = invoices
        .filter(inv => {
          const invDate = new Date(inv.date);
          return invDate.getMonth() === month && invDate.getFullYear() === year && inv.status === "مدفوعة";
        })
        .reduce((sum, inv) => sum + inv.total, 0);

      // Expenses in this month
      const monthExp = expenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate.getMonth() === month && expDate.getFullYear() === year;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

      data.push({
        name: label,
        الإيرادات: monthRev,
        المصروفات: monthExp,
        الربح: monthRev - monthExp
      });
    }
    return data;
  }, [invoices, expenses]);

  // Expense categories distribution
  const expensePieData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      groups[exp.category] = (groups[exp.category] || 0) + exp.amount;
    });

    return Object.entries(groups)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Receivables aging buckets
  const agingBarData = useMemo(() => {
    const buckets = {
      "حالي": 0,
      "1-30 يوم": 0,
      "31-60 يوم": 0,
      "61-90 يوم": 0,
      "+90 يوم": 0
    } as Record<string, number>;

    receivables.forEach(r => {
      if (r.status !== "مغلق" && r.status !== "مسوى") {
        const days = daysPastDue(r.dueDate);
        const bucket = agingBucket(days);
        buckets[bucket] += r.outstandingAmount;
      }
    });

    return Object.entries(buckets).map(([name, value]) => ({
      name,
      المستحقات: value
    }));
  }, [receivables]);

  // Top 5 High-Revenue Cases
  const topCases = useMemo(() => {
    return [...receivables]
      .filter(r => r.collectedAmount > 0)
      .sort((a, b) => b.collectedAmount - a.collectedAmount)
      .slice(0, 5);
  }, [receivables]);

  // Export Report Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<string>("pnl");
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    // Default to first day of current year
    return `${now.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [exportFormat, setExportFormat] = useState<string>("pdf"); // pdf, csv
  const [isExporting, setIsExporting] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  const getFilteredData = (type: string, start: Date, end: Date) => {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const invoicesFiltered = invoices.filter(i => {
      const d = i.date;
      return d >= startStr && d <= endStr;
    });

    const expensesFiltered = expenses.filter(e => {
      const d = e.date;
      return d >= startStr && d <= endStr;
    });

    const trustFiltered = trustTransactions.filter(t => {
      if (!t.transactionDate) return false;
      const d = t.transactionDate.split('T')[0];
      return d >= startStr && d <= endStr;
    });

    const receivablesFiltered = receivables.filter(r => {
      if (!r.createdAt) return false;
      const d = r.createdAt.split('T')[0];
      return d >= startStr && d <= endStr;
    });

    return { invoicesFiltered, expensesFiltered, trustFiltered, receivablesFiltered };
  };

  const exportToCSV = (type: string, start: string, end: string) => {
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const { invoicesFiltered, expensesFiltered, trustFiltered, receivablesFiltered } = getFilteredData(type, startDateObj, endDateObj);

    let csvContent = "\uFEFF"; // Byte Order Mark for Excel Arabic support

    if (type === "pnl") {
      const revenue = invoicesFiltered.filter(i => i.status === "مدفوعة").reduce((sum, i) => sum + i.total, 0);
      const totalExp = expensesFiltered.reduce((sum, e) => sum + e.amount, 0);
      const vat = revenue * 0.14;
      const totalRev = revenue + vat;
      const profit = revenue - totalExp;

      csvContent += "مكتب المحاماة والخدمات القانونية\n";
      csvContent += `التقرير المالي - الأرباح والخسائر P&L (${start} إلى ${end})\n\n`;
      csvContent += "البند,المبلغ (ج.م)\n";
      csvContent += `إجمالي الأتعاب المحصلة,${revenue}\n`;
      csvContent += `ضريبة القيمة المضافة (14%),${vat}\n`;
      csvContent += `إجمالي الإيرادات,${totalRev}\n`;
      csvContent += `إجمالي المصروفات,${totalExp}\n`;
      csvContent += `صافي الربح التشغيلي,${profit}\n`;
    } 
    else if (type === "invoices") {
      csvContent += "كشف الفواتير الصادرة والمسددة\n";
      csvContent += `الفترة: من ${start} إلى ${end}\n\n`;
      csvContent += "رقم الفاتورة,تاريخ الإصدار,الموكل,المبلغ الإجمالي (ج.م),الحالة\n";
      invoicesFiltered.forEach(i => {
        csvContent += `"${i.id}","${i.date}","${i.clientName || 'غير محدد'}",${i.total},"${i.status}"\n`;
      });
    } 
    else if (type === "expenses") {
      csvContent += "كشف المصروفات التشغيلية والقضائية\n";
      csvContent += `الفترة: من ${start} إلى ${end}\n\n`;
      csvContent += "التاريخ,البند / الوصف,التصنيف,حالة السداد,المبلغ (ج.م)\n";
      expensesFiltered.forEach(e => {
        csvContent += `"${e.date}","${e.description || '—'}","${e.category}","${e.status}",${e.amount}\n`;
      });
    } 
    else if (type === "trust") {
      csvContent += "كشف حركة حسابات الأمانات (Trust Accounts)\n";
      csvContent += `الفترة: من ${start} إلى ${end}\n\n`;
      csvContent += "التاريخ,الموكل,القضية,النوع,الوصف,رقم الإيصال,المبلغ (ج.م)\n";
      trustFiltered.forEach(t => {
        const typeStr = t.transactionType === "deposit" ? "إيداع" : "سحب";
        csvContent += `"${t.transactionDate ? t.transactionDate.split('T')[0] : ''}","${t.clientName || '—'}","${t.caseName || '—'}","${typeStr}","${t.description || '—'}","${t.receiptNumber || '—'}",${t.amount}\n`;
      });
    } 
    else if (type === "receivables") {
      csvContent += "تقرير الذمم المالية والمطالبات المتأخرة\n";
      csvContent += `الفترة: من ${start} إلى ${end}\n\n`;
      csvContent += "الموكل,رقم القضية,المبلغ الإجمالي (ج.م),المحصل الفعلي (ج.م),الذمم المعلقة (ج.م),تاريخ الاستحقاق,الحالة\n";
      receivablesFiltered.forEach(r => {
        csvContent += `"${r.clientName || '—'}","${r.caseId || '—'}",${r.totalAmount},${r.collectedAmount},${r.outstandingAmount},"${r.dueDate || '—'}","${r.status}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_مالي_${type}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("تم تصدير ملف Excel بنجاح");
  };

  const handleExportPDF = async (type: string, start: string, end: string) => {
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const { invoicesFiltered, expensesFiltered, trustFiltered, receivablesFiltered } = getFilteredData(type, startDateObj, endDateObj);

    const revenue = invoicesFiltered.filter(i => i.status === "مدفوعة").reduce((sum, i) => sum + i.total, 0);
    const totalExp = expensesFiltered.reduce((sum, e) => sum + e.amount, 0);

    const titleMap: Record<string, string> = {
      pnl: "ملخص الأرباح والخسائر (P&L)",
      invoices: "كشف الفواتير الصادرة والمسددة",
      expenses: "كشف المصروفات التشغيلية والقضائية",
      trust: "كشف حركة حسابات الأمانات (Trust Accounts)",
      receivables: "تقرير الذمم المالية والمطالبات المتأخرة"
    };

    setPrintData({
      type,
      startDate: start,
      endDate: end,
      title: titleMap[type] || "التقرير المالي",
      revenue,
      totalExpenses: totalExp,
      invoices: invoicesFiltered,
      expenses: expensesFiltered,
      trust: trustFiltered,
      receivables: receivablesFiltered
    });

    // Wait for the state to render in DOM
    await new Promise((resolve) => setTimeout(resolve, 400));

    const element = document.getElementById("pdf-report-print-area");
    if (!element) {
      toast.error("حدث خطأ أثناء إعداد منطقة الطباعة");
      setPrintData(null);
      return;
    }

    try {
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import("jspdf"),
        import("html2canvas")
      ]);
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`تقرير_${type}_${Date.now()}.pdf`);
      toast.success("تم تصدير ملف PDF بنجاح");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("فشل تصدير مستند PDF");
    } finally {
      setPrintData(null);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === "csv") {
        exportToCSV(reportType, startDate, endDate);
      } else {
        await handleExportPDF(reportType, startDate, endDate);
      }
      setExportModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء تصدير التقرير المالي");
    } finally {
      setIsExporting(false);
    }
  };

  // Removed global isLoading spinner to improve FCP/LCP
  // Each card and section now handles its own loading state with Skeletons

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Heavy Print Component (Only rendered when printData is set) */}
      {printData && (
        <Suspense fallback={null}>
          <ReportPrintArea printData={printData} />
        </Suspense>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">التحليل المالي المتقدم</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">مراقبة الأداء المالي، التدفقات النقدية، وتحليل المصروفات والربحية.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px] dark:bg-navy-800 dark:border-white/10 h-10">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="اختر الفترة" />
            </SelectTrigger>
            <SelectContent className="dark:bg-navy-800 dark:border-white/10">
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="6_months">آخر 6 أشهر</SelectItem>
              <SelectItem value="year">هذا العام</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setExportModalOpen(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white gap-2 h-10 px-4"
          >
            <Download className="w-4 h-4" />
            تصدير تقرير
          </Button>

          <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
             <DialogContent className="sm:max-w-[480px] dark:bg-navy-900 border-none shadow-2xl p-6 font-sans text-right" dir="rtl">
               <DialogHeader>
                 <DialogTitle className="text-lg font-extrabold text-navy-950 dark:text-white flex items-center gap-2 pb-2 border-b dark:border-white/10">
                   <FileText className="w-5 h-5 text-emerald-600" />
                   تصدير التقرير المالي
                 </DialogTitle>
               </DialogHeader>

               <div className="space-y-5 py-4">
                 <div className="space-y-1.5">
                   <Label className="text-xs font-bold text-slate-500 dark:text-slate-400">نوع التقرير</Label>
                   <Select value={reportType} onValueChange={setReportType}>
                     <SelectTrigger className="w-full text-right dark:bg-navy-800 dark:border-white/10">
                       <SelectValue placeholder="اختر نوع التقرير" />
                     </SelectTrigger>
                     <SelectContent className="dark:bg-navy-800">
                       <SelectItem value="pnl">📊 ملخص الأرباح والخسائر (P&L)</SelectItem>
                       <SelectItem value="invoices">🧾 كشف الفواتير</SelectItem>
                       <SelectItem value="expenses">💸 كشف المصروفات</SelectItem>
                       <SelectItem value="trust">🏛️ حسابات الأمانات</SelectItem>
                       <SelectItem value="receivables">⚖️ تقرير الذمم المالية</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <Label className="text-xs font-bold text-slate-500 dark:text-slate-400">من تاريخ</Label>
                     <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="dark:bg-navy-800 dark:border-white/10 text-right font-mono" />
                   </div>
                   <div className="space-y-1.5">
                     <Label className="text-xs font-bold text-slate-500 dark:text-slate-400">إلى تاريخ</Label>
                     <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="dark:bg-navy-800 dark:border-white/10 text-right font-mono" />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <Label className="text-xs font-bold text-slate-500 dark:text-slate-400">التنسيق</Label>
                   <div className="grid grid-cols-2 gap-2">
                     <Button variant={exportFormat === "pdf" ? "default" : "outline"} onClick={() => setExportFormat("pdf")} className="w-full">PDF</Button>
                     <Button variant={exportFormat === "csv" ? "default" : "outline"} onClick={() => setExportFormat("csv")} className="w-full">CSV</Button>
                   </div>
                 </div>
               </div>

               <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t dark:border-white/10">
                 <Button variant="ghost" onClick={() => setExportModalOpen(false)} disabled={isExporting}>إلغاء</Button>
                 <Button onClick={handleExportReport} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                   {isExporting ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                   تصدير
                 </Button>
               </div>
             </DialogContent>
           </Dialog>
         </div>
       </div>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[140px]">
        <Card className="border-none shadow-sm dark:bg-navy-800 bg-white min-h-[120px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500">إجمالي الإيرادات</p>
                <div className="h-8 flex items-center">
                  {isLoading ? <Skeleton className="h-7 w-24" /> : (
                    <p className="text-2xl font-extrabold font-mono text-navy-900 dark:text-white">
                      {formatEGP(totalRevenue)}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800 bg-white min-h-[120px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500">إجمالي المصروفات</p>
                <div className="h-8 flex items-center">
                  {isLoading ? <Skeleton className="h-7 w-24" /> : (
                    <p className="text-2xl font-extrabold font-mono text-navy-900 dark:text-white">
                      {formatEGP(totalExpenses)}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800 bg-white min-h-[120px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500">صافي الأرباح</p>
                <div className="h-8 flex items-center">
                  {isLoading ? <Skeleton className="h-7 w-24" /> : (
                    <p className={cn(
                      "text-2xl font-extrabold font-mono",
                      netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {formatEGP(netProfit)}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800 bg-white min-h-[120px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500">نسبة التحصيل</p>
                <div className="h-8 flex items-center">
                  {isLoading ? <Skeleton className="h-7 w-12" /> : (
                    <p className="text-2xl font-extrabold font-mono text-navy-900 dark:text-white">
                      {`${collectionRate}%`}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm dark:bg-navy-800 bg-white min-h-[380px]">
          <CardHeader className="pb-2 border-b border-slate-50 dark:border-white/5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={18} />
              التدفق النقدي والربحية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <Suspense fallback={<Skeleton className="h-[280px] w-full" />}>
                <CashFlowChart data={cashFlowHistoryData} />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800 bg-white min-h-[380px]">
          <CardHeader className="pb-2 border-b border-slate-50 dark:border-white/5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Wallet className="text-red-500" size={18} />
              توزيع المصروفات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <Suspense fallback={<Skeleton className="h-[280px] w-full" />}>
                <ExpensePieChart data={expensePieData} colors={COLORS} />
              </Suspense>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid of Aging Chart and High-Revenue cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receivables Aging Chart */}
        <Card className="border-none shadow-sm dark:bg-navy-800 bg-white min-h-[350px]">
          <CardHeader className="pb-2 border-b border-slate-50 dark:border-white/5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} />
              أعمار ذمم المطالبات المعلقة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
                <AgingBarChart data={agingBarData} />
              </Suspense>
            )}
          </CardContent>
        </Card>

        {/* Top 5 High-Revenue Cases */}
        <Card className="lg:col-span-2 border-none shadow-sm dark:bg-navy-800 bg-white min-h-[350px]">
          <CardHeader className="pb-2 border-b border-slate-50 dark:border-white/5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Scale className="text-purple-500" size={18} />
              أعلى 5 قضايا ربحية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                  <TableRow>
                    <TableHead className="text-start font-bold">الموكل</TableHead>
                    <TableHead className="text-start font-bold">المبلغ الكلي</TableHead>
                    <TableHead className="text-start font-bold">المحصل</TableHead>
                    <TableHead className="text-start font-bold">حالة الملف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCases.map((c) => (
                    <TableRow key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-bold text-navy-900 dark:text-white py-4">{c.clientName}</TableCell>
                      <TableCell className="font-mono font-bold">{formatEGP(c.totalAmount)}</TableCell>
                      <TableCell className="font-mono text-emerald-600 font-bold">{formatEGP(c.collectedAmount)}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700">{c.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
