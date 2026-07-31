import React, { useState, useEffect } from 'react';
import {
  X,
  Droplet,
  Bell,
  BellOff,
  Plus,
  Trash2,
  CheckCircle2,
  Volume2,
  Clock,
  Sparkles,
  Info,
  GlassWater,
  Award,
  SlidersHorizontal,
} from 'lucide-react';
import { WaterLog, WaterReminderConfig } from '../types';
import { localDb } from '../lib/localDb';

interface WaterReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  waterLogs: WaterLog[];
  waterConfig: WaterReminderConfig;
  onWaterUpdated: () => void;
}

// Pleasant synth chime using browser Web Audio API
export function playWaterChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Note 1: E5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Note 2: A5
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.2, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('Audio Context error:', err);
  }
}

export default function WaterReminderModal({
  isOpen,
  onClose,
  waterLogs,
  waterConfig,
  onWaterUpdated,
}: WaterReminderModalProps) {
  const [config, setConfig] = useState<WaterReminderConfig>(waterConfig);
  const [customMlInput, setCustomMlInput] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setConfig(waterConfig);
  }, [waterConfig]);

  useEffect(() => {
    if (isNotificationSupported) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen, isNotificationSupported]);

  if (!isOpen) return null;

  // Calculate today's total & items
  const todayStr = new Date().toDateString();
  const todayLogs = waterLogs.filter(
    (log) => new Date(log.logged_at).toDateString() === todayStr
  );
  const todayTotalMl = todayLogs.reduce((acc, curr) => acc + curr.amount_ml, 0);
  const progressPercent = Math.min(
    100,
    Math.round((todayTotalMl / (config.daily_goal_ml || 2000)) * 100)
  );
  const isGoalReached = todayTotalMl >= (config.daily_goal_ml || 2000);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddWater = (amountMl: number) => {
    if (amountMl <= 0) return;
    localDb.saveWaterLog(amountMl);
    onWaterUpdated();
    showToast(`+${amountMl} ml air tercatat!`);
    if (config.sound_enabled) {
      playWaterChime();
    }
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMlInput, 10);
    if (!val || val <= 0) return;
    handleAddWater(val);
    setCustomMlInput('');
  };

  const handleDeleteLog = (id: string) => {
    localDb.deleteWaterLog(id);
    onWaterUpdated();
    showToast('Catatan air dihapus.');
  };

  const handleToggleReminder = () => {
    const nextEnabled = !config.enabled;
    const updated = localDb.saveWaterConfig({ enabled: nextEnabled });
    setConfig(updated);
    onWaterUpdated();
    if (nextEnabled && isNotificationSupported && notificationPermission !== 'granted') {
      requestNotificationPermission();
    } else {
      showToast(
        nextEnabled
          ? 'Pengingat minum air AKTIF'
          : 'Pengingat minum air DILANTAK / NONAKTIF'
      );
    }
  };

  const requestNotificationPermission = async () => {
    if (!isNotificationSupported) {
      showToast('Browser Anda tidak mendukung notifikasi sistem. Pengingat akan muncul di dalam aplikasi.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        showToast('Izin notifikasi diberikan! Pengingat akan muncul secara berkala.');
      } else {
        showToast('Izin notifikasi ditolak oleh browser.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateConfig = (key: keyof WaterReminderConfig, value: unknown) => {
    const updated = localDb.saveWaterConfig({ [key]: value });
    setConfig(updated);
    onWaterUpdated();
    showToast('Pengaturan pengingat diperbarui.');
  };

  const handleTestNotification = () => {
    if (config.sound_enabled) {
      playWaterChime();
    }

    if (isNotificationSupported && Notification.permission === 'granted') {
      new Notification('💧 Waktunya Minum Air Putih!', {
        body: `Ayo cegah dehidrasi! Target harianmu: ${todayTotalMl}/${config.daily_goal_ml} ml.`,
        icon: '/favicon.ico',
      });
      showToast('Notifikasi uji coba terkirim!');
    } else {
      showToast('🔊 Suara chime dimainkan! Pengingat visual akan muncul di dalam aplikasi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-auto">
        {/* Toast Alert Banner */}
        {toastMsg && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-cyan-500 via-sky-600 to-indigo-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
              <Droplet className="h-6 w-6 text-cyan-200 fill-cyan-100 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Pengingat Minum Air
              </h2>
              <p className="text-xs text-cyan-100 font-medium">
                Target harian & hidrasi sehat untuk pembuluh darah
              </p>
            </div>
          </div>

          {/* Quick Progress Summary */}
          <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-cyan-100 font-medium block">Tercapai Hari Ini</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-white">{todayTotalMl.toLocaleString('id-ID')}</span>
                <span className="text-xs text-cyan-100 font-semibold">/ {config.daily_goal_ml.toLocaleString('id-ID')} ml</span>
              </div>
              <span className="text-[11px] text-cyan-200 mt-0.5 block">
                ≈ {Math.round(todayTotalMl / 250)} dari {Math.round(config.daily_goal_ml / 250)} gelas (250ml)
              </span>
            </div>

            <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-white transition-all duration-500 ease-out"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-white">
                {progressPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Target Reached Banner */}
          {isGoalReached && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-200">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Selamat! Target Hidrasi Tercapai 🎉
                </h4>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Tubuhmu tercukupi asupan cairan hari ini. Pertahankan pola minum sehat ini!
                </p>
              </div>
            </div>
          )}

          {/* Quick Intake Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <GlassWater className="h-4 w-4 text-cyan-500" />
                <span>Tambah Asupan Air</span>
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Klik sekali sentuh</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleAddWater(250)}
                className="p-3 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/60 border border-cyan-200/80 dark:border-cyan-800/60 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer text-center group"
              >
                <div className="p-1.5 bg-cyan-500 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                  <GlassWater className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">+250 ml</span>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-medium">1 Gelas</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddWater(330)}
                className="p-3 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/60 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer text-center group"
              >
                <div className="p-1.5 bg-sky-500 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                  <Droplet className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">+330 ml</span>
                <span className="text-[10px] text-sky-700 dark:text-sky-300 font-medium">Botol Kecil</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddWater(500)}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer text-center group"
              >
                <div className="p-1.5 bg-indigo-500 text-white rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                  <Droplet className="h-4 w-4 fill-current" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">+500 ml</span>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">Botol Sedang</span>
              </button>
            </div>

            {/* Custom ML Input */}
            <form onSubmit={handleCustomAdd} className="mt-2.5 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="10"
                  max="2000"
                  step="10"
                  value={customMlInput}
                  onChange={(e) => setCustomMlInput(e.target.value)}
                  placeholder="Jumlah khusus (misal: 150 ml)..."
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">
                  ml
                </span>
              </div>
              <button
                type="submit"
                disabled={!customMlInput}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah</span>
              </button>
            </form>
          </div>

          {/* Reminder Toggle & Settings Section */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl text-white ${
                    config.enabled ? 'bg-cyan-600' : 'bg-slate-400'
                  }`}
                >
                  {config.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Pengingat Otomatis
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {config.enabled
                      ? `Setiap ${config.interval_minutes} menit (${config.start_time} - ${config.end_time})`
                      : 'Pengingat dimatikan'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleReminder}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.enabled ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Expand / Collapse detailed settings */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{showSettings ? 'Sembunyikan Pengaturan Remind' : 'Atur Jam & Target Minum'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestNotification}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <Volume2 className="h-3.5 w-3.5 text-indigo-500" />
                <span>Uji Coba Notifikasi</span>
              </button>
            </div>

            {/* Notification permission prompt warning */}
            {config.enabled && isNotificationSupported && notificationPermission === 'default' && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between gap-2 text-amber-800 dark:text-amber-300 text-[11px]">
                <span>Izin notifikasi browser belum aktif.</span>
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shrink-0 cursor-pointer"
                >
                  Izinkan Notifikasi
                </button>
              </div>
            )}

            {config.enabled && isNotificationSupported && notificationPermission === 'denied' && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-800 dark:text-rose-300 text-[11px]">
                <span>Izin notifikasi diblokir. Aktifkan dari pengaturan situs browser Anda untuk mendapat notifikasi.</span>
              </div>
            )}
            
            {/* Warning when not supported */}
            {config.enabled && !isNotificationSupported && (
              <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl flex items-center justify-between gap-2 text-sky-800 dark:text-sky-300 text-[11px]">
                <span>Notifikasi sistem tidak didukung. Pengingat hanya akan berupa suara/pop-up dalam aplikasi saat aplikasi dibuka.</span>
              </div>
            )}

            {/* Expanded Detailed Settings */}
            {showSettings && (
              <div className="pt-3 space-y-3 animate-in fade-in duration-200 text-xs">
                {/* Target ML */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Target Harian (ml)
                    </label>
                    <select
                      value={config.daily_goal_ml}
                      onChange={(e) => handleUpdateConfig('daily_goal_ml', parseInt(e.target.value, 10))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value={1500}>1.500 ml (6 Gelas)</option>
                      <option value={2000}>2.000 ml (8 Gelas - Standar)</option>
                      <option value={2500}>2.500 ml (10 Gelas)</option>
                      <option value={3000}>3.000 ml (12 Gelas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Interval Pengingat
                    </label>
                    <select
                      value={config.interval_minutes}
                      onChange={(e) => handleUpdateConfig('interval_minutes', parseInt(e.target.value, 10))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value={45}>Setiap 45 Menit</option>
                      <option value={60}>Setiap 1 Jam (60 mnt)</option>
                      <option value={90}>Setiap 1.5 Jam (90 mnt)</option>
                      <option value={120}>Setiap 2 Jam (120 mnt)</option>
                      <option value={180}>Setiap 3 Jam (180 mnt)</option>
                    </select>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Mulai Dari Jam
                    </label>
                    <input
                      type="time"
                      value={config.start_time}
                      onChange={(e) => handleUpdateConfig('start_time', e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Selesai Jam
                    </label>
                    <input
                      type="time"
                      value={config.end_time}
                      onChange={(e) => handleUpdateConfig('end_time', e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Sound Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Suara Pengingat (Chime)</span>
                  <input
                    type="checkbox"
                    checked={config.sound_enabled}
                    onChange={(e) => handleUpdateConfig('sound_enabled', e.target.checked)}
                    className="h-4 w-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Today's History Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Catatan Air Hari Ini</span>
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {todayLogs.length} Kali Minum
              </span>
            </div>

            {todayLogs.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <Droplet className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada catatan air untuk hari ini.
                </p>
                <p className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-0.5">
                  Klik tombol di atas untuk mencatat gelas pertama Anda!
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {todayLogs
                  .slice()
                  .reverse()
                  .map((log) => {
                    const timeFormatted = new Date(log.logged_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 rounded-lg">
                            <GlassWater className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              +{log.amount_ml} ml
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2">{timeFormatted}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Hapus catatan ini"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Clinical Tip */}
          <div className="p-3 bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 rounded-2xl flex items-start gap-2.5 text-cyan-900 dark:text-cyan-200 text-[11px]">
            <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Manfaat untuk Tensi:</strong> Asupan air putih yang cukup membantu menjaga elastisitas pembuluh darah dan membantu ginjal membuang zat natrium (garam) berlebih dari tubuh.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Tersimpan di perangkat</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
