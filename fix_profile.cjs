const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const updated = localDb.saveProfile(profileNameInput.trim(), parsedTargetWeight, parsedHeight);`,
  `const updated = localDb.saveProfile(profileNameInput.trim(), parsedTargetWeight, parsedHeight);
      
      // If connected to Supabase, update remotely using sync engine
      if (supabase && !isOffline) {
        const userId = syncEngine.getLastUserId();
        if (userId) {
          syncEngine.localUpdateProfile(userId, profileNameInput.trim(), parsedTargetWeight, parsedHeight);
          // Optional: trigger background sync to flush the queue
          setTimeout(handleBackgroundSync, 500);
        }
      }`
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx profile sync updated');
