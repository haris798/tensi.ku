const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

const newSQL = `export const SUPABASE_SQL_SETUP = \`-- Script SQL untuk di-copy paste di Supabase SQL Editor Anda

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
\`;`;

const startIndex = code.indexOf('export const SUPABASE_SQL_SETUP');
if (startIndex !== -1) {
  code = code.substring(0, startIndex) + newSQL;
  fs.writeFileSync('src/lib/supabase.ts', code);
  console.log("Updated supabase.ts successfully");
} else {
  console.log("Could not find SUPABASE_SQL_SETUP");
}
