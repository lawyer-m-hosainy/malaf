import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function purge() {
  console.log("🧹 Purging existing test users and data...");
  
  const testEmails = [
    "lawyer-a-test@malaf.dev",
    "client-a-test@malaf.dev",
    "lawyer-b-test@malaf.dev",
    "client-b-test@malaf.dev"
  ];

  try {
    // 1. Find all organizations with test names
    const { data: orgs } = await supabaseAdmin.from('organizations').select('id').ilike('name', 'مكتب الاختبار%');
    const orgIds = orgs?.map(o => o.id) || [];

    if (orgIds.length > 0) {
        // 2. Delete ALL audit logs for these orgs first
        console.log(`Deleting audit logs for orgs: ${orgIds.join(', ')}`);
        await supabaseAdmin.from('audit_logs').delete().in('organization_id', orgIds);
        
        // 3. Delete other related data if necessary (cascade should handle most, but audit_logs was the issue)
    }

    // 4. List all Auth users and delete those matching emails
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    for (const user of users) {
        if (user.email && testEmails.includes(user.email)) {
            // Before deleting user, delete their profiles to avoid FK issues in audit_logs if any
            await supabaseAdmin.from('profiles').delete().eq('id', user.id);
            const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (delError) console.error(`Failed to delete ${user.email}:`, delError.message);
            else console.log(`Deleted Auth user: ${user.email}`);
        }
    }

    // 5. Finally delete organizations
    if (orgIds.length > 0) {
        const { error: orgDelError } = await supabaseAdmin.from('organizations').delete().in('id', orgIds);
        if (orgDelError) console.error("Error deleting organizations:", orgDelError.message);
        else console.log("Deleted organizations.");
    }

    console.log("✅ Purge complete.");
  } catch (err: any) {
    console.error("❌ Purge failed:", err.message);
  }
}

purge();
