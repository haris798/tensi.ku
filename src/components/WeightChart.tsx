import { WeightLog } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WeightChartProps {
  data: WeightLog[];
}

export default function WeightChart({ data }: WeightChartProps) {
  // Format dates for display
  const formattedData = data.map((log) => {
    const d = new Date(log.logged_at);
    return {
      ...log,
      tanggal: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      waktu: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const log = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl border border-slate-800 shadow-xl text-xs backdrop-blur-xs">
          <p className="font-semibold text-slate-300">{label} ({log.waktu})</p>
          <div className="mt-2 space-y-1">
            <p className="flex justify-between gap-6">
              <span className="text-amber-400 font-medium">Berat Badan:</span>
              <span className="font-mono font-bold text-sm text-amber-300">
                {Number(log.weight).toFixed(1)} <span className="text-[10px] text-slate-400">kg</span>
              </span>
            </p>
            {log.notes && (
              <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-1.5 mt-1.5 italic max-w-[200px] break-words">
                Catatan: "{log.notes}"
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[320px] bg-white rounded-xl">
      {formattedData.length === 0 ? (
        <div className="flex h-full items-center justify-center flex-col text-slate-400 py-12">
          <p className="text-sm font-medium">Belum ada data berat badan harian</p>
          <p className="text-xs text-slate-400 mt-1">Gunakan formulir untuk merekam perkembangan massa tubuh Anda</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 20, right: 10, left: -15, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="tanggal" 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              domain={['dataMin - 3', 'dataMax + 3']}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              name="Berat Badan (kg)"
              type="monotone"
              dataKey="weight"
              stroke="#f59e0b"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorWeight)"
              activeDot={{ r: 6, strokeWidth: 0 }}
              dot={{ r: 3, strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
