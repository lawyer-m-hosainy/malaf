import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals, generateInvoiceNumber, validatePaymentAmount, computeFinancialSummary } from '../src/domain/financeDomain';
import { Invoice, Expense } from '../src/types';

describe('financeDomain', () => {
  describe('calculateInvoiceTotals', () => {
    it('should calculate Egyptian invoice totals (VAT-exempt + 0.5% stamp duty)', () => {
      const result = calculateInvoiceTotals(1000);
      expect(result.vat).toBe(0); // الخدمات القانونية معفاة من ضريبة القيمة المضافة
      expect(result.stampDuty).toBe(5); // 0.5% رسوم دمغة
      expect(result.total).toBe(1005);
    });
    it('should handle zero base', () => {
      const result = calculateInvoiceTotals(0);
      expect(result.total).toBe(0);
    });
    it('should round stamp duty to 2 decimals', () => {
      const result = calculateInvoiceTotals(333);
      expect(result.stampDuty).toBe(1.67);
      expect(result.total).toBe(334.67);
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate sequential number with year', () => {
      const year = new Date().getFullYear();
      expect(generateInvoiceNumber(0)).toBe(`INV-${year}-0001`);
      expect(generateInvoiceNumber(99)).toBe(`INV-${year}-0100`);
    });
  });

  describe('validatePaymentAmount', () => {
    it('should reject zero amount', () => {
      expect(validatePaymentAmount(0, 1000).valid).toBe(false);
    });
    it('should reject negative amount', () => {
      expect(validatePaymentAmount(-100, 1000).valid).toBe(false);
    });
    it('should reject amount exceeding total', () => {
      expect(validatePaymentAmount(1500, 1000).valid).toBe(false);
    });
    it('should accept valid amount', () => {
      expect(validatePaymentAmount(500, 1000).valid).toBe(true);
    });
  });

  describe('computeFinancialSummary', () => {
    it('should compute correct totals', () => {
      const invoices: Invoice[] = [
        { id: '1', clientId: 'c1', clientName: 'أ', base: 1000, vat: 150, total: 1150, status: 'مدفوعة', date: '2025-01-01' },
        { id: '2', clientId: 'c2', clientName: 'ب', base: 2000, vat: 300, total: 2300, status: 'غير مدفوعة', date: '2025-02-01' },
      ];
      const expenses: Expense[] = [
        { id: 'e1', caseId: 'c1', caseName: 'ق', category: 'رسوم قضائية', amount: 200, date: '2025-01-15', status: 'تم السداد', description: '' },
      ];
      const summary = computeFinancialSummary(invoices, expenses);
      expect(summary.totalRevenue).toBe(3450);
      expect(summary.totalPaid).toBe(1150);
      expect(summary.totalUnpaid).toBe(2300);
      expect(summary.totalExpenses).toBe(200);
      expect(summary.netProfit).toBe(950);
      expect(summary.collectionRate).toBe(33);
    });
  });
});
