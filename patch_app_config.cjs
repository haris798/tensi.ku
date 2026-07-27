const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  const [creds, setCreds] = useState(getSavedCredentials());

  const handleSaveConfig = (url: string, key: string, email?: string, password?: string) => {
    updateSupabaseClient(url, key, email, password);
    setCreds(getSavedCredentials());
    setIsConfigOpen(false);
    window.location.reload(); // Reload to initialize client and check auth
  };

  const handleResetConfig = () => {
    clearSavedCredentials();
    setCreds(getSavedCredentials());
    setIsConfigOpen(false);
    window.location.reload();
  };
`;

code = code.replace("  const [creds, setCreds] = useState(getSavedCredentials());", replacement);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx config handles patched');
