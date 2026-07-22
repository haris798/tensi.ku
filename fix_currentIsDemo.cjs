const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseConfigModal.tsx', 'utf8');

code = code.replace(/const \[currentIsDemo, setCurrentIsDemo\] = useState\(false\);\n/g, '');
code = code.replace(/{!currentIsDemo && \(/g, '(');

fs.writeFileSync('src/components/SupabaseConfigModal.tsx', code);
