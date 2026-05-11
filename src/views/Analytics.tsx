import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useEffect } from "react";
import { TrendingUp, TrendingDown, Scale, Users, FileText, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon, Calendar as CalendarIcon, DollarSign, Download, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend 
} from 'recharts';
import { toast } from "sonner";
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { useMemo } from "react";

const revenueData = [
  { name: 'يناير', revenue: 45000, expenses: 12000, profit: 33000 },
  { name: 'فبراير', revenue: 52000, expenses: 15000, profit: 37000 },
  { name: 'مارس', revenue: 48000, expenses: 11000, profit: 37000 },
  { name: 'أبريل', revenue: 61000, expenses: 18000, profit: 43000 },
  { name: 'مايو', revenue: 55000, expenses: 14000, profit: 41000 },
  { name: 'يونيو', revenue: 67000, expenses: 20000, profit: 47000 },
];

const caseSuccessData = [
  { name: 'كسب القضية', value: 65, color: '#006c35' },
  { name: 'صلح', value: 20, color: '#d4af37' },
  { name: 'خسارة القضية', value: 10, color: '#ef4444' },
  { name: 'أخرى', value: 5, color: '#64748b' },
];

const workloadData = [
  { name: 'د. عبدالمحسن', cases: 12, tasks: 45 },
  { name: 'أ. سارة', cases: 8, tasks: 32 },
  { name: 'أ. فهد', cases: 4, tasks: 12 },
];

export default function Analytics() {
  const financial = useAnalyticsStore((state) => state.financialSummary);
  const practiceAreaStats = useAnalyticsStore((state) => state.practiceAreaStats);
  const isLoading = useAnalyticsStore((state) => state.isLoading);
  const fetchAnalyticsData = useAnalyticsStore((state) => state.fetchAnalyticsData);
  const getAttorneyPerformance = useAnalyticsStore((state) => state.getAttorneyPerformance);
  
  const attorneyPerformance = useMemo(() => getAttorneyPerformance(), [getAttorneyPerformance]);
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    try {
      // Generate CSV for Revenue Data
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
      csvContent += "الشهر,الإيرادات,المصروفات,الربح\n";
      revenueData.forEach(row => {
        csvContent += `${row.name},${row.revenue},${row.expenses},${row.profit}\n`;
      });

      // Add a separator and then Case Success Data
      csvContent += "\nالنتيجة,النسبة\n";
      caseSuccessData.forEach(row => {
        csvContent += `${row.name},${row.value}%\n`;
      });

      // Add Workload Data
      csvContent += "\nعضو الفريق,القضايا,المهام\n";
      workloadData.forEach(row => {
        csvContent += `${row.name},${row.cases},${row.tasks}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `تقرير_التحليلات_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("تم تصدير التقرير بنجاح", {
        description: "تم تحميل ملف CSV الخاص بالتحليلات",
        icon: <CheckCircle2 className="text-emerald-500" />
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء تصدير التقرير");
    } finally {
      setIsGenerating(false);
    }
  };

  const stats = [
    { title: "إجمالي الإيرادات", value: `${financial.totalRevenue.toLocaleString('ar-EG')} ج.م`, trend: "+12%", trendUp: true, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { title: "كفاءة التحصيل", value: `${financial.collectionRate.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}%`, trend: "+5%", trendUp: true, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "صافي الأرباح (تقديري)", value: `${(financial.totalRevenue * 0.7).toLocaleString('ar-EG')} ج.م`, trend: "+15%", trendUp: true, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "معدل كسب القضايا", value: (85).toLocaleString('ar-EG') + "%", trend: "+2%", trendUp: true, icon: Scale, color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">التحليلات والتقارير</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">رؤى بيانية حول الأداء المالي، إنتاجية الفريق، ونتائج القضايا.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="dark:border-white/10 gap-2"
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {isGenerating ? 'جاري الإنشاء...' : 'تصدير تقرير CSV'}
          </Button>
          <Button className="bg-primary-500 text-white">تخصيص اللوحة</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                  stat.trendUp ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                )}>
                  {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
              <p className="text-2xl font-bold text-navy-900 dark:text-white mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-primary-500" />
              مقارنة الإيرادات والمصروفات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            <ResponsiveContainer width="99%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006c35" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#006c35" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#006c35" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="المصروفات" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary-500" />
              نتائج القضايا النهائية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[350px] flex flex-col items-center">
            <ResponsiveContainer width="99%" height={300}>
              <PieChart>
                <Pie
                  data={caseSuccessData}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {caseSuccessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              توزيع عبء العمل على الفريق
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            <ResponsiveContainer width="99%" height={300}>
              <BarChart data={attorneyPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="cases" name="القضايا" fill="#006c35" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="winningRate" name="نسبة النجاح %" fill="#d4af37" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary-500" />
              معدل نمو العملاء
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            <ResponsiveContainer width="99%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#006c35" strokeWidth={3} dot={{ r: 4, fill: '#006c35' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
