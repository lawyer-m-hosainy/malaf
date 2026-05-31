// ============================================================
// منصة "ملف" - تكوين Supabase Client
// ============================================================
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Prevent app crash if Supabase environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase configuration is missing. Data fetching will fail.");
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: { 'x-app-name': 'malaf-egypt' },
    },
  }
);

export default supabase;
