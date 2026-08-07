export function getHealthTip(latestBP: any, latestWeight: any) {
  let tip = "Jaga pola makan seimbang, batasi garam, dan rutin berolahraga ringan 30 menit sehari.";
  let focus = "Gaya Hidup Sehat";

  if (latestBP) {
    const sys = Number(latestBP.systolic);
    const dia = Number(latestBP.diastolic);
    if (sys >= 140 || dia >= 90) {
      tip = "Tekanan darah Anda cenderung tinggi. Kurangi asupan garam/natrium, hindari makanan olahan, dan kelola stres.";
      focus = "Diet Rendah Garam";
    } else if (sys < 120 && dia < 80) {
      tip = "Tekanan darah Anda berada pada rentang optimal! Pertahankan pola makan sehat dan kecukupan cairan harian.";
      focus = "Optimal";
    } else {
      tip = "Tekanan darah dalam batas normal. Pertahankan konsumsi sayuran hijau dan aktivitas fisik teratur.";
      focus = "Pola Hidup Sehat";
    }
  } else if (latestWeight) {
    tip = "Pastikan minum air putih cukup (8 gelas/hari) dan utamakan makanan tinggi serat untuk menjaga berat badan.";
    focus = "Nutrisi";
  }

  return { tip, focus: `${focus} (Lokal)` };
}
