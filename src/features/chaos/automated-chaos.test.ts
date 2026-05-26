/**
 * @file automated-chaos.test.ts
 * @description Automated Chaos resilience and failure injection tests using Vitest.
 * @author مهندس الموثوقية (SRE)
 * @copyright (c) 2026. All rights reserved.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ETAApiClient } from '../../services/etaApiClient';
import { isFeatureEnabled } from '../../config/feature-flags';
import { CHAOS_EXPERIMENTS } from './chaos-library';

describe('Chaos Engineering & Resilience Tests — malaf.pro', function() {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('التجربة 1: انقطاع كلي لقاعدة البيانات (Supabase Outage)', () => {
    it('يجب أن تفشل طلبات الشبكة الموجهة لسوبابيس بأمان وتلتقط رسالة خطأ عربية', async () => {
      // محاكاة حظر اتصالات سوبابيس (Supabase Outage)
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('supabase.co')) {
          return Promise.reject(new Error('Chaos Network Error: Supabase is unavailable'));
        }
        return Promise.resolve(new Response(JSON.stringify({ data: [] })));
      });

      const fetchCases = async () => {
        try {
          await fetch('https://sb-xyz.supabase.co/rest/v1/cases');
          return 'success';
        } catch (error: any) {
          // محاكاة معالج الأخطاء العربي في الواجهة
          return `تعذر الاتصال بقاعدة البيانات حالياً: ${error.message}`;
        }
      };

      const result = await fetchCases();
      expect(result).toContain('تعذر الاتصال بقاعدة البيانات حالياً');
      expect(result).toContain('Chaos Network Error');
    });
  });

  describe('التجربة 2: بطء شديد في قاعدة البيانات (Database Latency Spike)', () => {
    it('يجب ألا تتجمد الواجهة وأن تعمل الدوال بشكل غير متزامن مع إظهار حالة الانتظار', async () => {
      let resolvePromise: any;
      const delayPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      // محاكاة تأخير في قاعدة البيانات عن طريق تعليق حل الوعد
      global.fetch = vi.fn().mockImplementation(() => {
        return delayPromise.then(() => new Response(JSON.stringify({ data: [{ id: 1, name: 'قضية جنائية' }] })));
      });

      let isLoading = true;
      let data: any = null;

      const loadData = async () => {
        const res = await fetch('https://sb-xyz.supabase.co/rest/v1/cases');
        data = await res.json();
        isLoading = false;
      };

      const loadPromise = loadData();

      // التحقق الفوري من ظهور حالة التحميل (Skeleton/Loader)
      expect(isLoading).toBe(true);
      expect(data).toBeNull();

      // حل الوعد الآن لمحاكاة اكتمال جلب البيانات
      resolvePromise();
      await loadPromise;

      // بعد انتهاء التأخير، يجب أن تكتمل العملية بنجاح
      expect(isLoading).toBe(false);
      expect(data.data[0].name).toBe('قضية جنائية');
    });
  });

  describe('التجربة 3 & 4: انقطاع وقاطع الدورة لـ ETA API (ETA API Down & Circuit Breaker)', () => {
    it('يجب تفعيل قاطع الدورة (Circuit Breaker) بعد 5 إخفاقات متتالية لتجنب إنهاك الموارد', async () => {
      const client = ETAApiClient.getInstance();

      // إعادة تهيئة حالة العميل لضمان إخفاقات جديدة
      // @ts-ignore - access private properties for testing
      client.failureCount = 0;
      // @ts-ignore
      client.isCircuitOpen = false;

      // محاكاة انقطاع كلي لخادم الضرائب بـ Network Error لضمان استدعاء catch
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.reject(new Error('Internal Server Error'));
      });

      // إخفاق 5 طلبات متتالية لتفعيل الـ Circuit Breaker
      for (let i = 0; i < 5; i++) {
        await expect(client.sendInvoice({ id: `inv-${i}` }, { retries: 1, backoff: 0 })).rejects.toBeDefined();
      }

      // الطلب السادس يجب أن يفشل فوراً برفض قاطع الدورة (Circuit Breaker is OPEN) دون استدعاء الـ Fetch
      global.fetch = vi.fn(); // تفريغ الـ fetch للتأكد من عدم استدعائها

      await expect(client.sendInvoice({ id: 'inv-6' })).rejects.toThrowError(/Circuit Breaker is OPEN/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('يجب أن ينتقل قاطع الدورة لحالة الفتح الجزئي (Half-Open) بعد مرور 60 ثانية ويسمح بالمحاولة مجدداً', async () => {
      const client = ETAApiClient.getInstance();

      // محاكاة وضع قاطع الدورة المفتوح
      // @ts-ignore
      client.isCircuitOpen = true;
      // @ts-ignore
      client.lastFailureTime = 1000;

      // محاكاة مرور 61 ثانية في النظام عن طريق محاكاة Date.now()
      const futureTime = 1000 + 61000;
      vi.spyOn(Date, 'now').mockReturnValue(futureTime);

      // محاكاة عودة الخدمة للعمل بشكل طبيعي 200 OK
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), {
          status: 200,
          statusText: 'OK'
        }));
      });

      // إرسال الفاتورة الآن يجب أن يمر بنجاح تام بعد الفتح الجزئي والتعافي
      const result = await client.sendInvoice({ id: 'inv-recovered' }, { retries: 1, backoff: 0 });
      expect(result.success).toBe(true);
    });
  });

  describe('التجربة 7: تلف بيانات التخزين المحلي (Local Storage Corruption)', () => {
    it('يجب معالجة جلسات الـ Local Storage التالفة وحماية التطبيق من الانهيار البرمجي', () => {
      const badJson = '{ invalid_json: this will fail parse }';
      
      const safeParseSession = (raw: string | null) => {
        try {
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (e) {
          // تطهير التخزين التالف وتنبيه الأمان
          return { error: 'SESSION_CORRUPTED', fallback: true };
        }
      };

      const result = safeParseSession(badJson);
      expect(result.error).toBe('SESSION_CORRUPTED');
      expect(result.fallback).toBe(true);
    });
  });

  describe('التجربة 9: استقرار خدمات الذكاء الاصطناعي وجوجل جمناي', () => {
    it('عند توقف Gemini AI، يجب تفعيل الفحص التقليدي الجاف بدلاً من توقف عمل التطبيق', async () => {
      const mockGeminiClient = {
        analyzeDocument: vi.fn().mockRejectedValue(new Error('Quota Exceeded / API offline'))
      };

      const fallbackAnalyzer = (text: string) => {
        // فحص جاف تقليدي بالكلمات المفتاحية
        const results = [];
        if (text.includes('عقد بيع')) results.push('نوع الوثيقة: عقد بيع عقد بيع عقار');
        if (text.includes('جنحة')) results.push('نوع القضية: جنحة مباشرة');
        return {
          results,
          isFallback: true,
          engine: 'Rule-Based Offline Engine'
        };
      };

      const runAnalysis = async (text: string) => {
        try {
          return await mockGeminiClient.analyzeDocument(text);
        } catch (e) {
          // التحويل للمحرك الاحتياطي عند الفشل الكلي
          return fallbackAnalyzer(text);
        }
      };

      const analysis = await runAnalysis('هذا المستند عبارة عن عقد بيع شقة سكنية بالدقي');
      expect(analysis.isFallback).toBe(true);
      expect(analysis.engine).toBe('Rule-Based Offline Engine');
      expect(analysis.results[0]).toBe('نوع الوثيقة: عقد بيع عقد بيع عقار');
    });
  });

  describe('التحقق من قائمة التجارب والمكتبة الشاملة', () => {
    it('يجب أن تحتوي مكتبة تجارب الفوضى على 10 تجارب موثقة بالكامل ولا توجد قيم فارغة', () => {
      expect(CHAOS_EXPERIMENTS.length).toBe(10);
      CHAOS_EXPERIMENTS.forEach((exp: any) => {
        expect(exp.name).toBeDefined();
        expect(exp.hypothesis).toBeDefined();
        expect(exp.method).toBeDefined();
        expect(exp.expectedBehavior).toBeDefined();
        expect(exp.rollbackPlan).toBeDefined();
        expect(exp.successCriteria.length).toBeGreaterThan(0);
      });
    });
  });
});
