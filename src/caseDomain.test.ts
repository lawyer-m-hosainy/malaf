import { describe, it, expect } from 'vitest';
import { isValidTransition, calculateCaseAge, getCaseRiskLevel, getCaseDistribution, getAtRiskCases } from '../src/domain/caseDomain';
import { Case } from '../src/types';

describe('caseDomain', () => {
  describe('isValidTransition', () => {
    it('should allow intake -> pleadings', () => {
      expect(isValidTransition('intake', 'pleadings')).toBe(true);
    });
    it('should allow hearing -> judgment', () => {
      expect(isValidTransition('hearing', 'judgment')).toBe(true);
    });
    it('should block judgment -> intake', () => {
      expect(isValidTransition('judgment', 'intake')).toBe(false);
    });
    it('should allow any stage -> closed', () => {
      expect(isValidTransition('intake', 'closed')).toBe(true);
      expect(isValidTransition('pleadings', 'closed')).toBe(true);
      expect(isValidTransition('hearing', 'closed')).toBe(true);
      expect(isValidTransition('judgment', 'closed')).toBe(true);
    });
    it('should block closed -> anything', () => {
      expect(isValidTransition('closed', 'intake')).toBe(false);
      expect(isValidTransition('closed', 'hearing')).toBe(false);
    });
  });

  describe('calculateCaseAge', () => {
    it('should return 0 for today', () => {
      expect(calculateCaseAge(new Date().toISOString())).toBe(0);
    });
    it('should return correct days for past dates', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      expect(calculateCaseAge(thirtyDaysAgo)).toBe(30);
    });
  });

  describe('getCaseRiskLevel', () => {
    it('should return low for closed cases', () => {
      const c = { status: 'مغلقة', createdAt: new Date(Date.now() - 365 * 86400000).toISOString() } as Case;
      expect(getCaseRiskLevel(c)).toBe('low');
    });
    it('should return high for old active cases', () => {
      const c = { status: 'متداولة', createdAt: new Date(Date.now() - 200 * 86400000).toISOString() } as unknown as Case;
      expect(getCaseRiskLevel(c)).toBe('high');
    });
    it('should return medium for moderately old cases', () => {
      const c = { status: 'متداولة', createdAt: new Date(Date.now() - 100 * 86400000).toISOString() } as unknown as Case;
      expect(getCaseRiskLevel(c)).toBe('medium');
    });
  });

  describe('getCaseDistribution', () => {
    it('should group cases by type', () => {
      const cases = [
        { type: 'تجاري' }, { type: 'تجاري' }, { type: 'عمالي' },
      ] as Case[];
      const dist = getCaseDistribution(cases);
      expect(dist['تجاري']).toBe(2);
      expect(dist['عمالي']).toBe(1);
    });
  });

  describe('getAtRiskCases', () => {
    it('should return only active old cases', () => {
      const cases = [
        { status: 'متداولة', createdAt: new Date(Date.now() - 150 * 86400000).toISOString() },
        { status: 'مغلقة', createdAt: new Date(Date.now() - 150 * 86400000).toISOString() },
        { status: 'متداولة', createdAt: new Date().toISOString() },
      ] as Case[];
      expect(getAtRiskCases(cases, 120).length).toBe(1);
    });
  });
});
