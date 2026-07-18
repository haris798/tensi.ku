import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Mail, Lock, AlertCircle, ArrowRight, Settings } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
  onOpenSettings: () => void;
}

export default function AuthScreen({ onSuccess, onOpenSettings }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!supabase) {
      setErrorMessage('Koneksi Supabase belum siap. Silakan klik tombol pengaturan untuk mengisi URL dan Anon Key Anda.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.session) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      // Translate common error messages to Indonesian
      let msg = err.message || 'Terjadi kesalahan sistem';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Email atau kata sandi salah. Silakan periksa kembali.';
      } else if (msg.includes('Password should be')) {
        msg = 'Kata sandi harus minimal 6 karakter.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Email Anda belum dikonfirmasi. Silakan verifikasi email Anda terlebih dahulu.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-screen-container" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div id="auth-card" className="w-full max-w-md rounded-2xl border border-slate-150 bg-white p-8 shadow-xl relative overflow-hidden">
        
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -z-10 translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl -z-10 -translate-x-12 translate-y-12"></div>

        {/* Logo and title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-150 mb-3">
            <Activity className="h-7 w-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">tensi.ku</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">Asisten monitoring dan pencatat tensi darah harian mandiri</p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-150 text-rose-800 text-xs leading-relaxed flex gap-2.5 items-start">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs leading-relaxed flex gap-2.5 items-start">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kata Sandi</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-150 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span>Masuk Aplikasi</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Launch Buttons */}
        <div className="space-y-2.5 mt-6">
          <button
            onClick={onOpenSettings}
            className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-center"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>Atur Sambungan Supabase</span>
          </button>
        </div>

      </div>
    </div>
  );
}
