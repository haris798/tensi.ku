import { BloodPressureLog, WeightLog, UserProfile } from '../types';

// Pre-populate with realistic mock health records for an immersive first impression
const DUMMY_BP_LOGS: BloodPressureLog[] = [
  {
    id: 'bp-1',
    user_id: 'local-user',
    systolic: 118,
    diastolic: 78,
    pulse: 72,
    logged_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Pagi hari, setelah bangun tidur',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bp-2',
    user_id: 'local-user',
    systolic: 122,
    diastolic: 81,
    pulse: 75,
    logged_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Sore hari, setelah kerja',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bp-3',
    user_id: 'local-user',
    systolic: 135,
    diastolic: 86,
    pulse: 88,
    logged_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Setelah minum kopi',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bp-4',
    user_id: 'local-user',
    systolic: 128,
    diastolic: 82,
    pulse: 70,
    logged_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Istirahat setelah olahraga',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bp-5',
    user_id: 'local-user',
    systolic: 119,
    diastolic: 79,
    pulse: 68,
    logged_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Sebelum tidur',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bp-6',
    user_id: 'local-user',
    systolic: 142,
    diastolic: 92,
    pulse: 82,
    logged_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Kurang tidur semalam, merasa pusing',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bp-7',
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
    id: 'w-1',
    user_id: 'local-user',
    weight: 72.5,
    logged_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Timbang pagi hari',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'w-2',
    user_id: 'local-user',
    weight: 72.3,
    logged_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Setelah olahraga pagi',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'w-3',
    user_id: 'local-user',
    weight: 72.6,
    logged_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Malam hari setelah makan',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'w-4',
    user_id: 'local-user',
    weight: 72.1,
    logged_at: new Date().toISOString(),
    notes: 'Timbang pagi, perut kosong',
    created_at: new Date().toISOString(),
  }
];

const DUMMY_PROFILE: UserProfile = {
  id: 'local-user',
  full_name: 'Budi Santoso (Demo)',
  target_weight: 68.0,
  height: 170.0,
  updated_at: new Date().toISOString()
};

// Keys
const KEYS = {
  BP: 'local_bp_logs_v1',
  WEIGHT: 'local_weight_logs_v1',
  PROFILE: 'local_profile_v1',
  HAS_SEEDED: 'local_has_seeded_v1'
};

export function initLocalStorage() {
  const seeded = localStorage.getItem(KEYS.HAS_SEEDED);
  if (!seeded) {
    localStorage.setItem(KEYS.BP, JSON.stringify(DUMMY_BP_LOGS));
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify(DUMMY_WEIGHT_LOGS));
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(DUMMY_PROFILE));
    localStorage.setItem(KEYS.HAS_SEEDED, 'true');
  }
}

export const localDb = {
  getBPLogs(): BloodPressureLog[] {
    initLocalStorage();
    const data = localStorage.getItem(KEYS.BP);
    return data ? JSON.parse(data) : [];
  },

  saveBPLog(systolic: number, diastolic: number, pulse: number, loggedAt: string, notes: string): BloodPressureLog {
    const logs = this.getBPLogs();
    const newLog: BloodPressureLog = {
      id: `bp-${Math.random().toString(36).substr(2, 9)}`,
      user_id: 'local-user',
      systolic,
      diastolic,
      pulse,
      logged_at: loggedAt,
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };
    logs.push(newLog);
    // Sort chronologically
    logs.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
    localStorage.setItem(KEYS.BP, JSON.stringify(logs));
    return newLog;
  },

  deleteBPLog(id: string): void {
    const logs = this.getBPLogs();
    const filtered = logs.filter(log => log.id !== id);
    localStorage.setItem(KEYS.BP, JSON.stringify(filtered));
  },

  getWeightLogs(): WeightLog[] {
    initLocalStorage();
    const data = localStorage.getItem(KEYS.WEIGHT);
    return data ? JSON.parse(data) : [];
  },

  saveWeightLog(weight: number, loggedAt: string, notes: string): WeightLog {
    const logs = this.getWeightLogs();
    const newLog: WeightLog = {
      id: `w-${Math.random().toString(36).substr(2, 9)}`,
      user_id: 'local-user',
      weight,
      logged_at: loggedAt,
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };
    logs.push(newLog);
    logs.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify(logs));
    return newLog;
  },

  deleteWeightLog(id: string): void {
    const logs = this.getWeightLogs();
    const filtered = logs.filter(log => log.id !== id);
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify(filtered));
  },

  getProfile(): UserProfile {
    initLocalStorage();
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : DUMMY_PROFILE;
  },

  saveProfile(fullName: string, targetWeight?: number | null, height?: number | null): UserProfile {
    const profile = this.getProfile();
    profile.full_name = fullName;
    profile.target_weight = targetWeight !== undefined ? targetWeight : null;
    profile.height = height !== undefined ? height : null;
    profile.updated_at = new Date().toISOString();
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    return profile;
  },

  resetAll(): void {
    localStorage.removeItem(KEYS.BP);
    localStorage.removeItem(KEYS.WEIGHT);
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.HAS_SEEDED);
    initLocalStorage();
  }
};
