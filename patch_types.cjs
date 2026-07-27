const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace("id: string;", "id: number | string;").replace("id: string;", "id: number | string;");

fs.writeFileSync('src/types.ts', code);
console.log('types.ts patched');
