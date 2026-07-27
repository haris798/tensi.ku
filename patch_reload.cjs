const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      } else {
        showSuccessAlert("Konfigurasi sambungan berhasil diperbarui!");
      }
    },
    [showSuccessAlert]
  );`;

const replacement = `      } else {
        showSuccessAlert("Konfigurasi sambungan berhasil diperbarui!");
      }
      setTimeout(() => window.location.reload(), 1500); // Reload to initialize client properly
    },
    [showSuccessAlert]
  );`;

const target2 = `  const handleResetConfig = useCallback(() => {
    clearSavedCredentials();
    setCreds(getSavedCredentials());
    showSuccessAlert("Konfigurasi telah di-reset.");
  }, [showSuccessAlert]);`;

const replacement2 = `  const handleResetConfig = useCallback(() => {
    clearSavedCredentials();
    setCreds(getSavedCredentials());
    showSuccessAlert("Konfigurasi telah di-reset.");
    setTimeout(() => window.location.reload(), 500);
  }, [showSuccessAlert]);`;

code = code.replace(target, replacement);
code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx reload patched');
