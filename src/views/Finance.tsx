import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calculator, Receipt, TrendingUp, DollarSign, Printer, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

import { toast } from "sonner";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useInvoicesStore } from "@/store/useInvoicesStore";
import { generateInvoiceId } from "@/lib/invoice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invoiceSchema } from "@/lib/schemas";
import { ZodError } from "zod";

import { Skeleton } from "@/components/ui/skeleton";
import { formatEGP, formatDateEG } from "@/lib/formatEG";

// بيانات المكتب للفاتورة الإلكترونية المصرية (ETA)
const SELLER_NAME = "مكتب الملف للمحاماة والاستشارات القانونية";
const TAX_REG_NUMBER = "100-200-300"; // رقم التسجيل الضريبي

/** Generates a simple ETA-compliant QR value for Egyptian e-invoicing */
function generateETAQR(seller: string, taxReg: string, date: string, total: string, vat: string): string {
  return `ETA|${seller}|${taxReg}|${date}|${total}|${vat}`;
}

const MemoizedInvoiceRow = React.memo(({ 
  inv, 
  onUpdateStatus, 
  onRemove 
}: { 
  inv: any; 
  onUpdateStatus: (id: string, status: string) => void; 
  onRemove: (id: string) => void; 
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
  <TableRow className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
    <TableCell className="font-mono text-xs font-bold dark:text-slate-300">{inv.id}</TableCell>
    <TableCell className="font-bold text-navy-900 dark:text-white">{inv.clientName}</TableCell>
    <TableCell className="text-sm dark:text-slate-300">{formatEGP(inv.base)}</TableCell>
    <TableCell className="text-sm text-primary-600 dark:text-primary-400">{formatEGP(inv.vat)}</TableCell>
    <TableCell className="font-bold text-navy-900 dark:text-white">{formatEGP(inv.total)}</TableCell>
    <TableCell>
      <Badge className={cn(
        "font-bold",
        inv.status === 'مدفوعة' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : 
        inv.status === 'غير مدفوعة' ? "bg-destructive/10 text-destructive" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
      )}>
        {inv.status}
      </Badge>
    </TableCell>
    <TableCell className="text-end">
      <div className="flex justify-end items-center gap-2">
        <Button variant="ghost" size="sm" className="text-xs text-amber-500 hover:text-amber-600" onClick={() => onUpdateStatus(inv.id, inv.status === 'مدفوعة' ? 'غير مدفوعة' : 'مدفوعة')}>
          تغيير الحالة
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-red-700" onClick={() => onRemove(inv.id)}>
          حذف
        </Button>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <Button type="button" variant="ghost" size="sm" className="text-primary-600 dark:text-primary-400 gap-2" onClick={() => setPreviewOpen(true)}>
          <Printer size={14} />
          استعراض
        </Button>
        <DialogContent className="max-w-2xl bg-white dark:bg-navy-900 p-0 overflow-hidden">
          <div className="p-8 space-y-8" id={`invoice-${inv.id}`}>
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
      </div>
    </TableCell>
  </TableRow>
  );
});

export default function Finance() {
  const invoices = useInvoicesStore(state => state.invoices);
  const isLoading = useInvoicesStore(state => state.isLoading);
  const addInvoice = useInvoicesStore(state => state.addInvoice);
  const removeInvoice = useInvoicesStore(state => state.removeInvoice);
  const updateInvoiceStatus = useInvoicesStore(state => state.updateInvoiceStatus);
  const loadInvoices = useInvoicesStore(state => state.loadInvoices);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ clientName: "", clientId: "", base: "" });

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Use useCallback so that MemoizedInvoiceRow dependencies don't change
  const handleUpdateStatus = useCallback((id: string, status: string) => {
    updateInvoiceStatus(id, status as "مدفوعة" | "غير مدفوعة" | "مسودة");
  }, [updateInvoiceStatus]);

  const handleRemove = useCallback((id: string) => {
    removeInvoice(id);
  }, [removeInvoice]);

  const handleCreateInvoice = async () => {
    const baseNum = parseFloat(newInvoice.base);
    
    try {
      invoiceSchema.parse({
        ...newInvoice,
        base: baseNum
      });

      await addInvoice({
        id: generateInvoiceId(),
        clientId: newInvoice.clientId || `C-${Date.now()}`,
        clientName: newInvoice.clientName,
        base: baseNum,
        status: 'مسودة',
        date: new Date().toISOString()
      });
      toast.success("تم تسجيل الفاتورة بنجاح في السجلات المعزولة والآمنة");
      setIsDialogOpen(false);
      setNewInvoice({ clientName: "", clientId: "", base: "" });
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error("حدث خطأ أثناء حفظ الفاتورة");
      }
    }
  };

  const totalRevenue = useMemo(() => invoices.reduce((sum, i) => sum + i.total, 0), [invoices]);
  const totalVat = useMemo(() => invoices.reduce((sum, i) => sum + i.vat, 0), [invoices]);
  const unpaid = useMemo(() => invoices.filter(i => i.status === 'غير مدفوعة').reduce((sum, i) => sum + i.total, 0), [invoices]);
  const unpaidCount = useMemo(() => invoices.filter(i => i.status === 'غير مدفوعة').length, [invoices]);
  const netProfit = totalRevenue - totalVat; 

  const stats = [
    { title: "إجمالي الإيرادات", value: formatEGP(totalRevenue), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", trend: "فعلي", trendColor: "text-emerald-600" },
    { title: "ضريبة القيمة المضافة (14%)", value: formatEGP(totalVat), icon: Calculator, color: "text-primary-500", bg: "bg-primary-50", trend: "مستحقة", trendColor: "text-primary-600" },
    { title: "فواتير غير مدفوعة", value: formatEGP(unpaid), icon: Receipt, color: "text-amber-500", bg: "bg-amber-50", trend: `${unpaidCount} فواتير`, trendColor: "text-amber-600" },
    { title: "صافي الربح", value: formatEGP(netProfit), icon: DollarSign, color: "text-blue-500", bg: "bg-blue-50", trend: "تقريبي", trendColor: "text-blue-600" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">المالية والضريبة</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة الفواتير، التحصيل، وحساب ضريبة القيمة المضافة (14%).</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button type="button" className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => setIsDialogOpen(true)}>
            <Receipt size={18} />
            إنشاء فاتورة ضريبية
          </Button>
          <DialogContent className="sm:max-w-md border-none shadow-2xl dark:bg-navy-900">
            <DialogHeader>
              <DialogTitle className="text-navy-900 dark:text-white">إصدار فاتورة ضريبية جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">اسم العميل</Label>
                <Input 
                  id="clientName" 
                  value={newInvoice.clientName} 
                  onChange={(e) => setNewInvoice({...newInvoice, clientName: e.target.value})} 
                  placeholder="شركة مثال..." 
                  className="dark:bg-white/5" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base">المبلغ الأساسي (قبل الضريبة)</Label>
                <Input 
                  id="base" 
                  type="number" 
                  value={newInvoice.base} 
                  onChange={(e) => setNewInvoice({...newInvoice, base: e.target.value})} 
                  placeholder="مثال: 5000" 
                  className="dark:bg-white/5" 
                />
              </div>
              <Button onClick={handleCreateInvoice} className="w-full bg-primary-600 hover:bg-primary-700 text-white">حفظ وحساب الضريبة آلياً</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg", stat.bg, "dark:bg-primary-900/20")}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-white/5", stat.trendColor)}>
                  {stat.trend}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
              <p className="text-xl font-bold text-navy-900 dark:text-white mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-white/5 pb-4">
          <CardTitle className="text-lg font-bold text-navy-900 dark:text-white">آخر الفواتير الصادرة</CardTitle>
          <Button variant="ghost" className="text-primary-600 dark:text-primary-400 text-sm" onClick={() => {
            const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoices, null, 2));
            const link = document.createElement("a");
            link.setAttribute("href", jsonContent);
            link.setAttribute("download", "eta_report.json");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("تم تصدير تقرير الفاتورة الإلكترونية بنجاح");
          }}>تصدير تقرير الفاتورة الإلكترونية</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">رقم الفاتورة</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">العميل</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">المبلغ الأساسي</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الضريبة (14%)</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الإجمالي</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الحالة</TableHead>
                <TableHead className="text-end font-bold text-navy-900 dark:text-white">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="p-4">
                      <Skeleton className="h-12 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : invoices.length > 0 ? (
                invoices.map(inv => (
                  <MemoizedInvoiceRow 
                    key={inv.id} 
                    inv={inv} 
                    onUpdateStatus={handleUpdateStatus} 
                    onRemove={handleRemove} 
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Receipt size={48} className="opacity-20" />
                      <p>لا توجد فواتير مسجلة حالياً</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
