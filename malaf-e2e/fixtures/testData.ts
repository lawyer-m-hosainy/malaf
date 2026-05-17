export const TEST_DATA = {
  // Arabic Egyptian Data
  clientName: 'محمد أحمد السيد',
  nationalId: '29901011234567', // Will be encrypted before storage
  caseTitle: 'قضية إخلاء طرف - محكمة الجيزة الابتداية',
  court: 'محكمة الجيزة الابتداية',
  transferReference: 'TRF-2025-TEST-001',
  
  // Test Tenants
  firmATenantId: 'tenant-firm-a-id',
  firmBTenantId: 'tenant-firm-b-id',

  // Supabase Auth Test Accounts (Assume pre-created in test DB)
  accounts: {
    admin: { email: 'admin@malaf.test', password: 'Password123!' },
    lawyer: { email: 'lawyer@malaf.test', password: 'Password123!' },
    secretary: { email: 'secretary@malaf.test', password: 'Password123!' },
  }
};
