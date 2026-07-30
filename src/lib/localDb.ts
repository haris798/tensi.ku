import { BloodPressureLog, WeightLog, UserProfile, AITipLog, WaterLog, WaterReminderConfig } from '../types';

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

// Keys
const KEYS = {
  BP: 'local_bp_logs_v1',
  WEIGHT: 'local_weight_logs_v1',
  PROFILE: 'local_profile_v1',
  HAS_SEEDED: 'local_has_seeded_v2',
  AI_TIPS: 'local_ai_tips_v1',
  WATER_LOGS: 'local_water_logs_v1',
  WATER_CONFIG: 'local_water_config_v1',
};

const DEFAULT_WATER_CONFIG: WaterReminderConfig = {
  enabled: true,
  daily_goal_ml: 2000,
  interval_minutes: 120,
  start_time: '07:00',
  end_time: '21:00',
  sound_enabled: true,
};

// Call once at module init to ensure seed data is present
function ensureSeeded() {
  const seeded = localStorage.getItem(KEYS.HAS_SEEDED);
  if (!seeded) {
    localStorage.setItem(KEYS.BP, JSON.stringify(DUMMY_BP_LOGS));
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify(DUMMY_WEIGHT_LOGS));
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(DUMMY_PROFILE));
    localStorage.setItem(KEYS.HAS_SEEDED, 'true');
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
  const seenKeys = new Set<string>();
  const result: BloodPressureLog[] = [];

  for (const log of logs) {
    if (!log || !log.id) continue;
    const logId = String(log.id);
    const timeKey = log.logged_at ? new Date(log.logged_at).toISOString() : '';
    const contentKey = `${timeKey}_${log.systolic}_${log.diastolic}_${log.pulse}`;

    if (seenIds.has(logId) || (timeKey && seenKeys.has(contentKey))) {
      continue;
    }
    seenIds.add(logId);
    if (timeKey) seenKeys.add(contentKey);
    result.push(log);
  }

  return result.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
}

// Deduplication helper for Weight logs
export function deduplicateWeightLogs(logs: WeightLog[]): WeightLog[] {
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const result: WeightLog[] = [];

  for (const log of logs) {
    if (!log || !log.id) continue;
    const logId = String(log.id);
    const timeKey = log.logged_at ? new Date(log.logged_at).toISOString() : '';
    const contentKey = `${timeKey}_${log.weight}`;

    if (seenIds.has(logId) || (timeKey && seenKeys.has(contentKey))) {
      continue;
    }
    seenIds.add(logId);
    if (timeKey) seenKeys.add(contentKey);
    result.push(log);
  }

  return result.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
}

export const localDb = {
  getBPLogs(): BloodPressureLog[] {
    const data = localStorage.getItem(KEYS.BP);
    const raw: BloodPressureLog[] = data ? JSON.parse(data) : [];
    const deduplicated = deduplicateBPLogs(raw);
    if (raw.length !== deduplicated.length) {
      localStorage.setItem(KEYS.BP, JSON.stringify(deduplicated));
    }
    return deduplicated;
  },

  saveBPLog(systolic: number, diastolic: number, pulse: number, loggedAt: string, notes: string, existingId?: string): BloodPressureLog {
    let logs = this.getBPLogs();
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

    let existingIndex = logs.findIndex(l => String(l.id) === String(targetId));
    if (existingIndex < 0) {
      // Check if duplicate exists by timestamp and values
      const targetTime = new Date(loggedAt).getTime();
      existingIndex = logs.findIndex(l => {
        const t = new Date(l.logged_at).getTime();
        return Math.abs(t - targetTime) < 1000 &&
          Number(l.systolic) === systolic &&
          Number(l.diastolic) === diastolic &&
          Number(l.pulse) === pulse;
      });
    }

    if (existingIndex >= 0) {
      logs[existingIndex] = { ...logs[existingIndex], ...newLog, id: targetId };
    } else {
      logs.push(newLog);
    }

    logs = deduplicateBPLogs(logs);
    localStorage.setItem(KEYS.BP, JSON.stringify(logs));
    return logs.find(l => String(l.id) === String(targetId)) || newLog;
  },

  deleteBPLog(id: string): void {
    const logs = this.getBPLogs();
    const filtered = logs.filter(log => String(log.id) !== String(id));
    localStorage.setItem(KEYS.BP, JSON.stringify(filtered));
  },

  getWeightLogs(): WeightLog[] {
    const data = localStorage.getItem(KEYS.WEIGHT);
    const raw: WeightLog[] = data ? JSON.parse(data) : [];
    const deduplicated = deduplicateWeightLogs(raw);
    if (raw.length !== deduplicated.length) {
      localStorage.setItem(KEYS.WEIGHT, JSON.stringify(deduplicated));
    }
    return deduplicated;
  },

  saveWeightLog(weight: number, loggedAt: string, notes: string, existingId?: string): WeightLog {
    let logs = this.getWeightLogs();
    const targetId = existingId || generateUUID();
    const newLog: WeightLog = {
      id: targetId,
      user_id: 'local-user',
      weight,
      logged_at: loggedAt,
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };

    let existingIndex = logs.findIndex(l => String(l.id) === String(targetId));
    if (existingIndex < 0) {
      const targetTime = new Date(loggedAt).getTime();
      existingIndex = logs.findIndex(l => {
        const t = new Date(l.logged_at).getTime();
        return Math.abs(t - targetTime) < 1000 && Number(l.weight) === weight;
      });
    }

    if (existingIndex >= 0) {
      logs[existingIndex] = { ...logs[existingIndex], ...newLog, id: targetId };
    } else {
      logs.push(newLog);
    }

    logs = deduplicateWeightLogs(logs);
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify(logs));
    return logs.find(l => String(l.id) === String(targetId)) || newLog;
  },

  deleteWeightLog(id: string): void {
    const logs = this.getWeightLogs();
    const filtered = logs.filter(log => String(log.id) !== String(id));
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify(filtered));
  },

  getProfile(): UserProfile {
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

  getAITips(): AITipLog[] {
    const data = localStorage.getItem(KEYS.AI_TIPS);
    return data ? JSON.parse(data) : [];
  },

  saveAITip(tip: string, focus: string): AITipLog {
    const logs = this.getAITips();
    const newLog: AITipLog = {
      id: `tip-${Math.random().toString(36).substr(2, 9)}`,
      tip,
      focus,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 30) logs.pop();
    localStorage.setItem(KEYS.AI_TIPS, JSON.stringify(logs));
    return newLog;
  },

  getWaterLogs(): WaterLog[] {
    const data = localStorage.getItem(KEYS.WATER_LOGS);
    return data ? JSON.parse(data) : [];
  },

  getTodayWaterLogs(): WaterLog[] {
    const logs = this.getWaterLogs();
    const todayStr = new Date().toDateString();
    return logs.filter((log) => new Date(log.logged_at).toDateString() === todayStr);
  },

  getTodayWaterTotal(): number {
    const todayLogs = this.getTodayWaterLogs();
    return todayLogs.reduce((sum, item) => sum + (Number(item.amount_ml) || 0), 0);
  },

  saveWaterLog(amountMl: number, loggedAt?: string): WaterLog {
    const logs = this.getWaterLogs();
    const newLog: WaterLog = {
      id: generateUUID(),
      amount_ml: amountMl,
      logged_at: loggedAt || new Date().toISOString(),
    };
    logs.push(newLog);
    // Sort chronologically
    logs.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
    localStorage.setItem(KEYS.WATER_LOGS, JSON.stringify(logs));
    return newLog;
  },

  deleteWaterLog(id: string): void {
    const logs = this.getWaterLogs();
    const filtered = logs.filter((log) => String(log.id) !== String(id));
    localStorage.setItem(KEYS.WATER_LOGS, JSON.stringify(filtered));
  },

  getWaterConfig(): WaterReminderConfig {
    const data = localStorage.getItem(KEYS.WATER_CONFIG);
    return data ? { ...DEFAULT_WATER_CONFIG, ...JSON.parse(data) } : DEFAULT_WATER_CONFIG;
  },

  saveWaterConfig(updated: Partial<WaterReminderConfig>): WaterReminderConfig {
    const current = this.getWaterConfig();
    const merged = { ...current, ...updated };
    localStorage.setItem(KEYS.WATER_CONFIG, JSON.stringify(merged));
    return merged;
  },

  clearAllData(): void {
    localStorage.setItem(KEYS.BP, JSON.stringify([]));
    localStorage.setItem(KEYS.WEIGHT, JSON.stringify([]));
  },

  resetAll(): void {
    localStorage.removeItem(KEYS.BP);
    localStorage.removeItem(KEYS.WEIGHT);
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.HAS_SEEDED);
    ensureSeeded();
  }
};
