import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get keys from environment variables or localStorage
export function getSavedCredentials() {
  const envUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem('bp_supabase_url');
  const localKey = localStorage.getItem('bp_supabase_anon_key');

  const localEmail = localStorage.getItem('bp_supabase_email');
  const localPassword = localStorage.getItem('bp_supabase_password');
  return {
    url: localUrl || envUrl || '',
    anonKey: localKey || envKey || '',
    email: localEmail || '',
    password: localPassword || '',
    isEnv: !!(envUrl && envKey),
    isLocalSaved: !!(localUrl && localKey),
  };
}

let supabaseInstance: SupabaseClient | null = null;

// Initialize client if credentials exist
const creds = getSavedCredentials();
if (creds.url && creds.anonKey) {
  try {
    supabaseInstance = createClient(creds.url, creds.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

export const supabase = supabaseInstance;

export function updateSupabaseClient(url: string, anonKey: string, email?: string, password?: string): SupabaseClient | null {
  if (!url || !anonKey) {
    localStorage.removeItem('bp_supabase_url');
    localStorage.removeItem('bp_supabase_anon_key');
    localStorage.removeItem('bp_supabase_email');
    localStorage.removeItem('bp_supabase_password');
    supabaseInstance = null;
    return null;
  }

  try {
    localStorage.setItem('bp_supabase_url', url);
    localStorage.setItem('bp_supabase_anon_key', anonKey);
    if (email) localStorage.setItem('bp_supabase_email', email);
    if (password) localStorage.setItem('bp_supabase_password', password);
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Error updating Supabase client:', error);
    return null;
  }
}

export function clearSavedCredentials() {
  localStorage.removeItem('bp_supabase_email');
  localStorage.removeItem('bp_supabase_password');
  localStorage.removeItem('bp_supabase_url');
  localStorage.removeItem('bp_supabase_anon_key');
  supabaseInstance = null;
}

// SQL helper for database setup that we will present in the UI
export const SUPABASE_SQL_SETUP = `-- Script SQL untuk di-copy paste di Supabase SQL Editor Anda

-- 1. Buat tabel profiles (tanpa auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT UNIQUE,
  target_weight NUMERIC(5,2),
  height NUMERIC(5,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Buat tabel blood_pressure_logs
CREATE TABLE IF NOT EXISTS public.blood_pressure_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT null,
  systolic INTEGER NOT null,
  diastolic INTEGER NOT null,
  pulse INTEGER NOT null,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);

-- 3. Buat tabel weight_logs
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT null,
  weight NUMERIC(5,2) NOT null,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);
`;