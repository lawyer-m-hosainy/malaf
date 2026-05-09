import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, AlertCircle, Upload, CheckCircle2, Clock, Search, Plus, X, Edit2, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface LawyerRegistration {
  id: string;
  name: string;
  regNumber: string;
  grade: 'جزئي' | 'ابتدائي' | 'استئناف' | 'نقض';
  expiryDate: string;
  status: 'ساري' | 'قريب الانتهاء' | 'منتهي';
  phone: string;
  specialization: string;
}

const initialLawyers: LawyerRegistration[] = [
  { id: 'L-1', name: 'د. أحمد حسني', regNumber: '12345', grade: 'نقض', expiryDate: '2026-12-15', status: 'ساري', phone: '01012345678', specialization: 'مدني وتجاري' },
  { id: 'L-2', name: 'أ. هبة عبداللطيف', regNumber: '23456', grade: 'استئناف', expiryDate: '2026-08-20', status: 'ساري', phone: '01098765432', specialization: 'جنائي' },
  { id: 'L-3', name: 'أ. عمر محمد علي', regNumber: '34567', grade: 'ابتدائي', expiryDate: '2026-06-01', status: 'قريب الانتهاء', phone: '01155566677', specialization: 'أحوال شخصية' },
  { id: 'L-4', name: 'أ. سارة الجوهري', regNumber: '45678', grade: 'استئناف', expiryDate: '2026-03-01', status: 'منتهي', phone: '01222333444', specialization: 'عمالي' },
];

export default function BarAssociation() {
  const [lawyers, setLawyers] = useState(initialLawyers);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('الكل');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const getDaysRemaining = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filtered = useMemo(() => {
    return lawyers.filter(l => {
      const matchesSearch = l.name.includes(searchTerm) || l.regNumber.includes(searchTerm) || l.specialization.includes(searchTerm);
      if (gradeFilter === 'الكل') return matchesSearch;
      return matchesSearch && l.grade === gradeFilter;
    });
  }, [lawyers, searchTerm, gradeFilter]);

  const stats = useMemo(() => ({
    total: lawyers.length,
    active: lawyers.filter(l => l.status === 'ساري').length,
    expiring: lawyers.filter(l => l.status === 'قريب الانتهاء').length,
    expired: lawyers.filter(l => l.status === 'منتهي').length,
  }), [lawyers]);

  const handleAddLawyer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const expiryDate = form.get('expiryDate') as string;
    const days = getDaysRemaining(expiryDate);
    const newLawyer: LawyerRegistration = {
      id: `L-${lawyers.length + 1}`,
      name: form.get('name') as string,
      regNumber: form.get('regNumber') as string,
      grade: form.get('grade') as any,
      expiryDate,
      status: days <= 0 ? 'منتهي' : days <= 30 ? 'قريب الانتهاء' : 'ساري',
      phone: form.get('phone') as string,
      specialization: form.get('specialization') as string,
    };
    setLawyers(prev => [newLawyer, ...prev]);
    setShowAddDialog(false);
    toast.success(`تم إضافة ${newLawyer.name} بنجاح`);
  };

  const handleDelete = (id: string) => {
    setLawyers(prev => prev.filter(l => l.id !== id));
    toast.success('تم الحذف');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">نقابة المحامين المصريين</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة بيانات القيد والاشتراكات بنقابة المحامين.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}><Plus size={16} /> إضافة محامٍ</Button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "إجمالي المحامين", value: stats.total, icon: Building, color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
          { title: "اشتراكات سارية", value: stats.active, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
          { title: "قريبة الانتهاء", value: stats.expiring, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { title: "منتهية", value: stats.expired, icon: Clock, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
              <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.title}</p><p className="text-lg font-bold text-navy-900 dark:text-white">{stat.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* تنبيه التجديد */}
      {stats.expiring > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">تنبيه تجديد الاشتراكات</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">يوجد {stats.expiring} اشتراك(ات) قريبة الانتهاء. يرجى التجديد في النقابة الفرعية التابع لها المحامي قبل انتهاء المهلة لتجنب الإيقاف.</p>
          </div>
        </div>
      )}

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="بحث بالاسم أو رقم القيد أو التخصص..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
        {['الكل', 'جزئي', 'ابتدائي', 'استئناف', 'نقض'].map(g => (
          <Button key={g} variant={gradeFilter === g ? 'default' : 'outline'} size="sm" onClick={() => setGradeFilter(g)}>{g}</Button>
        ))}
      </div>

      {/* الجدول */}
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
          <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-primary-500" /> سجل قيد المحامين ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400">
                <th className="text-right p-4 font-medium">الاسم</th>
                <th className="text-right p-4 font-medium">رقم القيد</th>
                <th className="text-right p-4 font-medium">الدرجة</th>
                <th className="text-right p-4 font-medium">التخصص</th>
                <th className="text-right p-4 font-medium">الهاتف</th>
                <th className="text-right p-4 font-medium">انتهاء الاشتراك</th>
                <th className="text-right p-4 font-medium">الحالة</th>
                <th className="text-right p-4 font-medium">إجراء</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {filtered.map(lawyer => {
                  const days = getDaysRemaining(lawyer.expiryDate);
                  return (
                    <tr key={lawyer.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${days <= 30 && days > 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : days <= 0 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                      <td className="p-4 font-bold text-navy-900 dark:text-white">{lawyer.name}</td>
                      <td className="p-4 font-mono text-xs">{lawyer.regNumber}</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{lawyer.grade}</span></td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{lawyer.specialization}</td>
                      <td className="p-4 font-mono text-xs text-slate-500" dir="ltr">{lawyer.phone}</td>
                      <td className="p-4 text-slate-500 flex items-center gap-1"><Clock size={12} /> {lawyer.expiryDate}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          lawyer.status === 'ساري' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          lawyer.status === 'قريب الانتهاء' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>{lawyer.status}{days > 0 && days <= 30 ? ` (${days} يوم)` : ''}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => toast.info('سيتم فتح نافذة رفع بطاقة النقابة')}><Upload size={12} /> البطاقة</Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(lawyer.id)}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">لا توجد نتائج مطابقة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog إضافة محامٍ */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddDialog(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">إضافة محامٍ جديد</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddDialog(false)}><X size={18} /></Button>
            </div>
            <form onSubmit={handleAddLawyer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>اسم المحامي</Label><Input name="name" required placeholder="أ. محمد أحمد" /></div>
                <div><Label>رقم القيد بالنقابة</Label><Input name="regNumber" required placeholder="12345" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>درجة القيد</Label>
                  <select name="grade" className="w-full border rounded-md p-2 text-sm bg-white dark:bg-navy-900 dark:border-white/10" required>
                    <option value="جزئي">جزئي</option>
                    <option value="ابتدائي">ابتدائي</option>
                    <option value="استئناف">استئناف</option>
                    <option value="نقض">نقض</option>
                  </select>
                </div>
                <div><Label>التخصص</Label><Input name="specialization" required placeholder="مدني وتجاري" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>رقم الهاتف</Label><Input name="phone" required placeholder="01012345678" dir="ltr" /></div>
                <div><Label>تاريخ انتهاء الاشتراك</Label><Input name="expiryDate" type="date" required /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
                <Button type="submit">إضافة</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
