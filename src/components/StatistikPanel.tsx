import React, { useMemo } from "react";
import { BloodPressureLog, WeightLog } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, isSameMonth, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { TrendingUp, Activity, Heart, ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  bpLogs: BloodPressureLog[];
  weightLogs: WeightLog[];
}

export const StatistikPanel: React.FC<Props> = ({ bpLogs }) => {
  // Tren Mingguan (7 hari terakhir)
  const weeklyData = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, 6 - i);
      return format(d, "yyyy-MM-dd");
    });

    return last7Days.map((dateStr) => {
      const logsForDay = bpLogs.filter((log) =>
        log.logged_at.startsWith(dateStr)
      );

      let sys = 0;
      let dia = 0;
      let count = 0;

      logsForDay.forEach((l) => {
        sys += l.systolic;
        dia += l.diastolic;
        count++;
      });

      return {
        date: format(parseISO(dateStr), "EEEE", { locale: id }), // Hari
        sys: count > 0 ? Math.round(sys / count) : null,
        dia: count > 0 ? Math.round(dia / count) : null,
      };
    });
  }, [bpLogs]);

  // Rata-rata Bulanan
  const monthlyData = useMemo(() => {
    // Kita ambil data bulan ini
    const today = new Date();
    const currentMonthLogs = bpLogs.filter((log) =>
      isSameMonth(new Date(log.logged_at), today)
    );

    let totalSys = 0;
    let totalDia = 0;

    currentMonthLogs.forEach((log) => {
      totalSys += log.systolic;
      totalDia += log.diastolic;
    });

    const count = currentMonthLogs.length;

    return {
      sysAvg: count > 0 ? Math.round(totalSys / count) : 0,
      diaAvg: count > 0 ? Math.round(totalDia / count) : 0,
      count,
    };
  }, [bpLogs]);

  // Tertinggi vs Terendah (All Time atau bulan ini, mari pakai all time)
  const extremes = useMemo(() => {
    if (bpLogs.length === 0) return null;

    let maxSys = bpLogs[0];
    let minSys = bpLogs[0];
    let maxDia = bpLogs[0];
    let minDia = bpLogs[0];

    bpLogs.forEach((log) => {
      if (log.systolic > maxSys.systolic) maxSys = log;
      if (log.systolic < minSys.systolic) minSys = log;
      if (log.diastolic > maxDia.diastolic) maxDia = log;
      if (log.diastolic < minDia.diastolic) minDia = log;
    });

    return { maxSys, minSys, maxDia, minDia };
  }, [bpLogs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in w-full">
      {/* Kolom Kiri: Tren Mingguan */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Tren 7 Hari Terakhir
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Rata-rata tensi harian
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  domain={["dataMin - 10", "dataMax + 10"]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow:
                      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{
                    fontWeight: "bold",
                    color: "#1e293b",
                    marginBottom: "4px",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
                <Line
                  type="monotone"
                  name="Sistolik"
                  dataKey="sys"
                  stroke="#ef4444"
                  strokeWidth={3}
                  activeDot={{
                    r: 6,
                    fill: "#ef4444",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  name="Diastolik"
                  dataKey="dia"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  activeDot={{
                    r: 6,
                    fill: "#3b82f6",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Rata-rata Bulanan & Rekor */}
      <div className="lg:col-span-4 space-y-6">
        {/* Rata-rata Bulanan */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-500" />
              Rata-rata Bulan Ini
            </h3>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
              {monthlyData.count > 0
                ? `${monthlyData.sysAvg} / ${monthlyData.diaAvg}`
                : "- / -"}
            </span>
            <span className="text-xs font-semibold text-slate-400">mmHg</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            Berdasarkan {monthlyData.count} pencatatan bulan ini
          </p>
        </div>

        {/* Tertinggi vs Terendah */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              Rekor Tensi
            </h3>
          </div>

          {extremes ? (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUp className="h-3.5 w-3.5 text-rose-600" />
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                    Tertinggi
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                    {extremes.maxSys.systolic}/{extremes.maxDia.diastolic}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {format(new Date(extremes.maxSys.logged_at), "dd MMM yy")}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Terendah
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                    {extremes.minSys.systolic}/{extremes.minDia.diastolic}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {format(new Date(extremes.minSys.logged_at), "dd MMM yy")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Belum ada data cukup
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
