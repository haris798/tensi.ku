const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<SupabaseConfigModal\n        isOpen=\{isConfigOpen\}\n        onClose=\{\(\) => setIsConfigOpen\(false\)\}\n        url=\{creds\.url\}\n        anonKey=\{creds\.anonKey\}/,
  `<SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        url={creds.url}
        anonKey={creds.anonKey}
        email={creds.email}
        password={creds.password}`
);

fs.writeFileSync('src/App.tsx', code);
