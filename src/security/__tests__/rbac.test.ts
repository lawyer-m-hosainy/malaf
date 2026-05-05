import { describe, it, expect } from 'vitest';
import { mapToSystemRole, hasRequiredRole } from '../rbac';

describe('RBAC Security Module', () => {
  describe('mapToSystemRole', () => {
    it('maps "مدير مكتب" to admin', () => {
      expect(mapToSystemRole('مدير مكتب')).toBe('admin');
    });

    it('maps various lawyer roles to lawyer', () => {
      expect(mapToSystemRole('محامي')).toBe('lawyer');
      expect(mapToSystemRole('محامي شريك')).toBe('lawyer');
      expect(mapToSystemRole('محامي متدرب')).toBe('lawyer');
    });

    it('maps "سكرتير" to staff', () => {
      expect(mapToSystemRole('سكرتير')).toBe('staff');
    });

    it('returns null for undefined or invalid roles', () => {
      expect(mapToSystemRole(null)).toBeNull();
      expect(mapToSystemRole(undefined)).toBeNull();
      expect(mapToSystemRole('invalid' as any)).toBeNull();
    });
  });

  describe('hasRequiredRole', () => {
    it('returns true if no required roles are specified', () => {
      expect(hasRequiredRole('سكرتير', [])).toBe(true);
      expect(hasRequiredRole('سكرتير', undefined)).toBe(true);
    });

    it('returns true if the user role matches one of the required roles', () => {
      expect(hasRequiredRole('مدير مكتب', ['admin'])).toBe(true);
      expect(hasRequiredRole('محامي شريك', ['lawyer', 'admin'])).toBe(true);
    });

    it('returns false if the user role does not match required roles', () => {
      expect(hasRequiredRole('سكرتير', ['admin', 'lawyer'])).toBe(false);
    });

    it('returns false if the user has no role', () => {
      expect(hasRequiredRole(null, ['admin'])).toBe(false);
    });
  });
});
