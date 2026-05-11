import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, CheckCircle2, AlertCircle, Clock, FileText, Plus, Search, Filter, Send, X, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useClientsStore } from "@/store/useClientsStore";
import { formatDateEG, formatEGP } from "@/lib/formatEG";
import { QRCodeSVG } from "qrcode.react";
import { fetchETAInvoices, saveETAInvoice } from "@/services/legalDataService";

// R7-FIX: بيانات المكتب الضريبية (يمكن تغييرها من الإعدادات)
const OFFICE_TAX_REG = '100-234-567'; // رقم التسجيل الضريبي للمكتب
const ETA_ACTIVITY_CODE = '8211';     // كود النشاط — 8211 = خدمات قانونية

interface ETAInvoice {
  id: string;
  client: string;
  clientTaxId: string;
  issuerTaxReg: string;    // R7-FIX: رقم التسجيل الضريبي للمُصدِر
  etaCode: string;          // R7-FIX: كود النشاط بمنظومة ETA
  amount: number;
  vatAmount: number;
  scheduleTax: number;      // R7-FIX: ضريبة جدول 10%
  stampDuty: number;        // R7-FIX: رسم دمغة محاماة
  total: number;
  status: 'مسودة' | 'مرسلة' | 'مقبولة' | 'مرفوضة';
  uuid: string | null;
  date: string;
  description: string;
}

const initialInvoices: ETAInvoice[] = [
  { id: 'ETA-001', client: 'شركة النيل للتجارة والتوريدات', clientTaxId: '123-456-789', issuerTaxReg: OFFICE_TAX_REG, etaCode: ETA_ACTIVITY_CODE, amount: 25000, vatAmount: 3500, scheduleTax: 2500, stampDuty: 20, total: 31020, status: 'مرسلة', uuid: 'ETA-UUID-001', date: '2026-04-01', description: 'أتعاب قضية مدنية' },
  { id: 'ETA-002', client: 'مؤسسة الأهرام الرقمية', clientTaxId: '987-654-321', issuerTaxReg: OFFICE_TAX_REG, etaCode: ETA_ACTIVITY_CODE, amount: 15000, vatAmount: 2100, scheduleTax: 0, stampDuty: 20, total: 17120, status: 'مقبولة', uuid: 'ETA-UUID-002', date: '2026-04-05', description: 'استشارة قانونية' },
  { id: 'ETA-003', client: 'شركة بيراميدز للمقاولات', clientTaxId: '555-123-456', issuerTaxReg: OFFICE_TAX_REG, etaCode: ETA_ACTIVITY_CODE, amount: 45000, vatAmount: 6300, scheduleTax: 4500, stampDuty: 20, total: 55820, status: 'مرفوضة', uuid: null, date: '2026-04-10', description: 'أتعاب قضية عقود' },
  { id: 'ETA-004', client: 'مكتب المستقبل للاستيراد', clientTaxId: '444-789-123', issuerTaxReg: OFFICE_TAX_REG, etaCode: ETA_ACTIVITY_CODE, amount: 8000, vatAmount: 1120, scheduleTax: 0, stampDuty: 20, total: 9140, status: 'مسودة', uuid: null, date: '2026-04-15', description: 'إعداد عقد تأسيس' },
];

export default function ETAInvoicing() {
  const [invoices, setInvoices] = useState<ETAInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ETAInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const clients = useClientsStore(s => s.clients);

  import("react").then((react) => {
    react.useEffect(() => {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const data = await fetchETAInvoices();
          setInvoices(data.map((d: any) => ({
            id: d.id,
            client: d.client_name,
            clientTaxId: d.client_tax_id,
            issuerTaxReg: d.issuer_tax_reg,
            etaCode: d.eta_code,
            amount: d.amount,
            vatAmount: d.vat_amount,
            scheduleTax: d.schedule_tax,
            stampDuty: d.stamp_duty,
            total: d.total,
            status: d.status,
            uuid: d.uuid,
            date: d.date,
            description: d.description,
          })) as ETAInvoice[]);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }, []);
  });

  // فلترة الفواتير
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.client.includes(searchTerm) || inv.id.includes(searchTerm) || inv.description.includes(searchTerm);
      const matchesStatus = statusFilter === 'الكل' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    draft: invoices.filter(i => i.status === 'مسودة').length,
    sent: invoices.filter(i => i.status === 'مرسلة').length,
    accepted: invoices.filter(i => i.status === 'مقبولة').length,
    rejected: invoices.filter(i => i.status === 'مرفوضة').length,
    totalAmount: invoices.reduce((s, i) => s + i.total, 0),
  }), [invoices]);

  const handleSendToETA = async (id: string) => {
    try {
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) return;
      
      const updatedUuid = `ETA-UUID-${Date.now().toString(36)}`;
      
      await saveETAInvoice({
        id: invoice.id,
        status: 'مرسلة',
        uuid: updatedUuid
      });
      
      setInvoices(prev => prev.map(inv =>
        inv.id === id ? { ...inv, status: 'مرسلة' as const, uuid: updatedUuid } : inv
      ));
      toast.success('تم إرسال الفاتورة لمنظومة الضرائب المصرية بنجاح');
    } catch (e) {
      toast.error('حدث خطأ أثناء الإرسال');
    }
  };

  const handleAddInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const amount = parseFloat(form.get('amount') as string) || 0;
    const applyScheduleTax = form.get('scheduleTax') === 'on';
    const vatAmount = amount * 0.14;
    const scheduleTax = applyScheduleTax ? amount * 0.10 : 0;
    const total = amount + vatAmount + scheduleTax + 20;

    const dbInvoice = {
      client_name: form.get('client') as string,
      client_tax_id: form.get('taxId') as string,
      issuer_tax_reg: OFFICE_TAX_REG,
      eta_code: ETA_ACTIVITY_CODE,
      amount,
      vat_amount: vatAmount,
      schedule_tax: scheduleTax,
      stamp_duty: 20,
      total,
      status: 'مسودة',
      uuid: null,
      date: new Date().toISOString().split('T')[0],
      description: form.get('description') as string,
    };

    try {
      await saveETAInvoice(dbInvoice);
      const data = await fetchETAInvoices();
      setInvoices(data.map((d: any) => ({
        id: d.id,
        client: d.client_name,
        clientTaxId: d.client_tax_id,
        issuerTaxReg: d.issuer_tax_reg,
        etaCode: d.eta_code,
        amount: d.amount,
        vatAmount: d.vat_amount,
        scheduleTax: d.schedule_tax,
        stampDuty: d.stamp_duty,
        total: d.total,
        status: d.status,
        uuid: d.uuid,
        date: d.date,
        description: d.description,
      })) as ETAInvoice[]);
      setShowAddDialog(false);
      toast.success('تم إنشاء فاتورة إلكترونية جديدة');
    } catch (err) {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">منظومة الفاتورة الإلكترونية (ETA)</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">ربط الفواتير مع منظومة مصلحة الضرائب المصرية — ضريبة 14% قيمة مضافة.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}><Plus size={16} /> فاتورة جديدة</Button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { title: "مسودة", value: stats.draft, icon: FileText, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-900/20" },
          { title: "مرسلة", value: stats.sent, icon: Clock, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { title: "مقبولة", value: stats.accepted, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
          { title: "مرفوضة", value: stats.rejected, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
          { title: "إجمالي (ج.م)", value: stats.totalAmount.toLocaleString('ar-EG'), icon: Receipt, color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
              <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{s.title}</p><p className="text-lg font-bold text-navy-900 dark:text-white">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="بحث بالاسم أو الرقم..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
        {['الكل', 'مسودة', 'مرسلة', 'مقبولة', 'مرفوضة'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>{s}</Button>
        ))}
      </div>

      {/* الجدول */}
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="pb-4"><CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-primary-500" /> سجل الفواتير الإلكترونية ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400">
                <th className="text-right p-4 font-medium">الرقم</th>
                <th className="text-right p-4 font-medium">العميل</th>
                <th className="text-right p-4 font-medium">الرقم الضريبي</th>
                <th className="text-right p-4 font-medium">المبلغ (ج.م)</th>
                <th className="text-right p-4 font-medium">الضريبة 14%</th>
                <th className="text-right p-4 font-medium">ضريبة جدول 10%</th>
                <th className="text-right p-4 font-medium">الإجمالي</th>
                <th className="text-right p-4 font-medium">التاريخ</th>
                <th className="text-right p-4 font-medium">الحالة</th>
                <th className="text-right p-4 font-medium">إجراء</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs">{inv.id}</td>
                    <td className="p-4 font-bold text-navy-900 dark:text-white">{inv.client}</td>
                    <td className="p-4 font-mono text-xs text-slate-500">{inv.clientTaxId}</td>
                    <td className="p-4">{inv.amount.toLocaleString('ar-EG')}</td>
                    <td className="p-4 text-amber-600">{inv.vatAmount.toLocaleString('ar-EG')}</td>
                    <td className="p-4 text-purple-600">{inv.scheduleTax > 0 ? inv.scheduleTax.toLocaleString('ar-EG') : '-'}</td>
                    <td className="p-4 font-bold">{inv.total.toLocaleString('ar-EG')}</td>
                    <td className="p-4 text-slate-500">{formatDateEG(inv.date)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        inv.status === 'مقبولة' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        inv.status === 'مرفوضة' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        inv.status === 'مرسلة' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {inv.status === 'مسودة' && (
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleSendToETA(inv.id)}>
                            <Send size={12} /> إرسال للضرائب
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(inv)}><Eye size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-500">لا توجد فواتير مطابقة للبحث</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog إضافة فاتورة */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddDialog(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">فاتورة إلكترونية جديدة</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddDialog(false)}><X size={18} /></Button>
            </div>
            <form onSubmit={handleAddInvoice} className="space-y-4">
              <div><Label>اسم العميل</Label><Input name="client" required placeholder="مثال: شركة النيل للتجارة" /></div>
              <div><Label>الرقم الضريبي للعميل</Label><Input name="taxId" required placeholder="مثال: 123-456-789" /></div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/20 rounded-md space-y-1">
                <p className="text-xs text-slate-500">رقم التسجيل الضريبي للمكتب: <span className="font-mono font-bold">{OFFICE_TAX_REG}</span></p>
                <p className="text-xs text-slate-500">كود النشاط (ETA): <span className="font-mono font-bold">{ETA_ACTIVITY_CODE}</span> — خدمات قانونية</p>
              </div>
              <div><Label>المبلغ الأساسي (ج.م)</Label><Input name="amount" type="number" required min="1" placeholder="25000" /></div>
              <div><Label>وصف الخدمة</Label><Input name="description" required placeholder="أتعاب قضية مدنية" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="scheduleTax" name="scheduleTax" className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <Label htmlFor="scheduleTax">تطبيق ضريبة جدول 10% (استشارات وخدمات قانونية)</Label>
              </div>
              <p className="text-xs text-slate-500">* ضريبة القيمة المضافة 14% + دمغة محاماة 20 ج.م ستُحسب تلقائياً</p>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
                <Button type="submit">إنشاء الفاتورة</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dialog عرض التفاصيل */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedInvoice(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">فاتورة {selectedInvoice.id}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}><X size={18} /></Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">العميل:</span><span className="font-bold">{selectedInvoice.client}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">الرقم الضريبي للعميل:</span><span className="font-mono">{selectedInvoice.clientTaxId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">رقم تسجيل المكتب:</span><span className="font-mono">{selectedInvoice.issuerTaxReg}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">كود النشاط (ETA):</span><span className="font-mono">{selectedInvoice.etaCode}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">المبلغ الأساسي:</span><span>{selectedInvoice.amount.toLocaleString('ar-EG')} ج.م</span></div>
              <div className="flex justify-between"><span className="text-slate-500">ضريبة 14%:</span><span className="text-amber-600">{selectedInvoice.vatAmount.toLocaleString('ar-EG')} ج.م</span></div>
              {selectedInvoice.scheduleTax > 0 && <div className="flex justify-between"><span className="text-slate-500">ضريبة جدول 10%:</span><span className="text-purple-600">{selectedInvoice.scheduleTax.toLocaleString('ar-EG')} ج.م</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">دمغة محاماة:</span><span>{selectedInvoice.stampDuty} ج.م</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-bold">الإجمالي:</span><span className="font-bold text-lg">{selectedInvoice.total.toLocaleString('ar-EG')} ج.م</span></div>
              <div className="flex justify-between"><span className="text-slate-500">الوصف:</span><span>{selectedInvoice.description}</span></div>
              {selectedInvoice.uuid && <div className="flex justify-between"><span className="text-slate-500">UUID منظومة ETA:</span><span className="font-mono text-xs">{selectedInvoice.uuid}</span></div>}
              {/* R7-FIX: QR Code للفاتورة الإلكترونية */}
              <div className="flex flex-col items-center pt-3 border-t">
                <p className="text-xs text-slate-500 mb-2">رمز QR الفاتورة الإلكترونية</p>
                <QRCodeSVG
                  value={JSON.stringify({
                    seller: selectedInvoice.issuerTaxReg,
                    buyer: selectedInvoice.clientTaxId,
                    total: selectedInvoice.total,
                    vat: selectedInvoice.vatAmount,
                    date: selectedInvoice.date,
                    uuid: selectedInvoice.uuid || selectedInvoice.id,
                    code: selectedInvoice.etaCode,
                  })}
                  size={120}
                  className="dark:bg-white dark:p-2 dark:rounded"
                />
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={() => setSelectedInvoice(null)}>إغلاق</Button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
