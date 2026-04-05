import { createClient } from '@supabase/supabase-js';

// Safely detect environment variables in a browser-friendly way
const getEnv = (key: string): string => {
  // 1. Try Vite's standard way
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[key]) return metaEnv[key];

  // 2. Try the define block from vite.config.ts (safely)
  try {
    if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
      return (process.env as any)[key];
    }
  } catch (e) {
    // process might not be defined, which is fine
  }

  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. The app will show a login screen but database features may be limited until keys are set in Netlify.');
}

// Use a fallback to prevent a crash, allowing the UI to render
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
