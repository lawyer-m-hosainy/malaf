import { describe, it, expect } from 'vitest'
import { conflictCheck, ConflictResult } from '../conflict-check'

// بيانات اختبار ثابتة — مش بتتغير بين الـ runs
const MOCK_DB = {
  clients: [
    { id: 'c1', name: 'شركة النيل للتجارة', cases: ['case-001'] },
    { id: 'c2', name: 'محمد أحمد علي', cases: ['case-002'] },
  ],
  cases: [
    { id: 'case-001', title: 'نزاع تجاري', plaintiff: 'c1', defendant: 'مؤسسة الأمل' },
    { id: 'case-002', title: 'قضية عمالية', plaintiff: 'c2', defendant: 'شركة الدلتا' },
  ]
}

describe('🔍 Conflict Check — تعارض المصالح', () => {

  describe('كشف التعارض الواضح', () => {
    it('يكشف تعارض عندما الطرف الثاني موكل حالي', async () => {
      const newCase = {
        clientName: 'مؤسسة جديدة',
        opposingParty: 'شركة النيل للتجارة',  // موكل موجود
      }
      const result: ConflictResult = await conflictCheck(newCase, MOCK_DB)
      expect(result.hasConflict).toBe(true)
      expect(result.conflictingClientId).toBe('c1')
      expect(result.conflictingCaseId).toBe('case-001')
    })

    it('يكشف تعارض عندما الموكل الجديد هو خصم في قضية قديمة', async () => {
      const newCase = {
        clientName: 'مؤسسة الأمل',  // كان خصماً في case-001
        opposingParty: 'طرف آخر',
      }
      const result = await conflictCheck(newCase, MOCK_DB)
      expect(result.hasConflict).toBe(true)
    })
  })

  describe('غياب التعارض', () => {
    it('يسمح بموكل جديد بلا تعارض', async () => {
      const newCase = {
        clientName: 'شركة السلام للاستيراد',
        opposingParty: 'مؤسسة الربيع',
      }
      const result = await conflictCheck(newCase, MOCK_DB)
      expect(result.hasConflict).toBe(false)
    })
  })

  describe('الأداء', () => {
    it('يعمل على 500 قضية في أقل من 800ms', async () => {
      const largeMockDB = {
        clients: Array.from({ length: 200 }, (_, i) => ({
          id: `c${i}`, name: `موكل رقم ${i}`, cases: [`case-${i}`]
        })),
        cases: Array.from({ length: 500 }, (_, i) => ({
          id: `case-${i}`, title: `قضية ${i}`,
          plaintiff: `c${i % 200}`, defendant: `خصم ${i}`
        }))
      }
      const start = Date.now()
      await conflictCheck({ clientName: 'موكل اختبار', opposingParty: 'خصم اختبار' }, largeMockDB)
      expect(Date.now() - start).toBeLessThan(800)
    })
  })
})
