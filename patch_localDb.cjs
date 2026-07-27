const fs = require('fs');
let code = fs.readFileSync('src/lib/localDb.ts', 'utf8');

// Add generateUUID function
code = code.replace(
  "export const localDb = {",
  `export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const localDb = {`
);

// Modify saveBPLog to accept optional id
code = code.replace(
  "saveBPLog(systolic: number, diastolic: number, pulse: number, loggedAt: string, notes: string): BloodPressureLog {",
  "saveBPLog(systolic: number, diastolic: number, pulse: number, loggedAt: string, notes: string, existingId?: string): BloodPressureLog {"
);
code = code.replace(
  "id: `bp-${Math.random().toString(36).substr(2, 9)}`,",
  "id: existingId || generateUUID(),"
);

// Modify saveWeightLog to accept optional id
code = code.replace(
  "saveWeightLog(weight: number, loggedAt: string, notes: string): WeightLog {",
  "saveWeightLog(weight: number, loggedAt: string, notes: string, existingId?: string): WeightLog {"
);
code = code.replace(
  "id: `w-${Math.random().toString(36).substr(2, 9)}`,",
  "id: existingId || generateUUID(),"
);

// Fix dummy data to have valid UUIDs
code = code.replace(/bp-1/g, "11111111-1111-4111-8111-111111111111")
          .replace(/bp-2/g, "22222222-2222-4222-8222-222222222222")
          .replace(/bp-3/g, "33333333-3333-4333-8333-333333333333")
          .replace(/bp-4/g, "44444444-4444-4444-8444-444444444444")
          .replace(/bp-5/g, "55555555-5555-4555-8555-555555555555")
          .replace(/bp-6/g, "66666666-6666-4666-8666-666666666666")
          .replace(/bp-7/g, "77777777-7777-4777-8777-777777777777")
          .replace(/w-1/g, "aaaaa111-1111-4111-8111-111111111111")
          .replace(/w-2/g, "aaaaa222-2222-4222-8222-222222222222")
          .replace(/w-3/g, "aaaaa333-3333-4333-8333-333333333333")
          .replace(/w-4/g, "aaaaa444-4444-4444-8444-444444444444");

// We need a saveAllBPLogs and saveAllWeightLogs for full sync to avoid O(N^2) duplication logic, 
// or just modify saveBPLog to update if it exists.
// Let's replace saveBPLog logic to update if existingId matches.
code = code.replace(
  "logs.push(newLog);",
  `const existingIndex = logs.findIndex(l => l.id === newLog.id);
    if (existingIndex >= 0) {
      logs[existingIndex] = newLog;
    } else {
      logs.push(newLog);
    }`
);

code = code.replace(
  "logs.push(newLog);\n    logs.sort((a, b)",
  `const existingIndex = logs.findIndex(l => l.id === newLog.id);
    if (existingIndex >= 0) {
      logs[existingIndex] = newLog;
    } else {
      logs.push(newLog);
    }
    logs.sort((a, b)`
);

fs.writeFileSync('src/lib/localDb.ts', code);
console.log('localDb patched');
