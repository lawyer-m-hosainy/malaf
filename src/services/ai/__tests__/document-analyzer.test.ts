import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeDocument, DocumentAnalysisResult } from '../document-analyzer'
import * as apiClient from '../apiClient'

// Mock the API client
vi.mock('../apiClient', () => ({
  callAiApi: vi.fn()
}))

const SAMPLE_LEASE = `
عقد إيجار مبرم بتاريخ الأول من يناير 2025 بين:
- السيد أحمد محمد علي، المقيم بالقاهرة (المؤجر)
- والسيد خالد إبراهيم حسن، المقيم بالجيزة (المستأجر)
وذلك على العقار الكائن بشارع التحرير رقم 15، الدور الثالث.
مدة الإيجار: سنة كاملة تبدأ من 1 فبراير 2025.
الإيجار الشهري: ثلاثة آلاف جنيه مصري (3000 جنيه).
`

const SAMPLE_EMPLOYMENT = `
عقد عمل بين شركة النيل للتقنية (صاحب العمل)
والمهندس سارة أحمد (الموظف)
المسمى الوظيفي: مطور برمجيات أول
الراتب الشهري: 25,000 جنيه + 10% حوافز سنوية
مدة العقد: سنتان قابلتان للتجديد
`

describe('📄 Document Analyzer — AI Core Feature', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('استخراج أطراف العقد', () => {
    it('يستخرج المؤجر والمستأجر من عقد الإيجار', async () => {
      (apiClient.callAiApi as any).mockResolvedValue({
        text: JSON.stringify({
          contractType: "عقد إيجار",
          parties: [
            { name: "أحمد محمد علي", role: "مؤجر" },
            { name: "خالد إبراهيم حسن", role: "مستأجر" }
          ],
          financials: [{ label: "إيجار شهري", amount: 3000, currency: "EGP" }],
          startDate: "2025-02-01",
          duration: "سنة واحدة",
          summary: "عقد إيجار شقة بسكن بشارع التحرير"
        })
      })

      const result: DocumentAnalysisResult = await analyzeDocument(SAMPLE_LEASE)
      expect(result.parties).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: expect.stringContaining('أحمد'), role: 'مؤجر' }),
          expect.objectContaining({ name: expect.stringContaining('خالد'), role: 'مستأجر' }),
        ])
      )
    }, 30_000)

    it('يستخرج صاحب العمل والموظف من عقد العمل', async () => {
      (apiClient.callAiApi as any).mockResolvedValue({
        text: JSON.stringify({
          contractType: "عقد عمل",
          parties: [
            { name: "شركة النيل للتقنية", role: "صاحب العمل" },
            { name: "سارة أحمد", role: "موظف" }
          ],
          financials: [{ label: "راتب شهري", amount: 25000, currency: "EGP" }],
          startDate: "غير محدد",
          duration: "سنتان",
          summary: "عقد عمل مطور برمجيات"
        })
      })

      const result = await analyzeDocument(SAMPLE_EMPLOYMENT)
      expect(result.parties.length).toBeGreaterThanOrEqual(2)
    }, 30_000)
  })

  describe('تحديد نوع العقد', () => {
    it('يصنّف عقد الإيجار بشكل صحيح', async () => {
      (apiClient.callAiApi as any).mockResolvedValue({
        text: JSON.stringify({ contractType: "عقد إيجار" })
      })
      const result = await analyzeDocument(SAMPLE_LEASE)
      expect(result.contractType).toMatch(/إيجار|tenancy|lease/i)
    }, 30_000)

    it('يصنّف عقد العمل بشكل صحيح', async () => {
      (apiClient.callAiApi as any).mockResolvedValue({
        text: JSON.stringify({ contractType: "عقد عمل" })
      })
      const result = await analyzeDocument(SAMPLE_EMPLOYMENT)
      expect(result.contractType).toMatch(/عمل|employment|work/i)
    }, 30_000)
  })

  describe('استخراج البيانات المالية', () => {
    it('يستخرج الإيجار الشهري بالقيمة الصحيحة', async () => {
      (apiClient.callAiApi as any).mockResolvedValue({
        text: JSON.stringify({
          financials: [{ label: "إيجار", amount: 3000, currency: "EGP" }]
        })
      })
      const result = await analyzeDocument(SAMPLE_LEASE)
      const financials = result.financials || []
      expect(financials.some(f => f.amount === 3000)).toBe(true)
    }, 30_000)
  })

  describe('استخراج التواريخ والمدد', () => {
    it('يحدد تاريخ بداية العقد', async () => {
      (apiClient.callAiApi as any).mockResolvedValue({
        text: JSON.stringify({ startDate: "2025-02-01" })
      })
      const result = await analyzeDocument(SAMPLE_LEASE)
      expect(result.startDate).toBeTruthy()
    }, 30_000)

    it('يحدد مدة العقد', async () => {
      (apiClient.callAiApi as any).mockResolvedValue({
        text: JSON.stringify({ duration: "سنة واحدة" })
      })
      const result = await analyzeDocument(SAMPLE_LEASE)
      expect(result.duration).toMatch(/سنة|year|12 month/i)
    }, 30_000)
  })

  describe('Quality Gate — بوابة الجودة', () => {
    it('لا يعرض نتيجة على المستخدم قبل المرور على Quality Checker', async () => {
      // Mock callAiApi to return valid analysis
      (apiClient.callAiApi as any).mockResolvedValue({
        text: JSON.stringify({ contractType: "عقد إيجار", parties: [] })
      })

      const result = await analyzeDocument(SAMPLE_LEASE)
      // النتيجة لازم تحتوي على qualityScore إذا مرت على الـ checker
      expect(result).toHaveProperty('qualityScore')
      expect(result.qualityScore).toBeGreaterThanOrEqual(0)
    }, 30_000)
  })
})
