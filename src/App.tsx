import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, getSavedCredentials, updateSupabaseClient, clearSavedCredentials, SUPABASE_SQL_SETUP } from './lib/supabase';
import { localDb } from './lib/localDb';
import { BloodPressureLog, WeightLog, UserProfile, BPCategory, AITipLog } from './types';
import { syncEngine } from './lib/syncEngine';
import { exportBPToCSV, exportWeightToCSV, parseCSV } from './lib/csvHelper';
import { classifyBP } from './components/MonthlyTrendPieChart';

// Icons
import {
  Activity,
  Heart,
  Scale,
  Plus,
  Trash2,
  Database,
  LogOut,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  Search,
  SlidersHorizontal,
  Info,
  ChevronDown,
  Download,
  Upload,
  User,
  TrendingUp,
  RefreshCw,
  LayoutDashboard,
  History,
  Settings,
  Copy,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

// Components
import BloodPressureChart from './components/BloodPressureChart';
import MonthlyTrendPieChart from './components/MonthlyTrendPieChart';
import WeightChart from './components/WeightChart';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import AuthScreen from './components/AuthScreen';

// Helper function to generate high-quality personalized health tips locally
const generateLocalTip = (bp: BloodPressureLog | undefined, weight: WeightLog | undefined): { tip: string; focus: string } => {
  if (bp) {
    const sys = Number(bp.systolic);
    const dia = Number(bp.diastolic);
    const category = classifyBP(sys, dia);
    
    if (category === 'Hipertensi 3') {
      return {
        tip: "Kurangi konsumsi natrium dengan sangat ketat dan istirahat total harian. Jika Anda mengalami pusing hebat, sesak napas, atau nyeri dada, segera hubungi layanan medis darurat.",
        focus: "Peringatan Medis"
      };
    } else if (category === 'Hipertensi 2') {
      return {
        tip: "Cobalah latihan pernapasan dalam (4-7-8) untuk menenangkan sistem saraf dan batasi asupan garam/kecap maksimal 1 sendok teh sehari.",
        focus: "Kelola Stres & Diet"
      };
    } else if (category === 'Hipertensi 1') {
      const tips = [
        { tip: "Mulailah berjalan kaki santai selama 30 menit setiap hari. Aktivitas aerobik ringan sangat membantu melatih otot jantung dan menurunkan tekanan darah harian secara stabil.", focus: "Aktivitas Fisik" },
        { tip: "Tingkatkan konsumsi makanan tinggi kalium seperti pisang, alpukat, dan sayuran hijau untuk membantu tubuh membuang kelebihan natrium melalui urine.", focus: "Nutrisi" },
        { tip: "Hindari minuman bersoda, kafein berlebih, dan usahakan tidur malam yang nyenyak minimal 7-8 jam guna menjaga kestabilan hormon tekanan darah.", focus: "Gaya Hidup" }
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    } else if (category === 'Hipertensi sistolik terisolasi') {
      const tips = [
        { tip: "Tekanan sistolik Anda cukup tinggi meskipun diastolik normal. Fokuslah mengurangi stres, membatasi garam, dan perbanyak buah serta sayur segar.", focus: "Gaya Hidup & Diet" },
        { tip: "Sistolik terisolasi membutuhkan pemantauan berkala. Usahakan berjalan santai atau bersepeda statis 20-30 menit secara rutin guna menjaga kelenturan pembuluh darah.", focus: "Aktivitas Fisik" }
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    } else if (category === 'Normal tinggi') {
      const tips = [
        { tip: "Batasi konsumsi junk food dan makanan kaleng yang sarat akan garam tersembunyi. Memilih masakan rumahan segar adalah langkah terbaik menjaga tensi harian tetap stabil.", focus: "Nutrisi" },
        { tip: "Minum air putih minimal 2 liter sehari untuk memastikan tubuh terhidrasi dengan baik, yang berdampak positif pada kekentalan darah dan tekanan sirkulasi tubuh.", focus: "Hidrasi" }
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    } else if (category === 'Normal' || category === 'Optimal') {
      const tips = [
        { tip: "Tensi Anda sangat luar biasa! Pertahankan pola makan seimbang kaya serat dan rutinitas olahraga mingguan Anda demi menjaga elastisitas pembuluh darah jangka panjang.", focus: "Pemeliharaan" },
        { tip: "Kunci tubuh sehat adalah konsistensi. Terus pantau tensi Anda secara berkala seminggu sekali di pagi hari setelah bangun tidur untuk melacak tren kesehatan mandiri.", focus: "Monitoring" }
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
  }

  if (weight) {
    const w = Number(weight.weight);
    const tips = [
      { tip: "Konsumsi buah segar atau segelas air sebelum makan besar dapat membantu Anda merasa lebih kenyang dan mengontrol porsi makan harian dengan lebih bijak.", focus: "Nutrisi" },
      { tip: "Kombinasikan olahraga kardio ringan dengan latihan kekuatan otot sederhana seperti squat atau push-up di rumah guna mengoptimalkan metabolisme pembakaran lemak.", focus: "Aktivitas Fisik" },
      { tip: "Pastikan Anda mendapatkan istirahat cukup, karena kurang tidur dapat meningkatkan hormon ghrelin yang memicu nafsu makan berlebih dan menaikkan berat badan.", focus: "Gaya Hidup" }
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  return {
    tip: "Mulailah dengan mencatat tensi darah dan berat badan harian secara rutin untuk mendapatkan tips kesehatan yang dirancang khusus sesuai kondisi tubuh unik Anda.",
    focus: "Tips Umum"
  };
};

export default function App() {
  // Load initial settings
  const [creds, setCreds] = useState(getSavedCredentials());
  const [isDemo, setIsDemo] = useState(false);

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const lastUserId = localStorage.getItem('bp_last_user_id');
    return lastUserId ? syncEngine.getCachedProfile(lastUserId) : null;
  });
  const [bpLogs, setBpLogs] = useState<BloodPressureLog[]>(() => {
    const lastUserId = localStorage.getItem('bp_last_user_id');
    return lastUserId ? syncEngine.getCachedBP(lastUserId) : [];
  });
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => {
    const lastUserId = localStorage.getItem('bp_last_user_id');
    return lastUserId ? syncEngine.getCachedWeight(lastUserId) : [];
  });
  
  // UI Controls
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'dashboard' | 'input' | 'riwayat' | 'seting'>('dashboard');
  const [currentTab, setCurrentTab] = useState<'bp' | 'weight'>('bp');
  const [logFilter, setLogFilter] = useState<'all' | 'bp' | 'weight'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formTab, setFormTab] = useState<'bp' | 'weight'>('bp');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isDragging, setIsDragging] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Refs for blood pressure inputs auto-focusing
  const sysRef = useRef<HTMLInputElement>(null);
  const diaRef = useRef<HTMLInputElement>(null);
  const pulseRef = useRef<HTMLInputElement>(null);

  const handleSysChange = (value: string) => {
    setSysInput(value);
    if (value.length >= 3) {
      diaRef.current?.focus();
    }
  };

  const handleDiaChange = (value: string) => {
    setDiaInput(value);
    if (value.length >= 2) {
      pulseRef.current?.focus();
    }
  };

  // Forms state
  const [sysInput, setSysInput] = useState<string>('');
  const [diaInput, setDiaInput] = useState<string>('');
  const [pulseInput, setPulseInput] = useState<string>('');
  const [bpNotes, setBpNotes] = useState<string>('');
  const [bpDate, setBpDate] = useState<string>(() => {
    const now = new Date();
    // Format to yyyy-MM-ddThh:mm for datetime-local
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [weightInput, setWeightInput] = useState<string>('');
  const [weightNotes, setWeightNotes] = useState<string>('');
  const [weightDate, setWeightDate] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [profileNameInput, setProfileNameInput] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('bp_dark_mode') === 'true');

  // Health tips states
  const [aiTipsHistory, setAiTipsHistory] = useState<AITipLog[]>(() => localDb.getAITips());
  const healthTip = aiTipsHistory.length > 0 ? aiTipsHistory[0] : null;
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);
  const [tipError, setTipError] = useState<string | null>(null);

  const handleGenerateHealthTip = async (
    force: boolean = false, 
    currentBP?: BloodPressureLog, 
    currentWeight?: WeightLog
  ) => {
    const activeBP = currentBP !== undefined ? currentBP : bpLogs[bpLogs.length - 1];
    const activeWeight = currentWeight !== undefined ? currentWeight : weightLogs[weightLogs.length - 1];

    if (!activeBP && !activeWeight) {
      setTipError('Masukkan setidaknya satu rekam medis tensi atau berat badan untuk menghasilkan tips kesehatan.');
      return;
    }

    // Check if we already have a tip for today to avoid spamming
    const todayStr = new Date().toLocaleDateString();
    const hasTipToday = aiTipsHistory.some(t => new Date(t.created_at).toLocaleDateString() === todayStr);

    if (!force && hasTipToday) return;

    setIsGeneratingTip(true);
    setTipError(null);

    try {
      if (!navigator.onLine) {
        throw new Error('Tidak ada koneksi internet');
      }

      const response = await fetch('/api/gemini/health-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latestBP: activeBP ? {
            systolic: activeBP.systolic,
            diastolic: activeBP.diastolic,
            pulse: activeBP.pulse,
          } : null,
          latestWeight: activeWeight ? {
            weight: activeWeight.weight,
          } : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON format');
      }

      const data = await response.json();
      const newTip = localDb.saveAITip(data.tip, data.focus);
      setAiTipsHistory(localDb.getAITips());
    } catch (err: any) {
      console.warn('Gagal memuat tips AI online, menggunakan versi lokal:', err);
      // Fallback seamlessly to local smart rules generator
      const localTipData = generateLocalTip(activeBP, activeWeight);
      const newTip = localDb.saveAITip(localTipData.tip, `${localTipData.focus} (Lokal)`);
      setAiTipsHistory(localDb.getAITips());
    } finally {
      setIsGeneratingTip(false);
    }
  };

  // Trigger health tips auto-generation if not generated yet and logs are available
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString();
    const hasTipToday = aiTipsHistory.some(t => new Date(t.created_at).toLocaleDateString() === todayStr);

    if (!hasTipToday && !isGeneratingTip && (bpLogs.length > 0 || weightLogs.length > 0)) {
      handleGenerateHealthTip(false, bpLogs[bpLogs.length - 1], weightLogs[weightLogs.length - 1]);
    }
  }, [bpLogs, weightLogs, aiTipsHistory, isGeneratingTip]);

  // Sync dark mode class
  useEffect(() => {
    localStorage.setItem('bp_dark_mode', isDark ? 'true' : 'false');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle active session and auth changes when not in demo mode
  useEffect(() => {
    if (isDemo || !supabase) {
      setSession(null);
      setProfile(localDb.getProfile());
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        const userId = session.user.id;
        syncEngine.setLastUserId(userId);
        
        // Load local cache synchronously immediately
        const cachedProfile = syncEngine.getCachedProfile(userId);
        const cachedBP = syncEngine.getCachedBP(userId);
        const cachedWeight = syncEngine.getCachedWeight(userId);

        setProfile(cachedProfile);
        if (cachedProfile) {
          setProfileNameInput(cachedProfile.full_name || 'Pengguna');
          setTargetWeightInput(cachedProfile.target_weight ? String(cachedProfile.target_weight) : '');
          setHeightInput(cachedProfile.height ? String(cachedProfile.height) : '');
        }
        setBpLogs(cachedBP);
        setWeightLogs(cachedWeight);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        const userId = session.user.id;
        syncEngine.setLastUserId(userId);

        // Load local cache synchronously immediately
        const cachedProfile = syncEngine.getCachedProfile(userId);
        const cachedBP = syncEngine.getCachedBP(userId);
        const cachedWeight = syncEngine.getCachedWeight(userId);

        setProfile(cachedProfile);
        if (cachedProfile) {
          setProfileNameInput(cachedProfile.full_name || 'Pengguna');
          setTargetWeightInput(cachedProfile.target_weight ? String(cachedProfile.target_weight) : '');
          setHeightInput(cachedProfile.height ? String(cachedProfile.height) : '');
        }
        setBpLogs(cachedBP);
        setWeightLogs(cachedWeight);
      } else if (!session) {
        syncEngine.setLastUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemo, creds]);

  // Fetch data on session change or mode change
  useEffect(() => {
    fetchData();
  }, [session, isDemo]);

  // Sync online/offline statuses
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchData(); // Trigger full sync when coming online
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [session, isDemo]);

  const fetchData = async () => {
    setDatabaseError(null);

    try {
      if (isDemo) {
        // Load offline mock/local data
        const bp = localDb.getBPLogs();
        const wl = localDb.getWeightLogs();
        const prof = localDb.getProfile();
        
        setBpLogs(bp);
        setWeightLogs(wl);
        setProfile(prof);
        setProfileNameInput(prof.full_name);
        setTargetWeightInput(prof.target_weight ? String(prof.target_weight) : '');
        setHeightInput(prof.height ? String(prof.height) : '');
      } else {
        if (!session) {
          return;
        }

        const user = session.user;
        const userId = user.id;

        // Check if we have no cached data at all. If so, show initial load spinner
        const cachedBP = syncEngine.getCachedBP(userId);
        const cachedWeight = syncEngine.getCachedWeight(userId);
        if (cachedBP.length === 0 && cachedWeight.length === 0) {
          setIsLoading(true);
        }

        setIsSyncing(true);

        // 1. Process sync queue (push offline additions/deletions)
        await syncEngine.processQueue(userId);

        // 2. Fetch fresh data from Supabase and update local cache
        const fresh = await syncEngine.fetchAndCacheAll(userId);

        // 3. Update React states with fresh synced data
        setProfile(fresh.profile);
        if (fresh.profile) {
          setProfileNameInput(fresh.profile.full_name || 'Pengguna');
          setTargetWeightInput(fresh.profile.target_weight ? String(fresh.profile.target_weight) : '');
          setHeightInput(fresh.profile.height ? String(fresh.profile.height) : '');
        }
        setBpLogs(fresh.bp);
        setWeightLogs(fresh.weight);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      // Check if it's a network error. In local-first, network errors are handled gracefully.
      const isNetworkError = 
        !navigator.onLine || 
        err.message?.includes('Failed to fetch') || 
        err.message?.includes('NetworkError') || 
        err.message?.includes('network') ||
        err.status === 0;

      if (isNetworkError) {
        console.log('App running in offline/cached mode.');
        // Don't show blocking database errors for simple connection drops
      } else if (err.message && err.message.includes('relation') && err.message.includes('does not exist')) {
        setDatabaseError(
          'Tabel database belum dibuat di Supabase Anda. Silakan klik tombol "Pengaturan database" (ikon database) di kanan atas, salin kode SQL skema, dan jalankan di SQL Editor Supabase Anda!'
        );
      } else {
        setDatabaseError(err.message || 'Gagal memuat data dari Supabase.');
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileNameInput.trim()) return;

    const parsedTargetWeight = targetWeightInput.trim() ? parseFloat(targetWeightInput) : null;
    const parsedHeight = heightInput.trim() ? parseFloat(heightInput) : null;

    try {
      if (isDemo) {
        const updated = localDb.saveProfile(profileNameInput, parsedTargetWeight, parsedHeight);
        setProfile(updated);
        showSuccessAlert('Profil berhasil diperbarui!');
        setIsEditingProfile(false);
      } else {
        if (!session?.user) return;
        const userId = session.user.id;

        // 1. Update local cache immediately
        const updated = syncEngine.localUpdateProfile(userId, profileNameInput.trim(), parsedTargetWeight, parsedHeight);
        setProfile(updated);
        showSuccessAlert('Profil berhasil diperbarui secara lokal!');
        setIsEditingProfile(false);

        // 2. Trigger background sync
        syncEngine.processQueue(userId).then((res) => {
          if (res.success) {
            // Keep state updated in case of remote changes
            syncEngine.fetchAndCacheAll(userId).then(fresh => {
              setProfile(fresh.profile);
            }).catch(console.error);
          }
        });
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal memperbarui profil: ' + err.message);
    }
  };

  // Add Blood Pressure Log
  const handleAddBP = async (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(sysInput);
    const dia = parseInt(diaInput);
    const pulse = parseInt(pulseInput);

    if (isNaN(sys) || isNaN(dia) || isNaN(pulse)) {
      alert('Masukkan angka tensi dan nadi yang valid.');
      return;
    }

    try {
      if (isDemo) {
        localDb.saveBPLog(sys, dia, pulse, new Date(bpDate).toISOString(), bpNotes);
        setBpLogs(localDb.getBPLogs());
        showSuccessAlert('Catatan tensi berhasil ditambahkan secara lokal!');
      } else {
        if (!session?.user) return;
        const userId = session.user.id;

        // 1. Save locally FIRST (instant UI update)
        syncEngine.localAddBP(userId, sys, dia, pulse, new Date(bpDate).toISOString(), bpNotes);
        setBpLogs(syncEngine.getCachedBP(userId)); // Immediate update!
        showSuccessAlert('Catatan tensi berhasil ditambahkan secara lokal!');

        // 2. Trigger background sync
        syncEngine.processQueue(userId).then((res) => {
          if (res.success) {
            syncEngine.fetchAndCacheAll(userId).then(fresh => {
              setBpLogs(fresh.bp);
            }).catch(console.error);
          }
        });
      }

      // Reset input fields, notes, and refresh date
      setSysInput('');
      setDiaInput('');
      setPulseInput('');
      setBpNotes('');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setBpDate(now.toISOString().slice(0, 16));
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan catatan: ' + err.message);
    }
  };

  // Add Weight Log
  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightInput);

    if (isNaN(w) || w <= 0) {
      alert('Masukkan berat badan yang valid.');
      return;
    }

    try {
      if (isDemo) {
        localDb.saveWeightLog(w, new Date(weightDate).toISOString(), weightNotes);
        setWeightLogs(localDb.getWeightLogs());
        showSuccessAlert('Catatan berat badan ditambahkan secara lokal!');
      } else {
        if (!session?.user) return;
        const userId = session.user.id;

        // 1. Save locally FIRST (instant UI update)
        syncEngine.localAddWeight(userId, w, new Date(weightDate).toISOString(), weightNotes);
        setWeightLogs(syncEngine.getCachedWeight(userId)); // Immediate update!
        showSuccessAlert('Catatan berat badan berhasil ditambahkan secara lokal!');

        // 2. Trigger background sync
        syncEngine.processQueue(userId).then((res) => {
          if (res.success) {
            syncEngine.fetchAndCacheAll(userId).then(fresh => {
              setWeightLogs(fresh.weight);
            }).catch(console.error);
          }
        });
      }

      setWeightInput('');
      setWeightNotes('');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setWeightDate(now.toISOString().slice(0, 16));
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan berat badan: ' + err.message);
    }
  };

  // Delete Log
  const handleDeleteBP = async (id: string) => {
    try {
      if (isDemo) {
        localDb.deleteBPLog(id);
        setBpLogs(localDb.getBPLogs());
        showSuccessAlert('Catatan tensi lokal berhasil dihapus.');
      } else {
        if (!session?.user) return;
        const userId = session.user.id;

        // 1. Delete locally FIRST (instant UI update)
        syncEngine.localDeleteBP(userId, id);
        setBpLogs(syncEngine.getCachedBP(userId)); // Immediate update!
        showSuccessAlert('Catatan tensi berhasil dihapus secara lokal.');

        // 2. Trigger background sync
        syncEngine.processQueue(userId).then((res) => {
          if (res.success) {
            syncEngine.fetchAndCacheAll(userId).then(fresh => {
              setBpLogs(fresh.bp);
            }).catch(console.error);
          }
        });
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus catatan: ' + err.message);
    }
  };

  const handleDeleteWeight = async (id: string) => {
    try {
      if (isDemo) {
        localDb.deleteWeightLog(id);
        setWeightLogs(localDb.getWeightLogs());
        showSuccessAlert('Catatan berat badan lokal berhasil dihapus.');
      } else {
        if (!session?.user) return;
        const userId = session.user.id;

        // 1. Delete locally FIRST (instant UI update)
        syncEngine.localDeleteWeight(userId, id);
        setWeightLogs(syncEngine.getCachedWeight(userId)); // Immediate update!
        showSuccessAlert('Catatan berat badan berhasil dihapus secara lokal.');

        // 2. Trigger background sync
        syncEngine.processQueue(userId).then((res) => {
          if (res.success) {
            syncEngine.fetchAndCacheAll(userId).then(fresh => {
              setWeightLogs(fresh.weight);
            }).catch(console.error);
          }
        });
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus catatan: ' + err.message);
    }
  };

  // Handle configuration changes
  const handleSaveConfig = (url: string, key: string, useDemoMode: boolean) => {
    const activeClient = updateSupabaseClient(url, key);
    setCreds(getSavedCredentials());
    
    setIsDemo(false);
    localStorage.setItem('bp_is_demo', 'false');

    if (!activeClient) {
      alert('Kredensial tidak valid atau tidak lengkap. Silakan masukkan URL dan Key Supabase Anda dengan benar.');
    } else {
      showSuccessAlert('Konfigurasi sambungan berhasil diperbarui!');
    }
  };

  const handleResetConfig = () => {
    clearSavedCredentials();
    setCreds(getSavedCredentials());
    setIsDemo(false);
    localStorage.setItem('bp_is_demo', 'false');
    showSuccessAlert('Konfigurasi sambungan berhasil di-reset.');
  };

  const handleLogout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('Gagal keluar: ' + error.message);
      } else {
        setSession(null);
        showSuccessAlert('Berhasil keluar dari akun Supabase.');
      }
    }
  };

  const showSuccessAlert = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Helper values & statistics
  const latestBP = bpLogs[bpLogs.length - 1];
  const latestWeight = weightLogs[weightLogs.length - 1];

  // Weight change calculation
  const getWeightChange = () => {
    if (weightLogs.length < 2) return null;
    const prev = weightLogs[weightLogs.length - 2].weight;
    const curr = latestWeight.weight;
    const diff = curr - prev;
    return {
      value: Math.abs(diff).toFixed(1),
      isLoss: diff < 0,
      isGain: diff > 0,
      diff,
    };
  };
  const weightChange = getWeightChange();

  // BMI Calculation and status classification
  const getBmiData = () => {
    if (!latestWeight || !profile?.height) return null;
    const weight = Number(latestWeight.weight);
    const heightInCm = Number(profile.height);
    if (heightInCm <= 0) return null;

    const heightInM = heightInCm / 100;
    const bmi = weight / (heightInM * heightInM);
    
    let category = '';
    let colorClass = '';
    let suggestion = '';

    if (bmi < 18.5) {
      category = 'Kurus (Underweight)';
      colorClass = 'bg-sky-500/15 text-sky-300 border-sky-500/20';
      suggestion = 'Disarankan menambah kalori & protein sehat.';
    } else if (bmi < 23.0) {
      category = 'Normal (Ideal)';
      colorClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
      suggestion = 'Bagus! Pertahankan pola hidup sehat Anda.';
    } else if (bmi < 25.0) {
      category = 'Berisiko (Overweight)';
      colorClass = 'bg-amber-500/15 text-amber-300 border-amber-500/20';
      suggestion = 'Atur porsi makan & kurangi asupan manis.';
    } else if (bmi < 30.0) {
      category = 'Obesitas Kelas 1';
      colorClass = 'bg-orange-500/15 text-orange-300 border-orange-500/20';
      suggestion = 'Perbanyak aktivitas fisik & kurangi lemak.';
    } else {
      category = 'Obesitas Kelas 2';
      colorClass = 'bg-rose-500/15 text-rose-300 border-rose-500/20';
      suggestion = 'Disarankan konsultasi diet terarah.';
    }

    return {
      value: bmi.toFixed(1),
      category,
      colorClass,
      suggestion,
    };
  };
  const bmiData = getBmiData();

  // Weight progress toward target calculation
  const getWeightProgress = () => {
    if (!profile?.target_weight) return null;
    const target = Number(profile.target_weight);
    const current = latestWeight ? Number(latestWeight.weight) : 0;
    if (!current) return null;

    const start = weightLogs.length > 0 ? Number(weightLogs[0].weight) : current;
    const diff = current - target;

    let percent = 0;
    if (Math.abs(start - target) < 0.01) {
      percent = current === target ? 100 : 0;
    } else if (start > target) {
      // weight loss
      if (current <= target) percent = 100;
      else if (current >= start) percent = 0;
      else percent = Math.round(((start - current) / (start - target)) * 100);
    } else {
      // weight gain
      if (current >= target) percent = 100;
      else if (current <= start) percent = 0;
      else percent = Math.round(((current - start) / (target - start)) * 100);
    }

    return {
      percent: Math.min(100, Math.max(0, percent)),
      target,
      current,
      diff: Math.abs(diff),
      isCompleted: current === target || (start > target ? current <= target : current >= target),
      isLoss: start > target
    };
  };
  const weightProgress = getWeightProgress();

  // Weekly summary of the last 7 days
  const getWeeklySummary = () => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Filter logs in the last 7 days (inclusive of today)
    const bpLogsLast7Days = bpLogs.filter(log => {
      const logDate = new Date(log.logged_at);
      return logDate >= sevenDaysAgo;
    });

    const weightLogsLast7Days = weightLogs.filter(log => {
      const logDate = new Date(log.logged_at);
      return logDate >= sevenDaysAgo;
    });

    const avgSystolic = bpLogsLast7Days.length > 0
      ? bpLogsLast7Days.reduce((sum, log) => sum + Number(log.systolic), 0) / bpLogsLast7Days.length
      : null;

    const avgDiastolic = bpLogsLast7Days.length > 0
      ? bpLogsLast7Days.reduce((sum, log) => sum + Number(log.diastolic), 0) / bpLogsLast7Days.length
      : null;

    const avgWeight = weightLogsLast7Days.length > 0
      ? weightLogsLast7Days.reduce((sum, log) => sum + Number(log.weight), 0) / weightLogsLast7Days.length
      : null;

    return {
      avgSystolic,
      avgDiastolic,
      avgWeight,
      bpCount: bpLogsLast7Days.length,
      weightCount: weightLogsLast7Days.length
    };
  };
  const weeklySummary = getWeeklySummary();

  // BP Evaluation & Advice
  const getBPCategoryDetails = (sys: number, dia: number): {
    category: BPCategory;
    color: string;
    bg: string;
    border: string;
    text: string;
    advice: string;
  } => {
    const category = classifyBP(sys, dia);
    switch (category) {
      case 'Optimal':
        return {
          category,
          color: '#059669',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-900/40',
          text: 'text-emerald-800 dark:text-emerald-400',
          advice: 'Tensi optimal yang sangat sehat. Pertahankan gaya hidup aktif dan pola makan bergizi seimbang!',
        };
      case 'Normal':
        return {
          category,
          color: '#10b981',
          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
          border: 'border-emerald-100 dark:border-emerald-900/30',
          text: 'text-emerald-700 dark:text-emerald-400',
          advice: 'Tensi normal. Terus konsumsi makanan kaya serat, batasi garam tersembunyi, dan rutin berolahraga.',
        };
      case 'Normal tinggi':
        return {
          category,
          color: '#fbbf24',
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-900/40',
          text: 'text-amber-800 dark:text-amber-400',
          advice: 'Tensi normal tinggi. Mulai batasi asupan asin/junk food, perbanyak aktivitas fisik, dan pantau tensi harian.',
        };
      case 'Hipertensi 1':
        return {
          category,
          color: '#f97316',
          bg: 'bg-orange-50 dark:bg-orange-950/30',
          border: 'border-orange-200 dark:border-orange-900/40',
          text: 'text-orange-800 dark:text-orange-400',
          advice: 'Hipertensi Derajat 1. Disarankan kurangi garam (maks 1 sendok teh/hari), tidur cukup, kelola stres, dan konsultasi ke medis.',
        };
      case 'Hipertensi 2':
        return {
          category,
          color: '#ef4444',
          bg: 'bg-rose-50 dark:bg-rose-950/30',
          border: 'border-rose-200 dark:border-rose-900/40',
          text: 'text-rose-800 dark:text-rose-400',
          advice: 'Hipertensi Derajat 2. Hindari asupan asin, batasi kafein, lakukan olahraga teratur, dan segera diskusikan pengobatan dengan dokter.',
        };
      case 'Hipertensi 3':
        return {
          category,
          color: '#991b1b',
          bg: 'bg-red-100 dark:bg-red-950/40',
          border: 'border-red-300 dark:border-red-900/40',
          text: 'text-red-900 dark:text-red-300',
          advice: '⚠️ HIPERTENSI BERAT! Jika Anda mengalami pusing berat, nyeri dada, sesak napas, atau pandangan kabur, segera ke fasilitas kesehatan terdekat.',
        };
      case 'Hipertensi sistolik terisolasi':
        return {
          category,
          color: '#8b5cf6',
          bg: 'bg-indigo-50 dark:bg-indigo-950/30',
          border: 'border-indigo-200 dark:border-indigo-900/40',
          text: 'text-indigo-800 dark:text-indigo-400',
          advice: 'Hipertensi Sistolik Terisolasi (Sistolik tinggi, Diastolik normal). Fokus kelola stres, jaga kelenturan pembuluh darah dengan olahraga aerobik ringan.',
        };
    }
  };

  // Pulse Evaluation
  const getPulseDetails = (bpm: number) => {
    if (bpm < 60) {
      return { label: 'Lambat (Bradikardia)', color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30' };
    } else if (bpm > 100) {
      return { label: 'Cepat (Takikardia)', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30' };
    }
    return { label: 'Normal (Rileks)', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' };
  };

  // Data Export / Import for local mode
  const exportLocalData = () => {
    const dataStr = JSON.stringify({
      bp: localDb.getBPLogs(),
      weight: localDb.getWeightLogs(),
      profile: localDb.getProfile(),
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `riwayat_kesehatan_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        alert('File kosong atau gagal membaca file.');
        return;
      }

      const result = parseCSV(text);
      if (result.error) {
        alert(result.error);
        return;
      }

      const totalBp = result.bp.length;
      const totalWeight = result.weight.length;

      if (totalBp === 0 && totalWeight === 0) {
        alert('Tidak ada data rekam medis yang valid ditemukan dalam file CSV.');
        return;
      }

      if (confirm(`Apakah Anda yakin ingin mengimpor ${totalBp} catatan tensi dan ${totalWeight} catatan berat badan dari CSV?`)) {
        try {
          if (isDemo) {
            // Import locally
            result.bp.forEach(item => {
              localDb.saveBPLog(item.systolic, item.diastolic, item.pulse, item.logged_at, item.notes);
            });
            result.weight.forEach(item => {
              localDb.saveWeightLog(item.weight, item.logged_at, item.notes);
            });
            
            setBpLogs(localDb.getBPLogs());
            setWeightLogs(localDb.getWeightLogs());
            showSuccessAlert(`Berhasil mengimpor ${totalBp} rekam tensi & ${totalWeight} rekam berat badan secara lokal!`);
          } else {
            if (!session?.user) {
              alert('Harap login terlebih dahulu untuk menyimpan data di cloud.');
              return;
            }
            const userId = session.user.id;

            // Save to local cache & sync queue
            result.bp.forEach(item => {
              syncEngine.localAddBP(userId, item.systolic, item.diastolic, item.pulse, item.logged_at, item.notes);
            });
            result.weight.forEach(item => {
              syncEngine.localAddWeight(userId, item.weight, item.logged_at, item.notes);
            });

            // Update instant UI states
            setBpLogs(syncEngine.getCachedBP(userId));
            setWeightLogs(syncEngine.getCachedWeight(userId));

            showSuccessAlert(`Berhasil mengimpor ${totalBp} rekam tensi & ${totalWeight} rekam berat badan. Sinkronisasi latar belakang berjalan!`);

            // Trigger sync
            syncEngine.processQueue(userId).then((res) => {
              if (res.success) {
                syncEngine.fetchAndCacheAll(userId).then(fresh => {
                  setBpLogs(fresh.bp);
                  setWeightLogs(fresh.weight);
                }).catch(console.error);
              }
            });
          }
        } catch (err: any) {
          console.error('Gagal mengimpor CSV:', err);
          alert('Gagal mengimpor data CSV: ' + err.message);
        }
      }
    };
    reader.readAsText(file);
  };

  // Filter logs for the history list
  const filteredLogsList = () => {
    let combined: Array<{
      type: 'bp' | 'weight';
      id: string;
      date: Date;
      valText: string;
      notes: string;
      raw: any;
    }> = [];

    if (logFilter === 'all' || logFilter === 'bp') {
      bpLogs.forEach(log => {
        combined.push({
          type: 'bp',
          id: log.id,
          date: new Date(log.logged_at),
          valText: `${log.systolic}/${log.diastolic} mmHg (Nadi: ${log.pulse} bpm)`,
          notes: log.notes,
          raw: log
        });
      });
    }

    if (logFilter === 'all' || logFilter === 'weight') {
      weightLogs.forEach(log => {
        combined.push({
          type: 'weight',
          id: log.id,
          date: new Date(log.logged_at),
          valText: `${Number(log.weight).toFixed(1)} kg`,
          notes: log.notes,
          raw: log
        });
      });
    }

    // Sort chronologically descending
    combined.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(item => 
        item.notes.toLowerCase().includes(q) || 
        item.valText.toLowerCase().includes(q) ||
        item.date.toLocaleDateString().includes(q)
      );
    }

    return combined;
  };

  // If in Supabase Cloud mode AND session is null, render Auth Screen
  if (!isDemo && !session) {
    return (
      <>
        <AuthScreen 
          onSuccess={() => fetchData()} 
          onOpenSettings={() => setIsConfigOpen(true)} 
        />
        <SupabaseConfigModal 
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          url={creds.url}
          anonKey={creds.anonKey}
          isEnv={creds.isEnv}
          isDemo={isDemo}
          onSave={handleSaveConfig}
          onReset={handleResetConfig}
        />
      </>
    );
  }

  const logsToShow = filteredLogsList();

  return (
    <div id="main-app-container" className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-100 dark:selection:bg-indigo-950 selection:text-indigo-900 dark:selection:text-indigo-200 pb-16 transition-colors duration-200 animate-fade-in">
      
      {/* HEADER BAR */}
      <header id="header-bar" className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-700/80 dark:border-slate-800 bg-[#F8FAFC]/90 dark:bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none shrink-0">
              <Activity className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                tensi.ku
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Asisten monitoring</p>
            </div>
          </div>

          {/* User Profile & Database Status */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
            
            {/* Sync Mode Status Badge */}
            {isOffline ? (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border shadow-xs">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>Mode Offline (Tersimpan Lokal)</span>
              </div>
            ) : isSyncing ? (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border shadow-xs">
                <RefreshCw className="h-3 w-3 animate-spin text-indigo-500 dark:text-indigo-400" />
                <span>Menyinkronkan...</span>
              </div>
            ) : null}

            {/* TAB SWITCHER IN HEADER */}
            <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mr-2">
              <button
                type="button"
                onClick={() => setActiveMainTab('dashboard')}
                title="Dashboard: Tensi, Nadi, Berat"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  activeMainTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('input')}
                title="Input Data Baru"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  activeMainTab === 'input'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <Plus className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('riwayat')}
                title="Riwayat Pengukuran"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  activeMainTab === 'riwayat'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <History className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('seting')}
                title="Pengaturan & Profil"
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  activeMainTab === 'seting'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            {/* Config & Logout Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsConfigOpen(true)}
                title={!isOffline && !isSyncing ? "Tersinkronisasi (Atur Supabase)" : "Atur Sambungan Supabase"}
                className={`p-2 rounded-xl border transition-all active:scale-95 shadow-xs flex items-center justify-center ${
                  !isOffline && !isSyncing
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <Database className={`h-4 w-4 ${!isOffline && !isSyncing ? 'animate-pulse' : ''}`} />
              </button>

              <button
                onClick={() => setIsDark(!isDark)}
                title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 shadow-xs flex items-center justify-center"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
              </button>

            </div>
          </div>

        </div>
      </header>

      {/* GLOBAL NOTIFICATIONS */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2.5 animate-bounce">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {databaseError && (
        <div className="mx-4 sm:mx-6 mt-6 max-w-7xl lg:mx-auto">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm leading-relaxed flex gap-3 items-start">
            <AlertTriangle className="h-5.5 w-5.5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Masalah Database Terdeteksi</p>
              <p>{databaseError}</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT WRAPPER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* ROW 1: REAL-TIME HEALTH SCORE CARDS */}
        {activeMainTab === 'dashboard' && (
          <section id="health-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            
            {/* BP Latest Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider">Tensi Darah Terakhir</span>
                  <Heart className="h-5.5 w-5.5 text-rose-500 fill-rose-50 dark:fill-rose-950/20" />
                </div>
                {latestBP ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                        {latestBP.systolic} / {latestBP.diastolic}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400">mmHg</span>
                    </div>
                    
                    {/* Dynamic diagnosis badge */}
                    {(() => {
                      const evalBP = getBPCategoryDetails(latestBP.systolic, latestBP.diastolic);
                      return (
                        <div className="mt-3">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-md border ${evalBP.bg} ${evalBP.border} ${evalBP.text}`}>
                            {evalBP.category}
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-350 mt-2.5 leading-relaxed italic">
                            "{evalBP.advice}"
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 italic">Belum ada riwayat tensi</p>
                  </div>
                )}
              </div>
              {latestBP && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold font-mono">
                  <span>Terakhir Dicatat</span>
                  <span>{new Date(latestBP.logged_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>

            {/* Pulse Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider">Detak Nadi Terakhir</span>
                  <Activity className="h-5.5 w-5.5 text-indigo-500" />
                </div>
                {latestBP ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                        {latestBP.pulse}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400">bpm (Detak/Menit)</span>
                    </div>
                    
                    {/* Dynamic pulse details */}
                    {(() => {
                      const pEval = getPulseDetails(latestBP.pulse);
                      return (
                        <div className="mt-3">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-md ${pEval.color}`}>
                            Kondisi: {pEval.label}
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-350 mt-2.5 leading-relaxed">
                            Detak jantung istirahat (RHR) yang normal berkisar antara 60 hingga 100 detak per menit bagi orang dewasa sehat.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 italic">Belum ada data detak nadi</p>
                  </div>
                )}
              </div>
              {latestBP && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold font-mono">
                  <span>Terakhir Dicatat</span>
                  <span>{new Date(latestBP.logged_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>

            {/* Weight Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider">Berat Badan Terakhir</span>
                  <Scale className="h-5.5 w-5.5 text-amber-500" />
                </div>
                {latestWeight ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                        {Number(latestWeight.weight).toFixed(1)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400">kg</span>
                      
                      {/* Weight change badge */}
                      {weightChange && (
                        <span className={`ml-2 inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                          weightChange.isLoss 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' 
                            : weightChange.isGain 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:bg-white/10 dark:text-slate-300'
                        }`}>
                          <TrendingUp className={`h-3 w-3 ${weightChange.isLoss ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
                          <span>{weightChange.isLoss ? '-' : '+'}{weightChange.value} kg</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 leading-relaxed">
                        Melacak fluktuasi berat badan secara konsisten membantu memahami korelasi retensi cairan atau asupan nutrisi harian Anda terhadap tekanan darah.
                      </p>
                    </div>

                    {weightProgress ? (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300 font-semibold">Target: {weightProgress.target.toFixed(1)} kg</span>
                          <span className="text-amber-500 dark:text-amber-400 font-extrabold">{weightProgress.percent}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${weightProgress.percent}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {weightProgress.isCompleted 
                            ? 'Target berat badan Anda telah tercapai! 🎉 Luar biasa!' 
                            : `${weightProgress.isLoss ? 'Kurang' : 'Butuh'} ${weightProgress.diff.toFixed(1)} kg lagi menuju target.`
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                          Atur target berat badan di tab profil untuk melacak progres pencapaian Anda.
                        </p>
                      </div>
                    )}

                    {/* BMI Calculator Section */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5 text-emerald-500" />
                          Body Mass Index (BMI)
                        </span>
                        {bmiData && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${bmiData.colorClass}`}>
                            {bmiData.category}
                          </span>
                        )}
                      </div>

                      {bmiData ? (
                        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 dark:border-slate-850 rounded-xl p-2.5 space-y-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                              {bmiData.value}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">skor BMI</span>
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-normal">
                            {bmiData.suggestion}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            Tinggi: {profile?.height} cm
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 dark:border-slate-850 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1.5 leading-normal">
                            Atur tinggi badan di tab profil untuk menghitung BMI secara otomatis.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMainTab('seting');
                              setIsEditingProfile(true);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
                          >
                            Atur Tinggi Badan Sekarang →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 italic">Belum ada riwayat berat badan</p>
                  </div>
                )}
              </div>
              {latestWeight && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold font-mono">
                  <span>Terakhir Dicatat</span>
                  <span>{new Date(latestWeight.logged_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>

            {/* Weekly Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider">Rata-Rata 7 Hari Terakhir</span>
                  <Calendar className="h-5.5 w-5.5 text-indigo-500 dark:text-indigo-400" />
                </div>
                {weeklySummary.bpCount > 0 || weeklySummary.weightCount > 0 ? (
                  <div className="space-y-4">
                    {/* BP Average Section */}
                    {weeklySummary.avgSystolic && weeklySummary.avgDiastolic ? (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Tekanan Darah</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                            {Math.round(weeklySummary.avgSystolic)} / {Math.round(weeklySummary.avgDiastolic)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400">mmHg</span>
                        </div>
                        {(() => {
                          const evalBP = getBPCategoryDetails(Math.round(weeklySummary.avgSystolic), Math.round(weeklySummary.avgDiastolic));
                          return (
                            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md mt-1 border ${evalBP.bg} ${evalBP.border} ${evalBP.text}`}>
                              {evalBP.category}
                            </span>
                          );
                        })()}
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Tekanan Darah</span>
                        <p className="text-xs text-slate-400 italic">Belum ada rekaman tensi</p>
                      </div>
                    )}

                    {/* Weight Average Section */}
                    {weeklySummary.avgWeight ? (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Berat Badan</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                            {weeklySummary.avgWeight.toFixed(1)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400">kg</span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Berat Badan</span>
                        <p className="text-xs text-slate-400 italic">Belum ada rekaman berat</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 italic">Belum ada rekam medis dalam 7 hari terakhir.</p>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold font-mono">
                <span>Total Rekaman</span>
                <span>{weeklySummary.bpCount + weeklySummary.weightCount} Data</span>
              </div>
            </div>

          </section>
        )}

        {/* ROW 1.5: DAILY AI HEALTH TIPS */}
        {activeMainTab === 'dashboard' && (bpLogs.length > 0 || weightLogs.length > 0) && (
          <section id="ai-health-tips" className="mt-6 bg-gradient-to-r from-indigo-50/40 via-sky-50/40 to-white dark:from-indigo-950/10 dark:via-slate-900/40 dark:to-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 relative overflow-hidden animate-fade-in">
            {/* Ambient Background Glow */}
            <div className="absolute -right-16 -top-16 h-48 w-48 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 h-48 w-48 bg-sky-400/10 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-100 dark:shadow-none shrink-0">
                  <Sparkles className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-wider">
                      Tips Kesehatan Harian AI
                    </h3>
                    {healthTip?.focus && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30">
                        {healthTip.focus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Rekomendasi gaya hidup & gizi praktis yang dipersonalisasi dari asisten medis AI Anda harian
                  </p>

                  <div className="mt-4">
                    {isGeneratingTip ? (
                      <div className="flex items-center gap-3 py-1">
                        <div className="h-4.5 w-4.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 italic font-semibold animate-pulse">
                          Menganalisis rekam medis terakhir dan menyusun tips untuk Anda...
                        </span>
                      </div>
                    ) : tipError ? (
                      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/30 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                        <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Gagal memuat tips harian</p>
                          <p className="mt-0.5 leading-relaxed font-medium">{tipError}</p>
                          <p className="mt-1 text-[10px] opacity-80">
                            Silakan pastikan parameter kunci API Anda telah terkonfigurasi di menu <strong>Settings &gt; Secrets</strong>.
                          </p>
                        </div>
                      </div>
                    ) : healthTip ? (
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed max-w-3xl border-l-2 border-indigo-500 pl-3">
                        "{healthTip.tip}"
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Belum ada tips yang dimuat. Klik tombol segarkan untuk menghasilkan tips AI.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleGenerateHealthTip(true)}
                  disabled={isGeneratingTip}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-xs shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 text-indigo-500 ${isGeneratingTip ? 'animate-spin' : ''}`} />
                  <span>Segarkan Tips</span>
                </button>
              </div>
            </div>
          </section>
        )}
                {/* ROW 2: CHARTS SHOWN ONLY ON DASHBOARD */}
        {activeMainTab === 'dashboard' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Detailed Graph Representation (Col 8) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
              <div>
                {/* Section Header with Tabs */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      Grafik Tren Perkembangan Kesehatan
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Visualisasi perkembangan tensi darah dan berat badan Anda</p>
                  </div>

                  {/* Tabs Trigger */}
                  <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCurrentTab('bp')}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                        currentTab === 'bp'
                          ? 'bg-white text-indigo-600 shadow-md shadow-slate-100'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                      }`}
                    >
                      Grafik Tensi & Nadi
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('weight')}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                        currentTab === 'weight'
                          ? 'bg-white text-amber-600 shadow-md shadow-slate-100'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                      }`}
                    >
                      Grafik Berat Badan
                    </button>
                  </div>
                </div>

                {/* Render Active Chart */}
                <div className="mt-2 min-h-[320px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    {isLoading && bpLogs.length === 0 && weightLogs.length === 0 ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center h-[320px] flex-col gap-3"
                      >
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600"></div>
                        <p className="text-xs font-semibold text-slate-400">Sinkronisasi data pertama...</p>
                      </motion.div>
                    ) : currentTab === 'bp' ? (
                      <motion.div
                        key="bp"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <BloodPressureChart data={bpLogs} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="weight"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <WeightChart data={weightLogs} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Monthly Trend Pie Chart Card (Col 4) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Tren Kesehatan Bulanan</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Berdasarkan proporsi diagnosis tensi darah 30 hari terakhir</p>
                  </div>
                  <Activity className="h-5 w-5 text-indigo-500 shrink-0" />
                </div>
                
                <div className="mt-4 flex justify-center">
                  <MonthlyTrendPieChart data={bpLogs} />
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center gap-2 text-[10px] text-slate-400 leading-relaxed">
                <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>WHO mengklasifikasikan hipertensi ke dalam derajat 1 & 2 untuk memudahkan evaluasi bahaya kardiovaskular secara bertahap.</span>
              </div>
            </div>
          </section>
        )}

        {/* INPUT DATA TAB */}
        {activeMainTab === 'input' && (
          <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-300 transition-all duration-200">
              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  Catat Pengukuran Baru
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tambahkan rekaman tekanan darah, detak jantung, atau berat badan Anda secara teratur</p>
              </div>

              {/* Form Tab Toggles */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 mb-6 gap-2">
                <button
                  type="button"
                  onClick={() => setFormTab('bp')}
                  className={`flex-1 text-center py-2.5 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formTab === 'bp'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-750'
                  }`}
                >
                  <Heart className="h-3.5 w-3.5" />
                  <span>Catat Tensi & Nadi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('weight')}
                  className={`flex-1 text-center py-2.5 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formTab === 'weight'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-100'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-750'
                  }`}
                >
                  <Scale className="h-3.5 w-3.5" />
                  <span>Catat Berat Badan</span>
                </button>
              </div>

              {/* Form Tensi */}
              {formTab === 'bp' && (
                <form onSubmit={handleAddBP} className="space-y-4">
                  {/* Grid Inputs */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
                        Sistolik (SYS)
                      </label>
                      <div className="relative">
                        <input
                          ref={sysRef}
                          type="number"
                          min="50"
                          max="250"
                          placeholder="120"
                          value={sysInput}
                          onChange={(e) => handleSysChange(e.target.value)}
                          required
                          className="w-full text-center font-bold text-base bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-1 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 transition-all font-mono text-rose-600 placeholder:text-slate-300"
                        />
                        <span className="absolute bottom-1 right-0 left-0 text-[8px] font-bold text-slate-400 text-center pointer-events-none">mmHg</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
                        Diastolik (DIA)
                      </label>
                      <div className="relative">
                        <input
                          ref={diaRef}
                          type="number"
                          min="30"
                          max="180"
                          placeholder="80"
                          value={diaInput}
                          onChange={(e) => handleDiaChange(e.target.value)}
                          required
                          className="w-full text-center font-bold text-base bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-1 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 transition-all font-mono text-blue-600 placeholder:text-slate-300"
                        />
                        <span className="absolute bottom-1 right-0 left-0 text-[8px] font-bold text-slate-400 text-center pointer-events-none">mmHg</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
                        Detak Nadi
                      </label>
                      <div className="relative">
                        <input
                          ref={pulseRef}
                          type="number"
                          min="30"
                          max="220"
                          placeholder="72"
                          value={pulseInput}
                          onChange={(e) => setPulseInput(e.target.value)}
                          required
                          className="w-full text-center font-bold text-base bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-1 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 transition-all font-mono text-emerald-600 placeholder:text-slate-300"
                        />
                        <span className="absolute bottom-1 right-0 left-0 text-[8px] font-bold text-slate-400 text-center pointer-events-none">bpm</span>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time Picker */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Tanggal & Waktu Pengukuran
                    </label>
                    <input
                      type="datetime-local"
                      value={bpDate}
                      readOnly
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none bg-slate-100 dark:bg-slate-800 text-slate-400 dark:bg-slate-800 dark:border-slate-800 font-mono cursor-not-allowed select-none"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
                      Catatan Tambahan (Gejala / Aktivitas)
                    </label>
                    <textarea
                      placeholder="Contoh: setelah bangun tidur, merasa pusing, setelah minum kopi"
                      value={bpNotes}
                      onChange={(e) => setBpNotes(e.target.value)}
                      maxLength={150}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-xs outline-none bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 transition-all text-slate-600 dark:text-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Catat Tekanan Darah</span>
                  </button>
                </form>
              )}

              {/* Form Berat Badan */}
              {formTab === 'weight' && (
                <form onSubmit={handleAddWeight} className="space-y-4">
                  {/* Weight Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
                      Berat Badan Sekarang
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="20"
                        max="350"
                        placeholder="70.0"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 pl-4 pr-12 py-3 text-base font-extrabold text-amber-600 font-mono outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-amber-100/30 dark:focus:ring-amber-900/30 bg-slate-50 dark:bg-slate-900/50 transition-all placeholder:text-amber-200"
                      />
                      <span className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-400 font-mono">kg</span>
                    </div>
                  </div>

                  {/* Date & Time Picker */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Tanggal & Waktu Penimbangan
                    </label>
                    <input
                      type="datetime-local"
                      value={weightDate}
                      readOnly
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none bg-slate-100 dark:bg-slate-800 text-slate-400 dark:bg-slate-800 dark:border-slate-800 font-mono cursor-not-allowed select-none"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
                      Catatan (Contoh: pagi sebelum sarapan, malam sehabis makan)
                    </label>
                    <textarea
                      placeholder="Kondisi fisik saat menimbang..."
                      value={weightNotes}
                      onChange={(e) => setWeightNotes(e.target.value)}
                      maxLength={150}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-xs outline-none bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-4 focus:ring-amber-100/30 dark:focus:ring-amber-900/30 transition-all text-slate-600 dark:text-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-amber-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-amber-100 hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Catat Berat Badan</span>
                  </button>
                </form>
              )}

              {/* Elegant Bento info alert badge matching the design */}
              <div className="p-3 bg-indigo-50/75 rounded-2xl flex items-center gap-2.5 mt-4">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <p className="text-[10px] text-indigo-800 leading-normal font-semibold">
                  {isDemo ? "Mode Demo lokal aman, tidak memerlukan internet." : "Data tersinkronisasi aman via Supabase Cloud."}
                </p>
              </div>
            </div>
            
            {/* Database mode advice footer */}
            <div className="border-t border-slate-100 mt-5 pt-3.5 flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-wider">
              <span>Status Penyimpanan</span>
              <span>{isDemo ? 'Offline Terenkripsi Lokal' : 'Tersinkron di Awan'}</span>
            </div>
          </div>
        )}

        {/* RIWAYAT TAB */}
        {activeMainTab === 'riwayat' && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 animate-fade-in">
            
            {/* Header of Table */}
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5 mb-5 gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Daftar Riwayat Rekam Medis Mandiri
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lihat, cari, saring, dan hapus data riwayat rekam medis harian Anda</p>
              </div>

              {/* Filters and Utilities Area */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 md:flex-none min-w-[200px]">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari catatan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 dark:focus:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all font-medium"
                  />
                </div>

                {/* Type Filter */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLogFilter('all')}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      logFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md shadow-slate-150/40 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('bp')}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      logFilter === 'bp' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-md shadow-slate-150/40 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Tensi
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('weight')}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      logFilter === 'weight' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-md shadow-slate-150/40 dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Berat
                  </button>
                </div>

                {/* Local Backup Mode (Only in local mode) */}
                {isDemo && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exportLocalData}
                      title="Unduh Cadangan JSON Lokal"
                      className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Ekspor JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Apakah Anda ingin mereset basis data lokal Anda ke data default awal?')) {
                          localDb.resetAll();
                          setBpLogs(localDb.getBPLogs());
                          setWeightLogs(localDb.getWeightLogs());
                          setProfile(localDb.getProfile());
                          setProfileNameInput(localDb.getProfile().full_name);
                          showSuccessAlert('Database lokal berhasil di-reset.');
                        }
                      }}
                      title="Reset Database Lokal"
                      className="p-2 border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-xl text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Table list representation */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/80 dark:border-slate-800/80 rounded-2xl bg-white/50 dark:bg-slate-900/50">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 dark:border-slate-850 font-bold text-slate-500 dark:text-slate-400 tracking-wider text-[10px]">
                    <th className="px-5 py-3.5">Tanggal & Waktu</th>
                    <th className="px-5 py-3.5">Jenis Rekaman</th>
                    <th className="px-5 py-3.5">Hasil Pengukuran</th>
                    <th className="px-5 py-3.5">Kategori / Evaluasi</th>
                    <th className="px-5 py-3.5">Catatan Tambahan</th>
                    <th className="px-5 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {logsToShow.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-500 dark:text-slate-400 italic">
                        Tidak ditemukan riwayat rekam medis harian yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    logsToShow.map((item) => {
                      const localTimeStr = new Date(item.date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      });
                      const hourStr = new Date(item.date).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          {/* Date/Time */}
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-700 dark:text-slate-200">{localTimeStr}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold font-mono mt-0.5">{hourStr}</p>
                          </td>

                          {/* Type indicator */}
                          <td className="px-5 py-3.5">
                            {item.type === 'bp' ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-full text-[10px] border border-rose-100 dark:border-rose-900/30">
                                <Heart className="h-3 w-3 fill-rose-100 dark:fill-rose-950/40" /> Tensi Darah
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full text-[10px] border border-amber-100 dark:border-amber-900/30">
                                <Scale className="h-3 w-3" /> Berat Badan
                              </span>
                            )}
                          </td>

                          {/* Results */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {item.type === 'bp' && (() => {
                                const evalBP = getBPCategoryDetails(item.raw.systolic, item.raw.diastolic);
                                return (
                                  <span 
                                    className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm animate-pulse" 
                                    style={{ backgroundColor: evalBP.color }} 
                                    title={`Kategori: ${evalBP.category}`}
                                  />
                                );
                              })()}
                              <span className="font-mono font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                                {item.valText}
                              </span>
                            </div>
                          </td>

                          {/* Classification Evaluation */}
                          <td className="px-5 py-3.5">
                            {item.type === 'bp' ? (
                              (() => {
                                const evalBP = getBPCategoryDetails(item.raw.systolic, item.raw.diastolic);
                                return (
                                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full border ${evalBP.bg} ${evalBP.border || 'border-transparent'} ${evalBP.text}`}>
                                    <span className="h-2 w-2 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: evalBP.color }} />
                                    {evalBP.category}
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400 italic text-[10px]">Lacak Mandiri</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="px-5 py-3.5 max-w-[200px] truncate-3-lines">
                            {item.notes ? (
                              <p className="text-slate-600 dark:text-slate-300 dark:text-slate-350 font-medium italic">"{item.notes}"</p>
                            ) : (
                              <span className="text-slate-350 dark:text-slate-600 dark:text-slate-300 italic">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => {
                                if (item.type === 'bp') {
                                  handleDeleteBP(item.id);
                                } else {
                                  handleDeleteWeight(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-95 cursor-pointer"
                              title="Hapus rekaman medis ini"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Showing total indicator */}
            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold font-mono">
              <span>Total {logsToShow.length} Rekaman Tersedia</span>
              <span>Di-filter Berdasarkan Parameter Sensor</span>
            </div>

          </section>
        )}

        {/* SETING TAB */}
        {activeMainTab === 'seting' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left Column: Profile & Connection Setting (Col 7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Profile Config Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-300 transition-all duration-200">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-indigo-600" />
                  Profil Pengguna
                </h3>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                        Nama Lengkap Anda
                      </label>
                      <input
                        type="text"
                        value={profileNameInput}
                        onChange={(e) => setProfileNameInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 transition-all font-semibold text-slate-700 dark:text-slate-200"
                        placeholder="Nama Lengkap"
                        required
                        maxLength={30}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                        Tinggi Badan (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="50"
                        max="250"
                        value={heightInput}
                        onChange={(e) => setHeightInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 transition-all font-semibold text-slate-700 dark:text-slate-200"
                        placeholder="Contoh: 170"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                        Target Berat Badan Anda (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="20"
                        max="300"
                        value={targetWeightInput}
                        onChange={(e) => setTargetWeightInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 transition-all font-semibold text-slate-700 dark:text-slate-200"
                        placeholder="Contoh: 68.0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Simpan Profil & Target
                    </button>
                  </div>
                </form>
              </div>

              {/* Database Connection Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-300 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-600" />
                    Penyimpanan & Koneksi Supabase
                  </h3>
                  
                  {/* Status badge */}
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Cloud Aktif</span>
                  </span>
                </div>

                {/* Info block */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-400 text-xs leading-relaxed mb-5">
                  <p>
                    <strong>Tersambung ke Supabase Cloud.</strong> Data rekam medis Anda otomatis tersinkronisasi aman dan terenkripsi. Aturan Keamanan RLS (Row Level Security) aktif melindungi data pribadi Anda.
                  </p>
                </div>

                {/* Inline Config Form */}
                <div className="space-y-4">

                  {/* Supabase URL */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
                      Supabase Project URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-project.supabase.co"
                      value={creds.url}
                      disabled={isDemo}
                      onChange={(e) => {
                        const newUrl = e.target.value.trim();
                        setCreds(prev => ({ ...prev, url: newUrl }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 disabled:opacity-50 disabled:bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-200 transition-all"
                    />
                  </div>

                  {/* Supabase Anon Key */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">
                      Supabase Anon API Key
                    </label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={creds.anonKey}
                      disabled={isDemo}
                      onChange={(e) => {
                        const newKey = e.target.value.trim();
                        setCreds(prev => ({ ...prev, anonKey: newKey }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs outline-none bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30 dark:focus:ring-indigo-900/30 disabled:opacity-50 disabled:bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-200 transition-all"
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isDemo}
                      onClick={() => handleSaveConfig(creds.url, creds.anonKey, false)}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      Hubungkan ke Supabase Cloud
                    </button>
                    <button
                      type="button"
                      onClick={handleResetConfig}
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Reset Koneksi
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Schema SQL & Export Actions (Col 5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Backups & Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-300 transition-all duration-200">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-4">
                  <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
                  Tindakan Pencadangan & Reset
                </h3>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={exportLocalData}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-between active:scale-98 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-indigo-600" /> Ekspor Seluruh Data ke JSON
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Apakah Anda ingin mereset seluruh database lokal Anda ke data default awal?')) {
                        localDb.resetAll();
                        setBpLogs(localDb.getBPLogs());
                        setWeightLogs(localDb.getWeightLogs());
                        setProfile(localDb.getProfile());
                        setProfileNameInput(localDb.getProfile().full_name);
                        showSuccessAlert('Database lokal berhasil dibersihkan!');
                      }
                    }}
                    className="w-full p-3 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center justify-between active:scale-98 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-rose-500" /> Reset Semua Log Lokal
                    </span>
                    <span className="text-[10px] text-rose-400 font-mono">Reset</span>
                  </button>
                </div>
              </div>

              {/* CSV Import/Export Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-300 transition-all duration-200">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Ekspor & Impor Data (CSV)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-normal">
                  Ekspor data Anda ke format CSV standar untuk dianalisis di Excel atau Google Sheets, atau impor data dari file CSV yang sudah ada.
                </p>

                <div className="space-y-4">
                  {/* Export Sub-Section */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">Ekspor Riwayat</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => exportBPToCSV(bpLogs)}
                        className="p-3 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 active:scale-98 cursor-pointer text-center"
                      >
                        <Heart className="h-4 w-4 text-rose-500" />
                        <span>Ekspor Tensi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => exportWeightToCSV(weightLogs)}
                        className="p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 text-amber-700 hover:text-amber-800 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 active:scale-98 cursor-pointer text-center"
                      >
                        <Scale className="h-4 w-4 text-amber-500" />
                        <span>Ekspor Berat Badan</span>
                      </button>
                    </div>
                  </div>

                  {/* Import Sub-Section */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">Impor dari CSV</h4>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          if (file.name.endsWith('.csv')) {
                            handleImportCSVFile(file);
                          } else {
                            alert('Hanya mendukung file format .csv');
                          }
                        }
                      }}
                      onClick={() => document.getElementById('csv-file-input')?.click()}
                      className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-indigo-500 bg-indigo-50/40 text-indigo-700'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 hover:border-slate-300 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <input
                        id="csv-file-input"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImportCSVFile(file);
                          }
                        }}
                      />
                      <Upload className={`h-6 w-6 mb-2 ${isDragging ? 'text-indigo-600 animate-bounce' : 'text-slate-400'}`} />
                      <p className="text-xs font-bold">
                        Seret & letakkan file .csv di sini
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        atau klik untuk memilih file dari komputer Anda
                      </p>
                      <div className="mt-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] text-slate-400 text-left font-mono w-full">
                        <p className="font-bold mb-0.5 text-center">Format kolom didukung:</p>
                        <p>• Tensi: Tanggal, Sistolik, Diastolik, Nadi, Catatan</p>
                        <p>• Berat: Tanggal, Berat Badan, Catatan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Schema Setup Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-slate-300 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-indigo-600" />
                    Skema SQL Supabase
                  </h3>
                  
                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
                      showSuccessAlert('Skema SQL disalin!');
                    }}
                    className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold px-2.5 py-1 rounded-md hover:bg-indigo-100 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> Salin SQL
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-3">
                  Salin kode di bawah ini lalu jalankan di menu <strong>SQL Editor</strong> di dalam dasbor proyek Supabase Anda untuk membuat tabel otomatis dengan izin RLS yang aman:
                </p>

                <div className="relative">
                  <textarea
                    readOnly
                    value={SUPABASE_SQL_SETUP}
                    rows={6}
                    className="w-full rounded-xl bg-slate-900 text-slate-300 p-3 text-[10px] font-mono outline-none border border-slate-800 leading-normal scrollbar-thin select-all"
                  />
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Supabase Connection Setup Overlay Modal */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        url={creds.url}
        anonKey={creds.anonKey}
        isEnv={creds.isEnv}
        isDemo={isDemo}
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
      />

    </div>
  );
}
