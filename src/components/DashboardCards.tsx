import { useMemo } from "react";
import { BloodPressureLog, WeightLog, UserProfile } from "../types";
import {
  getBPCategoryDetails,
  getPulseDetails,
  getWeightChange,
  getBmiData,
  getWeightProgress,
  getWeeklySummary,
} from "../lib/helpers";
import { Activity, Heart, Scale, Calendar, TrendingUp, Printer } from "lucide-react";

interface DashboardCardsProps {
  bpLogs: BloodPressureLog[];
  weightLogs: WeightLog[];
  profile: UserProfile;
  onNavigateSettings: () => void;
  onOpenReportModal?: () => void;
}

export default function DashboardCards({
  bpLogs,
  weightLogs,
  profile,
  onNavigateSettings,
  onOpenReportModal,
}: DashboardCardsProps) {
  const latestBP = bpLogs.length > 0 ? bpLogs[bpLogs.length - 1] : undefined;
  const latestWeight =
    weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : undefined;

  const weightChange = useMemo(
    () => getWeightChange(weightLogs),
    [weightLogs]
  );
  const bmiData = useMemo(
    () => getBmiData(latestWeight, profile),
    [latestWeight, profile]
  );
  const weightProgress = useMemo(
    () => getWeightProgress(weightLogs, profile),
    [weightLogs, profile]
  );
  const weeklySummary = useMemo(
    () => getWeeklySummary(bpLogs, weightLogs),
    [bpLogs, weightLogs]
  );

  return (
    <section
      id="health-cards-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in"
    >
      {/* BP Latest Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">
              Tensi Darah Terakhir
            </span>
            <Heart className="h-5.5 w-5.5 text-rose-500 fill-rose-50 dark:fill-rose-950/20" />
          </div>
          {latestBP ? (
            <BPLatestContent bp={latestBP} />
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                Belum ada riwayat tensi
              </p>
            </div>
          )}
        </div>
        {latestBP && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono">
            <span>Terakhir Dicatat</span>
            <span>
              {new Date(latestBP.logged_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Pulse Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">
              Detak Nadi Terakhir
            </span>
            <Activity className="h-5.5 w-5.5 text-indigo-500" />
          </div>
          {latestBP ? (
            <PulseContent bp={latestBP} />
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                Belum ada data detak nadi
              </p>
            </div>
          )}
        </div>
        {latestBP && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono">
            <span>Terakhir Dicatat</span>
            <span>
              {new Date(latestBP.logged_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Weight Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">
              Berat Badan Terakhir
            </span>
            <Scale className="h-5.5 w-5.5 text-amber-500" />
          </div>
          {latestWeight ? (
            <WeightContent
              latestWeight={latestWeight}
              weightChange={weightChange}
              weightProgress={weightProgress}
              bmiData={bmiData}
              profile={profile}
              onNavigateSettings={onNavigateSettings}
            />
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                Belum ada riwayat berat badan
              </p>
            </div>
          )}
        </div>
        {latestWeight && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono">
            <span>Terakhir Dicatat</span>
            <span>
              {new Date(latestWeight.logged_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Weekly Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">
              Rata-Rata 7 Hari Terakhir
            </span>
            <Calendar className="h-5.5 w-5.5 text-indigo-500 dark:text-indigo-400" />
          </div>
          {weeklySummary.bpCount > 0 || weeklySummary.weightCount > 0 ? (
            <WeeklySummaryContent weeklySummary={weeklySummary} />
          ) : (
            <div className="py-6">
              <p className="text-xs text-slate-400 italic">
                Belum ada data dalam 7 hari terakhir
              </p>
            </div>
          )}
        </div>

        {onOpenReportModal && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4">
            <button
              type="button"
              onClick={onOpenReportModal}
              className="w-full text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/80 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Laporan Dokter (PDF)</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Sub-components ─────────────────────────────────

function BPLatestContent({ bp }: { bp: BloodPressureLog }) {
  const evalBP = getBPCategoryDetails(bp.systolic, bp.diastolic);
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
          {bp.systolic} / {bp.diastolic}
        </span>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          mmHg
        </span>
      </div>
      <div className="mt-3">
        <span
          className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-md border ${evalBP.bg} ${evalBP.border} ${evalBP.text}`}
        >
          {evalBP.category}
        </span>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed italic">
          &ldquo;{evalBP.advice}&rdquo;
        </p>
      </div>
    </div>
  );
}

function PulseContent({ bp }: { bp: BloodPressureLog }) {
  const pEval = getPulseDetails(bp.pulse);
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
          {bp.pulse}
        </span>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          bpm (Detak/Menit)
        </span>
      </div>
      <div className="mt-3">
        <span
          className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-md ${pEval.color}`}
        >
          Kondisi: {pEval.label}
        </span>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
          Detak jantung istirahat (RHR) yang normal berkisar antara 60 hingga
          100 detak per menit bagi orang dewasa sehat.
        </p>
      </div>
    </div>
  );
}

function WeightContent({
  latestWeight,
  weightChange,
  weightProgress,
  bmiData,
  profile,
  onNavigateSettings,
}: {
  latestWeight: WeightLog;
  weightChange: ReturnType<typeof getWeightChange>;
  weightProgress: ReturnType<typeof getWeightProgress>;
  bmiData: ReturnType<typeof getBmiData>;
  profile: UserProfile;
  onNavigateSettings: () => void;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
          {Number(latestWeight.weight).toFixed(1)}
        </span>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          kg
        </span>

        {weightChange && (
          <span
            className={`ml-2 inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
              weightChange.isLoss
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : weightChange.isGain
                ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:bg-white/10"
            }`}
          >
            <TrendingUp
              className={`h-3 w-3 ${
                weightChange.isLoss
                  ? "rotate-180 text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            />
            <span>
              {weightChange.isLoss ? "-" : "+"}
              {weightChange.value} kg
            </span>
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Melacak fluktuasi berat badan secara konsisten membantu memahami
          korelasi retensi cairan atau asupan nutrisi harian Anda terhadap
          tekanan darah.
        </p>
      </div>

      {weightProgress ? (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-semibold">
              Target: {weightProgress.target.toFixed(1)} kg
            </span>
            <span className="text-amber-500 dark:text-amber-400 font-extrabold">
              {weightProgress.percent}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${weightProgress.percent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {weightProgress.isCompleted
              ? "Target berat badan Anda telah tercapai! 🎉 Luar biasa!"
              : `${weightProgress.isLoss ? "Kurang" : "Butuh"} ${weightProgress.diff.toFixed(
                  1
                )} kg lagi menuju target.`}
          </p>
        </div>
      ) : (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
            Atur target berat badan di tab profil untuk melacak progres
            pencapaian Anda.
          </p>
        </div>
      )}

      {/* BMI */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            Body Mass Index (BMI)
          </span>
          {bmiData && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${bmiData.colorClass}`}
            >
              {bmiData.category}
            </span>
          )}
        </div>

        {bmiData ? (
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                {bmiData.value}
              </span>
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                skor BMI
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-normal">
              {bmiData.suggestion}
            </p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
              Tinggi: {profile?.height} cm
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1.5 leading-normal">
              Atur tinggi badan di tab profil untuk menghitung BMI secara
              otomatis.
            </p>
            <button
              type="button"
              onClick={onNavigateSettings}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
            >
              Atur Tinggi Badan Sekarang →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function WeeklySummaryContent({
  weeklySummary,
}: {
  weeklySummary: ReturnType<typeof getWeeklySummary>;
}) {
  return (
    <div className="space-y-4">
      {/* BP Average */}
      {weeklySummary.avgSystolic && weeklySummary.avgDiastolic ? (
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
            Tekanan Darah
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
              {Math.round(weeklySummary.avgSystolic)} /{" "}
              {Math.round(weeklySummary.avgDiastolic)}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              mmHg
            </span>
          </div>
          <BPCategoryBadge
            sys={Math.round(weeklySummary.avgSystolic)}
            dia={Math.round(weeklySummary.avgDiastolic)}
          />
        </div>
      ) : (
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
            Tekanan Darah
          </span>
          <p className="text-xs text-slate-400 italic">Belum ada rekaman tensi</p>
        </div>
      )}

      {/* Weight Average */}
      {weeklySummary.avgWeight ? (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
            Berat Badan
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
              {weeklySummary.avgWeight.toFixed(1)}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              kg
            </span>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
            Berat Badan
          </span>
          <p className="text-xs text-slate-400 italic">Belum ada rekaman berat</p>
        </div>
      )}
    </div>
  );
}

function BPCategoryBadge({ sys, dia }: { sys: number; dia: number }) {
  const evalBP = getBPCategoryDetails(sys, dia);
  return (
    <span
      className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md mt-1 border ${evalBP.bg} ${evalBP.border} ${evalBP.text}`}
    >
      {evalBP.category}
    </span>
  );
}
