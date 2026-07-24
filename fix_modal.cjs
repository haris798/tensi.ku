const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseConfigModal.tsx', 'utf8');

code = code.replace(
  /export default function SupabaseConfigModal\(\{\n  isOpen,\n  onClose,\n  url,\n  anonKey,\n\n  onSave,\n  onReset,\n\}: SupabaseConfigModalProps\) \{/g,
  `export default function SupabaseConfigModal({
  isOpen,
  onClose,
  url,
  anonKey,
  email,
  password,
  onSave,
  onReset,
}: SupabaseConfigModalProps) {`
);

fs.writeFileSync('src/components/SupabaseConfigModal.tsx', code);
