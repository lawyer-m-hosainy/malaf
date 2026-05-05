import { describe, it, expect } from 'vitest';
import { validateClientIdentity, isValidNationalId, isValidCommercialRegistration, isValidVatNumber, canDeleteClient } from '../src/domain/clientDomain';

describe('clientDomain', () => {
  describe('validateClientIdentity', () => {
    it('should reject client without name', () => {
      const result = validateClientIdentity({ type: 'فرد', phone: '+966500000000' });
      expect(result.valid).toBe(false);
    });

    it('should reject individual without nationalId', () => {
      const result = validateClientIdentity({ name: 'محمد', type: 'فرد', phone: '+966500000000' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('الهوية');
    });

    it('should reject entity without commercial registration', () => {
      const result = validateClientIdentity({ name: 'شركة', type: 'منشأة', phone: '+966500000000' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('السجل');
    });

    it('should accept valid individual', () => {
      const result = validateClientIdentity({ name: 'محمد', type: 'فرد', phone: '+966500000000', nationalId: '1234567890' });
      expect(result.valid).toBe(true);
    });

    it('should accept valid entity', () => {
      const result = validateClientIdentity({ name: 'شركة', type: 'منشأة', phone: '+966500000000', commercialRegistration: '7000000001' });
      expect(result.valid).toBe(true);
    });
  });

  describe('isValidNationalId', () => {
    it('should accept valid IDs starting with 1', () => {
      expect(isValidNationalId('1234567890')).toBe(true);
    });
    it('should accept valid IDs starting with 2', () => {
      expect(isValidNationalId('2234567890')).toBe(true);
    });
    it('should reject IDs starting with other digits', () => {
      expect(isValidNationalId('3234567890')).toBe(false);
    });
    it('should reject IDs with wrong length', () => {
      expect(isValidNationalId('123456')).toBe(false);
    });
  });

  describe('isValidCommercialRegistration', () => {
    it('should accept valid CR starting with 7', () => {
      expect(isValidCommercialRegistration('7000000001')).toBe(true);
    });
    it('should reject CR not starting with 7', () => {
      expect(isValidCommercialRegistration('1000000001')).toBe(false);
    });
  });

  describe('isValidVatNumber', () => {
    it('should accept valid 15-digit VAT starting with 3', () => {
      expect(isValidVatNumber('300012345600000')).toBe(true);
    });
    it('should reject short VAT', () => {
      expect(isValidVatNumber('30001234')).toBe(false);
    });
  });

  describe('canDeleteClient', () => {
    it('should allow deletion when no active cases', () => {
      expect(canDeleteClient('C-1', ['C-2', 'C-3']).allowed).toBe(true);
    });
    it('should block deletion when client has active cases', () => {
      const result = canDeleteClient('C-1', ['C-1', 'C-2']);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('قضايا نشطة');
    });
  });
});
