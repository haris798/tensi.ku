const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  const handleSaveConfig = \(url: string, key: string, email\?: string, password\?: string\) => \{[\s\S]*?window\.location\.reload\(\);\n  \};\n/g;

code = code.replace(regex, "");

fs.writeFileSync('src/App.tsx', code);
console.log('Removed duplicate handleSaveConfig');
