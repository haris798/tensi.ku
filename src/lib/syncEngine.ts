import { supabase } from './supabase';
import { BloodPressureLog, WeightLog, UserProfile } from '../types';

export interface SyncAction {
  id: string;
  userId: string;
  type: 'ADD_BP' | 'DELETE_BP' | 'ADD_WEIGHT' | 'DELETE_WEIGHT' | 'UPDATE_PROFILE';
  payload: any;
  timestamp: number;
}

// Generate an RFC4122 v4 compliant UUID for local-first primary keys
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const KEYS = {
  BP: (userId: string) => `bp_local_cache_bp_${userId}`,
  WEIGHT: (userId: string) => `bp_local_cache_weight_${userId}`,
  PROFILE: (userId: string) => `bp_local_cache_profile_${userId}`,
  QUEUE: (userId: string) => `bp_local_cache_queue_${userId}`,
  LAST_USER: 'bp_last_user_id',
};

export const syncEngine = {
  // Last logged-in user tracking
  getLastUserId(): string | null {
    return localStorage.getItem(KEYS.LAST_USER);
  },

  setLastUserId(userId: string | null): void {
    if (userId) {
      localStorage.setItem(KEYS.LAST_USER, userId);
    } else {
      localStorage.removeItem(KEYS.LAST_USER);
    }
  },

  // Read caches
  getCachedBP(userId: string): BloodPressureLog[] {
    const data = localStorage.getItem(KEYS.BP(userId));
    return data ? JSON.parse(data) : [];
  },

  getCachedWeight(userId: string): WeightLog[] {
    const data = localStorage.getItem(KEYS.WEIGHT(userId));
    return data ? JSON.parse(data) : [];
  },

  getCachedProfile(userId: string): UserProfile | null {
    const data = localStorage.getItem(KEYS.PROFILE(userId));
    return data ? JSON.parse(data) : null;
  },

  // Save caches
  setCachedBP(userId: string, logs: BloodPressureLog[]): void {
    localStorage.setItem(KEYS.BP(userId), JSON.stringify(logs));
  },

  setCachedWeight(userId: string, logs: WeightLog[]): void {
    localStorage.setItem(KEYS.WEIGHT(userId), JSON.stringify(logs));
  },

  setCachedProfile(userId: string, profile: UserProfile | null): void {
    if (profile) {
      localStorage.setItem(KEYS.PROFILE(userId), JSON.stringify(profile));
    } else {
      localStorage.removeItem(KEYS.PROFILE(userId));
    }
  },

  // Queue Operations
  getQueue(userId: string): SyncAction[] {
    const data = localStorage.getItem(KEYS.QUEUE(userId));
    return data ? JSON.parse(data) : [];
  },

  setQueue(userId: string, queue: SyncAction[]): void {
    localStorage.setItem(KEYS.QUEUE(userId), JSON.stringify(queue));
  },

  addToQueue(userId: string, type: SyncAction['type'], payload: any): void {
    const queue = this.getQueue(userId);
    const action: SyncAction = {
      id: generateUUID(),
      userId,
      type,
      payload,
      timestamp: Date.now(),
    };
    queue.push(action);
    this.setQueue(userId, queue);
  },

  // Local-first Operations
  localAddBP(userId: string, systolic: number, diastolic: number, pulse: number, loggedAt: string, notes: string): BloodPressureLog {
    const logs = this.getCachedBP(userId);
    const newLog: BloodPressureLog = {
      id: generateUUID(),
      user_id: userId,
      systolic,
      diastolic,
      pulse,
      logged_at: loggedAt,
      notes: notes.trim(),
      created_at: new Date().toISOString(),
    };
    logs.push(newLog);
    // Sort chronologically
    logs.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
    this.setCachedBP(userId, logs);
    
    // Add to background sync queue
    this.addToQueue(userId, 'ADD_BP', newLog);
    return newLog;
  },

  localDeleteBP(userId: string, id: string): void {
    const logs = this.getCachedBP(userId);
    const filtered = logs.filter((log) => log.id !== id);
    this.setCachedBP(userId, filtered);

    // Add to background sync queue
    this.addToQueue(userId, 'DELETE_BP', { id });
  },

  localAddWeight(userId: string, weight: number, loggedAt: string, notes: string): WeightLog {
    const logs = this.getCachedWeight(userId);
    const newLog: WeightLog = {
      id: generateUUID(),
      user_id: userId,
      weight,
      logged_at: loggedAt,
      notes: notes.trim(),
      created_at: new Date().toISOString(),
    };
    logs.push(newLog);
    logs.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
    this.setCachedWeight(userId, logs);

    // Add to background sync queue
    this.addToQueue(userId, 'ADD_WEIGHT', newLog);
    return newLog;
  },

  localDeleteWeight(userId: string, id: string): void {
    const logs = this.getCachedWeight(userId);
    const filtered = logs.filter((log) => log.id !== id);
    this.setCachedWeight(userId, filtered);

    // Add to background sync queue
    this.addToQueue(userId, 'DELETE_WEIGHT', { id });
  },

  localUpdateProfile(userId: string, fullName: string, targetWeight?: number | null, height?: number | null): UserProfile {
    const profile = this.getCachedProfile(userId) || {
      id: userId,
      full_name: fullName,
      target_weight: targetWeight !== undefined ? targetWeight : null,
      height: height !== undefined ? height : null,
      updated_at: new Date().toISOString(),
    };
    profile.full_name = fullName;
    profile.target_weight = targetWeight !== undefined ? targetWeight : null;
    profile.height = height !== undefined ? height : null;
    profile.updated_at = new Date().toISOString();
    this.setCachedProfile(userId, profile);

    // Add to background sync queue
    this.addToQueue(userId, 'UPDATE_PROFILE', profile);
    return profile;
  },

  // Perform actual Supabase sync for a single item
  async syncItem(client: any, action: SyncAction): Promise<void> {
    const { type, payload } = action;

    switch (type) {
      case 'ADD_BP': {
        const { error } = await client
          .from('blood_pressure_logs')
          .upsert(payload); // Use upsert to handle potential duplicate retries
        if (error) throw error;
        break;
      }
      case 'DELETE_BP': {
        const { error } = await client
          .from('blood_pressure_logs')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
        break;
      }
      case 'ADD_WEIGHT': {
        const { error } = await client
          .from('weight_logs')
          .upsert(payload);
        if (error) throw error;
        break;
      }
      case 'DELETE_WEIGHT': {
        const { error } = await client
          .from('weight_logs')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
        break;
      }
      case 'UPDATE_PROFILE': {
        const { error } = await client
          .from('profiles')
          .upsert(payload);
        if (error) {
          // If the column height is missing in older databases, try upserting without height
          if (error.message && (error.message.includes('height') || error.message.includes('column'))) {
            const { height, ...safePayload } = payload;
            const { error: retryError } = await client
              .from('profiles')
              .upsert(safePayload);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        break;
      }
    }
  },

  // Process the queue and push up to Supabase
  async processQueue(userId: string): Promise<{ success: boolean; syncedCount: number; error?: any }> {
    if (!supabase) {
      return { success: false, syncedCount: 0, error: new Error('Supabase client not initialized') };
    }

    const queue = this.getQueue(userId);
    if (queue.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    const remainingQueue: SyncAction[] = [...queue];
    let syncedCount = 0;

    try {
      for (const action of queue) {
        await this.syncItem(supabase, action);
        remainingQueue.shift(); // Remove successfully synced action
        syncedCount++;
        // Save state progressively
        this.setQueue(userId, remainingQueue);
      }
      return { success: true, syncedCount };
    } catch (err: any) {
      console.error('Background sync failed at item:', err);
      // Save remaining queue
      this.setQueue(userId, remainingQueue);
      return { success: false, syncedCount, error: err };
    }
  },

  // Fetch fresh data from Supabase and overwrite the local cache
  async fetchAndCacheAll(userId: string): Promise<{ bp: BloodPressureLog[]; weight: WeightLog[]; profile: UserProfile | null }> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // 1. Fetch profile
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr && profileErr.code !== 'PGRST116') {
      throw profileErr;
    }

    let finalProfile: UserProfile | null = profileData;
    if (!profileData) {
      // Fallback/auto-create if needed
      finalProfile = {
        id: userId,
        full_name: 'Pengguna',
        target_weight: null,
        height: null,
        updated_at: new Date().toISOString(),
      };
    }

    // 2. Fetch BP logs
    const { data: bpData, error: bpErr } = await supabase
      .from('blood_pressure_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: true });

    if (bpErr) throw bpErr;

    // 3. Fetch weight logs
    const { data: wData, error: wErr } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: true });

    if (wErr) throw wErr;

    const bpLogs = bpData || [];
    const weightLogs = wData || [];

    // Cache them!
    this.setCachedProfile(userId, finalProfile);
    this.setCachedBP(userId, bpLogs);
    this.setCachedWeight(userId, weightLogs);

    return {
      bp: bpLogs,
      weight: weightLogs,
      profile: finalProfile,
    };
  }
};
