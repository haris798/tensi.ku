const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const handleSaveConfig = \(url: string, key: string\) => \{/g,
  `const handleSaveConfig = async (url: string, key: string, email?: string, password?: string) => {`
);

code = code.replace(
  /const activeClient = updateSupabaseClient\(url, key\);/g,
  `const activeClient = updateSupabaseClient(url, key, email, password);`
);

code = code.replace(
  /showSuccessAlert\("Konfigurasi sambungan berhasil diperbarui!"\);\n    \}/g,
  `if (email && password) {
        const { error } = await activeClient.auth.signInWithPassword({ email, password });
        if (error) {
           console.warn("SignIn error:", error);
           alert("Konfigurasi tersimpan, namun gagal login: " + error.message);
           return;
        }
      }
      showSuccessAlert("Konfigurasi sambungan berhasil diperbarui!");
    }`
);

fs.writeFileSync('src/App.tsx', code);
