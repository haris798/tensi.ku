const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseConfigModal.tsx', 'utf8');

code = code.replace(
  /onSave: \(url: string, key: string, isDemo: boolean\) => void;/g,
  `onSave: (url: string, key: string, email?: string, password?: string) => void;`
);

code = code.replace(
  /const \[inputUrl, setInputUrl\] = useState\(url\);\n  const \[inputKey, setInputKey\] = useState\(anonKey\);/g,
  `const [inputUrl, setInputUrl] = useState(url);
  const [inputKey, setInputKey] = useState(anonKey);
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");`
);

code = code.replace(
  /onSave\(inputUrl\.trim\(\), inputKey\.trim\(\), false\);/g,
  `onSave(inputUrl.trim(), inputKey.trim(), inputEmail.trim(), inputPassword.trim());`
);

const additionalInputs = `
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all font-mono"
                />
              </div>
`;

code = code.replace(
  /<\/span>\n              <\/div>\n            <\/div>/g,
  `</span>
              </div>${additionalInputs}
            </div>`
);

fs.writeFileSync('src/components/SupabaseConfigModal.tsx', code);
