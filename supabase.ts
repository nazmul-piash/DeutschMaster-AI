import { createClient } from '@supabase/supabase-js';

// Robust environment variable detection
const getEnv = (key: string) => {
  return (import.meta as any).env[key] || (process as any).env[key] || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase credentials missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify settings.');
}

// Use a fallback URL to prevent the entire app from crashing on initialization
// This allows us to show a friendly error message in the UI instead of a white screen
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-please-set-your-url.supabase.co', 
  supabaseAnonKey || 'placeholder-please-set-your-key'
);
