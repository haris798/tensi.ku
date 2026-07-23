const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. handleAddBP
code = code.replace(
  /localDb\.saveBPLog\([\s\S]*?\);\n      setBpLogs\(localDb\.getBPLogs\(\)\);/,
  `const userId = syncEngine.getLastUserId();
      if (supabase && userId) {
        syncEngine.localAddBP(userId, sys, dia, pulse, new Date(bpDate).toISOString(), bpNotes);
        setBpLogs(syncEngine.getCachedBP(userId));
      } else {
        localDb.saveBPLog(sys, dia, pulse, new Date(bpDate).toISOString(), bpNotes);
        setBpLogs(localDb.getBPLogs());
      }`
);

// 2. handleAddWeight
code = code.replace(
  /localDb\.saveWeightLog\(w, new Date\(weightDate\)\.toISOString\(\), weightNotes\);\n      setWeightLogs\(localDb\.getWeightLogs\(\)\);/,
  `const userId = syncEngine.getLastUserId();
      if (supabase && userId) {
        syncEngine.localAddWeight(userId, w, new Date(weightDate).toISOString(), weightNotes);
        setWeightLogs(syncEngine.getCachedWeight(userId));
      } else {
        localDb.saveWeightLog(w, new Date(weightDate).toISOString(), weightNotes);
        setWeightLogs(localDb.getWeightLogs());
      }`
);

// 3. handleDeleteBP
code = code.replace(
  /localDb\.deleteBPLog\(id\);\n      setBpLogs\(localDb\.getBPLogs\(\)\);/,
  `const userId = syncEngine.getLastUserId();
      if (supabase && userId) {
        syncEngine.localDeleteBP(userId, id);
        setBpLogs(syncEngine.getCachedBP(userId));
      } else {
        localDb.deleteBPLog(id);
        setBpLogs(localDb.getBPLogs());
      }`
);

// 4. handleDeleteWeight
code = code.replace(
  /localDb\.deleteWeightLog\(id\);\n      setWeightLogs\(localDb\.getWeightLogs\(\)\);/,
  `const userId = syncEngine.getLastUserId();
      if (supabase && userId) {
        syncEngine.localDeleteWeight(userId, id);
        setWeightLogs(syncEngine.getCachedWeight(userId));
      } else {
        localDb.deleteWeightLog(id);
        setWeightLogs(localDb.getWeightLogs());
      }`
);

fs.writeFileSync('src/App.tsx', code);
