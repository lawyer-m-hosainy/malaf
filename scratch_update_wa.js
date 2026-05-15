import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://zidejnagdyoimyhprxrt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppZGVqbmFnZHlvaW15aHByeHJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE5MTc3OCwiZXhwIjoyMDkzNzY3Nzc4fQ.aJ1-5CUvDifGGifjHQPjKVT2S6XE2PnZiwjEo_3oAdo';
const encryptionKeyRaw = '18620142032015Hos';
const WA_PHONE_ID = '1019595217914857';
const WA_TOKEN = 'EAAN5o1FXEjUBRbNujyT20dp7Kwkg0ZBpDsNhdMD80wn2KxOYcrtFdtgbAEhUWjKvwJyjzHvVVdrdIdyO8G4y1mCRfW63l7OwAjvYQxmzSKomWO7kZBiTt8UBtAXlYQcehqDEFPlJibqu9c4jbCIUObifpqd0HF0kQX2q8eo0Pqbo5Sl1PIxPib0o63uJiHz5ckanphWZAZAdu3zqwJUtI2Uw3bGJJfZAAPU0So5FQHuq6vq2V3q90X0jfYyNKZBl2V8cJVjSVZByjpAnmGqNkSB';

// Ensure 32 bytes key for AES-256
const ENCRYPTION_KEY = Buffer.from(encryptionKeyRaw.padEnd(32, '0').slice(0, 32));
const ALGORITHM = 'aes-256-gcm';
const CURRENT_KEY_VERSION = 'v2';

function encryptToken(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${CURRENT_KEY_VERSION}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Get the first organization (assuming he is the primary owner)
  const { data: orgs, error: orgErr } = await supabase.from('organizations').select('id, name').limit(1);
  if (orgErr || !orgs.length) {
    console.error('Could not find organization', orgErr);
    return;
  }
  
  const orgId = orgs[0].id;
  console.log(`Found organization: ${orgs[0].name} (${orgId})`);

  // Encrypt the token
  const encryptedToken = encryptToken(WA_TOKEN);

  // Update or insert tenant settings
  const { error: upsertErr } = await supabase.from('whatsapp_settings').upsert({
    org_id: orgId,
    is_active: true,
    wa_phone_number: WA_PHONE_ID,
    api_token_encrypted: encryptedToken,
    provider: 'meta_cloud',
    welcome_message: 'مرحباً بك في مكتب الحسيني للمحاماة! كيف يمكننا مساعدتك اليوم؟',
    away_message: 'نحن خارج أوقات العمل حالياً. سنقوم بالرد عليك في أقرب وقت.',
    updated_at: new Date().toISOString()
  });

  if (upsertErr) {
    console.error('Failed to update whatsapp_settings', upsertErr);
  } else {
    console.log('Successfully updated whatsapp_settings! Bot is now active for this tenant.');
  }
}

main();
