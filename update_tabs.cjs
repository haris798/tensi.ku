const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [activeMainTab, setActiveMainTab] = useState<'dashboard' | 'input' | 'riwayat' | 'seting'>('dashboard');",
  "const [activeMainTab, setActiveMainTab] = useState<'dashboard' | 'statistik' | 'input' | 'riwayat' | 'seting'>('dashboard');"
);

const oldTabs = `<button
                type="button"
                onClick={() => setActiveMainTab('input')}`;

const newTabs = `<button
                type="button"
                onClick={() => setActiveMainTab('statistik')}
                title="Statistik"
                className={\`p-2 rounded-lg transition-all cursor-pointer \${
                  activeMainTab === 'statistik'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800'
                }\`}
              >
                <TrendingUp className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('input')}`;

code = code.replace(oldTabs, newTabs);

fs.writeFileSync('src/App.tsx', code);
console.log('Tabs updated');
