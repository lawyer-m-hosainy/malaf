import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, handleExportPDF } from "./financeUtils";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: any[];
  expenses: any[];
  trustTransactions: any[];
  receivables: any[];
}

/**
 * Financial report export dialog with CSV/PDF support.
 * @param {ExportDialogProps} props - Dialog state and data.
 * @returns {JSX.Element} Export dialog component.
 */
export function ExportReportDialog({
  open, onOpenChange, invoices, expenses, trustTransactions, receivables
}: ExportDialogProps) {
  const [reportType, setReportType] = useState("pnl");
  const [startDate, setStartDate] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = { type: reportType, start: startDate, end: endDate, invoices, expenses, trustTransactions, receivables };
      if (exportFormat === "csv") { exportToCSV(params); } else { await handleExportPDF({ ...params, setPrintData: () => {} }); }
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء تصدير التقرير المالي");
    } finally { setIsExporting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] dark:bg-navy-900 border-none shadow-2xl p-6 font-sans text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-navy-950 dark:text-white flex items-center gap-2 pb-2 border-b dark:border-white/10">
            <FileText className="w-5 h-5 text-emerald-600" />
            تصدير التقرير المالي
          </DialogTitle>
        </DialogHeader>
        <ExportFormFields reportType={reportType} setReportType={setReportType} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} exportFormat={exportFormat} setExportFormat={setExportFormat} />
        <ExportFooter isExporting={isExporting} onCancel={() => onOpenChange(false)} onExport={handleExport} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Footer buttons for the export dialog.
 * @param {{ isExporting: boolean; onCancel: () => void; onExport: () => void }} props - Props.
 * @returns {JSX.Element} Footer element.
 */
function ExportFooter({ isExporting, onCancel, onExport }: { isExporting: boolean; onCancel: () => void; onExport: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t dark:border-white/10">
      <Button variant="ghost" onClick={onCancel} disabled={isExporting}>إلغاء</Button>
      <Button onClick={onExport} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
        {isExporting ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
        تصدير
      </Button>
    </div>
  );
}

interface FormFieldsProps {
  reportType: string;
  setReportType: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  exportFormat: string;
  setExportFormat: (v: string) => void;
}

/**
 * Form fields for the export dialog (report type, date range, format).
 * @param {FormFieldsProps} props - Form state and setters.
 * @returns {JSX.Element} Form fields.
 */
function ExportFormFields({
  reportType, setReportType, startDate, setStartDate, endDate, setEndDate, exportFormat, setExportFormat
}: FormFieldsProps) {
  return (
    <div className="space-y-5 py-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-500 dark:text-slate-400">نوع التقرير</Label>
        <Select value={reportType} onValueChange={(v) => v && setReportType(v)}>
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
  );
}
