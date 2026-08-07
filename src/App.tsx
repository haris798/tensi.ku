import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import {
  getSupabase,
  getSavedCredentials,
  updateSupabaseClient,
  clearSavedCredentials,
  SUPABASE_SQL_SETUP,
} from "./lib/supabase";
import { localDb } from "./lib/localDb";
import {
  BloodPressureLog,
  WeightLog,
  UserProfile,
  AITipLog,
} from "./types";
import { syncEngine } from "./lib/syncEngine";
import { parseCSV } from "./lib/csvHelper";
import { generateLocalTip, getBPCategoryDetails } from "./lib/helpers";

// Icons
import {
  Activity,
  Plus,
  Trash2,
  Database,
  AlertTriangle,
  CheckCircle,
  Search,
  Download,
  TrendingUp,
  RefreshCw,
  LayoutDashboard,
  History,
  Settings,
  Sun,
  Moon,
  FileText,
  Copy,
  Sparkles,
  CloudDownload,
  Printer,
} from "lucide-react";

// Components
import DashboardCards from "./components/DashboardCards";
import InputForms from "./components/InputForms";
import SettingsSection from "./components/SettingsSection";
import { StatistikPanel } from "./components/StatistikPanel";
import BloodPressureChart from "./components/BloodPressureChart";
import MonthlyTrendPieChart from "./components/MonthlyTrendPieChart";
import WeightChart from "./components/WeightChart";
import SupabaseConfigModal from "./components/SupabaseConfigModal";
import DoctorReportModal from "./components/DoctorReportModal";

export default function App() {
  // ── State ────────────────────────────────────────────────
  const [creds, setCreds] = useState(getSavedCredentials());



  const [profile, setProfile] = useState<UserProfile>(() =>
    localDb.getProfile()
  );
  const [bpLogs, setBpLogs] = useState<BloodPressureLog[]>(() =>
    localDb.getBPLogs()
  );
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() =>
    localDb.getWeightLogs()
  );
  // UI Controls
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<
    "dashboard" | "statistik" | "input" | "riwayat" | "seting"
  >("dashboard");
  const [currentTab, setCurrentTab] = useState<"bp" | "weight">("bp");
  const [logFilter, setLogFilter] = useState<"all" | "bp" | "weight">("bp");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [trendPeriod, setTrendPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Refs for BP input auto-focus
  const sysRef = useRef<HTMLInputElement>(null);
  const diaRef = useRef<HTMLInputElement>(null);
  const pulseRef = useRef<HTMLInputElement>(null);

  // Form inputs
  const [sysInput, setSysInput] = useState("");
  const [diaInput, setDiaInput] = useState("");
  const [pulseInput, setPulseInput] = useState("");
  const [bpNotes, setBpNotes] = useState("");
  const [bpDate, setBpDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [weightInput, setWeightInput] = useState("");
  const [weightNotes, setWeightNotes] = useState("");
  const [weightDate, setWeightDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [profileNameInput, setProfileNameInput] = useState(() => profile.full_name || "");
  const [targetWeightInput, setTargetWeightInput] = useState(() =>
    profile.target_weight ? String(profile.target_weight) : ""
  );
  const [heightInput, setHeightInput] = useState(() =>
    profile.height ? String(profile.height) : ""
  );
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("bp_dark_mode") === "true"
  );

  // Health tips
  const [aiTipsHistory, setAiTipsHistory] = useState<AITipLog[]>(() =>
    localDb.getAITips()
  );
  const healthTip = aiTipsHistory.length > 0 ? aiTipsHistory[0] : null;
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);
  const [tipError, setTipError] = useState<string | null>(null);

  // ── Auto-focus Handlers ─────────────────────────────────
  const handleSysChange = useCallback((value: string) => {
    setSysInput(value);
    if (value.length >= 3) diaRef.current?.focus();
  }, []);

  const handleDiaChange = useCallback((value: string) => {
    setDiaInput(value);
    if (value.length >= 2) pulseRef.current?.focus();
  }, []);

  // ── Derived Data ────────────────────────────────────────
  const latestBP = bpLogs[bpLogs.length - 1];
  const latestWeight = weightLogs[weightLogs.length - 1];

  useEffect(() => {
    setCurrentPage(1);
  }, [logFilter, searchQuery]);

  const logsToShow = useMemo(() => {
    let combined: Array<{
      type: "bp" | "weight";
      id: string;
      date: Date;
      valText: string;
      notes: string;
      raw: any;
    }> = [];

    if (logFilter === "all" || logFilter === "bp") {
      bpLogs.forEach((log) => {
        combined.push({
          type: "bp",
          id: log.id,
          date: new Date(log.logged_at),
          valText: `${log.systolic}/${log.diastolic}  : ${log.pulse}`,
          notes: log.notes,
          raw: log,
        });
      });
    }
    if (logFilter === "all" || logFilter === "weight") {
      weightLogs.forEach((log) => {
        combined.push({
          type: "weight",
          id: log.id,
          date: new Date(log.logged_at),
          valText: `${Number(log.weight).toFixed(1)} kg`,
          notes: log.notes,
          raw: log,
        });
      });
    }

    combined.sort((a, b) => b.date.getTime() - a.date.getTime());

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(
        (item) =>
          item.notes.toLowerCase().includes(q) ||
          item.valText.toLowerCase().includes(q) ||
          item.date.toLocaleDateString().includes(q)
      );
    }

    return combined;
  }, [bpLogs, weightLogs, logFilter, searchQuery]);

  const totalPages = Math.ceil(logsToShow.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return logsToShow.slice(startIndex, startIndex + itemsPerPage);
  }, [logsToShow, currentPage, itemsPerPage]);

  // ── Notifications ───────────────────────────────────────
  const showSuccessAlert = useCallback((msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  }, []);

  const showErrorAlert = useCallback((msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  }, []);

  // ── Health Tip Generator ────────────────────────────────
  const handleGenerateHealthTip = useCallback(
    async (force = false, currentBP?: BloodPressureLog, currentWeight?: WeightLog) => {
      const activeBP = currentBP !== undefined ? currentBP : latestBP;
      const activeWeight = currentWeight !== undefined ? currentWeight : latestWeight;

      if (!activeBP && !activeWeight) {
        setTipError(
          "Masukkan setidaknya satu rekam medis tensi atau berat badan untuk menghasilkan tips kesehatan."
        );
        return;
      }

      const todayStr = new Date().toLocaleDateString();
      const hasTipToday = aiTipsHistory.some(
        (t) => new Date(t.created_at).toLocaleDateString() === todayStr
      );
      if (!force && hasTipToday) return;

      setIsGeneratingTip(true);
      setTipError(null);

      // Menggunakan local tip statis (Gemini dihapus)
      setTimeout(() => {
        try {
          const localTipData = generateLocalTip(activeBP, activeWeight);
          localDb.saveAITip(localTipData.tip, `${localTipData.focus} (Lokal)`);
          setAiTipsHistory(localDb.getAITips());
        } catch (err: any) {
          console.error("Gagal men-generate tip lokal:", err);
        } finally {
          setIsGeneratingTip(false);
        }
      }, 300); // Simulasi delay animasi UX
    },
    [latestBP, latestWeight, aiTipsHistory]
  );

  // Auto-generate health tip
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString();
    const hasTipToday = aiTipsHistory.some(
      (t) => new Date(t.created_at).toLocaleDateString() === todayStr
    );
    if (!hasTipToday && !isGeneratingTip && (bpLogs.length > 0 || weightLogs.length > 0)) {
      handleGenerateHealthTip(false, latestBP, latestWeight);
    }
  }, [bpLogs, weightLogs, aiTipsHistory, isGeneratingTip, handleGenerateHealthTip, latestBP, latestWeight]);

  // ── IndexedDB Initialization ───────────────────────────
  useEffect(() => {
    localDb.initIndexedDB().then(() => {
      setBpLogs(localDb.getBPLogs());
      setWeightLogs(localDb.getWeightLogs());
      const p = localDb.getProfile();
      setProfile(p);
      setAiTipsHistory(localDb.getAITips());
      if (p && p.full_name) {
        setProfileNameInput(p.full_name);
        setTargetWeightInput(p.target_weight ? String(p.target_weight) : "");
        setHeightInput(p.height ? String(p.height) : "");
      }
    });

    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(console.warn);
    }
  }, []);

  // ── Dark Mode ───────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("bp_dark_mode", isDark ? "true" : "false");
    document.documentElement.classList.toggle("dark", isDark);
    
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(console.warn);
      StatusBar.setBackgroundColor({ color: isDark ? '#020617' : '#f8fafc' }).catch(console.warn);
    }
  }, [isDark]);

  // ── Silent Background Sync ────────────────────────────
  const handleBackgroundSync = useCallback(async () => {
    if (!navigator.onLine || !getSupabase()) return;

    try {
      const _localProfile = localDb.getProfile();
      const currentFullName = _localProfile.full_name || "Pengguna";
      let userId: string | undefined = syncEngine.getLastUserId() || undefined;

      const { data: { user } } = await getSupabase()!.auth.getUser();
      if (user) {
        userId = user.id;
        
        const { data: existingProfile, error: searchErr } = await getSupabase()!
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (!existingProfile && !searchErr) {
          await getSupabase()!
            .from("profiles")
            .insert({
              id: userId,
              full_name: currentFullName,
              height: _localProfile.height || null,
              target_weight: _localProfile.target_weight || null,
            });
        }
      }

      // If no auth user or last user ID, query Supabase profiles table directly
      if (!userId) {
        const { data: remoteProfiles } = await getSupabase()!
          .from("profiles")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (remoteProfiles && remoteProfiles.length > 0) {
          userId = remoteProfiles[0].id;
        }
      }
      
      if (userId) {
        syncEngine.setLastUserId(userId);
        // Push local changes to Supabase first
        await syncEngine.processQueue(userId);
        // Then fetch remote changes and merge into localDb
        const fresh = await syncEngine.fetchAndCacheAll(userId);
        if (fresh.bp && fresh.bp.length > 0) {
          fresh.bp.forEach((log) => localDb.saveBPLog(Number(log.systolic), Number(log.diastolic), Number(log.pulse), log.logged_at, log.notes || "", String(log.id)));
          setBpLogs(localDb.getBPLogs());
        }
        if (fresh.weight && fresh.weight.length > 0) {
          fresh.weight.forEach((log) => localDb.saveWeightLog(Number(log.weight), log.logged_at, log.notes || "", String(log.id)));
          setWeightLogs(localDb.getWeightLogs());
        }
        if (fresh.profile) {
          const updated = localDb.saveProfile(
            fresh.profile.full_name || _localProfile.full_name || "Pengguna",
            fresh.profile.target_weight !== undefined && fresh.profile.target_weight !== null ? fresh.profile.target_weight : _localProfile.target_weight,
            fresh.profile.height !== undefined && fresh.profile.height !== null ? fresh.profile.height : _localProfile.height
          );
          setProfile(updated);
          setProfileNameInput(updated.full_name || "");
          setTargetWeightInput(updated.target_weight ? String(updated.target_weight) : "");
          setHeightInput(updated.height ? String(updated.height) : "");
        }
      } else {
        // Direct fallback: fetch any available profile row
        const { data: directProfile } = await getSupabase()!
          .from("profiles")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (directProfile) {
          const updated = localDb.saveProfile(
            directProfile.full_name || _localProfile.full_name || "Pengguna",
            directProfile.target_weight !== undefined && directProfile.target_weight !== null ? directProfile.target_weight : _localProfile.target_weight,
            directProfile.height !== undefined && directProfile.height !== null ? directProfile.height : _localProfile.height
          );
          setProfile(updated);
          setProfileNameInput(updated.full_name || "");
          setTargetWeightInput(updated.target_weight ? String(updated.target_weight) : "");
          setHeightInput(updated.height ? String(updated.height) : "");
        }
      }
    } catch (err: any) {
      console.warn("Background sync message:", err);
    }
  }, []);

  useEffect(() => {
    if (navigator.onLine) handleBackgroundSync();

    const handleOnline = () => handleBackgroundSync();

    // Silent background auto-sync interval (every 30s)
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        handleBackgroundSync();
      }
    }, 30000);

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(intervalId);
    };
  }, [handleBackgroundSync]);

  // ── Profile Update ──────────────────────────────────────
  const handleUpdateProfile = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!profileNameInput.trim()) return;

      const parsedTargetWeight = targetWeightInput.trim() ? parseFloat(targetWeightInput) : null;
      const parsedHeight = heightInput.trim() ? parseFloat(heightInput) : null;

      try {
        // Local-first: always save to localStorage
        const updated = localDb.saveProfile(profileNameInput.trim(), parsedTargetWeight, parsedHeight);
        setProfile(updated);

        // If Supabase connected, also queue for background sync
        if (getSupabase() && navigator.onLine) {
          const userId = syncEngine.getLastUserId();
          if (userId) {
            syncEngine.localUpdateProfile(userId, profileNameInput.trim(), parsedTargetWeight, parsedHeight);
            setTimeout(handleBackgroundSync, 500);
          }
        }
        showSuccessAlert("Profil berhasil diperbarui!");
      } catch (err: any) {
        console.error(err);
        showErrorAlert("Gagal memperbarui profil: " + err.message);
      }
    },
    [profileNameInput, targetWeightInput, heightInput, showSuccessAlert, handleBackgroundSync]
  );

  // ── Add BP Log ─────────────────────────────────────────
  const handleAddBP = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const sys = parseInt(sysInput);
      const dia = parseInt(diaInput);
      const pulse = parseInt(pulseInput);
      if (isNaN(sys) || isNaN(dia) || isNaN(pulse)) {
        showErrorAlert("Masukkan angka tensi dan nadi yang valid.");
        return;
      }

      try {
        // Local-first: always save to localStorage
        const newLog = localDb.saveBPLog(sys, dia, pulse, new Date(bpDate).toISOString(), bpNotes);
        setBpLogs(localDb.getBPLogs());

        // If Supabase connected, also queue for background sync
        if (getSupabase() && navigator.onLine) {
          const userId = syncEngine.getLastUserId();
          if (userId) {
            syncEngine.localAddBP(userId, sys, dia, pulse, new Date(bpDate).toISOString(), bpNotes, String(newLog.id));
            setTimeout(handleBackgroundSync, 500);
          }
        }
        showSuccessAlert("Catatan tensi berhasil disimpan!");
        setSysInput("");
        setDiaInput("");
        setPulseInput("");
        setBpNotes("");
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setBpDate(now.toISOString().slice(0, 16));
      } catch (err: any) {
        console.error(err);
        showErrorAlert("Gagal menyimpan catatan: " + err.message);
      }
    },
    [sysInput, diaInput, pulseInput, bpDate, bpNotes, showSuccessAlert, handleBackgroundSync]
  );

  // ── Add Weight Log ─────────────────────────────────────
  const handleAddWeight = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const w = parseFloat(weightInput);
      if (isNaN(w) || w <= 0) {
        showErrorAlert("Masukkan berat badan yang valid.");
        return;
      }

      try {
        // Local-first: always save to localStorage
        const newLog = localDb.saveWeightLog(w, new Date(weightDate).toISOString(), weightNotes);
        setWeightLogs(localDb.getWeightLogs());

        // If Supabase connected, also queue for background sync
        if (getSupabase() && navigator.onLine) {
          const userId = syncEngine.getLastUserId();
          if (userId) {
            syncEngine.localAddWeight(userId, w, new Date(weightDate).toISOString(), weightNotes, newLog.id);
            setTimeout(handleBackgroundSync, 500);
          }
        }
        showSuccessAlert("Catatan berat badan berhasil disimpan!");
        setWeightInput("");
        setWeightNotes("");
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setWeightDate(now.toISOString().slice(0, 16));
      } catch (err: any) {
        console.error(err);
        showErrorAlert("Gagal menyimpan berat badan: " + err.message);
      }
    },
    [weightInput, weightNotes, weightDate, showSuccessAlert, handleBackgroundSync]
  );

  // ── Delete Logs ────────────────────────────────────────
  const handleDeleteBP = useCallback(
    (id: string) => {
      try {
        // Local-first: always delete from localStorage
        localDb.deleteBPLog(id);
        setBpLogs(localDb.getBPLogs());

        // If Supabase connected, also queue for background sync
        if (getSupabase() && navigator.onLine) {
          const userId = syncEngine.getLastUserId();
          if (userId) {
            syncEngine.localDeleteBP(userId, id);
            setTimeout(handleBackgroundSync, 500);
          }
        }
        showSuccessAlert("Catatan tensi berhasil dihapus.");
      } catch (err: any) {
        console.error(err);
        showErrorAlert("Gagal menghapus catatan: " + err.message);
      }
    },
    [showSuccessAlert, handleBackgroundSync]
  );

  const handleDeleteWeight = useCallback(
    (id: string) => {
      try {
        // Local-first: always delete from localStorage
        localDb.deleteWeightLog(id);
        setWeightLogs(localDb.getWeightLogs());

        // If Supabase connected, also queue for background sync
        if (getSupabase() && navigator.onLine) {
          const userId = syncEngine.getLastUserId();
          if (userId) {
            syncEngine.localDeleteWeight(userId, id);
            setTimeout(handleBackgroundSync, 500);
          }
        }
        showSuccessAlert("Catatan berat badan berhasil dihapus.");
      } catch (err: any) {
        console.error(err);
        showErrorAlert("Gagal menghapus catatan: " + err.message);
      }
    },
    [showSuccessAlert, handleBackgroundSync]
  );

  // ── Config ─────────────────────────────────────────────
  const handleSaveConfig = useCallback(
    async (url: string, key: string, email?: string, password?: string) => {
      const activeClient = updateSupabaseClient(url, key, email, password);
      setCreds(getSavedCredentials());
      if (!activeClient) {
        showErrorAlert("Kredensial tidak valid. Silakan masukkan URL dan Key Supabase yang benar.");
        return;
      }
      if (email && password) {
        const { error } = await activeClient.auth.signInWithPassword({ email, password });
        if (error) {
          console.warn("SignIn error:", error);
          showErrorAlert("Konfigurasi tersimpan, namun gagal login: " + error.message);
          return;
        }
      }
      
      showSuccessAlert("Konfigurasi sambungan berhasil diperbarui!");
      // Call background sync so the profile and data are fetched automatically
      handleBackgroundSync();
    },
    [showSuccessAlert, handleBackgroundSync]
  );

  const handleResetConfig = useCallback(() => {
    clearSavedCredentials();
    setCreds(getSavedCredentials());
    showSuccessAlert("Konfigurasi sambungan berhasil di-reset.");
  }, [showSuccessAlert]);

  // ── Manual Full Sync from Supabase ─────────────────────
  const handleManualSync = useCallback(async () => {
    if (!getSupabase() || !navigator.onLine) {
      showSuccessAlert("Tidak ada koneksi Supabase atau internet.");
      return;
    }

    setIsManualSyncing(true);
    try {
      const _localProfile = localDb.getProfile();
      const currentFullName = _localProfile.full_name || "Pengguna";
      let userId: string | undefined;

      const { data: { user } } = await getSupabase()!.auth.getUser();
      if (user) {
        userId = user.id;
        
        const { data: existingProfile, error: searchErr } = await getSupabase()!
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (!existingProfile && !searchErr) {
          await getSupabase()!
            .from("profiles")
            .insert({
              id: userId,
              full_name: currentFullName + (Math.random().toString(36).substring(2,6)),
              height: _localProfile.height || null,
              target_weight: _localProfile.target_weight || null,
            });
        }
      }
      
      if (!userId) {
        const { data: remoteProfiles } = await getSupabase()!
          .from("profiles")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (remoteProfiles && remoteProfiles.length > 0) {
          userId = remoteProfiles[0].id;
        }
      }

      if (!userId) {
        showSuccessAlert("Gagal mendapatkan ID pengguna dari Supabase.");
        setIsManualSyncing(false);
        return;
      }

      syncEngine.setLastUserId(userId);

      // Push local changes first, then fetch all remote data
      await syncEngine.processQueue(userId);
      const fresh = await syncEngine.fetchAndCacheAll(userId);

      // Replace all local data with remote data
      if (fresh.bp.length > 0 || fresh.weight.length > 0 || fresh.profile) {
        // Clear local logs first without bringing back dummy data
        localDb.clearAllData();

        // Overwrite with Supabase data
        fresh.bp.forEach((log) => localDb.saveBPLog(Number(log.systolic), Number(log.diastolic), Number(log.pulse), log.logged_at, log.notes || "", String(log.id)));
        fresh.weight.forEach((log) => localDb.saveWeightLog(Number(log.weight), log.logged_at, log.notes || "", String(log.id)));

        if (fresh.profile) {
          localDb.saveProfile(
            fresh.profile.full_name || "Pengguna",
            fresh.profile.target_weight ? Number(fresh.profile.target_weight) : null,
            fresh.profile.height ? Number(fresh.profile.height) : null
          );
        }

        // Update all state
        setBpLogs(localDb.getBPLogs());
        setWeightLogs(localDb.getWeightLogs());
        const updatedProfile = localDb.getProfile();
        setProfile(updatedProfile);
        setProfileNameInput(updatedProfile.full_name || "Pengguna");
        setTargetWeightInput(updatedProfile.target_weight ? String(updatedProfile.target_weight) : "");
        setHeightInput(updatedProfile.height ? String(updatedProfile.height) : "");

        showSuccessAlert(`Sinkronasi selesai! ${fresh.bp.length} BP & ${fresh.weight.length} Weight dari Supabase.`);
      } else {
        showSuccessAlert("Tidak ada data ditemukan di Supabase. Gunakan menu Input Data untuk menambah.");
      }
    } catch (err: any) {
      console.error("Manual sync error:", err);
      showSuccessAlert("Gagal sinkronasi: " + (err.message || "Error tidak diketahui"));
    } finally {
      setIsManualSyncing(false);
    }
  }, [profile, showSuccessAlert]);

  // ── Export/Import ──────────────────────────────────────
  const exportLocalData = useCallback(() => {
    const dataStr = JSON.stringify(
      { bp: localDb.getBPLogs(), weight: localDb.getWeightLogs(), profile: localDb.getProfile() },
      null,
      2
    );
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", `riwayat_kesehatan_${new Date().toISOString().slice(0, 10)}.json`);
    linkElement.click();
  }, []);

  const handleImportCSVFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (!text) {
          showErrorAlert("File kosong atau gagal membaca file.");
          return;
        }

        const result = parseCSV(text);
        if (result.error) {
          showErrorAlert(result.error);
          return;
        }

        const totalBp = result.bp.length;
        const totalWeight = result.weight.length;
        if (totalBp === 0 && totalWeight === 0) {
          showErrorAlert("Tidak ada data rekam medis yang valid ditemukan dalam file CSV.");
          return;
        }

        if (
          confirm(
            `Apakah Anda yakin ingin mengimpor ${totalBp} catatan tensi dan ${totalWeight} catatan berat badan dari CSV?`
          )
        ) {
          try {
            result.bp.forEach((item) => {
              const newLog = localDb.saveBPLog(item.systolic, item.diastolic, item.pulse, item.logged_at, item.notes);
              if (navigator.onLine && getSupabase()) {
                const userId = syncEngine.getLastUserId();
                if (userId) {
                  syncEngine.localAddBP(userId, item.systolic, item.diastolic, item.pulse, item.logged_at, item.notes, String(newLog.id));
                }
              }
            });
            result.weight.forEach((item) => {
              const newLog = localDb.saveWeightLog(item.weight, item.logged_at, item.notes);
              if (navigator.onLine && getSupabase()) {
                const userId = syncEngine.getLastUserId();
                if (userId) {
                  syncEngine.localAddWeight(userId, item.weight, item.logged_at, item.notes, newLog.id);
                }
              }
            });
            setBpLogs(localDb.getBPLogs());
            setWeightLogs(localDb.getWeightLogs());
            showSuccessAlert(`Berhasil mengimpor ${totalBp} rekam tensi & ${totalWeight} rekam berat badan!`);
            if (navigator.onLine && getSupabase()) setTimeout(handleBackgroundSync, 500);
          } catch (err: any) {
            console.error("Gagal mengimpor CSV:", err);
            showErrorAlert("Gagal mengimpor data CSV: " + err.message);
          }
        }
      };
      reader.readAsText(file);
    },
    [showSuccessAlert, handleBackgroundSync]
  );

  // ── Render ───────────────────────────────────────────────
  const mainTabs = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "statistik", label: "Statistik", icon: TrendingUp },
    { key: "input", label: "Input Data", icon: Plus },
    { key: "riwayat", label: "Riwayat", icon: History },
    { key: "seting", label: "Pengaturan", icon: Settings },
  ] as const;

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-100 dark:selection:bg-indigo-950 selection:text-indigo-900 dark:selection:text-indigo-200 pb-20 sm:pb-16 transition-colors duration-200 animate-fade-in"
    >
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-700/80 bg-[#F8FAFC]/90 dark:bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          {/* Logo + Header Nav */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none shrink-0">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  tensi.ku
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Asisten monitoring
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              {mainTabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveMainTab(key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                    activeMainTab === key
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                      : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right section: Actions */}
          <div className="flex items-center justify-end gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsReportModalOpen(true)}
              title="Cetak Laporan Dokter (PDF)"
              className="px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95 shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Laporan Dokter</span>
            </button>

            <button
              onClick={() => setIsConfigOpen(true)}
              title={getSupabase() ? "Supabase Terhubung (Klik untuk atur)" : "Atur Sambungan Supabase"}
              className={`p-2 rounded-xl border transition-all active:scale-95 shadow-xs flex items-center justify-center cursor-pointer ${
                getSupabase()
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              <Database className={`h-4 w-4 ${getSupabase() ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 shadow-xs flex items-center justify-center cursor-pointer"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mainTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveMainTab(key)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              activeMainTab === key
                ? "text-indigo-600 dark:text-indigo-400 font-bold"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                activeMainTab === key
                  ? "bg-indigo-100 dark:bg-indigo-950/60"
                  : ""
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">{label}</span>
          </button>
        ))}
      </nav>

      {/* NOTIFICATIONS */}
      {actionSuccess && (
        <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2.5 animate-bounce">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2.5 animate-bounce">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── DASHBOARD TAB ── */}
        {activeMainTab === "dashboard" && (
          <div className="space-y-6">
            <DashboardCards
              bpLogs={bpLogs}
              weightLogs={weightLogs}
              profile={profile}
              onNavigateSettings={() => setActiveMainTab("seting")}
              onOpenReportModal={() => setIsReportModalOpen(true)}
            />

            {/* AI Health Tips */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-fade-in">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                      Tips Kesehatan Harian AI
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Rekomendasi personal berdasarkan data kesehatan Anda
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleGenerateHealthTip(true)}
                    disabled={isGeneratingTip}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-xs shrink-0"
                  >
                    <RefreshCw className={`h-4 w-4 text-indigo-500 ${isGeneratingTip ? "animate-spin" : ""}`} />
                    <span>Segarkan Tips</span>
                  </button>
                </div>
              </div>

              <div className="mt-5">
                {isGeneratingTip ? (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2" />
                    </div>
                  </div>
                ) : tipError ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-1">Tips tidak tersedia</p>
                      <p>{tipError}</p>
                    </div>
                  </div>
                ) : healthTip ? (
                  <div className="p-5 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                        {healthTip.focus}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {new Date(healthTip.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {healthTip.tip}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      💡 Tambahkan data tensi atau berat badan Anda untuk mendapatkan tips kesehatan personal.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ── STATISTIK TAB ── */}
        {activeMainTab === "statistik" && (
          <div className="space-y-6 animate-fade-in">
            <StatistikPanel bpLogs={bpLogs} weightLogs={weightLogs} />

            {/* Detailed Charts + Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Chart Area (Col 8) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                {/* Chart Tabs */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 gap-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      Grafik Tren Perkembangan Kesehatan
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Visualisasi perkembangan tensi darah dan berat badan Anda
                    </p>
                  </div>

                  <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCurrentTab("bp")}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                        currentTab === "bp"
                          ? "bg-white text-indigo-600 shadow-md shadow-slate-100"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
                      }`}
                    >
                      Grafik Tensi & Nadi
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab("weight")}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                        currentTab === "weight"
                          ? "bg-white text-amber-600 shadow-md shadow-slate-100"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
                      }`}
                    >
                      Grafik Berat Badan
                    </button>
                  </div>
                </div>

                <div className="mt-2 min-h-[320px] overflow-hidden">
                  {currentTab === "bp" ? (
                    <BloodPressureChart data={bpLogs} />
                  ) : (
                    <WeightChart data={weightLogs} />
                  )}
                </div>
              </div>

              {/* Trend Pie Chart (Col 4) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                      Tren Kesehatan
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Proporsi diagnosis tensi {trendPeriod === "monthly" ? "30 hari" : "1 tahun"} terakhir
                    </p>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 ml-2 shrink-0">
                    <button
                      onClick={() => setTrendPeriod("monthly")}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        trendPeriod === "monthly"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      Bulan
                    </button>
                    <button
                      onClick={() => setTrendPeriod("yearly")}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        trendPeriod === "yearly"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      Tahun
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <MonthlyTrendPieChart data={bpLogs} period={trendPeriod} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── INPUT DATA TAB ── */}
        {activeMainTab === "input" && (
          <InputForms
            sysInput={sysInput}
            diaInput={diaInput}
            pulseInput={pulseInput}
            bpNotes={bpNotes}
            bpDate={bpDate}
            sysRef={sysRef}
            diaRef={diaRef}
            pulseRef={pulseRef}
            onSysChange={handleSysChange}
            onDiaChange={handleDiaChange}
            onPulseChange={setPulseInput}
            onBpNotesChange={setBpNotes}
            onBpDateChange={setBpDate}
            onAddBp={handleAddBP}
            weightInput={weightInput}
            weightNotes={weightNotes}
            weightDate={weightDate}
            onWeightInputChange={setWeightInput}
            onWeightNotesChange={setWeightNotes}
            onWeightDateChange={setWeightDate}
            onAddWeight={handleAddWeight}
            currentTab={currentTab}
            onTabChange={setCurrentTab}
          />
        )}

        {/* ── RIWAYAT TAB ── */}
        {activeMainTab === "riwayat" && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                <FileText className="h-5 w-5 text-indigo-600" />
                Riwayat Tensi
              </h2>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari catatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all font-medium"
                />
              </div>

              {/* Type Filter */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/50 shrink-0">
                {(["all", "bp", "weight"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setLogFilter(filter)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      logFilter === filter
                        ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {filter === "all" ? "Semua" : filter === "bp" ? "Tensi" : "Berat"}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  title="Cetak Laporan Kesehatan Dokter (PDF)"
                  className="p-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer shadow-xs"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Cetak PDF Dokter</span>
                </button>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isManualSyncing || !getSupabase() || !navigator.onLine}
                  title="Download semua data dari Supabase dan ganti data lokal"
                  className={`p-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer ${
                    isManualSyncing
                      ? "bg-indigo-100 text-indigo-400 border-indigo-200 cursor-wait"
                      : "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/40 dark:hover:bg-indigo-950/50"
                  }`}
                >
                  <CloudDownload className={`h-4 w-4 ${isManualSyncing ? "animate-bounce" : ""}`} />
                  <span className="hidden sm:inline">{isManualSyncing ? "Menyinkron..." : "Sync"}</span>
                </button>
                <button
                  type="button"
                  onClick={exportLocalData}
                  title="Unduh Cadangan JSON Lokal"
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Ekspor JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Apakah Anda ingin mereset basis data lokal Anda ke data default awal?")) {
                      localDb.resetAll();
                      setBpLogs(localDb.getBPLogs());
                      setWeightLogs(localDb.getWeightLogs());
                      setProfile(localDb.getProfile());
                      setProfileNameInput(localDb.getProfile().full_name);
                      showSuccessAlert("Database lokal berhasil di-reset.");
                    }
                  }}
                  title="Reset Database Lokal"
                  className="p-2 border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-xl text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/80 rounded-2xl bg-white/50 dark:bg-slate-900/50">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 font-bold text-slate-500 dark:text-slate-400 tracking-wider text-[10px]">
                    <th className="px-5 py-3.5">Tanggal & Waktu</th>
                    <th className="px-5 py-3.5">Hasil Pengukuran</th>
                    <th className="px-5 py-3.5">Kategori / Evaluasi</th>
                    <th className="px-5 py-3.5">Catatan Tambahan</th>
                    <th className="px-5 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {logsToShow.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500 italic">
                        Tidak ditemukan riwayat rekam medis harian yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((item) => {
                      const d = new Date(item.date);
                      const weekday = d.toLocaleDateString("id-ID", { weekday: "long" });
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const year = d.getFullYear();
                      const localTimeStr = `${weekday}, ${day}.${month}.${year}`;
                      const hourStr = d.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-700 dark:text-slate-200">{localTimeStr}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono mt-0.5">{hourStr}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {item.type === "bp" &&
                                (() => {
                                  const evalBP = getBPCategoryDetails(item.raw.systolic, item.raw.diastolic);
                                  return (
                                    <span className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm animate-pulse" style={{ backgroundColor: evalBP.color }} title={`Kategori: ${evalBP.category}`} />
                                  );
                                })()}
                              <span className="font-mono font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                                {item.valText}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {item.type === "bp" ? (
                              (() => {
                                const evalBP = getBPCategoryDetails(item.raw.systolic, item.raw.diastolic);
                                return (
                                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full border ${evalBP.bg} ${evalBP.border || "border-transparent"} ${evalBP.text}`}>
                                    <span className="h-2 w-2 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: evalBP.color }} />
                                    {evalBP.category}
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">Lacak Mandiri</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 max-w-[200px]">
                            {item.notes ? (
                              <p className="text-slate-600 dark:text-slate-300 font-medium italic truncate max-w-[180px]">"{item.notes}"</p>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 italic">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => (item.type === "bp" ? handleDeleteBP(item.id) : handleDeleteWeight(item.id))}
                              className={`p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center mx-auto ${
                                getSupabase()
                                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:border-rose-900/40"
                                  : "text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              }`}
                              title={getSupabase() ? "Hapus rekaman medis ini (Supabase Terhubung)" : "Hapus rekaman medis ini"}
                            >
                              <Trash2 className={`h-4.5 w-4.5 ${getSupabase() ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 dark:text-slate-500 font-semibold font-mono">
              <span>Total {logsToShow.length} Rekaman Tersedia</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt;&lt;
                  </button>
                  <span className="px-2">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &gt;&gt;
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SETING TAB ── */}
        {activeMainTab === "seting" && (
          <div className="space-y-6 animate-fade-in">
            <SettingsSection
              profile={profile}
              profileNameInput={profileNameInput}
              targetWeightInput={targetWeightInput}
              heightInput={heightInput}
              onProfileNameChange={setProfileNameInput}
              onTargetWeightChange={setTargetWeightInput}
              onHeightChange={setHeightInput}
              onUpdateProfile={handleUpdateProfile}
              onExportData={exportLocalData}
              onImportCSV={handleImportCSVFile}
            />

            {/* Database Schema Setup */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-indigo-600" />
                  Skema SQL Supabase
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
                    showSuccessAlert("Skema SQL disalin!");
                  }}
                  className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold px-2.5 py-1 rounded-md hover:bg-indigo-100 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="h-3 w-3" /> Salin SQL
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-3">
                Salin kode di bawah ini lalu jalankan di menu <strong>SQL Editor</strong> di dalam dasbor proyek Supabase
                Anda untuk membuat tabel otomatis dengan izin RLS yang aman:
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
        )}
      </main>

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        url={creds.url}
        anonKey={creds.anonKey}
        email={creds.email}
        password={creds.password}
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
      />

      {/* Doctor Report Printable PDF Modal */}
      <DoctorReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        bpLogs={bpLogs}
        weightLogs={weightLogs}
        profile={profile}
        healthTip={healthTip}
      />
    </div>
  );
}
