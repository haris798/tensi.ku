const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const chartsStart = `        {/* ROW 2: CHARTS SHOWN ONLY ON DASHBOARD */}
        {activeMainTab === 'dashboard' && (`;
const chartsEnd = `          </section>
        )}`;

let idxStart = code.indexOf(chartsStart);
if (idxStart !== -1) {
  let idxEnd = code.indexOf(chartsEnd, idxStart);
  if (idxEnd !== -1) {
    idxEnd += chartsEnd.length;
    let chartsBlock = code.substring(idxStart, idxEnd);
    
    // Remove it from current location
    code = code.substring(0, idxStart) + code.substring(idxEnd);
    
    // Now put it in Statistik tab
    // Modify chartsBlock to not check activeMainTab === 'dashboard'
    chartsBlock = chartsBlock.replace(`{/* ROW 2: CHARTS SHOWN ONLY ON DASHBOARD */}
        {activeMainTab === 'dashboard' && (`, '');
    chartsBlock = chartsBlock.substring(0, chartsBlock.lastIndexOf(')}')); // remove the closing )}

    const statistikMarker = `{activeMainTab === 'statistik' && (
          <section id="statistik-view" className="mt-2 space-y-6">
            <StatistikPanel bpLogs={bpLogs} weightLogs={weightLogs} />
          </section>
        )}`;
    
    // Actually the current code has:
    /*
        {/* STATISTIK TAB *\/}
        {activeMainTab === 'statistik' && (
          <section id="statistik-view" className="mt-2">
            <StatistikPanel bpLogs={bpLogs} weightLogs={weightLogs} />
          </section>
        )}
    */
    
    const existingStatistik = `{/* STATISTIK TAB */}
        {activeMainTab === 'statistik' && (
          <section id="statistik-view" className="mt-2 space-y-6">
            <StatistikPanel bpLogs={bpLogs} weightLogs={weightLogs} />
`;
    // wait I need to find the existing statistik block
    const statSearch = `{activeMainTab === 'statistik' && (
          <section id="statistik-view" className="mt-2">
            <StatistikPanel bpLogs={bpLogs} weightLogs={weightLogs} />`;
            
    code = code.replace(statSearch, statSearch + '\n' + chartsBlock);
    
    fs.writeFileSync('src/App.tsx', code);
    console.log('Moved successfully');
  }
}

