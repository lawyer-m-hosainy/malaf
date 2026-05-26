import { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { Building2, Users, Briefcase, CreditCard, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/store/useAuthStore';
import { Navigate } from 'react-router-dom';

const mockGrowthData = [
  { name: '1 مايو', offices: 12, users: 45 },
  { name: '5 مايو', offices: 15, users: 55 },
  { name: '10 مايو', offices: 22, users: 80 },
  { name: '15 مايو', offices: 30, users: 110 },
  { name: '20 مايو', offices: 45, users: 180 },
  { name: '25 مايو', offices: 60, users: 240 },
  { name: '30 مايو', offices: 85, users: 350 },
];

const mockOffices = [
  { id: '1', name: 'مكتب النيل للمحاماة', plan: 'محترفة', date: '2024-01-15', lawyers: 12, status: 'نشط' },
  { id: '2', name: 'مؤسسة العدالة للاستشارات', plan: 'مجانية', date: '2024-03-20', lawyers: 3, status: 'نشط' },
  { id: '3', name: 'مجموعة الصاوي القانونية', plan: 'محترفة', date: '2023-11-05', lawyers: 25, status: 'نشط' },
  { id: '4', name: 'مكتب الشرق الأوسط', plan: 'مجانية', date: '2024-04-10', lawyers: 1, status: 'غير نشط' },
  { id: '5', name: 'المحامون المتحدون', plan: 'محترفة', date: '2024-02-28', lawyers: 8, status: 'نشط' },
];

export default function SystemAdmin() {
  const currentUser = useAuthStore(state => state.currentUser);

  // حماية المسار: فقط الـ SuperAdmin (مؤسس) يمكنه الدخول
  if (currentUser?.role !== 'مؤسس') {
    return <Navigate to="/dashboard" replace />;
  }

  const metrics = [
    { title: 'إجمالي المكاتب', value: '142', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'المستخدمين النشطين (MAU)', value: '850', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { title: 'القضايا المسجلة', value: '3,240', icon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'الاشتراكات النشطة', value: '89', icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
      
      <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800/30">
        <ShieldAlert size={24} />
        <div>
          <h1 className="text-lg font-bold">لوحة تحكم المسؤول (Super Admin)</h1>
          <p className="text-sm">هذه الصفحة متاحة فقط لمؤسسي المنصة لمتابعة نمو النظام والمكاتب المشتركة.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.bg} ${m.color}`}>
                <m.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{m.title}</p>
                <h3 className="text-2xl font-bold text-navy-900 dark:text-white mt-1">{m.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Growth Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm dark:bg-navy-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold">نمو التسجيلات (آخر 30 يوماً)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOffices" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="offices" name="المكاتب" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOffices)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Status */}
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold">حالة النظام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">استهلاك الخادم (CPU)</span>
                <span className="font-bold text-emerald-500">24%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-navy-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[24%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">استهلاك قواعد البيانات</span>
                <span className="font-bold text-blue-500">45%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-navy-900 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[45%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">سعة التخزين (Storage)</span>
                <span className="font-bold text-amber-500">78%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-navy-900 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[78%]"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribed Offices Table */}
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader>
          <CardTitle className="text-lg font-bold">المكاتب المشتركة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-white/5">
                <TableRow>
                  <TableHead className="font-bold">اسم المكتب</TableHead>
                  <TableHead className="font-bold">الباقة</TableHead>
                  <TableHead className="font-bold">تاريخ الاشتراك</TableHead>
                  <TableHead className="font-bold">عدد المحامين</TableHead>
                  <TableHead className="font-bold">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOffices.map((office) => (
                  <TableRow key={office.id}>
                    <TableCell className="font-bold">{office.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={office.plan === 'محترفة' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}>
                        {office.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{office.date}</TableCell>
                    <TableCell className="font-mono">{office.lawyers}</TableCell>
                    <TableCell>
                      <Badge className={office.status === 'نشط' ? 'bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-100' : 'bg-red-100 text-red-700 border-none hover:bg-red-100'}>
                        {office.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
    </motion.div>
  );
}
