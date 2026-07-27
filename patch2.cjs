const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        // Push local changes to Supabase first
        await syncEngine.processQueue(userId);
        // Then fetch remote changes and merge into localDb
        const fresh = await syncEngine.fetchAndCacheAll(userId);

        if (fresh.bp && fresh.bp.length > 0) {
          fresh.bp.forEach((log) => localDb.saveBPLog(log.systolic, log.diastolic, log.pulse, log.logged_at, log.notes, log.id));
          setBpLogs(localDb.getBPLogs());
        }
        if (fresh.weight && fresh.weight.length > 0) {
          fresh.weight.forEach((log) => localDb.saveWeightLog(log.weight, log.logged_at, log.notes, log.id));
          setWeightLogs(localDb.getWeightLogs());
        }
        if (fresh.profile) {
          localDb.saveProfile(fresh.profile.full_name, fresh.profile.target_weight, fresh.profile.height);
          setProfile(localDb.getProfile());
          setProfileNameInput(fresh.profile.full_name || "Pengguna");
          setTargetWeightInput(fresh.profile.target_weight ? String(fresh.profile.target_weight) : "");
          setHeightInput(fresh.profile.height ? String(fresh.profile.height) : "");
        }`;

const replacement = `        // Push local changes to Supabase first
        const qResult = await syncEngine.processQueue(userId);
        if (!qResult.success && qResult.error) {
           console.warn("Background sync paused: queue has pending items that failed to push.", qResult.error);
           return; 
        }

        const fresh = await syncEngine.fetchAndCacheAll(userId);
        
        localDb.resetAll();

        if (fresh.bp && fresh.bp.length > 0) {
          fresh.bp.forEach((log) => localDb.saveBPLog(log.systolic, log.diastolic, log.pulse, log.logged_at, log.notes, log.id));
        }
        if (fresh.weight && fresh.weight.length > 0) {
          fresh.weight.forEach((log) => localDb.saveWeightLog(log.weight, log.logged_at, log.notes, log.id));
        }
        if (fresh.profile) {
          localDb.saveProfile(fresh.profile.full_name, fresh.profile.target_weight, fresh.profile.height);
        }
        
        setBpLogs(localDb.getBPLogs());
        setWeightLogs(localDb.getWeightLogs());
        setProfile(localDb.getProfile());
        
        if (fresh.profile) {
          setProfileNameInput(fresh.profile.full_name || "Pengguna");
          setTargetWeightInput(fresh.profile.target_weight ? String(fresh.profile.target_weight) : "");
          setHeightInput(fresh.profile.height ? String(fresh.profile.height) : "");
        }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for background sync!");
