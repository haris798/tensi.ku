import { BloodPressureLog, WeightLog, UserProfile, BPCategory } from '../types';
import { classifyBP } from '../components/MonthlyTrendPieChart';

// ─── BP Category Details ────────────────────────────

export function getBPCategoryDetails(
  sys: number,
  dia: number
): {
  category: BPCategory;
  color: string;
  bg: string;
  border: string;
  text: string;
  advice: string;
} {
  const category = classifyBP(sys, dia);
  switch (category) {
    case "Optimal":
      return {
        category,
        color: "#059669",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-900/40",
        text: "text-emerald-800 dark:text-emerald-400",
        advice:
          "Tensi optimal yang sangat sehat. Pertahankan gaya hidup aktif dan pola makan bergizi seimbang!",
      };
    case "Normal":
      return {
        category,
        color: "#10b981",
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-emerald-100 dark:border-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-400",
        advice:
          "Tensi normal. Terus konsumsi makanan kaya serat, batasi garam tersembunyi, dan rutin berolahraga.",
      };
    case "Normal tinggi":
      return {
        category,
        color: "#fbbf24",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-900/40",
        text: "text-amber-800 dark:text-amber-400",
        advice:
          "Tensi normal tinggi. Mulai batasi asupan asin/junk food, perbanyak aktivitas fisik, dan pantau tensi harian.",
      };
    case "Hipertensi 1":
      return {
        category,
        color: "#f97316",
        bg: "bg-orange-50 dark:bg-orange-950/30",
        border: "border-orange-200 dark:border-orange-900/40",
        text: "text-orange-800 dark:text-orange-400",
        advice:
          "Hipertensi Derajat 1. Disarankan kurangi garam (maks 1 sendok teh/hari), tidur cukup, kelola stres, dan konsultasi ke medis.",
      };
    case "Hipertensi 2":
      return {
        category,
        color: "#ef4444",
        bg: "bg-rose-50 dark:bg-rose-950/30",
        border: "border-rose-200 dark:border-rose-900/40",
        text: "text-rose-800 dark:text-rose-400",
        advice:
          "Hipertensi Derajat 2. Hindari asupan asin, batasi kafein, lakukan olahraga teratur, dan segera diskusikan pengobatan dengan dokter.",
      };
    case "Hipertensi 3":
      return {
        category,
        color: "#991b1b",
        bg: "bg-red-100 dark:bg-red-950/40",
        border: "border-red-300 dark:border-red-900/40",
        text: "text-red-900 dark:text-red-300",
        advice:
          "⚠️ HIPERTENSI BERAT! Jika Anda mengalami pusing berat, nyeri dada, sesak napas, atau pandangan kabur, segera ke fasilitas kesehatan terdekat.",
      };
    case "Hipertensi sistolik terisolasi":
      return {
        category,
        color: "#8b5cf6",
        bg: "bg-indigo-50 dark:bg-indigo-950/30",
        border: "border-indigo-200 dark:border-indigo-900/40",
        text: "text-indigo-800 dark:text-indigo-400",
        advice:
          "Hipertensi Sistolik Terisolasi (Sistolik tinggi, Diastolik normal). Fokus kelola stres, jaga kelenturan pembuluh darah dengan olahraga aerobik ringan.",
      };
  }
}

// ─── Pulse Evaluation ───────────────────────────────

export function getPulseDetails(bpm: number) {
  if (bpm < 60) {
    return {
      label: "Lambat (Bradikardia)",
      color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30",
    };
  }
  if (bpm > 100) {
    return {
      label: "Cepat (Takikardia)",
      color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30",
    };
  }
  return {
    label: "Normal (Rileks)",
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
  };
}

// ─── Weight Change ──────────────────────────────────

export function getWeightChange(weightLogs: WeightLog[]) {
  if (weightLogs.length < 2) return null;
  const prev = Number(weightLogs[weightLogs.length - 2].weight);
  const curr = Number(weightLogs[weightLogs.length - 1].weight);
  const diff = curr - prev;
  return {
    value: Math.abs(diff).toFixed(1),
    isLoss: diff < 0,
    isGain: diff > 0,
    diff,
  };
}

// ─── BMI Calculation ────────────────────────────────

export function getBmiData(latestWeight: WeightLog | undefined, profile: UserProfile | null) {
  if (!latestWeight || !profile?.height) return null;
  const weight = Number(latestWeight.weight);
  const heightInCm = Number(profile.height);
  if (heightInCm <= 0) return null;

  const heightInM = heightInCm / 100;
  const bmi = weight / (heightInM * heightInM);

  let category = "";
  let colorClass = "";
  let suggestion = "";

  if (bmi < 18.5) {
    category = "Kurus (Underweight)";
    colorClass = "bg-sky-500/15 text-sky-300 border-sky-500/20";
    suggestion = "Disarankan menambah kalori & protein sehat.";
  } else if (bmi < 23.0) {
    category = "Normal (Ideal)";
    colorClass = "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
    suggestion = "Bagus! Pertahankan pola hidup sehat Anda.";
  } else if (bmi < 25.0) {
    category = "Berisiko (Overweight)";
    colorClass = "bg-amber-500/15 text-amber-300 border-amber-500/20";
    suggestion = "Atur porsi makan & kurangi asupan manis.";
  } else if (bmi < 30.0) {
    category = "Obesitas Kelas 1";
    colorClass = "bg-orange-500/15 text-orange-300 border-orange-500/20";
    suggestion = "Perbanyak aktivitas fisik & kurangi lemak.";
  } else {
    category = "Obesitas Kelas 2";
    colorClass = "bg-rose-500/15 text-rose-300 border-rose-500/20";
    suggestion = "Disarankan konsultasi diet terarah.";
  }

  return { value: bmi.toFixed(1), category, colorClass, suggestion };
}

// ─── Weight Progress ────────────────────────────────

export function getWeightProgress(weightLogs: WeightLog[], profile: UserProfile | null) {
  if (!profile?.target_weight) return null;
  const target = Number(profile.target_weight);
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;
  const current = latestWeight ? Number(latestWeight.weight) : 0;
  if (!current) return null;

  const start = weightLogs.length > 0 ? Number(weightLogs[0].weight) : current;
  const diff = current - target;

  let percent = 0;
  if (Math.abs(start - target) < 0.01) {
    percent = current === target ? 100 : 0;
  } else if (start > target) {
    if (current <= target) percent = 100;
    else if (current >= start) percent = 0;
    else percent = Math.round(((start - current) / (start - target)) * 100);
  } else {
    if (current >= target) percent = 100;
    else if (current <= start) percent = 0;
    else percent = Math.round(((current - start) / (target - start)) * 100);
  }

  return {
    percent: Math.min(100, Math.max(0, percent)),
    target,
    current,
    diff: Math.abs(diff),
    isCompleted:
      current === target ||
      (start > target ? current <= target : current >= target),
    isLoss: start > target,
  };
}

// ─── Weekly Summary ─────────────────────────────────

export function getWeeklySummary(bpLogs: BloodPressureLog[], weightLogs: WeightLog[]) {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const bpLogsLast7Days = bpLogs.filter((log) => {
    const logDate = new Date(log.logged_at);
    return logDate >= sevenDaysAgo;
  });

  const weightLogsLast7Days = weightLogs.filter((log) => {
    const logDate = new Date(log.logged_at);
    return logDate >= sevenDaysAgo;
  });

  const avgSystolic =
    bpLogsLast7Days.length > 0
      ? bpLogsLast7Days.reduce((sum, log) => sum + Number(log.systolic), 0) /
        bpLogsLast7Days.length
      : null;

  const avgDiastolic =
    bpLogsLast7Days.length > 0
      ? bpLogsLast7Days.reduce((sum, log) => sum + Number(log.diastolic), 0) /
        bpLogsLast7Days.length
      : null;

  const avgWeight =
    weightLogsLast7Days.length > 0
      ? weightLogsLast7Days.reduce(
          (sum, log) => sum + Number(log.weight),
          0
        ) / weightLogsLast7Days.length
      : null;

  return {
    avgSystolic,
    avgDiastolic,
    avgWeight,
    bpCount: bpLogsLast7Days.length,
    weightCount: weightLogsLast7Days.length,
  };
}

// ─── Local Health Tips Generator ────────────────────

export function generateLocalTip(
  bp: BloodPressureLog | undefined,
  weight: WeightLog | undefined
): { tip: string; focus: string } {
  if (bp) {
    const sys = Number(bp.systolic);
    const dia = Number(bp.diastolic);
    const category = classifyBP(sys, dia);

    if (category === "Hipertensi 3") {
      return {
        tip: "Kurangi konsumsi natrium dengan sangat ketat dan istirahat total harian. Jika Anda mengalami pusing hebat, sesak napas, atau nyeri dada, segera hubungi layanan medis darurat.",
        focus: "Peringatan Medis",
      };
    }
    if (category === "Hipertensi 2") {
      return {
        tip: "Cobalah latihan pernapasan dalam (4-7-8) untuk menenangkan sistem saraf dan batasi asupan garam/kecap maksimal 1 sendok teh sehari.",
        focus: "Kelola Stres & Diet",
      };
    }
    if (category === "Hipertensi 1") {
      const tips = [
        {
          tip: "Mulailah berjalan kaki santai selama 30 menit setiap hari. Aktivitas aerobik ringan sangat membantu melatih otot jantung dan menurunkan tekanan darah harian secara stabil.",
          focus: "Aktivitas Fisik",
        },
        {
          tip: "Tingkatkan konsumsi makanan tinggi kalium seperti pisang, alpukat, dan sayuran hijau untuk membantu tubuh membuang kelebihan natrium melalui urine.",
          focus: "Nutrisi",
        },
        {
          tip: "Hindari minuman bersoda, kafein berlebih, dan usahakan tidur malam yang nyenyak minimal 7-8 jam guna menjaga kestabilan hormon tekanan darah.",
          focus: "Gaya Hidup",
        },
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
    if (category === "Hipertensi sistolik terisolasi") {
      const tips = [
        {
          tip: "Tekanan sistolik Anda cukup tinggi meskipun diastolik normal. Fokuslah mengurangi stres, membatasi garam, dan perbanyak buah serta sayur segar.",
          focus: "Gaya Hidup & Diet",
        },
        {
          tip: "Sistolik terisolasi membutuhkan pemantauan berkala. Usahakan berjalan santai atau bersepeda statis 20-30 menit secara rutin guna menjaga kelenturan pembuluh darah.",
          focus: "Aktivitas Fisik",
        },
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
    if (category === "Normal tinggi") {
      const tips = [
        {
          tip: "Batasi konsumsi junk food dan makanan kaleng yang sarat akan garam tersembunyi. Memilih masakan rumahan segar adalah langkah terbaik menjaga tensi harian tetap stabil.",
          focus: "Nutrisi",
        },
        {
          tip: "Minum air putih minimal 2 liter sehari untuk memastikan tubuh terhidrasi dengan baik, yang berdampak positif pada kekentalan darah dan tekanan sirkulasi tubuh.",
          focus: "Hidrasi",
        },
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
    if (category === "Normal" || category === "Optimal") {
      const tips = [
        {
          tip: "Tensi Anda sangat luar biasa! Pertahankan pola makan seimbang kaya serat dan rutinitas olahraga mingguan Anda demi menjaga elastisitas pembuluh darah jangka panjang.",
          focus: "Pemeliharaan",
        },
        {
          tip: "Kunci tubuh sehat adalah konsistensi. Terus pantau tensi Anda secara berkala seminggu sekali di pagi hari setelah bangun tidur untuk melacak tren kesehatan mandiri.",
          focus: "Monitoring",
        },
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
  }

  if (weight) {
    const tips = [
      {
        tip: "Konsumsi buah segar atau segelas air sebelum makan besar dapat membantu Anda merasa lebih kenyang dan mengontrol porsi makan harian dengan lebih bijak.",
        focus: "Nutrisi",
      },
      {
        tip: "Kombinasikan olahraga kardio ringan dengan latihan kekuatan otot sederhana seperti squat atau push-up di rumah guna mengoptimalkan metabolisme pembakaran lemak.",
        focus: "Aktivitas Fisik",
      },
      {
        tip: "Pastikan Anda mendapatkan istirahat cukup, karena kurang tidur dapat meningkatkan hormon ghrelin yang memicu nafsu makan berlebih dan menaikkan berat badan.",
        focus: "Gaya Hidup",
      },
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  return {
    tip: "Mulailah dengan mencatat tensi darah dan berat badan harian secara rutin untuk mendapatkan tips kesehatan yang dirancang khusus sesuai kondisi tubuh unik Anda.",
    focus: "Tips Umum",
  };
}
