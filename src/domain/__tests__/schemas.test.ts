import { describe, it, expect } from 'vitest';
import { ClientSchema, CaseSchema } from '../schemas';

describe('Domain Schemas', () => {
  describe('ClientSchema', () => {
    it('should validate correct Egyptian client data', () => {
      const validData = {
        id: 'cl-1',
        type: 'فرد' as const,
        name: 'أحمد محمد',
        phone: '+201012345678'
      };
      const result = ClientSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail for non-Egyptian phone format', () => {
      const invalidData = {
        id: 'cl-1',
        type: 'فرد' as const,
        name: 'أحمد محمد',
        phone: '01012345678' // Should fail because regex expects +201...
      };
      const result = ClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues[0].message).toContain('رقم الجوال يجب أن يكون بالصيغة المصرية');
      }
    });

    it('should fail for name shorter than 2 characters', () => {
      const invalidData = {
        id: 'cl-1',
        type: 'فرد' as const,
        name: 'أ',
        phone: '+201012345678'
      };
      const result = ClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CaseSchema', () => {
    it('should validate correct case data with recognized court', () => {
      const validData = {
        id: 'case-1',
        clientId: 'cl-1',
        court: 'المحكمة الاقتصادية' as const,
        plaintiff: 'شركة أ',
        defendant: 'شركة ب',
        status: 'متداولة' as const,
        createdAt: new Date().toISOString()
      };
      const result = CaseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail for unrecognized court', () => {
      const invalidData = {
        id: 'case-1',
        court: 'محكمة المرور' as any, // Not in the enum
        plaintiff: 'شركة أ',
        defendant: 'شركة ب',
        status: 'نشطة' as const,
        createdAt: new Date().toISOString()
      };
      const result = CaseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
