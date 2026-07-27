const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// In handleBackgroundSync
code = code.replace(
  "fresh.bp.forEach((log) => localDb.saveBPLog(log.systolic, log.diastolic, log.pulse, log.logged_at, log.notes));",
  "fresh.bp.forEach((log) => localDb.saveBPLog(log.systolic, log.diastolic, log.pulse, log.logged_at, log.notes, log.id));"
);
code = code.replace(
  "fresh.weight.forEach((log) => localDb.saveWeightLog(log.weight, log.logged_at, log.notes));",
  "fresh.weight.forEach((log) => localDb.saveWeightLog(log.weight, log.logged_at, log.notes, log.id));"
);

// In handleManualSync
code = code.replace(
  "fresh.bp.forEach((log) => localDb.saveBPLog(log.systolic, log.diastolic, log.pulse, log.logged_at, log.notes));",
  "fresh.bp.forEach((log) => localDb.saveBPLog(log.systolic, log.diastolic, log.pulse, log.logged_at, log.notes, log.id));"
);
code = code.replace(
  "fresh.weight.forEach((log) => localDb.saveWeightLog(log.weight, log.logged_at, log.notes));",
  "fresh.weight.forEach((log) => localDb.saveWeightLog(log.weight, log.logged_at, log.notes, log.id));"
);

// In handleAddBP
code = code.replace(
  "localDb.saveBPLog(sys, dia, pulse, new Date(bpDate).toISOString(), bpNotes);",
  "const localLog = localDb.saveBPLog(sys, dia, pulse, new Date(bpDate).toISOString(), bpNotes);"
);
code = code.replace(
  "syncEngine.localAddBP(userId, sys, dia, pulse, new Date(bpDate).toISOString(), bpNotes);",
  "syncEngine.localAddBP(userId, sys, dia, pulse, new Date(bpDate).toISOString(), bpNotes, localLog.id);"
);

// In handleAddWeight
code = code.replace(
  "localDb.saveWeightLog(w, new Date(weightDate).toISOString(), weightNotes);",
  "const localLog = localDb.saveWeightLog(w, new Date(weightDate).toISOString(), weightNotes);"
);
code = code.replace(
  "syncEngine.localAddWeight(userId, w, new Date(weightDate).toISOString(), weightNotes);",
  "syncEngine.localAddWeight(userId, w, new Date(weightDate).toISOString(), weightNotes, localLog.id);"
);

fs.writeFileSync('src/App.tsx', code);
console.log('App patched');
