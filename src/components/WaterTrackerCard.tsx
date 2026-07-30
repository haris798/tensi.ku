import React from 'react';
import { Droplet, Plus, GlassWater, Bell, CheckCircle2, ChevronRight } from 'lucide-react';
import { WaterLog, WaterReminderConfig } from '../types';
import { localDb } from '../lib/localDb';
import { playWaterChime } from './WaterReminderModal';

interface WaterTrackerCardProps {
  waterLogs: WaterLog[];
  waterConfig: WaterReminderConfig;
  onOpenModal: () => void;
  onWaterUpdated: () => void;
}

export default function WaterTrackerCard({
  waterLogs,
  waterConfig,
  onOpenModal,
  onWaterUpdated,
}: WaterTrackerCardProps) {
  const todayStr = new Date().toDateString();
  const todayLogs = waterLogs.filter(
    (log) => new Date(log.logged_at).toDateString() === todayStr
  );
  const todayTotalMl = todayLogs.reduce((acc, curr) => acc + curr.amount_ml, 0);
  const targetMl = waterConfig.daily_goal_ml || 2000;
  const progressPercent = Math.min(100, Math.round((todayTotalMl / targetMl) * 100));
  const isGoalReached = todayTotalMl >= targetMl;

  const handleQuickAddGlass = (e: React.MouseEvent) => {
    e.stopPropagation();
    localDb.saveWaterLog(250);
    if (waterConfig.sound_enabled) {
      playWaterChime();
    }
    onWaterUpdated();
  };

  return (
    <div
      onClick={onOpenModal}
      className="group relative bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-indigo-500/10 dark:from-cyan-950/40 dark:via-sky-950/20 dark:to-indigo-950/30 border border-cyan-200/80 dark:border-cyan-800/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      {/* Subtle Background Water Ripple Circle */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-cyan-400/10 dark:bg-cyan-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-cyan-500 text-white rounded-2xl shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Droplet className="h-5 w-5 fill-cyan-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Air Putih (Hidrasi)
              </h3>
              {waterConfig.enabled && (
                <span className="p-1 text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 rounded-full" title="Pengingat Otomatis Aktif">
                  <Bell className="h-3 w-3" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Target: {targetMl.toLocaleString('id-ID')} ml / hari
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickAddGlass}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0 z-10"
          title="Tambah 1 Gelas Air (250 ml)"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+250 ml</span>
        </button>
      </div>

      {/* Progress & Values */}
      <div className="space-y-2 mt-4">
        <div className="flex items-baseline justify-between text-xs">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {todayTotalMl.toLocaleString('id-ID')}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">ml</span>
            <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold ml-1">
              ({Math.round(todayTotalMl / 250)} gelas)
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-xs text-cyan-600 dark:text-cyan-400">
            {isGoalReached ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Target Tercapai
              </span>
            ) : (
              <span>{progressPercent}%</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 w-full bg-cyan-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGoalReached
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                : 'bg-gradient-to-r from-cyan-500 to-sky-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer Banner */}
      <div className="mt-3.5 pt-2.5 border-t border-cyan-100/60 dark:border-cyan-900/40 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <GlassWater className="h-3.5 w-3.5 text-cyan-500" />
          <span>{todayLogs.length > 0 ? `${todayLogs.length} catatan hari ini` : 'Belum minum air hari ini'}</span>
        </span>

        <span className="text-cyan-600 dark:text-cyan-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
          <span>Atur Remind</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}
