const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseConfigModal.tsx', 'utf8');

code = code.replace(
  /url: string;\n  anonKey: string;/g,
  `url: string;\n  anonKey: string;\n  email?: string;\n  password?: string;`
);

code = code.replace(
  /export default function SupabaseConfigModal\(\{\n  isOpen,\n  onClose,\n  url,\n  anonKey,\n  onSave,\n  onReset,\n\}: SupabaseConfigModalProps\) \{/g,
  `export default function SupabaseConfigModal({\n  isOpen,\n  onClose,\n  url,\n  anonKey,\n  email,\n  password,\n  onSave,\n  onReset,\n}: SupabaseConfigModalProps) {`
);

code = code.replace(
  /const \[inputEmail, setInputEmail\] = useState\(""\);\n  const \[inputPassword, setInputPassword\] = useState\(""\);/g,
  `const [inputEmail, setInputEmail] = useState(email || "");\n  const [inputPassword, setInputPassword] = useState(password || "");`
);

fs.writeFileSync('src/components/SupabaseConfigModal.tsx', code);
