import { describe, it, expect } from 'vitest';
import { formatEgyptPhone } from '../validation';

describe('Validation Library', () => {
  describe('formatEgyptPhone', () => {
    it('should format 01XXXXXXXXX to +201XXXXXXXXX', () => {
      expect(formatEgyptPhone('01012345678')).toBe('+201012345678');
    });

    it('should handle already formatted +201XXXXXXXXX', () => {
      expect(formatEgyptPhone('+201012345678')).toBe('+201012345678');
    });

    it('should format 1XXXXXXXXX (10 digits) to +201XXXXXXXXX', () => {
      expect(formatEgyptPhone('1012345678')).toBe('+201012345678');
    });

    it('should handle 201XXXXXXXXX (without +)', () => {
      expect(formatEgyptPhone('201012345678')).toBe('+201012345678');
    });
  });
});
