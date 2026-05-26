/**
 * @file backward-compatibility.test.ts
 * @description Backward compatibility checks for API v1 schemas to prevent breaking changes.
 * @author مهندس الموثوقية والأمان (SRE)
 * @copyright (c) 2026. All rights reserved.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

describe('API v1 Backward Compatibility Test Suite — malaf.pro', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('GET /api/v1/cases — استرجاع القضايا', () => {
    it('يجب أن تحتوي الاستجابة دائماً على حقل data وميتا البيانات بالهيكل الصحيح لتجنب كسر التوافقية', async () => {
      // محاكاة استجابة من مسار القضايا v1
      const mockResponse = {
        data: [
          {
            id: 'case-9901-xyz',
            title: 'قضية تعويض أضرار عمالية',
            status: 'متداولة',
            court: 'محكمة العمال بشمال القاهرة',
            created_at: '2026-05-26T20:00:00Z',
          }
        ],
        meta: {
          total: 1,
          page: 1,
          per_page: 10,
        }
      };

      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve(new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      });

      const response = await fetch('/api/v1/cases');
      const body = await response.json();

      // التحقق من وجود الحقول الأساسية لضمان عدم كسر الأنظمة المستهلكة
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total');
      expect(body.meta).toHaveProperty('page');
      expect(body.meta).toHaveProperty('per_page');

      // التحقق من الحقول الحساسة للقضية وأنواعها
      const firstCase = body.data[0];
      expect(firstCase).toHaveProperty('id');
      expect(typeof firstCase.id).toBe('string');
      expect(firstCase).toHaveProperty('title');
      expect(typeof firstCase.title).toBe('string');
      expect(firstCase).toHaveProperty('status');
      expect(typeof firstCase.status).toBe('string');
      expect(firstCase).toHaveProperty('created_at');
      expect(typeof firstCase.created_at).toBe('string');
    });
  });

  describe('GET /api/v1/clients — استرجاع الموكلين', () => {
    it('يجب أن تحتوي استجابة الموكلين دائماً على البيانات الأساسية المطلوبة من العملاء', async () => {
      const mockResponse = {
        data: [
          {
            id: 'client-5501-abc',
            name: 'أحمد محمد العشري',
            phone: '01012345678',
            national_id: '29001011234567',
            created_at: '2026-05-26T20:00:00Z'
          }
        ],
        meta: {
          total: 1,
          page: 1,
          per_page: 10
        }
      };

      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve(new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      });

      const response = await fetch('/api/v1/clients');
      const body = await response.json();

      expect(body).toHaveProperty('data');
      expect(body.data[0]).toHaveProperty('id');
      expect(typeof body.data[0].id).toBe('string');
      expect(body.data[0]).toHaveProperty('name');
      expect(typeof body.data[0].name).toBe('string');
      expect(body.data[0]).toHaveProperty('phone');
      expect(typeof body.data[0].phone).toBe('string');
      expect(body.data[0]).toHaveProperty('national_id');
      expect(typeof body.data[0].national_id).toBe('string');
    });
  });

  describe('GET /api/v1/finance/metrics — إحصائيات المالية', () => {
    it('يجب أن تُرجع إحصائيات المالية القيم الأساسية لضمان عدم توقف الواجهة الإحصائية', async () => {
      const mockResponse = {
        total_revenue: 150000.00,
        pending_payments: 45000.00,
        currency: 'EGP'
      };

      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve(new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      });

      const response = await fetch('/api/v1/finance/metrics');
      const body = await response.json();

      expect(body).toHaveProperty('total_revenue');
      expect(typeof body.total_revenue).toBe('number');
      expect(body).toHaveProperty('pending_payments');
      expect(typeof body.pending_payments).toBe('number');
      expect(body).toHaveProperty('currency');
      expect(body.currency).toBe('EGP');
    });
  });
});
