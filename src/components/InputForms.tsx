import { RefObject, FormEvent } from "react";
import { Heart, Scale, Activity } from "lucide-react";

interface InputFormsProps {
  // BP Form
  sysInput: string;
  diaInput: string;
  pulseInput: string;
  bpNotes: string;
  bpDate: string;
  sysRef: RefObject<HTMLInputElement | null>;
  diaRef: RefObject<HTMLInputElement | null>;
  pulseRef: RefObject<HTMLInputElement | null>;
  onSysChange: (value: string) => void;
  onDiaChange: (value: string) => void;
  onPulseChange: (value: string) => void;
  onBpNotesChange: (value: string) => void;
  onBpDateChange: (value: string) => void;
  onAddBp: (e: FormEvent) => void;

  // Weight Form
  weightInput: string;
  weightNotes: string;
  weightDate: string;
  onWeightInputChange: (value: string) => void;
  onWeightNotesChange: (value: string) => void;
  onWeightDateChange: (value: string) => void;
  onAddWeight: (e: FormEvent) => void;

  currentTab: "bp" | "weight";
  onTabChange: (tab: "bp" | "weight") => void;
}

export default function InputForms({
  sysInput,
  diaInput,
  pulseInput,
  bpNotes,
  bpDate,
  sysRef,
  diaRef,
  pulseRef,
  onSysChange,
  onDiaChange,
  onPulseChange,
  onBpNotesChange,
  onBpDateChange,
  onAddBp,
  weightInput,
  weightNotes,
  weightDate,
  onWeightInputChange,
  onWeightNotesChange,
  onWeightDateChange,
  onAddWeight,
  currentTab,
  onTabChange,
}: InputFormsProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Form Type Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-fit">
        <button
          type="button"
          onClick={() => onTabChange("bp")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            currentTab === "bp"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
        >
          <Heart className="h-4 w-4" />
          Tensi Darah
        </button>
        <button
          type="button"
          onClick={() => onTabChange("weight")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            currentTab === "weight"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
        >
          <Scale className="h-4 w-4" />
          Berat Badan
        </button>
      </div>

      {/* BP Form */}
      {currentTab === "bp" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Catat Tensi Darah
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Masukkan hasil pengukuran tensi Anda
                  </p>
                </div>
              </div>

          <form onSubmit={onAddBp} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                  Sistolik (SYS)
                </label>
                <input
                  ref={sysRef}
                  type="number"
                  placeholder="120"
                  value={sysInput}
                  onChange={(e) => onSysChange(e.target.value)}
                  required
                  min="60"
                  max="250"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm font-mono font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                  Diastolik (DIA)
                </label>
                <input
                  ref={diaRef}
                  type="number"
                  placeholder="80"
                  value={diaInput}
                  onChange={(e) => onDiaChange(e.target.value)}
                  required
                  min="30"
                  max="180"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm font-mono font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                  Nadi (Pulse)
                </label>
                <input
                  ref={pulseRef}
                  type="number"
                  placeholder="72"
                  value={pulseInput}
                  onChange={(e) => onPulseChange(e.target.value)}
                  required
                  min="30"
                  max="250"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm font-mono font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                Tanggal & Waktu
              </label>
              <input
                type="datetime-local"
                value={bpDate}
                onChange={(e) => onBpDateChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                Catatan (opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Setelah olahraga atau pagi hari"
                value={bpNotes}
                onChange={(e) => onBpNotesChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Heart className="h-4 w-4" />
              Simpan Catatan Tensi
            </button>
          </form>
        </div>
      )}

      {/* Weight Form */}
      {currentTab === "weight" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Catat Berat Badan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Rekam perkembangan berat badan Anda
              </p>
            </div>
          </div>

          <form onSubmit={onAddWeight} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                Berat Badan (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="72.5"
                value={weightInput}
                onChange={(e) => onWeightInputChange(e.target.value)}
                required
                min="20"
                max="300"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-mono font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                Tanggal & Waktu
              </label>
              <input
                type="datetime-local"
                value={weightDate}
                onChange={(e) => onWeightDateChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                Catatan (opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Timbang pagi hari"
                value={weightNotes}
                onChange={(e) => onWeightNotesChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-white shadow-lg hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Scale className="h-4 w-4" />
              Simpan Catatan Berat Badan
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
