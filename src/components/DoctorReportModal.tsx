import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Printer,
  FileDown,
  Activity,
  Heart,
  Scale,
  Stethoscope,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BloodPressureLog, WeightLog, UserProfile, AITipLog } from '../types';
import { getBPCategoryDetails, getBmiData, getPulseDetails } from '../lib/helpers';

interface DoctorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bpLogs: BloodPressureLog[];
  weightLogs: WeightLog[];
  profile: UserProfile;
  healthTip?: AITipLog | null;
}

type TimeRangeOption = '7days' | '30days' | '90days' | 'all';

export const DoctorReportModal: React.FC<DoctorReportModalProps> = ({
  isOpen,
  onClose,
  bpLogs,
  weightLogs,
  profile,
  healthTip,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter & customization options
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('30days');
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [includeBP, setIncludeBP] = useState(true);
  const [includeWeight, setIncludeWeight] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeTip, setIncludeTip] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Date filtering logic
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date | null = new Date();

    if (timeRange === '7days') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30days') {
      cutoffDate.setDate(now.getDate() - 30);
    } else if (timeRange === '90days') {
      cutoffDate.setDate(now.getDate() - 90);
    } else {
      cutoffDate = null;
    }

    const filteredBP = cutoffDate
      ? bpLogs.filter((log) => new Date(log.logged_at) >= cutoffDate!)
      : [...bpLogs];

    const filteredWeight = cutoffDate
      ? weightLogs.filter((log) => new Date(log.logged_at) >= cutoffDate!)
      : [...weightLogs];

    // Sort ascending for chronological review
    filteredBP.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
    filteredWeight.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());

    return { filteredBP, filteredWeight, cutoffDate };
  }, [bpLogs, weightLogs, timeRange]);

  // Statistics calculation for the report
  const stats = useMemo(() => {
    const bpList = filteredData.filteredBP;
    const wList = filteredData.filteredWeight;

    if (bpList.length === 0 && wList.length === 0) return null;

    let sysSum = 0;
    let diaSum = 0;
    let pulseSum = 0;
    let sysMax = -Infinity;
    let sysMin = Infinity;
    let diaMax = -Infinity;
    let diaMin = Infinity;

    bpList.forEach((log) => {
      const sys = Number(log.systolic);
      const dia = Number(log.diastolic);
      const pulse = Number(log.pulse);

      sysSum += sys;
      diaSum += dia;
      pulseSum += pulse;

      if (sys > sysMax) sysMax = sys;
      if (sys < sysMin) sysMin = sys;
      if (dia > diaMax) diaMax = dia;
      if (dia < diaMin) diaMin = dia;
    });

    const avgSys = bpList.length ? Math.round(sysSum / bpList.length) : null;
    const avgDia = bpList.length ? Math.round(diaSum / bpList.length) : null;
    const avgPulse = bpList.length ? Math.round(pulseSum / bpList.length) : null;

    let weightSum = 0;
    let weightMin = Infinity;
    let weightMax = -Infinity;
    wList.forEach((log) => {
      const w = Number(log.weight);
      weightSum += w;
      if (w > weightMax) weightMax = w;
      if (w < weightMin) weightMin = w;
    });

    const avgWeight = wList.length ? Number((weightSum / wList.length).toFixed(1)) : null;
    const latestWeightLog = wList.length > 0 ? wList[wList.length - 1] : undefined;
    const bmiData = getBmiData(latestWeightLog, profile);

    return {
      avgSys,
      avgDia,
      avgPulse,
      sysMax: sysMax === -Infinity ? '-' : sysMax,
      sysMin: sysMin === Infinity ? '-' : sysMin,
      diaMax: diaMax === -Infinity ? '-' : diaMax,
      diaMin: diaMin === Infinity ? '-' : diaMin,
      avgWeight,
      weightMin: weightMin === Infinity ? '-' : weightMin,
      weightMax: weightMax === -Infinity ? '-' : weightMax,
      bmiData,
      bpCount: bpList.length,
      weightCount: wList.length,
    };
  }, [filteredData, profile]);

  if (!isOpen) return null;

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Export to PDF Action
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      setIsExportingPDF(true);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // High DPI rendering
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const patientCleanName = (profile.full_name || 'Pengguna').replace(/[^a-zA-Z0-9]/g, '_');
      const todayDateStr = new Date().toISOString().split('T')[0];
      pdf.save(`Laporan_Kesehatan_${patientCleanName}_${todayDateStr}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const formattedPrintDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '.');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
      {/* Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none">
        
        {/* MODAL HEADER (Hidden on print) */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-emerald-600 rounded-2xl text-white shadow-md">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Cetak Laporan Kesehatan Dokter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Buat laporan ringkasan rekam medis tensi & berat badan siap cetak/PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL BODY CONTROLS & PREVIEW */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 print:overflow-visible print:p-0">
          
          {/* CONTROLS BAR (Hidden on print) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-4 print:hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Info className="h-4 w-4 text-indigo-500" />
              <span>Opsi & Filter Laporan</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rentang Waktu */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Rentang Waktu
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}
                  className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="7days">7 Hari Terakhir</option>
                  <option value="30days">30 Hari Terakhir</option>
                  <option value="90days">3 Bulan Terakhir</option>
                  <option value="all">Semua Data Rekam</option>
                </select>
              </div>

              {/* Nama Dokter */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Nama Dokter / Klinik (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: dr. Budi Santoso, Sp.JP"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Nama Klinik */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Fasilitas Kesehatan / RS (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RS Medika Sejahtera"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Checkbox Section Toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Ringkasan Rata-rata</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBP}
                  onChange={(e) => setIncludeBP(e.target.checked)}
                  className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Rekam Tensi ({filteredData.filteredBP.length})</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWeight}
                  onChange={(e) => setIncludeWeight(e.target.checked)}
                  className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Rekam Berat Badan ({filteredData.filteredWeight.length})</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTip}
                  onChange={(e) => setIncludeTip(e.target.checked)}
                  className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Catatan AI Dokter</span>
              </label>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                Keluhan / Catatan Pasien Sebelum Konsultasi
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan keluhan atau gejala yang ingin didiskusikan dengan dokter..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* PRINTABLE REPORT SHEET PREVIEW */}
          <div
            ref={reportRef}
            id="printable-doctor-report"
            className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md space-y-6 font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:bg-white print:text-black"
          >
            {/* Header Banner */}
            <div className="border-b-2 border-indigo-600 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-black text-lg tracking-tight uppercase">
                  <Activity className="h-6 w-6 text-indigo-600 shrink-0" />
                  <span>LAPORAN REKAPITULASI KESEHATAN MANDIRI</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Aplikasi TensiKu &bull; Pemantauan Tekanan Darah & Berat Badan
                </p>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-600 font-medium">
                <p><strong className="text-slate-800">Tanggal Cetak:</strong> {formattedPrintDate}</p>
                {clinicName && <p><strong className="text-slate-800">Faskes:</strong> {clinicName}</p>}
                {doctorName && <p><strong className="text-slate-800">Dokter:</strong> {doctorName}</p>}
              </div>
            </div>

            {/* Patient Info Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Nama Pasien</span>
                <span className="font-extrabold text-slate-800 text-sm">{profile.full_name || 'Pengguna'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tinggi Badan</span>
                <span className="font-bold text-slate-800">{profile.height ? `${profile.height} cm` : '-'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Berat</span>
                <span className="font-bold text-slate-800">{profile.target_weight ? `${profile.target_weight} kg` : '-'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Periode Rekam</span>
                <span className="font-bold text-slate-800">
                  {timeRange === '7days' && '7 Hari Terakhir'}
                  {timeRange === '30days' && '30 Hari Terakhir'}
                  {timeRange === '90days' && '3 Bulan Terakhir'}
                  {timeRange === 'all' && 'Semua Data'}
                </span>
              </div>
            </div>

            {/* Patient Complaint / Note */}
            {doctorNotes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-bold text-amber-800 block mb-0.5">Catatan / Keluhan Pasien:</span>
                <p className="italic">{doctorNotes}</p>
              </div>
            )}

            {/* Summary Statistics Matrix */}
            {includeStats && stats && (
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span>Ringkasan Rata-rata &amp; Parameter Kesehatan</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Rata-rata Tensi</span>
                    <span className="text-base font-black text-indigo-900">
                      {stats.avgSys ? `${stats.avgSys}/${stats.avgDia}` : '-'} <span className="text-[10px] font-medium text-slate-500">mmHg</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Min: {stats.sysMin}/{stats.diaMin} &bull; Max: {stats.sysMax}/{stats.diaMax}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Rata-rata Nadi</span>
                    <span className="text-base font-black text-emerald-900">
                      {stats.avgPulse || '-'} <span className="text-[10px] font-medium text-slate-500">bpm</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {stats.avgPulse ? getPulseDetails(stats.avgPulse).label : '-'}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">Rata-rata Berat</span>
                    <span className="text-base font-black text-amber-900">
                      {stats.avgWeight || '-'} <span className="text-[10px] font-medium text-slate-500">kg</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Min: {stats.weightMin} &bull; Max: {stats.weightMax} kg
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">Indeks Massa Tubuh (BMI)</span>
                    <span className="text-base font-black text-purple-900">
                      {stats.bmiData ? stats.bmiData.value : '-'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                      {stats.bmiData ? stats.bmiData.category : 'Belum atur TB'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Health Tip Note */}
            {includeTip && healthTip && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Rekomendasi Analisis AI ({healthTip.focus}):</span>
                </div>
                <p className="text-slate-600 leading-relaxed italic">{healthTip.tip}</p>
              </div>
            )}

            {/* Blood Pressure Table */}
            {includeBP && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-indigo-600" />
                    <span>Tabel Rekam Tekanan Darah ({filteredData.filteredBP.length} Log)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">Sistolik / Diastolik (mmHg)</span>
                </div>

                {filteredData.filteredBP.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Tidak ada rekam tensi darah pada periode ini.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                          <th className="py-2 px-2 w-8">No</th>
                          <th className="py-2 px-2">Hari &amp; Tanggal</th>
                          <th className="py-2 px-2">Jam</th>
                          <th className="py-2 px-2">Tensi (mmHg)</th>
                          <th className="py-2 px-2">Nadi</th>
                          <th className="py-2 px-2">Kategori</th>
                          <th className="py-2 px-2">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredData.filteredBP.map((log, idx) => {
                          const d = new Date(log.logged_at);
                          const weekday = d.toLocaleDateString("id-ID", { weekday: "long" });
                          const day = String(d.getDate()).padStart(2, "0");
                          const month = String(d.getMonth() + 1).padStart(2, "0");
                          const year = d.getFullYear();
                          const dateStr = `${weekday}, ${day}.${month}.${year}`;
                          const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

                          const catInfo = getBPCategoryDetails(Number(log.systolic), Number(log.diastolic));

                          return (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="py-2 px-2 text-slate-400 font-medium text-[11px]">{idx + 1}</td>
                              <td className="py-2 px-2 font-semibold text-slate-800">{dateStr}</td>
                              <td className="py-2 px-2 text-slate-500 font-mono text-[11px]">{timeStr}</td>
                              <td className="py-2 px-2 font-black text-slate-900 font-mono">
                                {log.systolic}/{log.diastolic}
                              </td>
                              <td className="py-2 px-2 font-semibold text-slate-700 font-mono">{log.pulse}</td>
                              <td className="py-2 px-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}>
                                  {catInfo.category}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-slate-500 italic max-w-xs truncate">{log.notes || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Weight Table */}
            {includeWeight && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-emerald-600" />
                    <span>Tabel Rekam Berat Badan ({filteredData.filteredWeight.length} Log)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">Berat (kg)</span>
                </div>

                {filteredData.filteredWeight.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Tidak ada rekam berat badan pada periode ini.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                          <th className="py-2 px-2 w-8">No</th>
                          <th className="py-2 px-2">Hari &amp; Tanggal</th>
                          <th className="py-2 px-2">Jam</th>
                          <th className="py-2 px-2">Berat (kg)</th>
                          <th className="py-2 px-2">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredData.filteredWeight.map((log, idx) => {
                          const d = new Date(log.logged_at);
                          const weekday = d.toLocaleDateString("id-ID", { weekday: "long" });
                          const day = String(d.getDate()).padStart(2, "0");
                          const month = String(d.getMonth() + 1).padStart(2, "0");
                          const year = d.getFullYear();
                          const dateStr = `${weekday}, ${day}.${month}.${year}`;
                          const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

                          return (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="py-2 px-2 text-slate-400 font-medium text-[11px]">{idx + 1}</td>
                              <td className="py-2 px-2 font-semibold text-slate-800">{dateStr}</td>
                              <td className="py-2 px-2 text-slate-500 font-mono text-[11px]">{timeStr}</td>
                              <td className="py-2 px-2 font-black text-slate-900 font-mono">{log.weight} kg</td>
                              <td className="py-2 px-2 text-slate-500 italic max-w-xs truncate">{log.notes || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Doctor Signature & Observations Block */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
              <div className="border border-dashed border-slate-300 rounded-xl p-3 min-h-[90px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Catatan Evaluasi / Instruksi Dokter:
                </span>
              </div>

              <div className="flex flex-col justify-between items-end text-right space-y-12">
                <div>
                  <p className="text-slate-500 text-[11px]">Tanda Tangan &amp; Stempel Dokter</p>
                </div>
                <div className="border-t border-slate-400 pt-1 w-48 text-center">
                  <p className="font-bold text-slate-800">{doctorName || '( ............................................... )'}</p>
                  <p className="text-[10px] text-slate-400">SIP / No. Izin Praktik</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* MODAL FOOTER ACTIONS (Hidden on print) */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            💡 Pilih <strong>Cetak / Print</strong> untuk langsung ke printer/PDF browser, atau <strong>Unduh PDF</strong> untuk menyimpan berkas.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span>Unduh PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <span>Cetak / Print Laporan</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorReportModal;
