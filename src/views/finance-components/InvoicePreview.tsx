import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatEGP, formatDateEG } from "@/lib/formatEG";
import { toast } from "sonner";

const SELLER_NAME = "مكتب الملف للمحاماة والاستشارات القانونية";
const TAX_REG_NUMBER = "100-200-300";

function generateETAQR(seller: string, taxReg: string, date: string, total: string, vat: string): string {
  return `ETA|${seller}|${taxReg}|${date}|${total}|${vat}`;
}

export default function InvoicePreview({ 
  inv, 
  open, 
  onOpenChange 
}: { 
  inv: any; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-navy-900 p-0 overflow-hidden">
        <div className="p-8 space-y-8" id={`invoice-print-${inv.id}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-navy-900 dark:text-white">{SELLER_NAME}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">رقم التسجيل الضريبي: {TAX_REG_NUMBER}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">القاهرة، جمهورية مصر العربية</p>
            </div>
            <div className="text-end space-y-1">
              <h3 className="text-xl font-bold text-primary-600 dark:text-primary-400">فاتورة ضريبية</h3>
              <p className="text-sm font-mono dark:text-slate-300">{inv.id}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateEG(inv.date)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 py-6 border-y border-slate-100 dark:border-white/10">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">فاتورة إلى:</p>
              <p className="font-bold text-navy-900 dark:text-white">{inv.clientName}</p>
            </div>
            <div className="text-end">
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">حالة الدفع:</p>
              <Badge className={inv.status === 'مدفوعة' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                {inv.status}
              </Badge>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="dark:border-white/10">
                <TableHead className="text-start dark:text-white">الوصف</TableHead>
                <TableHead className="text-end dark:text-white">المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="dark:border-white/10">
                <TableCell className="font-medium dark:text-slate-300">أتعاب قانونية - تمثيل قضائي</TableCell>
                <TableCell className="text-end dark:text-white">{formatEGP(inv.base)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex justify-between items-end pt-6">
            <div className="p-2 border border-slate-100 dark:border-white/10 rounded-lg bg-white dark:bg-navy-900">
              <QRCodeSVG 
                value={generateETAQR(SELLER_NAME, TAX_REG_NUMBER, inv.date, inv.total.toString(), inv.vat.toString())} 
                size={100}
              />
              <p className="text-[8px] text-center mt-1 text-slate-400 font-bold">فاتورة إلكترونية مصرية (ETA)</p>
            </div>
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">المبلغ الخاضع للضريبة:</span>
                <span className="font-bold dark:text-white">{formatEGP(inv.base)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">ضريبة القيمة المضافة (14%):</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">{formatEGP(inv.vat)}</span>
              </div>
              <div className="flex justify-between text-lg border-t border-slate-100 dark:border-white/10 pt-2">
                <span className="font-bold text-navy-900 dark:text-white">الإجمالي المستحق:</span>
                <span className="font-bold text-navy-900 dark:text-white">{formatEGP(inv.total)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 p-4 flex justify-end gap-3">
          <Button variant="outline" className="gap-2 dark:border-white/10" onClick={() => {
            toast.success("جاري تصدير الفاتورة كـ PDF...");
            setTimeout(() => window.print(), 500);
          }}>
            <Download size={16} />
            تحميل PDF
          </Button>
          <Button className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => window.print()}>
            <Printer size={16} />
            طباعة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
