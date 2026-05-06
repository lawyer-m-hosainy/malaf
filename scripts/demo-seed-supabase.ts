import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role for seeding

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function runSeed() {
  console.log("🚀 Starting Demo Seeding for Egyptian Law Firm...");

  // 1. Clear existing data (optional, be careful)
  // await supabase.from('poas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // ...

  // 2. Create Organizations
  const orgs = [
    { name: 'مكتب النيل للمحاماة', slug: 'nile-law', plan: 'pro' },
    { name: 'مكتب الأهرام للاستشارات', slug: 'ahram-law', plan: 'basic' },
    { name: 'مكتب الدلتا القانوني', slug: 'delta-law', plan: 'free' },
  ];

  const { data: createdOrgs, error: orgError } = await supabase.from('organizations').upsert(orgs, { onConflict: 'slug' }).select();
  if (orgError) throw orgError;
  console.log(`✅ Seeded ${createdOrgs.length} organizations.`);

  const mainOrg = createdOrgs.find(o => o.slug === 'nile-law');

  // 3. Seed Demo Profiles (Note: Auth accounts must exist in Firebase)
  if (mainOrg) {
    const demoProfiles = [
      { id: 'DEMO_ADMIN_ID', org_id: mainOrg.id, full_name: 'مدير النظام', email: 'admin@malaf.com', role: 'محامي شريك' },
      { id: 'DEMO_LAWYER_ID', org_id: mainOrg.id, full_name: 'أحمد المحامي', email: 'lawyer@demo.com', role: 'محامي' },
    ];
    await supabase.from('profiles').upsert(demoProfiles, { onConflict: 'email' });
    console.log("✅ Seeded demo profiles.");
  }

  // 4. Seed Clients for each org
  for (const org of createdOrgs) {
    const clients = Array.from({ length: 50 }).map((_, i) => ({
      org_id: org.id,
      name: i % 2 === 0 ? `شركة ${org.name.split(' ')[1]} للتجارة ${i}` : `الموكل المصري ${i}`,
      type: i % 2 === 0 ? 'منشأة' : 'فرد',
      phone: `+201${Math.floor(Math.random() * 1000000000)}`,
      email: `client${i}@${org.slug}.com`,
    }));

    const { data: createdClients, error: clientError } = await supabase.from('clients').insert(clients).select();
    if (clientError) throw clientError;

    // 4. Seed Cases for each client
    const cases = createdClients.map((client, i) => ({
      org_id: org.id,
      client_id: client.id,
      title: `نزاع ${['مدني', 'جنائي', 'أسرة', 'إداري'][i % 4]} رقم ${i}`,
      type: ['مدني', 'جنائي', 'أسرة', 'إداري'][i % 4],
      status: i % 10 === 0 ? 'closed' : 'active',
    }));

    const { data: createdCases, error: caseError } = await supabase.from('cases').insert(cases).select();
    if (caseError) throw caseError;

    // 5. Seed Sessions & Invoices
    for (const caseObj of createdCases) {
       await supabase.from('sessions').insert({
         case_id: caseObj.id,
         date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
         court_room: 'الدائرة 5 مدني',
         notes: 'جلسة مرافعة أولى'
       });
    }

    console.log(`✅ Seeded clients and cases for ${org.name}`);
  }

  console.log("✨ Seeding Complete!");
}

// removed immediate call for server import
