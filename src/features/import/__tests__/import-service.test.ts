import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  parseCSV, 
  parseAndNormalizeFile, 
  runDryRun, 
  executeImport, 
  rollbackBatch 
} from '../services/import-service';
import { supabase } from '@/lib/supabase';
import { getCurrentTenantId } from '@/lib/tenant';

// Mocking dependencies
vi.mock('@/lib/tenant', () => ({
  getCurrentTenantId: vi.fn(() => 'demo-organization-uuid')
}));

vi.mock('@/lib/encryption', () => ({
  encryptField: vi.fn(async (val) => `encrypted_${val}`),
  decryptField: vi.fn(async (val) => String(val).replace('encrypted_', ''))
}));

vi.mock('@/lib/supabase', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom
    }
  };
});

describe('Import & Migration Service Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CSV Parser', () => {
    it('should parse simple CSV text correctly', () => {
      const csv = 'الاسم,النوع,رقم الهاتف\nاحمد,فرد,01234567890\nشركة النور,منشأة,01122334455';
      const parsed = parseCSV(csv);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toEqual(['الاسم', 'النوع', 'رقم الهاتف']);
      expect(parsed[1]).toEqual(['احمد', 'فرد', '01234567890']);
      expect(parsed[2]).toEqual(['شركة النور', 'منشأة', '01122334455']);
    });

    it('should handle quoted fields with commas inside', () => {
      const csv = 'الاسم,العنوان,ملاحظات\n"محمد, احمد","القاهرة, مصر","عميل مميز جداً"';
      const parsed = parseCSV(csv);

      expect(parsed).toHaveLength(2);
      expect(parsed[1][0]).toBe('محمد, احمد');
      expect(parsed[1][1]).toBe('القاهرة, مصر');
      expect(parsed[1][2]).toBe('عميل مميز جداً');
    });
  });

  describe('parseAndNormalizeFile', () => {
    it('should parse CSV and normalize header columns correctly', () => {
      const csv = 'اسم الموكل,الرقم القومي,الهاتف\nمحمد كامل,12345678901234,01000000000';
      const result = parseAndNormalizeFile(csv, 'csv', 'clients');

      expect(result.headers).toEqual(['اسم الموكل', 'الرقم القومي', 'الهاتف']);
      expect(result.rows).toHaveLength(1);
      // 'اسم الموكل' maps to 'name' via COLUMN_ALIASES
      expect(result.rows[0].name).toBe('محمد كامل');
      // 'الرقم القومي' maps to 'national_id'
      expect(result.rows[0].national_id).toBe('12345678901234');
      // 'الهاتف' maps to 'phone'
      expect(result.rows[0].phone).toBe('01000000000');
    });

    it('should parse JSON and normalize keys', () => {
      const json = JSON.stringify([
        { 'اسم الموكل': 'شركة الفتح', 'السجل التجاري': '55443' }
      ]);
      const result = parseAndNormalizeFile(json, 'json', 'clients');

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('شركة الفتح');
      expect(result.rows[0].commercial_registration).toBe('55443');
    });
  });

  describe('runDryRun Validation', () => {
    it('should validate correct client data and flag zero errors', async () => {
      // Mock Supabase from('clients').select() returning empty array (no existing client)
      const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = vi.fn().mockReturnValue({ is: vi.fn().mockImplementation(() => ({ select: mockSelect })) });
      (supabase.from as any).mockReturnValue({ select: vi.fn().mockReturnValue({ eq: mockEq }) });

      const rawRows = [
        {
          name: 'مصطفى كامل الجيار',
          type: 'فرد',
          national_id: '29001150102345',
          phone: '01012345678',
          email: 'mostafa@gmail.com',
          governorate: 'القاهرة'
        }
      ];

      const report = await runDryRun(rawRows, 'clients');

      expect(report.totalRows).toBe(1);
      expect(report.validRows).toBe(1);
      expect(report.invalidRows).toBe(0);
      expect(report.errorsCount).toBe(0);
      expect(report.errors).toHaveLength(0);
    });

    it('should capture Zod validation failures on incorrect national IDs and phone numbers', async () => {
      const rawRows = [
        {
          name: 'ع', // Short name (< 2 chars)
          type: 'فضائي', // Invalid enum
          national_id: '12345', // Short national ID (should be 14)
          phone: '99999' // Invalid Egyptian phone number (should start with 01 and be 11 digits)
        }
      ];

      const report = await runDryRun(rawRows, 'clients');

      expect(report.validRows).toBe(0);
      expect(report.invalidRows).toBe(1);
      expect(report.errorsCount).toBeGreaterThanOrEqual(3);
      
      const messages = report.errors.map(e => e.message);
      expect(messages).toContain('الاسم يجب أن يكون حرفين على الأقل');
      expect(messages).toContain('الرقم القومي يجب أن يكون 14 رقماً بالضبط');
      expect(messages).toContain('رقم الهاتف المصري غير صحيح — يجب أن يبدأ بـ 01 ويتبعه 9 أرقام');
    });
  });

  describe('executeImport & Rollback', () => {
    it('should execute import sequentially and write rows correctly', async () => {
      // Mocking supabase batch inserts and queries
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'new-batch-uuid' }, error: null })
        })
      });
      
      // Mock clients query, cases query
      const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = vi.fn().mockReturnValue({ is: vi.fn().mockReturnValue(mockSelect) });
      
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'import_batches') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'batch-123' }, error: null })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          };
        }
        if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'client-123' }, error: null })
              })
            })
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        };
      });

      const rows = [
        {
          name: 'سمير غانم الممثل',
          type: 'فرد',
          phone: '01223344556'
        }
      ];

      const result = await executeImport(rows, 'clients', 'clients_list.csv');

      expect(result.batchId).toBe('batch-123');
      expect(result.clientsCount).toBe(1);
    });
  });
});
