import { BloodPressureLog, WeightLog, UserProfile, AITipLog } from '../types';
import {
  idbGetBPLogs,
  idbSaveBPLog,
  idbDeleteBPLog,
  idbBulkSaveBPLogs,
  idbGetWeightLogs,
  idbSaveWeightLog,
  idbDeleteWeightLog,
  idbBulkSaveWeightLogs,
  idbGetProfile,
  idbSaveProfile,
  idbGetAITips,
  idbSaveAITip,
  idbClearData,
  idbResetAll,
  idbGetKV,
  idbSetKV,
} from './indexedDb';

// Pre-populate with realistic mock health records for an immersive first impression
const DUMMY_BP_LOGS: BloodPressureLog[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    user_id: 'local-user',
    systolic: 118,
    diastolic: 78,
    pulse: 72,
    logged_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Pagi hari, setelah bangun tidur',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    user_id: 'local-user',
    systolic: 122,
    diastolic: 81,
    pulse: 75,
    logged_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Sore hari, setelah kerja',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    user_id: 'local-user',
    systolic: 135,
    diastolic: 86,
    pulse: 88,
    logged_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Setelah minum kopi',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    user_id: 'local-user',
    systolic: 128,
    diastolic: 82,
    pulse: 70,
    logged_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Istirahat setelah olahraga',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    user_id: 'local-user',
    systolic: 119,
    diastolic: 79,
    pulse: 68,
    logged_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Sebelum tidur',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    user_id: 'local-user',
    systolic: 142,
    diastolic: 92,
    pulse: 82,
    logged_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Kurang tidur semalam, merasa pusing',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    user_id: 'local-user',
    systolic: 120,
    diastolic: 80,
    pulse: 74,
    logged_at: new Date().toISOString(),
    notes: 'Pagi hari, merasa sehat',
    created_at: new Date().toISOString(),
  }
];

const DUMMY_WEIGHT_LOGS: WeightLog[] = [
  {
    id: 'aaaaa111-1111-4111-8111-111111111111',
    user_id: 'local-user',
    weight: 72.5,
    logged_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Timbang pagi hari',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aaaaa222-2222-4222-8222-222222222222',
    user_id: 'local-user',
    weight: 72.3,
    logged_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Setelah olahraga pagi',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aaaaa333-3333-4333-8333-333333333333',
    user_id: 'local-user',
    weight: 72.6,
    logged_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Malam hari setelah makan',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aaaaa444-4444-4444-8444-444444444444',
    user_id: 'local-user',
    weight: 72.1,
    logged_at: new Date().toISOString(),
    notes: 'Timbang pagi, perut kosong',
    created_at: new Date().toISOString(),
  }
];

const DUMMY_PROFILE: UserProfile = {
  id: 'local-user',
  full_name: 'Haris',
  target_weight: 75.0,
  height: 172.0,
  updated_at: new Date().toISOString()
};

// Keys for fallback localStorage
const KEYS = {
  BP: 'local_bp_logs_v1',
  WEIGHT: 'local_weight_logs_v1',
  PROFILE: 'local_profile_v1',
  HAS_SEEDED: 'local_has_seeded_v2',
  AI_TIPS: 'local_ai_tips_v1',
};

// In-memory cache for ultra-fast synchronous UI responses
let bpCache: BloodPressureLog[] = [];
let weightCache: WeightLog[] = [];
let profileCache: UserProfile = { ...DUMMY_PROFILE };
let aiTipsCache: AITipLog[] = [];
let isInitialized = false;

// Call once at module init to ensure baseline seed data is present in localStorage
function ensureSeeded() {
  if (typeof window === 'undefined') return;
  const seeded = localStorage.getItem(KEYS.HAS_SEEDED);
  if (!seeded) {
    localStorage.setItem(KEYS.BP, JSON.stringify(DUMMY_BP_LOGS));
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify(DUMMY_WEIGHT_LOGS));
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(DUMMY_PROFILE));
    localStorage.setItem(KEYS.HAS_SEEDED, 'true');
  }

  // Load synchronous cache from localStorage as instant fallback
  try {
    const rawBp = localStorage.getItem(KEYS.BP);
    bpCache = rawBp ? deduplicateBPLogs(JSON.parse(rawBp)) : DUMMY_BP_LOGS;

    const rawW = localStorage.getItem(KEYS.WEIGHT);
    weightCache = rawW ? deduplicateWeightLogs(JSON.parse(rawW)) : DUMMY_WEIGHT_LOGS;

    const rawProf = localStorage.getItem(KEYS.PROFILE);
    profileCache = rawProf ? JSON.parse(rawProf) : DUMMY_PROFILE;

    const rawTips = localStorage.getItem(KEYS.AI_TIPS);
    aiTipsCache = rawTips ? JSON.parse(rawTips) : [];
  } catch (err) {
    console.error('Error loading localStorage fallback:', err);
  }
}

ensureSeeded();

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Deduplication helper for Blood Pressure logs
export function deduplicateBPLogs(logs: BloodPressureLog[]): BloodPressureLog[] {
  const seenIds = new Set<string>();
  const seenContentKeys = new Set<string>();
  const result: BloodPressureLog[] = [];

  for (const log of logs) {
    if (!log || !log.id) continue;
    const logId = String(log.id);
    const timeMs = log.logged_at ? new Date(log.logged_at).getTime() : NaN;
    // Round to nearest second (1000ms) to ensure robust cross-platform matching
    const timeSec = !isNaN(timeMs) ? Math.floor(timeMs / 1000) : '';
    const contentKey = `${timeSec}_${Number(log.systolic)}_${Number(log.diastolic)}_${Number(log.pulse)}`;

    if (seenIds.has(logId) || (timeSec !== '' && seenContentKeys.has(contentKey))) {
      continue;
    }
    seenIds.add(logId);
    if (timeSec !== '') seenContentKeys.add(contentKey);
    result.push(log);
  }

  return result.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
}

// Deduplication helper for Weight logs
export function deduplicateWeightLogs(logs: WeightLog[]): WeightLog[] {
  const seenIds = new Set<string>();
  const seenContentKeys = new Set<string>();
  const result: WeightLog[] = [];

  for (const log of logs) {
    if (!log || !log.id) continue;
    const logId = String(log.id);
    const timeMs = log.logged_at ? new Date(log.logged_at).getTime() : NaN;
    const timeSec = !isNaN(timeMs) ? Math.floor(timeMs / 1000) : '';
    const contentKey = `${timeSec}_${Number(log.weight)}`;

    if (seenIds.has(logId) || (timeSec !== '' && seenContentKeys.has(contentKey))) {
      continue;
    }
    seenIds.add(logId);
    if (timeSec !== '') seenContentKeys.add(contentKey);
    result.push(log);
  }

  return result.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
}

export const localDb = {
  // Initialize IndexedDB and sync memory cache
  async initIndexedDB(): Promise<void> {
    if (isInitialized || typeof window === 'undefined') return;

    try {
      const seeded = await idbGetKV<boolean>('has_seeded');
      let idbBp = await idbGetBPLogs();
      let idbW = await idbGetWeightLogs();
      let idbProf = await idbGetProfile('local-user');
      let idbTips = await idbGetAITips();

      if (!seeded || (idbBp.length === 0 && idbW.length === 0)) {
        // Hydrate from memory/localStorage or dummy data into IndexedDB
        const sourceBp = bpCache.length > 0 ? bpCache : DUMMY_BP_LOGS;
        const sourceW = weightCache.length > 0 ? weightCache : DUMMY_WEIGHT_LOGS;
        const sourceProf = profileCache || DUMMY_PROFILE;

        await idbBulkSaveBPLogs(sourceBp);
        await idbBulkSaveWeightLogs(sourceW);
        await idbSaveProfile(sourceProf);
        await idbSetKV('has_seeded', true);

        idbBp = sourceBp;
        idbW = sourceW;
        idbProf = sourceProf;
      }

      // Populate memory cache from IndexedDB
      bpCache = deduplicateBPLogs(idbBp);
      weightCache = deduplicateWeightLogs(idbW);
      if (idbProf) profileCache = idbProf;
      if (idbTips.length > 0) aiTipsCache = idbTips;

      // Synchronize back to localStorage for fallback
      localStorage.setItem(KEYS.BP, JSON.stringify(bpCache));
      localStorage.setItem(KEYS.WEIGHT, JSON.stringify(weightCache));
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profileCache));
      localStorage.setItem(KEYS.AI_TIPS, JSON.stringify(aiTipsCache));

      isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize IndexedDB:', err);
    }
  },

  getBPLogs(): BloodPressureLog[] {
    bpCache = deduplicateBPLogs(bpCache);
    return [...bpCache];
  },

  saveBPLog(systolic: number, diastolic: number, pulse: number, loggedAt: string, notes: string, existingId?: string): BloodPressureLog {
    const targetId = existingId || generateUUID();
    const newLog: BloodPressureLog = {
      id: targetId,
      user_id: 'local-user',
      systolic,
      diastolic,
      pulse,
      logged_at: loggedAt,
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };

    let existingIndex = bpCache.findIndex(l => String(l.id) === String(targetId));
    if (existingIndex < 0) {
      const targetTime = new Date(loggedAt).getTime();
      existingIndex = bpCache.findIndex(l => {
        const t = new Date(l.logged_at).getTime();
        return Math.abs(t - targetTime) < 1000 &&
          Number(l.systolic) === systolic &&
          Number(l.diastolic) === diastolic &&
          Number(l.pulse) === pulse;
      });
    }

    if (existingIndex >= 0) {
      bpCache[existingIndex] = { ...bpCache[existingIndex], ...newLog, id: targetId };
    } else {
      bpCache.push(newLog);
    }

    bpCache = deduplicateBPLogs(bpCache);
    const finalLog = bpCache.find(l => String(l.id) === String(targetId)) || newLog;

    // Persist to IndexedDB & localStorage
    idbSaveBPLog(finalLog);
    localStorage.setItem(KEYS.BP, JSON.stringify(bpCache));

    return finalLog;
  },

  deleteBPLog(id: string): void {
    bpCache = bpCache.filter(log => String(log.id) !== String(id));
    idbDeleteBPLog(id);
    localStorage.setItem(KEYS.BP, JSON.stringify(bpCache));
  },

  getWeightLogs(): WeightLog[] {
    weightCache = deduplicateWeightLogs(weightCache);
    return [...weightCache];
  },

  saveWeightLog(weight: number, loggedAt: string, notes: string, existingId?: string): WeightLog {
    const targetId = existingId || generateUUID();
    const newLog: WeightLog = {
      id: targetId,
      user_id: 'local-user',
      weight,
      logged_at: loggedAt,
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };

    let existingIndex = weightCache.findIndex(l => String(l.id) === String(targetId));
    if (existingIndex < 0) {
      const targetTime = new Date(loggedAt).getTime();
      existingIndex = weightCache.findIndex(l => {
        const t = new Date(l.logged_at).getTime();
        return Math.abs(t - targetTime) < 1000 && Number(l.weight) === weight;
      });
    }

    if (existingIndex >= 0) {
      weightCache[existingIndex] = { ...weightCache[existingIndex], ...newLog, id: targetId };
    } else {
      weightCache.push(newLog);
    }

    weightCache = deduplicateWeightLogs(weightCache);
    const finalLog = weightCache.find(l => String(l.id) === String(targetId)) || newLog;

    // Persist to IndexedDB & localStorage
    idbSaveWeightLog(finalLog);
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify(weightCache));

    return finalLog;
  },

  deleteWeightLog(id: string): void {
    weightCache = weightCache.filter(log => String(log.id) !== String(id));
    idbDeleteWeightLog(id);
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify(weightCache));
  },

  getProfile(): UserProfile {
    return { ...profileCache };
  },

  saveProfile(fullName: string, targetWeight?: number | null, height?: number | null): UserProfile {
    profileCache.full_name = fullName;
    profileCache.target_weight = targetWeight !== undefined ? targetWeight : null;
    profileCache.height = height !== undefined ? height : null;
    profileCache.updated_at = new Date().toISOString();

    idbSaveProfile(profileCache);
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profileCache));

    return { ...profileCache };
  },

  getAITips(): AITipLog[] {
    return [...aiTipsCache];
  },

  saveAITip(tip: string, focus: string): AITipLog {
    const newLog: AITipLog = {
      id: `tip-${Math.random().toString(36).substr(2, 9)}`,
      tip,
      focus,
      created_at: new Date().toISOString()
    };
    aiTipsCache.unshift(newLog);
    if (aiTipsCache.length > 30) aiTipsCache.pop();

    idbSaveAITip(newLog);
    localStorage.setItem(KEYS.AI_TIPS, JSON.stringify(aiTipsCache));

    return newLog;
  },

  clearAllData(): void {
    bpCache = [];
    weightCache = [];
    idbClearData();
    localStorage.setItem(KEYS.BP, JSON.stringify([]));
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify([]));
  },

  resetAll(): void {
    bpCache = deduplicateBPLogs(DUMMY_BP_LOGS);
    weightCache = deduplicateWeightLogs(DUMMY_WEIGHT_LOGS);
    profileCache = { ...DUMMY_PROFILE };
    aiTipsCache = [];

    idbResetAll();
    localStorage.removeItem(KEYS.BP);
    localStorage.removeItem(KEYS.WEIGHT);
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.HAS_SEEDED);
    ensureSeeded();
  }
};

