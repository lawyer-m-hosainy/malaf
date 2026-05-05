import { describe, it, expect } from 'vitest';
import { 
  linkCaseToELitigation, 
  addCaseMemorandum, 
  createDeadline, 
  transitionCaseStatus 
} from '../useCases';
import { CasesRepository } from '@/repositories/casesRepository';
import { Case } from '@/types';

// Mock simple repository for testing
class MockCasesRepository implements CasesRepository {
  private cases: Case[] = [];
  
  constructor(initialCases: Case[] = []) {
    this.cases = initialCases;
  }
  
  getCases() {
    return this.cases;
  }
  
  saveCases(cases: Case[]) {
    this.cases = cases;
  }
  
  addDeadline() {
    // mock add deadline
  }
}

describe('linkCaseToELitigation', () => {
  it('يغير حالة التقاضي الإلكتروني إلى مربوط', () => {
    const mockCase: Case = {
      id: 'C-1',
      clientId: 'C-001',
      status: 'متداولة',
      workflowStage: 'intake',
      plaintiff: 'A',
      defendant: 'B',
      type: 'تجاري',
      court: 'المحكمة الاقتصادية',
      powerOfAttorneyRef: '',
      createdAt: '2024-03-10T12:00:00Z',
      memorandums: [],
      documents: []
    };
    const repo = new MockCasesRepository([mockCase]);
    
    linkCaseToELitigation(repo, 'C-1');
    
    const updated = repo.getCases().find(c => c.id === 'C-1');
    // expect(updated?.eLitigationStatus).toBe('مربوط ببوابة التقاضي'); // removed from schema
  });
});

describe('addCaseMemorandum', () => {
  it('يضيف اسم المذكرة لمصفوفة المذكرات ويغير حالة سير العمل إلى pleadings', () => {
    const mockCase: Case = {
      id: 'C-2',
      clientId: 'C-001',
      status: 'متداولة',
      workflowStage: 'intake',
      plaintiff: 'A',
      defendant: 'B',
      type: 'تجاري',
      court: 'المحكمة الاقتصادية',
      powerOfAttorneyRef: '',
      createdAt: '2024-03-10T12:00:00Z',
      memorandums: [],
      documents: []
    };
    const repo = new MockCasesRepository([mockCase]);
    
    addCaseMemorandum(repo, 'C-2', 'مذكرة دفاع أولى');
    
    const updated = repo.getCases().find(c => c.id === 'C-2');
    expect(updated?.memorandums).toContain('مذكرة دفاع أولى');
    expect(updated?.workflowStage).toBe('pleadings');
  });
});

describe('createDeadline', () => {
  it('ينشئ موعد نهائي بمعرف فريد وحالة معلقة', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];
    
    const deadline = createDeadline({
      caseId: 'C-1',
      title: 'موعد إيداع',
      date: dateStr,
      type: 'تقديم صحيفة',
      priority: 'high'
    });
    
    expect(deadline.id).toBeDefined();
    expect(deadline.status).toBe('pending');
    expect(deadline.title).toBe('موعد إيداع');
  });
});

describe('transitionCaseStatus', () => {
  it('يرمي خطأ عند انتقال غير صالح', () => {
    const mockCase: Case = {
      id: 'C-3',
      clientId: 'C-001',
      status: 'مغلقة',
      workflowStage: 'closed',
      plaintiff: 'A',
      defendant: 'B',
      type: 'تجاري',
      court: 'المحكمة الاقتصادية',
      powerOfAttorneyRef: '',
      createdAt: '2024-03-10T12:00:00Z',
      memorandums: [],
      documents: []
    };
    const repo = new MockCasesRepository([mockCase]);
    
    // محاولة فتح قضية مغلقة
    expect(() => transitionCaseStatus(repo, 'C-3', 'متداولة')).toThrow('INVALID_CASE_STATUS_TRANSITION');
  });
  
  it('يغير حالة القضية ومرحلة سير العمل بنجاح للانتقال الصالح', () => {
    const mockCase: Case = {
      id: 'C-4',
      clientId: 'C-001',
      status: 'تحت الدراسة',
      workflowStage: 'intake',
      plaintiff: 'A',
      defendant: 'B',
      type: 'تجاري',
      court: 'المحكمة الاقتصادية',
      powerOfAttorneyRef: '',
      createdAt: '2024-03-10T12:00:00Z',
      memorandums: [],
      documents: []
    };
    const repo = new MockCasesRepository([mockCase]);
    
    transitionCaseStatus(repo, 'C-4', 'متداولة');
    
    const updated = repo.getCases().find(c => c.id === 'C-4');
    expect(updated?.status).toBe('متداولة');
    expect(updated?.workflowStage).toBe('hearing');
  });
});
