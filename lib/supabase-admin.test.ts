import { describe, it, expect, vi } from 'vitest';
import { verifyUserOwnsOrg } from './supabase-admin.js';
import { supabaseAdmin } from './supabase-admin.js';

// Mock the supabaseAdmin client
vi.mock('./supabase-admin.js', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    supabaseAdmin: {
      from: vi.fn()
    }
  };
});

describe('Supabase Admin', () => {
  it('✅ verifyUserOwnsOrg يرجع true لمستخدم ينتمي للـ org', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'record-1' }], error: null })
      })
    });
    (supabaseAdmin.from as any).mockReturnValue({ select: mockSelect });

    const result = await verifyUserOwnsOrg('user-1', 'org-1');
    expect(result).toBe(true);
  });

  it('❌ verifyUserOwnsOrg يرجع false لمستخدم لا ينتمي', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    });
    (supabaseAdmin.from as any).mockReturnValue({ select: mockSelect });

    const result = await verifyUserOwnsOrg('user-1', 'org-2');
    expect(result).toBe(false);
  });

  it('❌ verifyUserOwnsOrg يرمي error إذا Supabase غير متاح', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
      })
    });
    (supabaseAdmin.from as any).mockReturnValue({ select: mockSelect });

    await expect(verifyUserOwnsOrg('user-1', 'org-1')).rejects.toThrow();
  });
});
