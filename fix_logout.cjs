const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const logoutRegex = /const handleLogout = async \(\) => {[\s\S]*?};\n/g;
code = code.replace(logoutRegex, '');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx logout removed');
