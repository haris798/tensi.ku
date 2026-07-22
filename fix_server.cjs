const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(`app.get('*', (req, res) => {`, `app.get('*', (_req, res) => {`);
fs.writeFileSync('server.ts', code);
