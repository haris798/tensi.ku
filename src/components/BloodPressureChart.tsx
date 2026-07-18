import { BloodPressureLog } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';

interface BloodPressureChartProps {
  data: BloodPressureLog[];
}

export default function BloodPressureChart({ data }: BloodPressureChartProps) {
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
              <span className="text-rose-400 font-medium">Sistolik (Systolic):</span>
              <span className="font-mono font-bold text-sm text-rose-300">{log.systolic} <span className="text-[10px] text-slate-400">mmHg</span></span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-indigo-400 font-medium">Diastolik (Diastolic):</span>
              <span className="font-mono font-bold text-sm text-indigo-300">{log.diastolic} <span className="text-[10px] text-slate-400">mmHg</span></span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-emerald-400 font-medium">Detak Nadi (Pulse):</span>
              <span className="font-mono font-bold text-sm text-emerald-300">{log.pulse} <span className="text-[10px] text-slate-400">bpm</span></span>
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
          <p className="text-sm font-medium">Belum ada data tensi untuk digambarkan</p>
          <p className="text-xs text-slate-400 mt-1">Tambahkan beberapa data tensi harian Anda terlebih dahulu</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{ top: 20, right: 10, left: -15, bottom: 5 }}
          >
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
              domain={['dataMin - 15', 'dataMax + 15']}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
            />
            
            {/* Shaded area for ideal normal blood pressure zone (diastolic 60-80, systolic 90-120) */}
            <ReferenceArea {...({ y1: 60, y2: 120, fill: "rgba(16, 185, 129, 0.03)" } as any)} />
            
            <Line
              name="Sistolik (SYS)"
              type="monotone"
              dataKey="systolic"
              stroke="#ef4444"
              strokeWidth={3}
              activeDot={{ r: 6, strokeWidth: 0 }}
              dot={{ r: 3, strokeWidth: 1 }}
            />
            <Line
              name="Diastolik (DIA)"
              type="monotone"
              dataKey="diastolic"
              stroke="#3b82f6"
              strokeWidth={3}
              activeDot={{ r: 6, strokeWidth: 0 }}
              dot={{ r: 3, strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
