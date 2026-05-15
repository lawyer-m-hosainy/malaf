import { motion } from "motion/react";
import { formatEGP, formatDateEG } from "@/lib/formatEG";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, FileText, CheckCircle2, Clock, AlertTriangle, CheckCircle, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCasesStore } from "@/store/useCasesStore";
import { Case } from "@/types";
import { NewCaseDialog } from "./cases-components";

const services = [
  { title: "توثيق التوكيلات الرسمية", desc: "توكيلات عامة وخاصة في القضايا" },
  { title: "تسجيل العقود", desc: "تسجيل عقود البيع والرهن العقاري" },
  { title: "إشهار الشركات", desc: "تسجيل عقود تأسيس وتعديل الشركات" },
  { title: "محاضر الصلح والاتفاق", desc: "توثيق عقود الصلح الرسمية" },
];

export default function RealEstateRegistry() {
  const cases = useCasesStore(state => state.cases);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);

  const registryCases = cases.filter(c => c.type === 'عقاري').filter(c => {
    const matchesSearch = `${c.plaintiff} ${c.defendant} ${c.firstInstanceNumber || ''}`.includes(searchTerm);
    return matchesSearch;
  });

  const renderStageBadge = (stage: string | undefined) => {
    if (!stage) return <Badge variant="outline">غير محدد</Badge>;
    switch(stage) {
      case 'إيداع': return <Badge variant="outline" className="bg-slate-50 text-slate-700">إيداع</Badge>;
      case 'فحص': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock size={12} className="me-1"/> فحص</Badge>;
      case 'اعتراض': return <Badge className="bg-red-50 text-red-700 border-none hover:bg-red-100"><AlertTriangle size={12} className="me-1"/> اعتراض</Badge>;
      case 'شهر': return <Badge className="bg-emerald-50 text-emerald-700 border-none hover:bg-emerald-100"><CheckCircle size={12} className="me-1"/> تم الشهر</Badge>;
      case 'متداولة': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock size={12} className="me-1"/> متداولة</Badge>;
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
              <Button className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => setIsNewCaseOpen(true)}><Plus size={16}/> طلب جديد</Button>
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
              {registryCases.length > 0 ? registryCases.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="font-bold text-navy-900 dark:text-white">{req.firstInstanceNumber || req.id.slice(0, 8)}</TableCell>
                  <TableCell>{req.plaintiff} ضد {req.defendant}</TableCell>
                  <TableCell>{formatDateEG(req.createdAt || new Date().toISOString())}</TableCell>
                  <TableCell>{renderStageBadge(req.status)}</TableCell>
                  <TableCell className="font-mono text-sm">—</TableCell>
                  <TableCell className="font-bold text-emerald-600">—</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">لا توجد طلبات مسجلة</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <NewCaseDialog 
        open={isNewCaseOpen} 
        onOpenChange={setIsNewCaseOpen} 
      />
    </motion.div>
  );
}
