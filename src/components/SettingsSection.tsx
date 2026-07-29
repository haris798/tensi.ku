import { useRef, FormEvent, ChangeEvent } from "react";
import { User, Download, Upload, Activity, Save } from "lucide-react";
import { UserProfile } from "../types";

interface SettingsSectionProps {
  profile: UserProfile;
  profileNameInput: string;
  targetWeightInput: string;
  heightInput: string;
  onProfileNameChange: (value: string) => void;
  onTargetWeightChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onUpdateProfile: (e: FormEvent) => void;
  onExportData: () => void;
  onImportCSV: (file: File) => void;
}

export default function SettingsSection({
  profile: _profile,
  profileNameInput,
  targetWeightInput,
  heightInput,
  onProfileNameChange,
  onTargetWeightChange,
  onHeightChange,
  onUpdateProfile,
  onExportData,
  onImportCSV,
}: SettingsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <form onSubmit={onUpdateProfile} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Profil Pengguna
              </h3>
            </div>
            <button
              type="submit"
              title="Simpan Profil"
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              <Save className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              placeholder="Nama Anda"
              value={profileNameInput}
              onChange={(e) => onProfileNameChange(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                Target Berat (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="75"
                value={targetWeightInput}
                onChange={(e) => onTargetWeightChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-mono outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                Tinggi Badan (cm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="172"
                value={heightInput}
                onChange={(e) => onHeightChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-mono outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Data Management Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Manajemen Data
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Ekspor atau impor data kesehatan Anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onExportData}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Ekspor JSON</span>
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4 text-indigo-500 shrink-0" />
            <span>Impor CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
