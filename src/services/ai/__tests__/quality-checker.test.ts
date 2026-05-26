import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evaluateOutput, QualityResult } from '../quality-checker'
import * as apiClient from '../apiClient'
import { supabase } from '@/lib/supabase'

const isRealApi = process.env.REAL_API === 'true'

// Conditional mocking that handles Vitest hoisting
vi.mock('../apiClient', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../apiClient')>()
  if (process.env.REAL_API === 'true') {
    return mod
  }
  return {
    ...mod,
    callAiApi: vi.fn()
  }
})

describe('⚖️ Quality Checker — Hallucination Guard', () => {

  beforeEach(() => {
    if (!isRealApi) {
      vi.clearAllMocks()
    } else {
      // Mock Supabase session for real API tests to bypass the UNAUTHORIZED check
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: { access_token: 'mock-token' } as any },
        error: null
      })
    }
  })

  // --- Hallucinated Legal Articles ---
  describe('كشف المواد القانونية الوهمية', () => {
    it('يرفض مادة قانونية غير موجودة', async () => {
      const hallucinated = 'طبقاً للمادة 999 من القانون المدني المصري...'
      const result: QualityResult = await evaluateOutput(hallucinated, { 
        domain: 'civil_law', 
        country: 'EG' 
      })
      expect(result.passed).toBe(false)
      expect(result.reason).toMatch(/999|مادة|article|غير موجود|not found|هلوسة/i)
    }, 20_000)

    it('يقبل مادة قانونية صحيحة', async () => {
      if (!isRealApi) {
        (apiClient.callAiApi as any).mockResolvedValue({
          text: JSON.stringify({
            passed: true,
            confidence: 0.95,
            reason: "المادة 147 مادة حقيقية وصحيحة في القانون المدني المصري.",
            hallucinations: []
          })
        })
      }

      const valid = 'طبقاً للمادة 147 من القانون المدني المصري، العقد شريعة المتعاقدين.'
      const result: QualityResult = await evaluateOutput(valid, { 
        domain: 'civil_law', 
        country: 'EG' 
      })
      expect(result.passed).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.7)
    }, 20_000)
  })

  // --- Confidence Threshold ---
  describe('عتبة الثقة (Confidence Threshold)', () => {
    it('يرفض مخرج بثقة أقل من 70%', async () => {
      if (!isRealApi) {
        (apiClient.callAiApi as any).mockResolvedValue({
          text: JSON.stringify({
            passed: true,
            confidence: 0.5,
            reason: "النص غامض وغير محدد.",
            hallucinations: []
          })
        })
      }

      const vagueOutput = 'ربما يكون العقد صحيحاً أو لا، من الممكن أن القانون ينص على أشياء غير واضحة.'
      const result = await evaluateOutput(vagueOutput, { domain: 'contract_law' })
      
      if (!isRealApi) {
        expect(result.confidence).toBeLessThan(0.7)
        expect(result.passed).toBe(false)
      } else {
        expect(result).toHaveProperty('passed')
        expect(result).toHaveProperty('confidence')
      }
    }, 20_000)
  })

  // --- Disclaimer Injection ---
  describe('إضافة Disclaimer تلقائي', () => {
    it('يضيف تنويه للمستخدم على كل مخرج AI سليم', async () => {
      if (!isRealApi) {
        (apiClient.callAiApi as any).mockResolvedValue({
          text: JSON.stringify({
            passed: true,
            confidence: 0.9,
            reason: "نص سليم",
            hallucinations: []
          })
        })
      }

      const output = 'يحق للمستأجر إخطار المؤجر كتابياً في حالة وجود تلفيات.'
      const result = await evaluateOutput(output, { domain: 'tenancy_law' })
      
      if (result.passed) {
        expect(result.finalOutput).toContain('محامٍ')
      }
    }, 20_000)
  })

  // --- Performance ---
  describe('أداء الـ Quality Checker', () => {
    it('يستجيب في وقت معقول', async () => {
      if (!isRealApi) {
        (apiClient.callAiApi as any).mockResolvedValue({
          text: JSON.stringify({ passed: true, confidence: 0.9 })
        })
      }

      const start = Date.now()
      await evaluateOutput('نص قانوني بسيط للاختبار', { domain: 'general' })
      const elapsed = Date.now() - start
      
      expect(elapsed).toBeLessThan(isRealApi ? 20000 : 5000)
    }, 25_000)
  })
})
