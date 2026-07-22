const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const _w = parseFloat\\(weightInput\\);/g, 'const w = parseFloat(weightInput);');

// fix the 3 arguments on line 2488
code = code.replace(/onSave={\\(url, key, useDemoMode\\) => handleSaveConfig\\(url, key, useDemoMode\\)}/g, 'onSave={(url, key, useDemoMode) => handleSaveConfig(url, key)}');
code = code.replace(/onSave={\\(url, key\\) => handleSaveConfig\\(url, key\\)}/g, 'onSave={(url, key, _useDemoMode) => handleSaveConfig(url, key)}');

fs.writeFileSync('src/App.tsx', code);
