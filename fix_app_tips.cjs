const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The original was const _useDemoMode = false, let's remove it entirely
code = code.replace(/const _useDemoMode = false;\n/g, '');

fs.writeFileSync('src/App.tsx', code);
