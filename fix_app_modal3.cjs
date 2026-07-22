const fs = require('fs');

let code = fs.readFileSync('src/components/SupabaseConfigModal.tsx', 'utf8');
code = code.replace("setCurrentIsDemo(false);", "");
fs.writeFileSync('src/components/SupabaseConfigModal.tsx', code);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace("handleSaveConfig(creds.url, creds.anonKey, false)", "handleSaveConfig(creds.url, creds.anonKey)");
fs.writeFileSync('src/App.tsx', appCode);

