import { BloodPressureLog, BPCategory } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MonthlyTrendPieChartProps {
  data: BloodPressureLog[];
}

export function classifyBP(sys: number, dia: number): BPCategory {
  // 1. Hipertensi sistolik terisolasi: >= 140 dan < 90
  if (sys >= 140 && dia < 90) {
    return 'Hipertensi sistolik terisolasi';
  }

  // Determine ranks for other categories
  let sysRank = 1; // Optimal
  if (sys >= 180) sysRank = 6;
  else if (sys >= 160) sysRank = 5;
  else if (sys >= 140) sysRank = 4;
  else if (sys >= 130) sysRank = 3;
  else if (sys >= 120) sysRank = 2;

  let diaRank = 1; // Optimal
  if (dia >= 110) diaRank = 6;
  else if (dia >= 100) diaRank = 5;
  else if (dia >= 90) diaRank = 4;
  else if (dia >= 85) diaRank = 3;
  else if (dia >= 80) diaRank = 2;

  const maxRank = Math.max(sysRank, diaRank);
  switch (maxRank) {
    case 6: return 'Hipertensi 3';
    case 5: return 'Hipertensi 2';
    case 4: return 'Hipertensi 1';
    case 3: return 'Normal tinggi';
    case 2: return 'Normal';
    default: return 'Optimal';
  }
}

export default function MonthlyTrendPieChart({ data }: MonthlyTrendPieChartProps) {
  // Filter for past 30 days to focus on monthly trends
  const past30Days = new Date();
  past30Days.setDate(past30Days.getDate() - 30);
  
  const monthlyLogs = data.filter(log => new Date(log.logged_at) >= past30Days);

  const counts: Record<BPCategory, number> = {
    'Optimal': 0,
    'Normal': 0,
    'Normal tinggi': 0,
    'Hipertensi 1': 0,
    'Hipertensi 2': 0,
    'Hipertensi 3': 0,
    'Hipertensi sistolik terisolasi': 0,
  };

  monthlyLogs.forEach((log) => {
    const cat = classifyBP(log.systolic, log.diastolic);
    counts[cat]++;
  });

  const categoryMetadata: Record<BPCategory, { color: string; desc: string; label: string }> = {
    'Optimal': { color: '#059669', desc: 'Sistolik < 120 & Diastolik < 80', label: 'Optimal' },
    'Normal': { color: '#10b981', desc: 'Sistolik 120-129 dan/atau Diastolik 80-84', label: 'Normal' },
    'Normal tinggi': { color: '#fbbf24', desc: 'Sistolik 130-139 dan/atau Diastolik 85-89', label: 'Normal Tinggi' },
    'Hipertensi 1': { color: '#f97316', desc: 'Sistolik 140-159 dan/atau Diastolik 90-99', label: 'Hipertensi 1' },
    'Hipertensi 2': { color: '#ef4444', desc: 'Sistolik 160-179 dan/atau Diastolik 100-109', label: 'Hipertensi 2' },
    'Hipertensi 3': { color: '#991b1b', desc: 'Sistolik >= 180 dan/atau Diastolik >= 110', label: 'Hipertensi 3' },
    'Hipertensi sistolik terisolasi': { color: '#8b5cf6', desc: 'Sistolik >= 140 & Diastolik < 90', label: 'Hst. Terisolasi' },
  };

  const chartData = Object.entries(counts)
    .map(([key, count]) => ({
      name: key as BPCategory,
      value: count,
      color: categoryMetadata[key as BPCategory].color,
    }))
    .filter((item) => item.value > 0);

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl text-xs shadow-xl font-sans">
          <p className="font-bold flex items-center gap-1.5" style={{ color: item.payload.color }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.payload.color }}></span>
            {item.name}
          </p>
          <p className="text-slate-300 mt-1">
            Jumlah: <span className="font-mono font-bold text-white">{item.value} record(s)</span> ({percent}%)
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 italic">
            {categoryMetadata[item.name as BPCategory].desc}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white p-2 rounded-xl">
      {monthlyLogs.length === 0 ? (
        <div className="col-span-12 flex h-[200px] items-center justify-center flex-col text-slate-400 py-6">
          <p className="text-sm font-medium">Belum ada data tensi 30 hari terakhir</p>
          <p className="text-xs text-slate-400 mt-1">Simpan data untuk melihat tren bulanan</p>
        </div>
      ) : (
        <>
          {/* Chart Graphic (Col 5) */}
          <div className="col-span-12 md:col-span-5 h-[200px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Summary Text */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-800 font-mono">{total}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Log Tensi</span>
            </div>
          </div>

          {/* Chart Details List (Col 7) */}
          <div className="col-span-12 md:col-span-7 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Penyebaran Kategori (30 Hari Terakhir)</h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {Object.entries(categoryMetadata).map(([category, meta]) => {
                const count = counts[category as BPCategory];
                const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                
                return (
                  <div 
                    key={category} 
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      count > 0 
                        ? 'bg-slate-50 border-slate-100 hover:shadow-xs' 
                        : 'opacity-40 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: meta.color }}></span>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{meta.label}</p>
                        <p className="text-[9px] text-slate-400 font-mono hidden sm:block">{meta.desc}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 font-mono">{count} kali</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-150 text-slate-600 font-mono shrink-0 min-w-[34px] text-center">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
