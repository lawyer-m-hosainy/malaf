import { motion } from "motion/react";
import { formatEGP, formatDateEG } from "@/lib/formatEG";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, FileText, CheckCircle2, Clock, AlertTriangle, CheckCircle, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const services = [
  { title: "توثيق التوكيلات الرسمية", desc: "توكيلات عامة وخاصة في القضايا" },
  { title: "تسجيل العقود", desc: "تسجيل عقود البيع والرهن العقاري" },
  { title: "إشهار الشركات", desc: "تسجيل عقود تأسيس وتعديل الشركات" },
  { title: "محاضر الصلح والاتفاق", desc: "توثيق عقود الصلح الرسمية" },
];

export default function RealEstateRegistry() {
  const [requests] = useState([
    {
      id: "REQ-2026-901",
      contractType: "بيع عقار مسجل",
      depositDate: "2026-04-10",
      stage: "فحص",
      expectedMonthDate: "2026-05-15",
      fees: 15000,
      notes: "تم دفع الرسوم المبدئية"
    },
    {
      id: "REQ-2026-905",
      contractType: "توكيل عام قضايا",
      depositDate: "2026-05-01",
      stage: "إيداع",
      expectedMonthDate: "2026-05-02",
      fees: 150,
      notes: ""
    },
    {
      id: "REQ-2026-880",
      contractType: "تسجيل شركة",
      depositDate: "2026-03-20",
      stage: "اعتراض",
      expectedMonthDate: "-",
      fees: 5000,
      notes: "نقص مستندات المساحة"
    },
    {
      id: "REQ-2026-800",
      contractType: "رهن عقاري",
      depositDate: "2026-02-15",
      stage: "شهر",
      expectedMonthDate: "2026-03-15",
      fees: 30000,
      notes: "مكتمل"
    }
  ]);

  const renderStageBadge = (stage: string) => {
    switch(stage) {
      case 'إيداع': return <Badge variant="outline" className="bg-slate-50 text-slate-700">إيداع</Badge>;
      case 'فحص': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock size={12} className="me-1"/> فحص</Badge>;
      case 'اعتراض': return <Badge className="bg-red-50 text-red-700 border-none hover:bg-red-100"><AlertTriangle size={12} className="me-1"/> اعتراض</Badge>;
      case 'شهر': return <Badge className="bg-emerald-50 text-emerald-700 border-none hover:bg-emerald-100"><CheckCircle size={12} className="me-1"/> تم الشهر</Badge>;
      default: return <Badge>{stage}</Badge>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">الشهر العقاري والتوثيق</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">متابعة إجراءات التوثيق والتسجيل بمكاتب الشهر العقاري.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((svc, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800 hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center shrink-0">
                <Home className="w-6 h-6 text-violet-500" />
              </div>
              <div>
                <h3 className="font-bold text-navy-900 dark:text-white mb-1">{svc.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{svc.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="pb-4 border-b border-slate-50 dark:border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" /> طلبات الشهر العقاري
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input placeholder="بحث برقم الطلب..." className="pr-10 dark:bg-navy-900" />
              </div>
              <Button className="bg-primary-500 text-white gap-2"><Plus size={16}/> طلب جديد</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow>
                <TableHead className="font-bold">رقم الطلب</TableHead>
                <TableHead className="font-bold">نوع العقد</TableHead>
                <TableHead className="font-bold">تاريخ الإيداع</TableHead>
                <TableHead className="font-bold">المرحلة</TableHead>
                <TableHead className="font-bold">تاريخ الشهر المتوقع</TableHead>
                <TableHead className="font-bold">رسوم الشهر</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="font-bold text-navy-900 dark:text-white">{req.id}</TableCell>
                  <TableCell>{req.contractType}</TableCell>
                  <TableCell>{formatDateEG(req.depositDate)}</TableCell>
                  <TableCell>{renderStageBadge(req.stage)}</TableCell>
                  <TableCell className="font-mono text-sm">{req.expectedMonthDate !== '-' ? formatDateEG(req.expectedMonthDate) : '—'}</TableCell>
                  <TableCell className="font-bold text-emerald-600">{formatEGP(req.fees)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
