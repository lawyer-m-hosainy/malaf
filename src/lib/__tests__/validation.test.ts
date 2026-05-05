import { describe, it, expect } from 'vitest';
import { formatSaudiPhone } from '../validation';

describe('Validation Library', () => {
  describe('formatSaudiPhone', () => {
    it('should format 05XXXXXXXX to +9665XXXXXXXX', () => {
      expect(formatSaudiPhone('0512345678')).toBe('+966512345678');
    });

    it('should handle already formatted +9665XXXXXXXX', () => {
      expect(formatSaudiPhone('+966512345678')).toBe('+966512345678');
    });

    it('should format 5XXXXXXXX (9 digits) to +9665XXXXXXXX', () => {
      expect(formatSaudiPhone('512345678')).toBe('+966512345678');
    });

    it('should handle 9665XXXXXXXX (without +)', () => {
      expect(formatSaudiPhone('966512345678')).toBe('+966512345678');
    });
  });
});
