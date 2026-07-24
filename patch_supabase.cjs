const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

code = code.replace(
  /return \{\n    url: localUrl \|\| envUrl \|\| '',\n    anonKey: localKey \|\| envKey \|\| '',\n    isEnv: !!\(envUrl && envKey\),\n    isLocalSaved: !!\(localUrl && localKey\),\n  \};/,
  `const localEmail = localStorage.getItem('bp_supabase_email');
  const localPassword = localStorage.getItem('bp_supabase_password');
  return {
    url: localUrl || envUrl || '',
    anonKey: localKey || envKey || '',
    email: localEmail || '',
    password: localPassword || '',
    isEnv: !!(envUrl && envKey),
    isLocalSaved: !!(localUrl && localKey),
  };`
);

code = code.replace(
  /export function updateSupabaseClient\(url: string, anonKey: string\): SupabaseClient \| null \{/g,
  `export function updateSupabaseClient(url: string, anonKey: string, email?: string, password?: string): SupabaseClient | null {`
);

code = code.replace(
  /localStorage\.removeItem\('bp_supabase_url'\);\n    localStorage\.removeItem\('bp_supabase_anon_key'\);\n    supabaseInstance = null;\n    return null;\n  \}/g,
  `localStorage.removeItem('bp_supabase_url');
    localStorage.removeItem('bp_supabase_anon_key');
    localStorage.removeItem('bp_supabase_email');
    localStorage.removeItem('bp_supabase_password');
    supabaseInstance = null;
    return null;
  }`
);

code = code.replace(
  /localStorage\.setItem\('bp_supabase_anon_key', anonKey\);/g,
  `localStorage.setItem('bp_supabase_anon_key', anonKey);
    if (email) localStorage.setItem('bp_supabase_email', email);
    if (password) localStorage.setItem('bp_supabase_password', password);`
);

code = code.replace(
  /export function clearSavedCredentials\(\) \{/g,
  `export function clearSavedCredentials() {
  localStorage.removeItem('bp_supabase_email');
  localStorage.removeItem('bp_supabase_password');`
);

fs.writeFileSync('src/lib/supabase.ts', code);
