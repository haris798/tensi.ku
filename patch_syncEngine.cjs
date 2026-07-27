const fs = require('fs');
let code = fs.readFileSync('src/lib/syncEngine.ts', 'utf8');

code = code.replace(
  "localAddBP(userId: string, systolic: number, diastolic: number, pulse: number, loggedAt: string, notes: string): BloodPressureLog {",
  "localAddBP(userId: string, systolic: number, diastolic: number, pulse: number, loggedAt: string, notes: string, existingId?: string): BloodPressureLog {"
);
code = code.replace(
  "const newLog: BloodPressureLog = {\n      id: generateUUID(),\n      user_id: userId,",
  "const newLog: BloodPressureLog = {\n      id: existingId || generateUUID(),\n      user_id: userId,"
);

code = code.replace(
  "localAddWeight(userId: string, weight: number, loggedAt: string, notes: string): WeightLog {",
  "localAddWeight(userId: string, weight: number, loggedAt: string, notes: string, existingId?: string): WeightLog {"
);
code = code.replace(
  "const newLog: WeightLog = {\n      id: generateUUID(),\n      user_id: userId,",
  "const newLog: WeightLog = {\n      id: existingId || generateUUID(),\n      user_id: userId,"
);

fs.writeFileSync('src/lib/syncEngine.ts', code);
console.log('syncEngine patched');
