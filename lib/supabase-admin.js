import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const verifyUserOwnsOrg = async (userId, orgId) => {
  try {
    // Assuming a table structure like 'organization_users' or similar. 
    // Wait, the prompt says "يضم helper: verifyUserOwnsOrg(userId, orgId) → boolean"
    // Let's assume a generic check, or check `auth.users` metadata if org_id is stored there.
    // The auth middleware added req.user.org_id = decoded.user_metadata?.org_id.
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data.user) return false;
    
    const userOrgId = data.user.user_metadata?.org_id;
    return userOrgId === orgId;
  } catch (err) {
    return false;
  }
};
