import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholders if env vars are missing or invalid to prevent crash
const finalUrl = (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('xyz.supabase.co')) 
  ? 'https://placeholder-project.supabase.co' 
  : supabaseUrl;
  
const finalKey = (!supabaseKey || supabaseKey.includes('placeholder')) 
  ? 'placeholder-key' 
  : supabaseKey;

export const createClient = () =>
  createBrowserClient(
    finalUrl,
    finalKey,
  );
