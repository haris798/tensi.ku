const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseConfigModal.tsx', 'utf8');

code = code.replace(/Cloud,\n  Play,\n/g, '');
code = code.replace(/Cloud, Play, /g, '');
code = code.replace(/const { isEnv, isDemo, isLocalSaved } = creds;/g, "const { isLocalSaved } = creds;");
code = code.replace(/const handleToggleDemo = \(checked: boolean\) => {[\s\S]*?};/g, "");

fs.writeFileSync('src/components/SupabaseConfigModal.tsx', code);
