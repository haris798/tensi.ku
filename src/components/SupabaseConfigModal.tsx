import React, { useState } from 'react';
import { X, Database, Copy, Check, Cloud, Play, RefreshCw, Info, Lock } from 'lucide-react';
import { SUPABASE_SQL_SETUP } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  anonKey: string;
  isEnv: boolean;
  isDemo: boolean;
  onSave: (url: string, key: string, isDemo: boolean) => void;
  onReset: () => void;
}

export default function SupabaseConfigModal({
  isOpen,
  onClose,
  url,
  anonKey,
  isEnv,
  isDemo,
  onSave,
  onReset,
}: SupabaseConfigModalProps) {
  const [inputUrl, setInputUrl] = useState(url);
  const [inputKey, setInputKey] = useState(anonKey);
  const [isCopied, setIsCopied] = useState(false);
  const [currentIsDemo, setCurrentIsDemo] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(inputUrl.trim(), inputKey.trim(), false);
    onClose();
  };

  const handleToggleDemo = (checked: boolean) => {
    setCurrentIsDemo(false);
  };

  return (
    <div id="supabase-config-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div id="supabase-config-modal-container" className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-800">Pengaturan Supabase</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Status Alert */}
          <div className="p-4 rounded-xl border flex items-start gap-3 bg-emerald-50 border-emerald-200 text-emerald-800">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                Mode Aktif: Tersambung Supabase Cloud
              </p>
              <p className="text-xs mt-1 leading-relaxed">
                Aplikasi Anda tersinkronisasi langsung dengan server Supabase Anda secara aman. RLS diaktifkan sehingga data hanya bisa diakses oleh akun Anda sendiri.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSubmit} className="space-y-4">
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                />
                <span className="text-xs text-slate-400 mt-1 block flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Key Anon aman dipasang di sisi browser karena database dilindungi kebijakan keamanan Row-Level Security (RLS).
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Simpan Konfigurasi
              </button>
              {(url || anonKey) && (
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setInputUrl('');
                    setInputKey('');
                    setCurrentIsDemo(false);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Database Setup Instructions */}
          {!currentIsDemo && (
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Inisialisasi Skema Database</h4>
                  <p className="text-xs text-slate-500">Jalankan script ini di SQL Editor Supabase Anda agar tabel dan kebijakan (RLS) terbuat otomatis.</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.97] transition-all"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>Salin SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 text-slate-200 p-4 text-[11px] font-mono leading-relaxed h-48 overflow-y-auto">
                <pre>{SUPABASE_SQL_SETUP}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
