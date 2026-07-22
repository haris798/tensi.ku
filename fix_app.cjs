const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove session state
code = code.replace(
  `  const [session, setSession] = useState<any>(null);\n`,
  ``
);

// Replace handleBackgroundSync
const oldSync = `  const handleBackgroundSync = async () => {
    setDatabaseError(null);
    if (!navigator.onLine || !supabase) {
      return;
    }

    setIsSyncing(true);
    try {
      let currentSession = (await supabase.auth.getSession()).data.session;
      if (!currentSession) {
        try {
          const { data } = await supabase.auth.signInAnonymously();
          currentSession = data.session;
        } catch {
          // If anonymous sign in is disabled or fails, proceed without blocking
        }
      }

      if (currentSession?.user?.id) {
        const userId = currentSession.user.id;
        syncEngine.setLastUserId(userId);

        // 1. Process offline sync queue
        await syncEngine.processQueue(userId);

        // 2. Fetch remote records from Supabase
        const fresh = await syncEngine.fetchAndCacheAll(userId);
        if (fresh.bp && fresh.bp.length > 0) {
          setBpLogs(fresh.bp);
        }
        if (fresh.weight && fresh.weight.length > 0) {
          setWeightLogs(fresh.weight);
        }
        if (fresh.profile) {
          setProfile(fresh.profile);
          setProfileNameInput(fresh.profile.full_name || 'Pengguna');
          setTargetWeightInput(fresh.profile.target_weight ? String(fresh.profile.target_weight) : '');
          setHeightInput(fresh.profile.height ? String(fresh.profile.height) : '');
        }
      }
    } catch (err: any) {
      console.warn('Background sync message:', err);
    } finally {
      setIsSyncing(false);
    }
  };`;

const newSync = `  const handleBackgroundSync = async () => {
    setDatabaseError(null);
    if (!navigator.onLine || !supabase) {
      return;
    }

    setIsSyncing(true);
    try {
      const currentFullName = profile?.full_name || 'Pengguna';
      let userId = undefined;

      const { data: existingProfile, error: searchErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('full_name', currentFullName)
        .maybeSingle();

      if (existingProfile) {
        userId = existingProfile.id;
      } else if (!searchErr) {
        const { data: newProfile, error: insertErr } = await supabase
          .from('profiles')
          .insert({ 
            full_name: currentFullName, 
            height: profile?.height || null, 
            target_weight: profile?.target_weight || null 
          })
          .select('id')
          .single();
          
        if (newProfile) {
          userId = newProfile.id;
        } else {
          console.warn('Could not create profile:', insertErr);
        }
      }

      if (userId) {
        syncEngine.setLastUserId(userId);

        // 1. Process offline sync queue
        await syncEngine.processQueue(userId);

        // 2. Fetch remote records from Supabase
        const fresh = await syncEngine.fetchAndCacheAll(userId);
        if (fresh.bp && fresh.bp.length > 0) {
          setBpLogs(fresh.bp);
        }
        if (fresh.weight && fresh.weight.length > 0) {
          setWeightLogs(fresh.weight);
        }
        if (fresh.profile) {
          setProfile(fresh.profile);
          setProfileNameInput(fresh.profile.full_name || 'Pengguna');
          setTargetWeightInput(fresh.profile.target_weight ? String(fresh.profile.target_weight) : '');
          setHeightInput(fresh.profile.height ? String(fresh.profile.height) : '');
        }
      }
    } catch (err: any) {
      console.warn('Background sync message:', err);
    } finally {
      setIsSyncing(false);
    }
  };`;

if (code.includes('const handleBackgroundSync = async () => {') && code.includes('const userId = currentSession.user.id;')) {
  // It has old sync
  const start = code.indexOf('const handleBackgroundSync = async () => {');
  const end = code.indexOf('};', start) + 2;
  // This is a rough replace, let's just use string replace.
  code = code.replace(oldSync, newSync);
}

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
