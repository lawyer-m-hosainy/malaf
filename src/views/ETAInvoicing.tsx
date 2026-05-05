import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const mockETAInvoices = [
  { id: 'ETA-001', client: 'شركة النيل للتجارة والتوريدات', amount: 25000, status: 'مرسلة', uuid: 'ETA-UUID-001', date: '2026-04-01' },
  { id: 'ETA-002', client: 'مؤسسة الأهرام الرقمية', amount: 15000, status: 'مقبولة', uuid: 'ETA-UUID-002', date: '2026-04-05' },
  { id: 'ETA-003', client: 'شركة بيراميدز للمقاولات', amount: 45000, status: 'مرفوضة', uuid: null, date: '2026-04-10' },
];

export default function ETAInvoicing() {
  const [invoices] = useState(mockETAInvoices);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">منظومة الفاتورة الإلكترونية (ETA)</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">ربط الفواتير مع منظومة مصلحة الضرائب المصرية.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "فواتير مرسلة", value: invoices.filter(i => i.status === 'مرسلة').length, icon: Clock, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { title: "فواتير مقبولة", value: invoices.filter(i => i.status === 'مقبولة').length, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
          { title: "فواتير مرفوضة", value: invoices.filter(i => i.status === 'مرفوضة').length, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
              <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.title}</p><p className="text-2xl font-bold text-navy-900 dark:text-white">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="pb-4"><CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-primary-500" /> سجل الفواتير الإلكترونية</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {invoices.map(inv => (
              <div key={inv.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between">
                <div>
                  <p className="font-bold text-navy-900 dark:text-white">{inv.client}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span>{inv.amount.toLocaleString('ar-EG')} ج.م</span>
                    <span>{inv.date}</span>
                    {inv.uuid && <span className="text-xs font-mono">{inv.uuid}</span>}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  inv.status === 'مقبولة' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  inv.status === 'مرفوضة' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>{inv.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
