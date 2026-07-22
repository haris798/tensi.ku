const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseConfigModal.tsx', 'utf8');

code = code.replace(/setCurrentIsDemo\\(false\\);\n/g, '');

fs.writeFileSync('src/components/SupabaseConfigModal.tsx', code);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/handleSaveConfig\\(creds.url, creds.anonKey, false\\)/g, 'handleSaveConfig(creds.url, creds.anonKey)');
fs.writeFileSync('src/App.tsx', appCode);

