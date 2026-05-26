import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env or .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
const FIXTURES_PATH = path.join(process.cwd(), 'scripts', 'test-fixtures.json');

async function createTestData() {
  console.log("🚀 Creating isolated test data for security audit...");

  try {
    // 1. Create Organizations
    const { data: orgs, error: orgError } = await supabaseAdmin.from('organizations').insert([
      { name: "مكتب الاختبار أ" },
      { name: "مكتب الاختبار ب" }
    ]).select();

    if (orgError) throw orgError;
    const orgA = orgs[0];
    const orgB = orgs[1];

    // 2. Create Clients (Domain Entities)
    const { data: clients, error: clientError } = await supabaseAdmin.from('clients').insert([
      { organization_id: orgA.id, name: "الموكل أ", type: "فرد" },
      { organization_id: orgB.id, name: "الموكل ب", type: "فرد" }
    ]).select();

    if (clientError) throw clientError;
    const clientA = clients[0];
    const clientB = clients[1];

    // 2. Create Auth Users & Profiles
    const timestamp = Date.now();
    const usersToCreate = [
      { email: `lawyer-a-${timestamp}@malaf.dev`, password: "password123", orgId: orgA.id, role: "محامي", fullName: "محامي أ", linkedClientId: null },
      { email: `client-a-${timestamp}@malaf.dev`, password: "password123", orgId: orgA.id, role: "موكل", fullName: "موكل أ", linkedClientId: clientA.id },
      { email: `lawyer-b-${timestamp}@malaf.dev`, password: "password123", orgId: orgB.id, role: "محامي", fullName: "محامي ب", linkedClientId: null },
      { email: `client-b-${timestamp}@malaf.dev`, password: "password123", orgId: orgB.id, role: "موكل", fullName: "موكل ب", linkedClientId: clientB.id }
    ];

    const profiles = [];

    for (const u of usersToCreate) {
      // Delete existing user if any (robustness)
      const { data: existingProfiles } = await supabaseAdmin.from('profiles').select('id').eq('email', u.email);
      if (existingProfiles && existingProfiles.length > 0) {
        for (const p of existingProfiles) {
          await supabaseAdmin.auth.admin.deleteUser(p.id);
        }
      }

      // Create Auth User
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { org_id: u.orgId, role: u.role }
      });

      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`ℹ️ User ${u.email} already exists. Skipping auth creation.`);
          const { data: existingUser } = await supabaseAdmin.from('profiles').select('*').eq('email', u.email).single();
          profiles.push(existingUser);
          continue;
        }
        throw authError;
      }

      // Upsert Profile
      const { data: profile, error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .upsert({ 
          id: authUser.user.id,
          organization_id: u.orgId, 
          role: u.role, 
          full_name: u.fullName,
          email: u.email,
          linked_client_id: u.linkedClientId
        })
        .select()
        .single();
      
      if (profileUpdateError) throw profileUpdateError;
      profiles.push(profile);
    }

    const lawyerA = profiles[0];
    const clientUserA = profiles[1];
    const lawyerB = profiles[2];
    const clientUserB = profiles[3];

    // 4. Create Cases
    const { data: cases, error: caseError } = await supabaseAdmin.from('cases').insert([
      { 
        organization_id: orgA.id, 
        client_id: clientA.id, 
        type: "مدني", 
        court: "محكمة القاهرة", 
        status: "متداولة",
        assigned_to: lawyerA.id 
      },
      { 
        organization_id: orgB.id, 
        client_id: clientB.id, 
        type: "جنائي", 
        court: "محكمة الإسكندرية", 
        status: "تحت الدراسة" 
      }
    ]).select();

    if (caseError) throw caseError;
    const caseA = cases[0];
    const caseB = cases[1];

    // 5. Create Invoices
    const { data: invoices, error: invoiceError } = await supabaseAdmin.from('invoices').insert([
      { organization_id: orgA.id, client_id: clientA.id, invoice_number: "INV-A-001", base_amount: 5000, total: 5000 },
      { organization_id: orgB.id, client_id: clientB.id, invoice_number: "INV-B-001", base_amount: 7500, total: 7500 }
    ]).select();

    if (invoiceError) throw invoiceError;

    // 6. Create Documents
    const { data: documents, error: docError } = await supabaseAdmin.from('documents').insert([
      { 
        organization_id: orgA.id, 
        case_id: caseA.id, 
        file_name: "مستند_سري_أ.pdf", 
        file_url: "https://storage.malaf.pro/a.pdf",
        shared_with_client: false 
      }
    ]).select();

    if (docError) throw docError;

    const fixtures = {
      orgA: { id: orgA.id, name: orgA.name },
      orgB: { id: orgB.id, name: orgB.name },
      lawyerA: { id: lawyerA.id, email: lawyerA.email },
      clientA: { id: clientUserA.id, email: clientUserA.email, clientId: clientA.id },
      lawyerB: { id: lawyerB.id, email: lawyerB.email },
      clientB: { id: clientUserB.id, email: clientUserB.email, clientId: clientB.id },
      caseA: { id: caseA.id },
      caseB: { id: caseB.id },
      invoiceA: { id: invoices[0].id },
      docA: { id: documents[0].id }
    };

    fs.writeFileSync(FIXTURES_PATH, JSON.stringify(fixtures, null, 2));
    console.log("✅ Test data created successfully");
    console.log(`📍 Fixtures saved to: ${FIXTURES_PATH}`);

  } catch (error) {
    console.error("❌ Error creating test data:", error);
  }
}

async function cleanup() {
  console.log("🧹 Starting cleanup of test data...");
  if (!fs.existsSync(FIXTURES_PATH)) {
    console.log("ℹ️ No fixtures file found. Skipping cleanup.");
    return;
  }

  const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf-8'));
  
  try {
    const orgIds = [fixtures.orgA.id, fixtures.orgB.id];
    const userEmails = [
      fixtures.lawyerA.email,
      fixtures.clientA.email,
      fixtures.lawyerB.email,
      fixtures.clientB.email
    ];

    for (const email of userEmails) {
        const { data: userData } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();
        if (userData) {
            await supabaseAdmin.auth.admin.deleteUser(userData.id);
        }
    }

    const { error: cleanupError } = await supabaseAdmin
      .from('organizations')
      .delete()
      .in('id', orgIds);

    if (cleanupError) throw cleanupError;

    fs.unlinkSync(FIXTURES_PATH);
    console.log("✅ Cleanup completed successfully.");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
}

const args = process.argv.slice(2);
if (args.includes('--cleanup')) {
  cleanup();
} else {
  createTestData();
}
