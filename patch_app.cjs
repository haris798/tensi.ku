const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Import StatistikPanel
if (!code.includes('import { StatistikPanel }')) {
  code = code.replace(
    `import { classifyBP } from './components/MonthlyTrendPieChart';`,
    `import { classifyBP } from './components/MonthlyTrendPieChart';\nimport { StatistikPanel } from './components/StatistikPanel';`
  );
}

// 2. Add render logic for StatistikPanel
// find where dashboard is rendered and add statistik right after
const dashboardEndIdx = code.indexOf(`{/* ROW 2: MAIN CONTROLS (Input Form & Chart/History Tabs) */}`);
if (dashboardEndIdx !== -1) {
  const insertBefore = `{activeMainTab === 'input' && (`;
  
  if (!code.includes(`{activeMainTab === 'statistik' && (`)) {
    code = code.replace(
      insertBefore,
      `{activeMainTab === 'statistik' && (
          <section id="statistik-view" className="mt-6">
            <StatistikPanel bpLogs={bpLogs} weightLogs={weightLogs} />
          </section>
        )}

        ` + insertBefore
    );
  }
}

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched for StatistikPanel');
