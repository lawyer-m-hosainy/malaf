import { formatEGP } from "@/lib/formatEG";
import { toast } from "sonner";

/** Harmonic colors for Pie Chart. */
export const COLORS = [
  "#16a34a", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#10b981", "#64748b"
];

/** Arabic month name labels. */
export const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

/**
 * Calculates days past a due date.
 * @param {string} dueDate - ISO date string.
 * @returns {number} Days past due (min 0).
 */
export function daysPastDue(dueDate: string): number {
  const due = new Date(dueDate).getTime();
  const diff = Math.floor((Date.now() - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Maps days past due to an aging bucket label.
 * @param {number} days - Number of days past due.
 * @returns {string} Arabic aging bucket label.
 */
export function agingBucket(days: number): string {
  if (days <= 0) return "حالي";
  if (days <= 30) return "1-30 يوم";
  if (days <= 60) return "31-60 يوم";
  if (days <= 90) return "61-90 يوم";
  return "+90 يوم";
}

/**
 * Filters items by time period.
 * @param {T[]} items - Array of items with date fields.
 * @param {string} timePeriod - "month" | "year" | "6_months".
 * @returns {T[]} Filtered array.
 */
export const filterByPeriod = <T extends { date?: string; transactionDate?: string; created_at?: string }>(
  items: T[],
  timePeriod: string
): T[] => {
  const now = new Date();
  return items.filter(item => {
    const dateStr = item.date || item.transactionDate || item.created_at;
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return false;
    if (timePeriod === "month") {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    } else if (timePeriod === "year") {
      return itemDate.getFullYear() === now.getFullYear();
    }
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    return itemDate >= sixMonthsAgo;
  });
};

interface FilteredDataParams {
  invoices: any[];
  expenses: any[];
  trustTransactions: any[];
  receivables: any[];
  start: Date;
  end: Date;
}

/**
 * Filters all financial data arrays by a date range.
 * @param {FilteredDataParams} params - Data arrays and date range.
 * @returns {object} Filtered data arrays.
 */
export const getFilteredData = ({
  invoices, expenses, trustTransactions, receivables, start, end
}: FilteredDataParams) => {
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const dateFilter = (dateField: string | undefined) => {
    if (!dateField) return false;
    const d = dateField.split('T')[0];
    return d >= startStr && d <= endStr;
  };

  return {
    invoicesFiltered: invoices.filter(i => dateFilter(i.date)),
    expensesFiltered: expenses.filter(e => dateFilter(e.date)),
    trustFiltered: trustTransactions.filter(t => dateFilter(t.transactionDate)),
    receivablesFiltered: receivables.filter(r => dateFilter(r.createdAt)),
  };
};

interface ExportCSVParams {
  type: string;
  start: string;
  end: string;
  invoices: any[];
  expenses: any[];
  trustTransactions: any[];
  receivables: any[];
}

/**
 * Exports financial data to a CSV file.
 * @param {ExportCSVParams} params - Report type, date range, and data.
 * @returns {void}
 */
export const exportToCSV = ({
  type, start, end, invoices, expenses, trustTransactions, receivables
}: ExportCSVParams): void => {
  const filtered = getFilteredData({
    invoices, expenses, trustTransactions, receivables,
    start: new Date(start), end: new Date(end)
  });

  let csv = "\uFEFF";
  csv += buildCSVBody({
    type, start, end, ...filtered
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `تقرير_مالي_${type}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("تم تصدير ملف Excel بنجاح");
};

interface CSVBodyParams {
  type: string;
  start: string;
  end: string;
  invoicesFiltered: any[];
  expensesFiltered: any[];
  trustFiltered: any[];
  receivablesFiltered: any[];
}

/**
 * Builds the CSV content body based on report type.
 * @param {CSVBodyParams} p - Report type and filtered data.
 * @returns {string} CSV string content.
 */
function buildCSVBody(p: CSVBodyParams): string {
  if (p.type === "pnl") return buildPnlCSV(p);
  if (p.type === "invoices") return buildInvoicesCSV(p);
  if (p.type === "expenses") return buildExpensesCSV(p);
  if (p.type === "trust") return buildTrustCSV(p);
  if (p.type === "receivables") return buildReceivablesCSV(p);
  return "";
}

function buildPnlCSV({ start, end, invoicesFiltered, expensesFiltered }: CSVBodyParams): string {
  const revenue = invoicesFiltered.filter(i => i.status === "مدفوعة").reduce((s, i) => s + i.total, 0);
  const totalExp = expensesFiltered.reduce((s, e) => s + e.amount, 0);
  const vat = revenue * 0.14;
  let c = `مكتب المحاماة والخدمات القانونية\n`;
  c += `التقرير المالي - الأرباح والخسائر P&L (${start} إلى ${end})\n\n`;
  c += `البند,المبلغ (ج.م)\nإجمالي الأتعاب المحصلة,${revenue}\n`;
  c += `ضريبة القيمة المضافة (14%),${vat}\nإجمالي الإيرادات,${revenue + vat}\n`;
  c += `إجمالي المصروفات,${totalExp}\nصافي الربح التشغيلي,${revenue - totalExp}\n`;
  return c;
}

function buildInvoicesCSV({ start, end, invoicesFiltered }: CSVBodyParams): string {
  let c = `كشف الفواتير الصادرة والمسددة\nالفترة: من ${start} إلى ${end}\n\n`;
  c += "رقم الفاتورة,تاريخ الإصدار,الموكل,المبلغ الإجمالي (ج.م),الحالة\n";
  invoicesFiltered.forEach(i => {
    c += `"${i.id}","${i.date}","${i.clientName || 'غير محدد'}",${i.total},"${i.status}"\n`;
  });
  return c;
}

function buildExpensesCSV({ start, end, expensesFiltered }: CSVBodyParams): string {
  let c = `كشف المصروفات التشغيلية والقضائية\nالفترة: من ${start} إلى ${end}\n\n`;
  c += "التاريخ,البند / الوصف,التصنيف,حالة السداد,المبلغ (ج.م)\n";
  expensesFiltered.forEach(e => {
    c += `"${e.date}","${e.description || '—'}","${e.category}","${e.status}",${e.amount}\n`;
  });
  return c;
}

function buildTrustCSV({ start, end, trustFiltered }: CSVBodyParams): string {
  let c = `كشف حركة حسابات الأمانات (Trust Accounts)\nالفترة: من ${start} إلى ${end}\n\n`;
  c += "التاريخ,الموكل,القضية,النوع,الوصف,رقم الإيصال,المبلغ (ج.م)\n";
  trustFiltered.forEach(t => {
    const typeStr = t.transactionType === "deposit" ? "إيداع" : "سحب";
    c += `"${t.transactionDate ? t.transactionDate.split('T')[0] : ''}","${t.clientName || '—'}","${t.caseName || '—'}","${typeStr}","${t.description || '—'}","${t.receiptNumber || '—'}",${t.amount}\n`;
  });
  return c;
}

function buildReceivablesCSV({ start, end, receivablesFiltered }: CSVBodyParams): string {
  let c = `تقرير الذمم المالية والمطالبات المتأخرة\nالفترة: من ${start} إلى ${end}\n\n`;
  c += "الموكل,رقم القضية,المبلغ الإجمالي (ج.م),المحصل الفعلي (ج.م),الذمم المعلقة (ج.م),تاريخ الاستحقاق,الحالة\n";
  receivablesFiltered.forEach(r => {
    c += `"${r.clientName || '—'}","${r.caseId || '—'}",${r.totalAmount},${r.collectedAmount},${r.outstandingAmount},"${r.dueDate || '—'}","${r.status}"\n`;
  });
  return c;
}

interface ExportPDFParams {
  type: string;
  start: string;
  end: string;
  invoices: any[];
  expenses: any[];
  trustTransactions: any[];
  receivables: any[];
  setPrintData: (data: any) => void;
}

/**
 * Exports financial data to a PDF file via html2canvas + jsPDF.
 * @param {ExportPDFParams} params - Report parameters and data.
 * @returns {Promise<void>}
 */
export const handleExportPDF = async ({
  type, start, end, invoices, expenses, trustTransactions, receivables, setPrintData
}: ExportPDFParams): Promise<void> => {
  const filtered = getFilteredData({
    invoices, expenses, trustTransactions, receivables,
    start: new Date(start), end: new Date(end)
  });

  const revenue = filtered.invoicesFiltered.filter(i => i.status === "مدفوعة").reduce((s, i) => s + i.total, 0);
  const totalExp = filtered.expensesFiltered.reduce((s, e) => s + e.amount, 0);

  const titleMap: Record<string, string> = {
    pnl: "ملخص الأرباح والخسائر (P&L)",
    invoices: "كشف الفواتير الصادرة والمسددة",
    expenses: "كشف المصروفات التشغيلية والقضائية",
    trust: "كشف حركة حسابات الأمانات (Trust Accounts)",
    receivables: "تقرير الذمم المالية والمطالبات المتأخرة"
  };

  setPrintData({
    type, startDate: start, endDate: end,
    title: titleMap[type] || "التقرير المالي",
    revenue, totalExpenses: totalExp,
    invoices: filtered.invoicesFiltered,
    expenses: filtered.expensesFiltered,
    trust: filtered.trustFiltered,
    receivables: filtered.receivablesFiltered
  });

  await new Promise((resolve) => setTimeout(resolve, 400));
  await renderPDF(type, setPrintData);
};

/**
 * Renders the PDF from the DOM print area element.
 * @param {string} type - Report type identifier.
 * @param {Function} setPrintData - State setter to clear print data.
 * @returns {Promise<void>}
 */
async function renderPDF(type: string, setPrintData: (data: any) => void): Promise<void> {
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

    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
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
}

/** Receivable data from Supabase with snake_case fields. */
export interface Receivable {
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

/**
 * Maps a Receivable from snake_case to camelCase.
 * @param {Receivable} d - Raw receivable data.
 * @returns {object} Mapped receivable object.
 */
export function mapReceivable(d: Receivable) {
  return {
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
  };
}
