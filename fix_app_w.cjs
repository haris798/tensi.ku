const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const w = Number\\(weight.weight\\);\\n/g, '');

fs.writeFileSync('src/App.tsx', code);
