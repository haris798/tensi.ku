import React, { useState, useRef } from "react";
import { Database, Lock, Save, X, Upload, Download } from "lucide-react";

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  anonKey: string;
  email?: string;
  password?: string;

  onSave: (url: string, key: string, email?: string, password?: string) => void;
  onReset: () => void;
}

export default function SupabaseConfigModal({
  isOpen,
  onClose,
  url,
  anonKey,
  email,
  password,
  onSave,
  onReset,
}: SupabaseConfigModalProps) {
  const [inputUrl, setInputUrl] = useState(url);
  const [inputKey, setInputKey] = useState(anonKey);
  const [inputEmail, setInputEmail] = useState(email || "");
  const [inputPassword, setInputPassword] = useState(password || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const config = {
      url: inputUrl,
      anonKey: inputKey,
      email: inputEmail,
      password: inputPassword,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const urlBlob = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = "supabase-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(urlBlob);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === "string") {
          const config = JSON.parse(result);
          if (config.url !== undefined) setInputUrl(config.url);
          if (config.anonKey !== undefined) setInputKey(config.anonKey);
          if (config.email !== undefined) setInputEmail(config.email);
          if (config.password !== undefined) setInputPassword(config.password);
          
          // Auto-save and close if URL and Key are present
          if (config.url && config.anonKey) {
            onSave(
              config.url.trim(), 
              config.anonKey.trim(), 
              (config.email || "").trim(), 
              (config.password || "").trim()
            );
            onClose();
          }
        }
      } catch (err) {
        alert("Gagal membaca file JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(inputUrl.trim(), inputKey.trim(), inputEmail.trim(), inputPassword.trim());
    onClose();
  };

  return (
    <div
      id="supabase-config-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <div
        id="supabase-config-modal-container"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl transition-all flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Pengaturan Supabase
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Impor Konfigurasi"
              className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-100 transition-all"
            >
              <Upload className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleExport}
              title="Ekspor Konfigurasi"
              className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-100 transition-all"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(inputUrl.trim(), inputKey.trim(), inputEmail.trim(), inputPassword.trim());
                onClose();
              }}
              title="Simpan Konfigurasi"
              className="flex items-center justify-center p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-xs"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Tutup"
              className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          <form onSubmit={handleSaveSubmit} className="space-y-4">
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all font-mono"
                />
                <span className="text-xs text-slate-400 mt-1 block flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Key Anon aman dipasang di sisi
                  browser karena database dilindungi kebijakan keamanan
                  Row-Level Security (RLS).
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all font-mono"
                />
              </div>

            </div>

            {(url || anonKey) && (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setInputUrl("");
                    setInputKey("");
                    setInputEmail("");
                    setInputPassword("");
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all"
                >
                  Reset Konfigurasi
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
