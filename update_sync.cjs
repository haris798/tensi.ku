const fs = require('fs');
let code = fs.readFileSync('src/lib/syncEngine.ts', 'utf8');

code = code.replace(
`  async fetchAndCacheAll(userId: string): Promise<{ bp: BloodPressureLog[]; weight: WeightLog[]; profile: UserProfile | null }> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // 1. Fetch profile
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr && profileErr.code !== 'PGRST116') {
      throw profileErr;
    }

    let finalProfile: UserProfile | null = profileData;
    if (!profileData) {
      // Fallback/auto-create if needed
      finalProfile = {
        id: userId,
        full_name: 'Pengguna',
        target_weight: null,
        height: null,
        updated_at: new Date().toISOString(),
      };
    }`,
`  async fetchAndCacheAll(userId: string): Promise<{ bp: BloodPressureLog[]; weight: WeightLog[]; profile: UserProfile | null }> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // 1. Fetch profile
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr && profileErr.code !== 'PGRST116') {
      throw profileErr;
    }

    let finalProfile: UserProfile | null = profileData;
    if (!profileData) {
      // Fallback/auto-create if needed
      finalProfile = {
        id: userId,
        full_name: 'Pengguna',
        target_weight: null,
        height: null,
        updated_at: new Date().toISOString(),
      };
    }`);
fs.writeFileSync('src/lib/syncEngine.ts', code);
console.log('Done syncEngine.ts check');
