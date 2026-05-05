import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Building2, Users, Activity, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { isFeatureEnabled, getAllFeatureFlags, setFeatureFlag } from "@/config/features";
import { PLANS } from "@/modules/subscriptions/subscriptionService";

// ── Mock data for Super Admin view ──────────────────────────────────
const mockTenants = [
  { id: 'T-001', name: 'مكتب المحامي القحطاني', plan: 'advanced' as const, users: 8, cases: 145, revenue: 48650, status: 'active' },
  { id: 'T-002', name: 'شركة الرواد للمحاماة', plan: 'enterprise' as const, users: 25, cases: 520, revenue: 156000, status: 'active' },
  { id: 'T-003', name: 'مكتب العدالة القانوني', plan: 'basic' as const, users: 3, cases: 32, revenue: 8970, status: 'active' },
  { id: 'T-004', name: 'مؤسسة البيان القانونية', plan: 'advanced' as const, users: 12, cases: 210, revenue: 72300, status: 'trial' },
];

const mockAuditLogs = [
  { id: 'A-1', timestamp: '2026-04-09T14:00:00Z', action: 'CREATE', user: 'admin@malaf.app', target: 'فاتورة INV-2604-0012', tenant: 'مكتب المحامي أحمد' },
  { id: 'A-2', timestamp: '2026-04-09T13:45:00Z', action: 'DELETE', user: 'lawyer@rawad.sa', target: 'عميل C-0088', tenant: 'شركة الرواد للمحاماة' },
  { id: 'A-3', timestamp: '2026-04-09T12:30:00Z', action: 'UPDATE', user: 'admin@adala.sa', target: 'قضية CASE-0032 (تغيير حالة)', tenant: 'مكتب العدالة القانوني' },
  { id: 'A-4', timestamp: '2026-04-09T11:15:00Z', action: 'CREATE', user: 'admin@bayan.sa', target: 'مستخدم جديد: سارة المالكي', tenant: 'مؤسسة البيان القانونية' },
];

export default function GlobalAdmin() {
  const [activeTab, setActiveTab] = useState("tenants");
  const [flags, setFlags] = useState(getAllFeatureFlags());

  if (!isFeatureEnabled("GLOBAL_ADMIN")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">لوحة السوبر أدمن معطّلة حالياً.</p>
      </div>
    );
  }

  const toggleFlag = (key: string) => {
    setFeatureFlag(key, !flags.find(f => f.key === key)?.enabled);
    setFlags(getAllFeatureFlags().map(f => ({ ...f }))); // force re-render
  };

  const totalRevenue = mockTenants.reduce((s, t) => s + t.revenue, 0);
  const totalUsers = mockTenants.reduce((s, t) => s + t.users, 0);
  const totalCases = mockTenants.reduce((s, t) => s + t.cases, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-3">
          <Shield className="text-primary-500" />
          لوحة إدارة المنصة
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة شاملة لجميع المكاتب والمستخدمين والعمليات الحساسة.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "المكاتب المسجلة", value: mockTenants.length, icon: Building2, color: "text-primary-500", bg: "bg-primary-50 dark:bg-primary-900/20" },
          { title: "إجمالي المستخدمين", value: totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { title: "إجمالي القضايا", value: totalCases, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { title: "الإيرادات (ج.م)", value: totalRevenue.toLocaleString(), icon: Activity, color: "text-accent-500", bg: "bg-accent-50 dark:bg-accent-900/20" },
        ].map(stat => (
          <Card key={stat.title} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}><stat.icon className={cn("w-5 h-5", stat.color)} /></div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.title}</p>
                <p className="text-xl font-bold text-navy-900 dark:text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardContent className="p-0">
          <div className="flex border-b border-slate-100 dark:border-white/10">
            {[
              { key: "tenants", label: "المكاتب" },
              { key: "audit", label: "سجل العمليات" },
              { key: "features", label: "أدوات التحكم" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn(
                "px-6 py-3 text-sm font-bold transition-colors border-b-2",
                activeTab === tab.key
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}>{tab.label}</button>
            ))}
          </div>

          {/* Tenants Tab */}
          {activeTab === "tenants" && (
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                <TableRow>
                  <TableHead className="text-start font-bold">المكتب</TableHead>
                  <TableHead className="text-start font-bold">الخطة</TableHead>
                  <TableHead className="text-start font-bold">المستخدمين</TableHead>
                  <TableHead className="text-start font-bold">القضايا</TableHead>
                  <TableHead className="text-start font-bold">الإيرادات (ج.م)</TableHead>
                  <TableHead className="text-start font-bold">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTenants.map(t => (
                  <TableRow key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="font-bold text-navy-900 dark:text-white">{t.name}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-bold",
                        t.plan === 'enterprise' ? "bg-accent-100 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400" :
                        t.plan === 'advanced' ? "bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400" :
                        "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                      )}>{PLANS[t.plan].nameAr}</Badge>
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{t.users}</TableCell>
                    <TableCell className="dark:text-slate-300">{t.cases}</TableCell>
                    <TableCell className="font-bold dark:text-white">{t.revenue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={t.status === 'active' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"}>
                        {t.status === 'active' ? 'نشط' : 'تجريبي'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Audit Tab */}
          {activeTab === "audit" && (
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                <TableRow>
                  <TableHead className="text-start font-bold">الوقت</TableHead>
                  <TableHead className="text-start font-bold">العملية</TableHead>
                  <TableHead className="text-start font-bold">المستخدم</TableHead>
                  <TableHead className="text-start font-bold">الهدف</TableHead>
                  <TableHead className="text-start font-bold">المكتب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAuditLogs.map(log => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs dark:text-slate-300">{new Date(log.timestamp).toLocaleString('ar-SA')}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-bold text-[10px]",
                        log.action === 'CREATE' ? "bg-emerald-50 text-emerald-700" :
                        log.action === 'DELETE' ? "bg-red-50 text-red-700" :
                        "bg-blue-50 text-blue-700"
                      )}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm dark:text-slate-300">{log.user}</TableCell>
                    <TableCell className="font-bold text-sm dark:text-white">{log.target}</TableCell>
                    <TableCell className="text-sm dark:text-slate-400">{log.tenant}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Feature Flags Tab */}
          {activeTab === "features" && (
            <div className="p-6 space-y-4">
              {flags.map(flag => (
                <div key={flag.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                  <div>
                    <p className="font-bold text-navy-900 dark:text-white">{flag.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{flag.description}</p>
                  </div>
                  <button onClick={() => toggleFlag(flag.key)} className="transition-transform hover:scale-110">
                    {flag.enabled
                      ? <ToggleRight className="w-8 h-8 text-primary-500" />
                      : <ToggleLeft className="w-8 h-8 text-slate-300" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
