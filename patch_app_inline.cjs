const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const additionalInputs = `
                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={creds.email}
                      disabled={isDemo}
                      onChange={(e) => {
                        const newEmail = e.target.value.trim();
                        setCreds((prev) => ({ ...prev, email: newEmail }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 disabled:opacity-50 disabled:bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-200 transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={creds.password}
                      disabled={isDemo}
                      onChange={(e) => {
                        const newPassword = e.target.value.trim();
                        setCreds((prev) => ({ ...prev, password: newPassword }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 disabled:opacity-50 disabled:bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-200 transition-all"
                    />
                  </div>
`;

code = code.replace(
  /<\/div>\n\n                  \{\/\* Actions buttons \*\/\}/g,
  `</div>
${additionalInputs}
                  {/* Actions buttons */}`
);

code = code.replace(
  /onClick=\{[^\}]*handleSaveConfig\(creds\.url, creds\.anonKey\)[^\}]*\}/g,
  `onClick={() => handleSaveConfig(creds.url, creds.anonKey, creds.email, creds.password)}`
);

fs.writeFileSync('src/App.tsx', code);
