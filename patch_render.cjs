const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const insertCode = `        {/* STATISTIK TAB */}
        {activeMainTab === 'statistik' && (
          <section id="statistik-view" className="mt-2">
            <StatistikPanel bpLogs={bpLogs} weightLogs={weightLogs} />
          </section>
        )}

`;

code = code.replace('{/* INPUT DATA TAB */}', insertCode + '{/* INPUT DATA TAB */}');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched render for StatistikPanel');
