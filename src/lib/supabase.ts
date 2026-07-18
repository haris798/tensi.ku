import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get keys from environment variables or localStorage
export function getSavedCredentials() {
  const envUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem('bp_supabase_url');
  const localKey = localStorage.getItem('bp_supabase_anon_key');

  return {
    url: localUrl || envUrl || '',
    anonKey: localKey || envKey || '',
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

export function updateSupabaseClient(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) {
    localStorage.removeItem('bp_supabase_url');
    localStorage.removeItem('bp_supabase_anon_key');
    supabaseInstance = null;
    return null;
  }

  try {
    localStorage.setItem('bp_supabase_url', url);
    localStorage.setItem('bp_supabase_anon_key', anonKey);
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
  localStorage.removeItem('bp_supabase_url');
  localStorage.removeItem('bp_supabase_anon_key');
  supabaseInstance = null;
}

// SQL helper for database setup that we will present in the UI
export const SUPABASE_SQL_SETUP = `-- Script SQL untuk di-copy paste di Supabase SQL Editor Anda

-- 1. Buat tabel profiles (opsional, untuk nama lengkap)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  target_weight NUMERIC(5,2),
  height NUMERIC(5,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Jalankan Row-Level Security (RLS) di profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna bisa membaca profil mereka sendiri" 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Pengguna bisa memperbarui profil mereka sendiri" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Pengguna bisa membuat profil mereka sendiri" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. Buat tabel blood_pressure_logs
CREATE TABLE IF NOT EXISTS public.blood_pressure_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT null,
  systolic INTEGER NOT null,
  diastolic INTEGER NOT null,
  pulse INTEGER NOT null,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);

-- Jalankan RLS di blood_pressure_logs
ALTER TABLE public.blood_pressure_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna bisa mengelola tensi mereka" 
  ON public.blood_pressure_logs 
  ALL USING (auth.uid() = user_id);


-- 3. Buat tabel weight_logs
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT null,
  weight NUMERIC(5,2) NOT null,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT null
);

-- Jalankan RLS di weight_logs
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna bisa mengelola berat badan mereka" 
  ON public.weight_logs 
  ALL USING (auth.uid() = user_id);


-- 4. Trigger otomatis saat user mendaftar untuk membuat record profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Pengguna'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
