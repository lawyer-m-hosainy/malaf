import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, AlertCircle, Upload, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const mockLawyers = [
  { id: 'L-1', name: 'د. أحمد حسني', regNumber: '12345', grade: 'نقض', expiryDate: '2026-12-15', status: 'ساري' },
  { id: 'L-2', name: 'أ. هبة عبداللطيف', regNumber: '23456', grade: 'استئناف', expiryDate: '2026-08-20', status: 'ساري' },
  { id: 'L-3', name: 'أ. عمر محمد علي', regNumber: '34567', grade: 'ابتدائي', expiryDate: '2026-06-01', status: 'قريب الانتهاء' },
];

export default function BarAssociation() {
  const [lawyers] = useState(mockLawyers);

  const getDaysRemaining = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">نقابة المحامين المصريين</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة بيانات القيد والاشتراكات بنقابة المحامين.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "إجمالي المحامين", value: lawyers.length, icon: Building, color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
          { title: "اشتراكات سارية", value: lawyers.filter(l => l.status === 'ساري').length, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
          { title: "قريبة الانتهاء", value: lawyers.filter(l => l.status === 'قريب الانتهاء').length, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
              <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{stat.title}</p><p className="text-2xl font-bold text-navy-900 dark:text-white">{stat.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
          <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-primary-500" />
            سجل قيد المحامين
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {lawyers.map((lawyer) => {
              const days = getDaysRemaining(lawyer.expiryDate);
              const isExpiring = days <= 30;
              return (
                <div key={lawyer.id} className={`p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isExpiring ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-navy-900 dark:text-white">{lawyer.name}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span>رقم القيد: {lawyer.regNumber}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          درجة: {lawyer.grade}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={12} /> انتهاء الاشتراك: {lawyer.expiryDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpiring && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                          تنبيه: متبقي {days} يوم
                        </span>
                      )}
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info('سيتم فتح نافذة رفع بطاقة النقابة')}>
                        <Upload size={14} /> رفع البطاقة
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
