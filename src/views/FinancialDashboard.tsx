import { motion } from "motion/react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download } from "lucide-react";
import { fetchExpenses, fetchReceivables, fetchInvoices, fetchTrustTransactions } from "@/services/legalDataService";
import { useQuery } from "@tanstack/react-query";
import { FINANCES_KEY, queryConfig } from "@/lib/queryConfig";

import { FinancialStats, FinancialChartsSection, AgingAndTopCasesSection } from "./finance-components/FinancialSections";
import { ExportReportDialog } from "./finance-components/ExportReportDialog";
import {
  COLORS, ARABIC_MONTHS, filterByPeriod, daysPastDue, agingBucket,
  Receivable, mapReceivable
} from "./finance-components/financeUtils";

/**
 * لوحة التحكم المالية المتقدمة لمنصة ملف.
 * تعرض تقارير الأرباح والخسائر، وتدفق السيولة النقدية، والمصروفات والذمم المعلقة.
 * @returns {JSX.Element} Financial dashboard page.
 */
export default function FinancialDashboard() {
  const queries = useFinanceQueries();
  const [timePeriod, setTimePeriod] = useState("6_months");
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const computed = useComputedData(queries, timePeriod);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <DashboardHeader timePeriod={timePeriod} setTimePeriod={setTimePeriod} onExport={() => setExportModalOpen(true)} />

      <ExportReportDialog
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        invoices={queries.invoices}
        expenses={queries.expenses}
        trustTransactions={queries.trustTransactions}
        receivables={queries.receivables}
      />

      <FinancialStats
        isLoading={queries.isLoading}
        totalRevenue={computed.totalRevenue}
        totalExpenses={computed.totalExpenses}
        netProfit={computed.netProfit}
        collectionRate={computed.collectionRate}
      />
      <FinancialChartsSection
        isLoading={queries.isLoading}
        cashFlowHistoryData={computed.cashFlowHistoryData}
        expensePieData={computed.expensePieData}
        colors={COLORS}
      />
      <AgingAndTopCasesSection
        isLoading={queries.isLoading}
        agingBarData={computed.agingBarData}
        topCases={computed.topCases}
      />
    </motion.div>
  );
}

interface DashboardHeaderProps {
  timePeriod: string;
  setTimePeriod: (v: string) => void;
  onExport: () => void;
}

/**
 * Dashboard title bar with period selector and export button.
 * @param {DashboardHeaderProps} props - Header configuration.
 * @returns {JSX.Element} Header element.
 */
function DashboardHeader({ timePeriod, setTimePeriod, onExport }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">التحليل المالي المتقدم</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">مراقبة الأداء المالي، التدفقات النقدية، وتحليل المصروفات والربحية.</p>
      </div>
      <div className="flex items-center gap-3">
        <Select value={timePeriod} onValueChange={(v) => v && setTimePeriod(v)}>
          <SelectTrigger className="w-[180px] dark:bg-navy-800 dark:border-white/10 h-10">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="اختر الفترة" />
          </SelectTrigger>
          <SelectContent className="dark:bg-navy-800 dark:border-white/10">
            <SelectItem value="month">هذا الشهر</SelectItem>
            <SelectItem value="6_months">آخر 6 أشهر</SelectItem>
            <SelectItem value="year">هذا العام</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onExport} className="bg-primary-500 hover:bg-primary-600 text-white gap-2 h-10 px-4">
          <Download className="w-4 h-4" />
          تصدير تقرير
        </Button>
      </div>
    </div>
  );
}

/**
 * Custom hook to fetch all financial data via React Query.
 * @returns {object} Data arrays and combined loading state.
 */
function useFinanceQueries() {
  const { data: invoices = [], isLoading: il } = useQuery({
    queryKey: [FINANCES_KEY, "invoices"],
    queryFn: () => fetchInvoices(),
    staleTime: queryConfig.finances.staleTime,
  });
  const { data: expensesData = [], isLoading: el } = useQuery({
    queryKey: [FINANCES_KEY, "expenses"],
    queryFn: () => fetchExpenses(),
    staleTime: queryConfig.finances.staleTime,
  });
  const { data: receivablesData = [], isLoading: rl } = useQuery<Receivable[]>({
    queryKey: [FINANCES_KEY, "receivables"],
    queryFn: () => fetchReceivables() as unknown as Promise<Receivable[]>,
    staleTime: queryConfig.finances.staleTime,
  });
  const { data: trustTransactions = [], isLoading: tl } = useQuery({
    queryKey: [FINANCES_KEY, "trust"],
    queryFn: () => fetchTrustTransactions(),
    staleTime: queryConfig.finances.staleTime,
  });

  const expenses = useMemo(() => expensesData || [], [expensesData]);
  const receivables = useMemo(() => (receivablesData || []).map(mapReceivable), [receivablesData]);

  return { invoices, expenses, receivables, trustTransactions, isLoading: il || el || rl || tl };
}

/**
 * Derives all computed dashboard metrics from raw data and time period.
 * @param {object} q - Query results from useFinanceQueries.
 * @param {string} timePeriod - Selected time period filter.
 * @returns {object} Computed metrics and chart data.
 */
function useComputedData(q: ReturnType<typeof useFinanceQueries>, timePeriod: string) {
  const filteredInvoices = useMemo(() => filterByPeriod(q.invoices, timePeriod), [q.invoices, timePeriod]);
  const filteredExpenses = useMemo(() => filterByPeriod(q.expenses, timePeriod), [q.expenses, timePeriod]);

  const totalRevenue = useMemo(() => filteredInvoices.filter(i => i.status === "مدفوعة").reduce((s, i) => s + i.total, 0), [filteredInvoices]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((s, e) => s + e.amount, 0), [filteredExpenses]);
  const netProfit = totalRevenue - totalExpenses;

  const collectionRate = useMemo(() => {
    const total = filteredInvoices.reduce((s, i) => s + i.total, 0);
    const paid = filteredInvoices.filter(i => i.status === "مدفوعة").reduce((s, i) => s + i.total, 0);
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }, [filteredInvoices]);

  const cashFlowHistoryData = useCashFlowHistory(q.invoices, q.expenses);
  const expensePieData = useExpensePieData(filteredExpenses);
  const agingBarData = useAgingBarData(q.receivables);
  const topCases = useTopCases(q.receivables);

  return { totalRevenue, totalExpenses, netProfit, collectionRate, cashFlowHistoryData, expensePieData, agingBarData, topCases };
}

/**
 * Computes 6-month cash flow history for chart rendering.
 * @param {any[]} invoices - Invoice records.
 * @param {any[]} expenses - Expense records.
 * @returns {any[]} Monthly cash flow data points.
 */
function useCashFlowHistory(invoices: any[], expenses: any[]) {
  return useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = `${ARABIC_MONTHS[month]} ${year}`;
      const monthRev = invoices.filter(inv => { const id = new Date(inv.date); return id.getMonth() === month && id.getFullYear() === year && inv.status === "مدفوعة"; }).reduce((s, inv) => s + inv.total, 0);
      const monthExp = expenses.filter(exp => { const ed = new Date(exp.date); return ed.getMonth() === month && ed.getFullYear() === year; }).reduce((s, exp) => s + exp.amount, 0);
      data.push({ name: label, الإيرادات: monthRev, المصروفات: monthExp, الربح: monthRev - monthExp });
    }
    return data;
  }, [invoices, expenses]);
}

/**
 * Computes expense category distribution for pie chart.
 * @param {any[]} filteredExpenses - Filtered expense records.
 * @returns {any[]} Pie chart data sorted by value.
 */
function useExpensePieData(filteredExpenses: any[]) {
  return useMemo(() => {
    const groups: Record<string, number> = {};
    filteredExpenses.forEach(exp => { groups[exp.category] = (groups[exp.category] || 0) + exp.amount; });
    return Object.entries(groups).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);
}

/**
 * Computes receivable aging bucket data for bar chart.
 * @param {any[]} receivables - Receivable records.
 * @returns {any[]} Aging bucket data points.
 */
function useAgingBarData(receivables: any[]) {
  return useMemo(() => {
    const buckets: Record<string, number> = { "حالي": 0, "1-30 يوم": 0, "31-60 يوم": 0, "61-90 يوم": 0, "+90 يوم": 0 };
    receivables.forEach(r => { if (r.status !== "مغلق" && r.status !== "مسوى") { buckets[agingBucket(daysPastDue(r.dueDate))] += r.outstandingAmount; } });
    return Object.entries(buckets).map(([name, value]) => ({ name, المستحقات: value }));
  }, [receivables]);
}

/**
 * Picks top 5 highest-revenue cases from receivables.
 * @param {any[]} receivables - Receivable records.
 * @returns {any[]} Top 5 cases sorted by collected amount.
 */
function useTopCases(receivables: any[]) {
  return useMemo(() => [...receivables].filter(r => r.collectedAmount > 0).sort((a, b) => b.collectedAmount - a.collectedAmount).slice(0, 5), [receivables]);
}
