# 🩺 Tensi.ku

Tensi.ku adalah aplikasi pelacak kesehatan personal yang dirancang untuk membantu Anda memantau tekanan darah dan berat badan secara praktis. Dibangun dengan pendekatan *Offline-First*, aplikasi ini dapat digunakan 100% tanpa koneksi internet dan dapat disinkronkan ke *cloud* kapan pun Anda mau.

## ✨ Fitur Utama

- **Pencatatan Cepat & Mudah**: Catat tekanan darah (Sistolik/Diastolik), denyut nadi, dan berat badan Anda setiap hari.
- **Dukungan Offline 100%**: Menggunakan IndexedDB untuk menyimpan data dengan aman secara lokal di perangkat Anda.
- **Tips Kesehatan Personal (Lokal)**: Dapatkan saran gaya hidup dan gizi harian yang disesuaikan secara dinamis dengan hasil ukuran tekanan darah dan berat badan terakhir, tanpa memerlukan API eksternal.
- **Grafik Interaktif**: Analisis tren kesehatan Anda dalam rentang waktu bulanan maupun tahunan dengan grafik *Line* dan *Pie Chart* interaktif.
- **Ekspor Laporan Dokter (PDF)**: Cetak atau unduh riwayat kesehatan Anda dalam format PDF berdesain rapi, sangat berguna saat jadwal konsultasi dokter.
- **Integrasi Cloud (Supabase)**: Opsi untuk menghubungkan aplikasi dengan *database* Supabase pribadi Anda guna menyinkronkan data antar-perangkat.
- **Aplikasi Mobile & PWA**: Mendukung instalasi *Progressive Web App* (PWA) dari *browser* atau di-*build* menjadi aplikasi Android Native menggunakan Capacitor.

## 🛠️ Stack Teknologi

- **Frontend**: React 19, Vite, Tailwind CSS v4
- **UI & Ikon**: Lucide React, Motion (Framer Motion)
- **Data & Visualisasi**: Recharts, idb (IndexedDB)
- **Ekspor Dokumen**: html2canvas, jsPDF
- **Cloud/Backend**: Supabase
- **Mobile Environment**: Capacitor

## 🚀 Cara Menjalankan Proyek (Development)

Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) dan *package manager* pilihan Anda (NPM atau Bun).

1. **Kloning atau buka direktori proyek**:
   ```bash
   cd tensi.ku
   ```

2. **Instal dependensi**:
   ```bash
   npm install
   # atau
   bun install
   ```

3. **Jalankan *Development Server***:
   ```bash
   npm run dev
   # atau
   bun run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

## 📦 Membangun Aplikasi (Production)

### Build untuk Web (PWA)
```bash
npm run build
npm run start
```
File siap *deploy* (statis) akan dihasilkan di dalam folder `dist/`.

### Build untuk Android (Capacitor)
Proyek ini terintegrasi dengan GitHub Actions untuk CI/CD. Anda juga dapat mem-*build* APK secara lokal:
```bash
# 1. Build aset web terbaru
npm run build

# 2. Sinkronkan dengan Capacitor
npx cap sync android

# 3. Buka di Android Studio atau build via Gradle
cd android && ./gradlew assembleDebug
```
File APK akan berada di `android/app/build/outputs/apk/debug/`.

## 🔒 Privasi dan Keamanan
Karena mengusung arsitektur *Offline-First*, data medis yang Anda masukkan sepenuhnya tersimpan di memori perangkat Anda. Jika Anda mengaktifkan fitur sinkronisasi, data akan dikirim ke *database* Supabase dengan autentikasi privat (RLS).
