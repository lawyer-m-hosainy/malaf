import { Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, Scale, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEGP } from "@/lib/formatEG";

const CashFlowChart = lazy(() => import("./FinancialCharts").then(m => ({ default: m.CashFlowChart })));
const ExpensePieChart = lazy(() => import("./FinancialCharts").then(m => ({ default: m.ExpensePieChart })));
const AgingBarChart = lazy(() => import("./FinancialCharts").then(m => ({ default: m.AgingBarChart })));

interface StatsProps {
  isLoading: boolean;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  collectionRate: number;
}

/**
 * Renders the four financial KPI stat cards.
 * @param {StatsProps} props - Stats data and loading state.
 * @returns {JSX.Element} Grid of stat cards.
 */
export function FinancialStats({ isLoading, totalRevenue, totalExpenses, netProfit, collectionRate }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[140px]">
      <StatCard label="إجمالي الإيرادات" value={formatEGP(totalRevenue)} isLoading={isLoading} icon={<TrendingUp className="w-6 h-6 text-emerald-600" />} iconBg="bg-emerald-50 dark:bg-emerald-950/30" />
      <StatCard label="إجمالي المصروفات" value={formatEGP(totalExpenses)} isLoading={isLoading} icon={<TrendingDown className="w-6 h-6 text-red-600" />} iconBg="bg-red-50 dark:bg-red-950/30" />
      <StatCard
        label="صافي الأرباح"
        value={formatEGP(netProfit)}
        isLoading={isLoading}
        icon={<DollarSign className="w-6 h-6 text-blue-600" />}
        iconBg="bg-blue-50 dark:bg-blue-950/30"
        valueClass={cn("text-2xl font-extrabold font-mono", netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
      />
      <StatCard label="نسبة التحصيل" value={`${collectionRate}%`} isLoading={isLoading} icon={<Wallet className="w-6 h-6 text-purple-600" />} iconBg="bg-purple-50 dark:bg-purple-950/30" skeletonW="w-12" />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  isLoading: boolean;
  icon: React.ReactNode;
  iconBg: string;
  valueClass?: string;
  skeletonW?: string;
}

/**
 * A single financial stat card with skeleton loading.
 * @param {StatCardProps} props - Card configuration.
 * @returns {JSX.Element} Stat card element.
 */
function StatCard({ label, value, isLoading, icon, iconBg, valueClass, skeletonW = "w-24" }: StatCardProps) {
  return (
    <Card className="border-none shadow-sm dark:bg-navy-800 bg-white min-h-[120px]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <div className="h-8 flex items-center">
              {isLoading ? <Skeleton className={`h-7 ${skeletonW}`} /> : (
                <p className={valueClass || "text-2xl font-extrabold font-mono text-navy-900 dark:text-white"}>
                  {value}
                </p>
              )}
            </div>
          </div>
          <div className={`p-3.5 rounded-xl ${iconBg}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChartsSectionProps {
  isLoading: boolean;
  cashFlowHistoryData: any[];
  expensePieData: any[];
  colors: string[];
}

/**
 * Renders the cash flow line chart and expense pie chart side by side.
 * @param {ChartsSectionProps} props - Chart data and loading state.
 * @returns {JSX.Element} Charts grid.
 */
export function FinancialChartsSection({ isLoading, cashFlowHistoryData, expensePieData, colors }: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-none shadow-sm dark:bg-navy-800 bg-white min-h-[380px]">
        <CardHeader className="pb-2 border-b border-slate-50 dark:border-white/5">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={18} />
            التدفق النقدي والربحية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <Suspense fallback={<Skeleton className="h-[280px] w-full" />}>
              <CashFlowChart data={cashFlowHistoryData} />
            </Suspense>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm dark:bg-navy-800 bg-white min-h-[380px]">
        <CardHeader className="pb-2 border-b border-slate-50 dark:border-white/5">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Wallet className="text-red-500" size={18} />
            توزيع المصروفات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <Suspense fallback={<Skeleton className="h-[280px] w-full" />}>
              <ExpensePieChart data={expensePieData} colors={colors} />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AgingProps {
  isLoading: boolean;
  agingBarData: any[];
  topCases: any[];
}

/**
 * Renders aging bar chart and top 5 high-revenue cases table.
 * @param {AgingProps} props - Aging data, top cases, and loading state.
 * @returns {JSX.Element} Aging and top cases grid.
 */
export function AgingAndTopCasesSection({ isLoading, agingBarData, topCases }: AgingProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AgingCard isLoading={isLoading} agingBarData={agingBarData} />
      <TopCasesCard isLoading={isLoading} topCases={topCases} />
    </div>
  );
}

/**
 * Aging bar chart card.
 * @param {{ isLoading: boolean; agingBarData: any[] }} props - Props.
 * @returns {JSX.Element} Card element.
 */
function AgingCard({ isLoading, agingBarData }: { isLoading: boolean; agingBarData: any[] }) {
  return (
    <Card className="border-none shadow-sm dark:bg-navy-800 bg-white min-h-[350px]">
      <CardHeader className="pb-2 border-b border-slate-50 dark:border-white/5">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={18} />
          أعمار ذمم المطالبات المعلقة
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
            <AgingBarChart data={agingBarData} />
          </Suspense>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Top 5 high-revenue cases table card.
 * @param {{ isLoading: boolean; topCases: any[] }} props - Props.
 * @returns {JSX.Element} Card element.
 */
function TopCasesCard({ isLoading, topCases }: { isLoading: boolean; topCases: any[] }) {
  return (
    <Card className="lg:col-span-2 border-none shadow-sm dark:bg-navy-800 bg-white min-h-[350px]">
      <CardHeader className="pb-2 border-b border-slate-50 dark:border-white/5">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Scale className="text-purple-500" size={18} />
          أعلى 5 قضايا ربحية
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow>
                <TableHead className="text-start font-bold">الموكل</TableHead>
                <TableHead className="text-start font-bold">المبلغ الكلي</TableHead>
                <TableHead className="text-start font-bold">المحصل</TableHead>
                <TableHead className="text-start font-bold">حالة الملف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCases.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <TableCell className="font-bold text-navy-900 dark:text-white py-4">{c.clientName}</TableCell>
                  <TableCell className="font-mono font-bold">{formatEGP(c.totalAmount)}</TableCell>
                  <TableCell className="font-mono text-emerald-600 font-bold">{formatEGP(c.collectedAmount)}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-700">{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
