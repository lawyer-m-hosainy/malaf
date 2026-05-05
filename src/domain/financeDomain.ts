import { Invoice, Expense } from "@/types";

// Egyptian legal services are VAT-exempt
const EGYPT_LEGAL_VAT_RATE = 0;
const EGYPT_STAMP_DUTY_RATE = 0.005; // 0.5% رسوم دمغة

/**
 * Calculates invoice totals — Egyptian legal services are VAT-exempt.
 * Only stamp duty applies.
 */
export function calculateInvoiceTotals(base: number): { base: number; vat: number; stampDuty: number; total: number } {
  const vat = 0; // معفاة من ضريبة القيمة المضافة
  const stampDuty = Math.round(base * EGYPT_STAMP_DUTY_RATE * 100) / 100;
  return { base, vat, stampDuty, total: base + stampDuty };
}

/**
 * Calculates Egyptian court fees based on claim value.
 * Egyptian court fees are tiered based on المطالبة value.
 */
export function calculateCourtFees(claimValue: number): number {
  if (claimValue <= 0) return 0;
  if (claimValue <= 2000) return Math.round(claimValue * 0.01);
  if (claimValue <= 4000) return Math.round(claimValue * 0.015);
  if (claimValue <= 40000) return Math.round(claimValue * 0.02);
  return Math.round(claimValue * 0.03);
}

/**
 * Generates a sequential invoice number.
 */
export function generateInvoiceNumber(existingCount: number): string {
  const year = new Date().getFullYear();
  const seq = String(existingCount + 1).padStart(4, "0");
  return `INV-${year}-${seq}`;
}

/**
 * Validates that a payment amount is within acceptable range.
 */
export function validatePaymentAmount(amount: number, invoiceTotal: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: "المبلغ يجب أن يكون أكبر من صفر" };
  }
  if (amount > invoiceTotal) {
    return { valid: false, error: "المبلغ يتجاوز إجمالي الفاتورة" };
  }
  return { valid: true };
}

/**
 * Calculates financial summary from invoices and expenses.
 */
export function computeFinancialSummary(invoices: Invoice[], expenses: Expense[]) {
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.filter(i => i.status === 'مدفوعة').reduce((sum, inv) => sum + inv.total, 0);
  const totalUnpaid = invoices.filter(i => i.status === 'غير مدفوعة').reduce((sum, inv) => sum + inv.total, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalPaid - totalExpenses;
  const collectionRate = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;

  return { totalRevenue, totalPaid, totalUnpaid, totalExpenses, netProfit, collectionRate };
}

/**
 * Groups invoices by month for charting.
 */
export function groupInvoicesByMonth(invoices: Invoice[]): { name: string; value: number }[] {
  const grouped: Record<string, number> = {};
  invoices.forEach(inv => {
    const date = new Date(inv.date);
    const month = date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
    grouped[month] = (grouped[month] || 0) + inv.total;
  });
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

/**
 * Formats currency in Egyptian Pounds (ج.م).
 */
export function formatEGP(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}
