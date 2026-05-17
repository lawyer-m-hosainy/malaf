import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { encryptField, decryptField } from '@/lib/encryption';

// ============================================================================
// ENVIRONMENT & SETUP
// ============================================================================
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'fake-anon-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-service-key';

// Service Role Client: Used ONLY for setup and teardown (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Interfaces for our test entities
interface TestTenant {
  orgId: string;
  userId: string;
  email: string;
  client: SupabaseClient; // Authenticated client for this user
}

let firmA: TestTenant;
let firmB: TestTenant;
let testPaymentId: string; // to keep track across Flow 1 and Flow 2

// Helper to generate random strings for uniqueness
const randomStr = () => Math.random().toString(36).substring(7);

beforeAll(async () => {
  // 1. Create Firm A
  const emailA = `firmA_${randomStr()}@test.malaf.com`;
  const { data: userA } = await supabaseAdmin.auth.admin.createUser({
    email: emailA,
    password: 'Password123!',
    email_confirm: true,
  });
  
  // Organization is usually created automatically via triggers or manually here
  const { data: orgA } = await supabaseAdmin.from('organizations').insert({ name: 'Firm A' }).select().single();
  await supabaseAdmin.from('profiles').update({ organization_id: orgA.id }).eq('id', userA.user.id);

  const clientA = createClient(supabaseUrl, anonKey);
  await clientA.auth.signInWithPassword({ email: emailA, password: 'Password123!' });

  firmA = { orgId: orgA.id, userId: userA.user.id, email: emailA, client: clientA };

  // 2. Create Firm B
  const emailB = `firmB_${randomStr()}@test.malaf.com`;
  const { data: userB } = await supabaseAdmin.auth.admin.createUser({
    email: emailB,
    password: 'Password123!',
    email_confirm: true,
  });

  const { data: orgB } = await supabaseAdmin.from('organizations').insert({ name: 'Firm B' }).select().single();
  await supabaseAdmin.from('profiles').update({ organization_id: orgB.id }).eq('id', userB.user.id);

  const clientB = createClient(supabaseUrl, anonKey);
  await clientB.auth.signInWithPassword({ email: emailB, password: 'Password123!' });

  firmB = { orgId: orgB.id, userId: userB.user.id, email: emailB, client: clientB };

  // Seed some cases for Firm B to test RLS later
  await supabaseAdmin.from('cases').insert([
    { organization_id: firmB.orgId, created_by: firmB.userId, id: `CASE-B-${randomStr()}`, court: 'Firm B Court' }
  ]);
});

afterAll(async () => {
  // Cleanup Firm A and Firm B
  if (firmA) {
    await supabaseAdmin.from('organizations').delete().eq('id', firmA.orgId); // Should cascade cases, payments, profiles
    await supabaseAdmin.auth.admin.deleteUser(firmA.userId);
  }
  if (firmB) {
    await supabaseAdmin.from('organizations').delete().eq('id', firmB.orgId);
    await supabaseAdmin.auth.admin.deleteUser(firmB.userId);
  }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
describe('Supabase Integration Flows (Malaf Platform)', () => {

  // --------------------------------------------------------------------------
  // FLOW 1 — Manual Payment Submission
  // --------------------------------------------------------------------------
  describe('FLOW 1: Manual Payment Submission', () => {
    it('should create a pending payment record and NOT activate subscription', async () => {
      const transferRef = `TXN-${randomStr()}`;

      // Firm A submits a manual payment
      const { data: payment, error } = await firmA.client.from('payments').insert({
        organization_id: firmA.orgId,
        amount: 599,
        plan: 'professional',
        transfer_reference: transferRef,
        method: 'instapay',
        status: 'pending' // Expected initial status
      }).select().single();

      expect(error).toBeNull();
      expect(payment).toBeDefined();
      expect(payment.status).toBe('pending');
      expect(payment.transfer_reference).toBe(transferRef);

      // Verify that subscription is NOT updated yet (remains 'free' or previous)
      const { data: org } = await firmA.client.from('organizations').select('plan').eq('id', firmA.orgId).single();
      expect(org.plan).not.toBe('professional'); // Has not activated yet!

      testPaymentId = payment.id; // Save for FLOW 2
    });
  });

  // --------------------------------------------------------------------------
  // FLOW 2 — Admin Approval → Subscription Activation
  // --------------------------------------------------------------------------
  describe('FLOW 2: Admin Approval → Subscription Activation', () => {
    it('should immediately update tenant plan when admin approves payment', async () => {
      expect(testPaymentId).toBeDefined(); // Must run after Flow 1

      // Admin (Service Role) approves the payment manually
      const { error: updateError } = await supabaseAdmin.from('payments')
        .update({ status: 'approved' })
        .eq('id', testPaymentId);
        
      expect(updateError).toBeNull();

      // Trigger should have fired in DB (or an API function processes it). 
      // If done via an edge function, we wait. If via Supabase DB Trigger, it's instant.
      // Assuming DB trigger updates the organizations table:
      
      const { data: org, error: fetchError } = await firmA.client.from('organizations')
        .select('plan, subscription_status')
        .eq('id', firmA.orgId)
        .single();

      expect(fetchError).toBeNull();
      expect(org.plan).toBe('professional'); // Plan upgraded
      expect(org.subscription_status).toBe('active'); // Features are accessible
    });
  });

  // --------------------------------------------------------------------------
  // FLOW 3 — Duplicate transferReference Guard
  // --------------------------------------------------------------------------
  describe('FLOW 3: Duplicate transferReference Guard', () => {
    const duplicateRef = `DUPE-${randomStr()}`;

    beforeAll(async () => {
      // Setup the first successful submission
      await firmA.client.from('payments').insert({
        organization_id: firmA.orgId,
        amount: 599,
        plan: 'professional',
        transfer_reference: duplicateRef,
        method: 'instapay',
        status: 'pending'
      });
    });

    it('should REJECT the same transferReference from the same user', async () => {
      const { error } = await firmA.client.from('payments').insert({
        organization_id: firmA.orgId,
        amount: 999,
        plan: 'enterprise',
        transfer_reference: duplicateRef, // SAME REFERENCE
        method: 'vodafone_cash',
        status: 'pending'
      });

      // DB should reject it via UNIQUE constraint on transfer_reference
      expect(error).toBeDefined();
      expect(error.code).toBe('23505'); // unique_violation in Postgres
      expect(error.message).toContain('duplicate key value');
    });

    it('should REJECT the same transferReference from a different user (Firm B)', async () => {
      const { error } = await firmB.client.from('payments').insert({
        organization_id: firmB.orgId,
        amount: 599,
        plan: 'professional',
        transfer_reference: duplicateRef, // SAME REFERENCE
        method: 'instapay',
        status: 'pending'
      });

      // Even another firm cannot use the same transaction reference
      expect(error).toBeDefined();
      expect(error.code).toBe('23505');
    });
  });

  // --------------------------------------------------------------------------
  // FLOW 4 — RLS Tenant Isolation (MOST CRITICAL)
  // --------------------------------------------------------------------------
  describe('FLOW 4: RLS Tenant Isolation (MOST CRITICAL)', () => {
    it('should return empty result (not an error) when Firm A attempts to read Firm B cases', async () => {
      // 1. Verify Firm B has cases (using admin bypass)
      const { data: firmBCasesAdmin } = await supabaseAdmin.from('cases').select('id').eq('organization_id', firmB.orgId);
      expect(firmBCasesAdmin.length).toBeGreaterThan(0); // Admin sees it

      // 2. Firm A intentionally tries to fetch Firm B's cases (Direct SQL injection/manipulation attempt)
      const { data: firmAHackAttempt, error } = await firmA.client.from('cases')
        .select('*')
        .eq('organization_id', firmB.orgId);

      // 3. RLS blocks it implicitly. It does NOT throw an error, it just acts like the data doesn't exist.
      expect(error).toBeNull(); // No error thrown
      expect(firmAHackAttempt).toBeDefined();
      expect(firmAHackAttempt.length).toBe(0); // Empty Array! RLS worked.
    });

    it('should prevent Firm A from updating Firm B data', async () => {
      const { error } = await firmA.client.from('cases')
        .update({ court: 'HACKED' })
        .eq('organization_id', firmB.orgId);

      // Will likely return no error, but 0 rows affected, or a policy error depending on setup
      // Let's verify data wasn't changed
      const { data: checkData } = await supabaseAdmin.from('cases').select('court').eq('organization_id', firmB.orgId).limit(1);
      expect(checkData[0].court).not.toBe('HACKED');
    });
  });

  // --------------------------------------------------------------------------
  // FLOW 5 — Encryption → Storage → Retrieval
  // --------------------------------------------------------------------------
  describe('FLOW 5: Encryption → Storage → Retrieval', () => {
    it('should correctly encrypt sensitive data before DB and decrypt after fetch', async () => {
      const sensitiveNationalId = '29001011234567';
      const caseId = `CASE-ENC-${randomStr()}`;

      // 1. Client-Side Encryption
      const encryptedId = await encryptField(sensitiveNationalId);
      expect(encryptedId).not.toBe(sensitiveNationalId); // It's cipher text

      // 2. Insert ciphertext into Supabase
      const { error: insertError } = await firmA.client.from('cases').insert({
        id: caseId,
        organization_id: firmA.orgId,
        created_by: firmA.userId,
        court: 'محكمة الجيزة',
        encrypted_national_id: encryptedId // Store only ciphertext
      });
      expect(insertError).toBeNull();

      // 3. Verify DB explicitly holds ciphertext (Admin read to confirm DB state)
      const { data: dbRawRecord } = await supabaseAdmin.from('cases').select('encrypted_national_id').eq('id', caseId).single();
      expect(dbRawRecord.encrypted_national_id).toBe(encryptedId); // Matches what we sent
      expect(dbRawRecord.encrypted_national_id).not.toBe(sensitiveNationalId); // DB does NOT have plain text

      // 4. Client retrieves and decrypts
      const { data: fetchedCase } = await firmA.client.from('cases').select('encrypted_national_id').eq('id', caseId).single();
      const decryptedId = await decryptField(fetchedCase.encrypted_national_id);
      
      expect(decryptedId).toBe(sensitiveNationalId); // Back to original
    });
  });

});
