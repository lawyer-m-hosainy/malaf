import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, ShieldCheck, User, Activity, Search, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import { useUIStore } from '@/store/useUIStore';

export default function AuditLogs() {
  const auditLogs = useUIStore((state) => state.auditLogs);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">سجل العمليات (Audit Logs)</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تتبع كافة الأنشطة والتغييرات التي تتم على النظام لضمان الشفافية والأمن.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => {
          const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
            "المستخدم,العملية,الوحدة,التفاصيل,التوقيت,IP\n" + 
            auditLogs.map(l => `${l.userName},${l.action},${l.module},${l.details},${l.timestamp},${l.ipAddress || '192.168.1.1'}`).join('\n');
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "audit_logs.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("تم تصدير سجل العمليات");
        }}>
          <Download size={18} />
          تصدير السجل
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="البحث في العمليات، الموظفين، أو الوحدات..." 
            className="w-full ps-10 h-10 rounded-md border-none bg-white dark:bg-navy-800 shadow-sm dark:bg-navy-800 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={18} />
          تصفية
        </Button>
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-white/5">
              <TableRow>
                <TableHead className="text-start">المستخدم</TableHead>
                <TableHead className="text-start">العملية</TableHead>
                <TableHead className="text-start">الوحدة</TableHead>
                <TableHead className="text-start">التفاصيل</TableHead>
                <TableHead className="text-start">التوقيت</TableHead>
                <TableHead className="text-start">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Activity size={40} className="opacity-20" />
                      <p>لا توجد عمليات مسجلة في السجل حالياً</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                          <User size={14} />
                        </div>
                        <span className="font-medium">{log.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold">{log.module}</TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">{log.details}</TableCell>
                    <TableCell className="text-xs font-mono">{log.timestamp}</TableCell>
                    <TableCell className="text-[10px] font-mono text-slate-400">{log.ipAddress || '192.168.1.1'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
