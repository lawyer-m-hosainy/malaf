import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyticsStore } from '../useAnalyticsStore';
import { useClientsStore } from '../useClientsStore';
import { useCasesStore } from '../useCasesStore';
import { useAuthStore } from '../useAuthStore';

describe('Conflict Check Integration', () => {
  beforeEach(() => {
    // Reset stores and populate with mock data for testing
    useAuthStore.setState({ currentUser: { id: 'user-1', name: 'Tester', role: 'محامي', permissions: [] } as any });
    
    useClientsStore.setState({
      clients: [
        { id: 'C1', type: 'منشأة', name: 'شركة ألف', phone: '+966500000000', subsidiaries: ['شركة تابعة ألف'] },
        { id: 'C2', type: 'فرد', name: 'محمد عبدالله', phone: '+966511111111' }
      ] as any[]
    });

    useCasesStore.setState({
      cases: [
        { id: 'case-1', plaintiff: 'شركة ألف', defendant: 'شركة منافسة', status: 'نشطة' },
        { id: 'case-2', plaintiff: 'خالد', defendant: 'محمد عبدالله', status: 'نشطة' }
      ] as any[]
    });
  });

  it('detects a direct conflict when searching for an existing client', () => {
    const { executeConflictCheck } = useAnalyticsStore.getState();
    const result = executeConflictCheck('شركة ألف');

    expect(result.status).toBe('DirectConflict');
    expect(result.matches.length).toBeGreaterThan(0);
    const directMatch = result.matches.find(m => m.relationshipType === 'Client');
    expect(directMatch).toBeDefined();
    expect(directMatch?.entityName).toBe('شركة ألف');
  });

  it('detects an indirect conflict when searching for a subsidiary', () => {
    const { executeConflictCheck } = useAnalyticsStore.getState();
    const result = executeConflictCheck('شركة تابعة ألف');

    // Since the logic currently assigns Medium severity to Subsidiary, the status might be 'IndirectConflict'
    expect(result.status).toBe('IndirectConflict');
    const subMatch = result.matches.find(m => m.relationshipType === 'Subsidiary');
    expect(subMatch).toBeDefined();
    expect(subMatch?.entityName).toBe('شركة تابعة ألف');
  });

  it('detects a direct conflict when searching for a defendant in an active case', () => {
    const { executeConflictCheck } = useAnalyticsStore.getState();
    const result = executeConflictCheck('محمد عبدالله');

    // Should match both as a Client and an AdverseParty
    expect(result.status).toBe('DirectConflict');
    const adverseMatch = result.matches.find(m => m.relationshipType === 'AdverseParty');
    expect(adverseMatch).toBeDefined();
    expect(adverseMatch?.entityName).toBe('محمد عبدالله');
  });

  it('returns Clear status when no conflicts are found', () => {
    const { executeConflictCheck } = useAnalyticsStore.getState();
    const result = executeConflictCheck('مؤسسة غير معروفة');

    expect(result.status).toBe('Clear');
    expect(result.matches).toHaveLength(0);
  });
});
